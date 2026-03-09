"""
Flask Streaming API for AI Agent
Provides Server-Sent Events (SSE) streaming for real-time AI iterations
NOW WITH JWT AUTHENTICATION
"""
from flask import Flask, request, Response, jsonify
from flask_cors import CORS
import json
from agent import Agent
from auth_utils import token_required  # Import JWT authentication

app = Flask(__name__)

# Enable CORS with credentials - Allow all services
CORS(app, 
     resources={r"/*": {
         "origins": [
             "http://localhost:5173",
             "http://localhost:5000",
             "https://excel-to-db-iare.onrender.com",
             "https://ai-to-db-iare.onrender.com",
             "https://authentication-for-iare.onrender.com"
         ],
         "allow_headers": ["Content-Type", "Authorization"],
         "supports_credentials": True
     }}
)


@app.route('/api/auth/set-token', methods=['POST'])
def set_token():
    """
    Receive token from auth service and set cookie for this domain
    This allows AI service to read its own cookie
    """
    data = request.get_json()
    access_token = data.get('accessToken')
    refresh_token = data.get('refreshToken')
    
    if not access_token:
        return jsonify({'error': 'No token provided'}), 400
    
    response = jsonify({'message': 'Token set successfully'})
    
    # Set cookie for ai-to-db domain
    response.set_cookie(
        'accessToken',
        access_token,
        httponly=True,
        max_age=900,  # 15 minutes
        samesite='None',
        secure=True,
        path='/'
    )
    
    if refresh_token:
        response.set_cookie(
            'refreshToken',
            refresh_token,
            httponly=True,
            max_age=604800,  # 7 days
            samesite='None',
            secure=True,
            path='/'
        )
    
    return response, 200


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Clear cookies for this domain"""
    response = jsonify({'message': 'Logged out successfully'})
    
    response.set_cookie(
        'accessToken',
        '',
        max_age=0,
        samesite='None',
        secure=True,
        path='/'
    )
    response.set_cookie(
        'refreshToken',
        '',
        max_age=0,
        samesite='None',
        secure=True,
        path='/'
    )
    
    return response, 200


def stream_generator(user_query):
    """
    Generator function that yields SSE-formatted events in real-time
    Uses queue and threading for true streaming as events happen
    """
    import queue
    import threading
    
    # Create a queue for events
    event_queue = queue.Queue()
    
    # Sentinel value to signal end of stream
    STREAM_END = object()
    
    def streaming_callback(event_type, data):
        """Callback function invoked by agent - puts events in queue immediately"""
        if event_type == 'iteration_start':
            event_data = {
                'type': 'iteration',
                'iteration': data.get('iteration', 0),
                'decision': data.get('decision', 'continue'),
                'action': data.get('action', 'processing'),
                'message': data.get('message', 'Processing...')
            }
            event_queue.put(('event', event_data))
        
        elif event_type == 'ai_decision':
            event_data = {
                'type': 'ai_decision',
                'decision': data.get('decision', 'unknown'),
                'reason': data.get('reason', 'N/A'),
                'iteration': data.get('iteration', 0)
            }
            event_queue.put(('event', event_data))
        
        elif event_type == 'function_start':
            event_data = {
                'type': 'function_start',
                'function': data.get('function', 'unknown'),
                'params': data.get('params', {}),
                'iteration': data.get('iteration', 0)
            }
            event_queue.put(('event', event_data))
        
        elif event_type == 'function_result':
            event_data = {
                'type': 'function_result',
                'function': data.get('function', 'unknown'),
                'success': data.get('success', True),
                'message': data.get('message', 'Completed'),
                'count': data.get('count'),
                'iteration': data.get('iteration', 0)
            }
            event_queue.put(('event', event_data))
        
        elif event_type == 'huge_data':
            # Send metadata first (headers + count, NO data array)
            headers = data.get('headers', [])
            dataset = data.get('data', [])
            count = data.get('count', len(dataset))
            
            # Send table initialization event
            init_event = {
                'type': 'huge_data_init',
                'huge_data': True,
                'headers': headers,
                'count': count,
                'ai_summary': data.get('ai_summary', f"Found {count} items")
            }
            event_queue.put(('event', init_event))
            
            # Stream each row individually for true streaming experience
            for idx, row in enumerate(dataset):
                row_event = {
                    'type': 'huge_data_row',
                    'row': row,
                    'index': idx
                }
                event_queue.put(('event', row_event))
        
        elif event_type == 'final':
            event_data = {
                'type': 'final',
                'final': True,
                'response': data.get('response', ''),
                'iterations': data.get('iterations', 0)
            }
            event_queue.put(('event', event_data))
    
    def run_agent():
        """Run agent in separate thread"""
        try:
            # Initialize agent
            agent = Agent()
            agent.verbose = True  # Enable logging to see early termination checks
            
            # Send initial event
            init_event = {
                'type': 'iteration',
                'iteration': 0,
                'message': 'Starting AI agent...'
            }
            event_queue.put(('event', init_event))
            
            # Process request with streaming callback
            result = agent.process_request(user_query, stream_callback=streaming_callback)
            
            # Send final response (in case callback didn't send it)
            final_event = {
                'type': 'final',
                'final': True,
                'response': result['response'],
                'iterations': result['iterations'],
                'success': result.get('success', True)
            }
            event_queue.put(('event', final_event))
            
        except Exception as e:
            # Send error event
            error_event = {
                'type': 'error',
                'error': True,
                'message': str(e)
            }
            event_queue.put(('event', error_event))
        
        finally:
            # Signal end of stream
            event_queue.put(('end', STREAM_END))
    
    # Start agent in background thread
    agent_thread = threading.Thread(target=run_agent, daemon=True)
    agent_thread.start()
    
    # Yield events as they come from the queue
    while True:
        try:
            event_type, event_data = event_queue.get(timeout=0.1)
            
            if event_type == 'end':
                break
            
            if event_type == 'event':
                # Format as SSE and yield immediately
                yield f"data: {json.dumps(event_data, default=str)}\n\n"
        
        except queue.Empty:
            # Send keepalive comment to keep connection alive
            yield ": keepalive\n\n"
            continue


@app.route('/api/stream', methods=['POST'])
@token_required  # ← Protected with JWT authentication
def stream_query():
    """
    SSE endpoint for streaming AI query results
    NOW PROTECTED WITH JWT AUTHENTICATION
    
    Request body:
    {
        "query": "User's question here"
    }
    
    Response: Server-Sent Events stream
    
    Authentication: Requires valid JWT token in cookie
    """
    # Get authenticated user info
    user = request.current_user
    
    data = request.get_json()
    user_query = data.get('query', '')
    
    if not user_query:
        return jsonify({'error': 'No query provided'}), 400
    
    # Log authenticated request
    print(f"🔒 Authenticated request from user: {user.get('username', 'Unknown')}")
    
    # Return SSE response
    return Response(
        stream_generator(user_query),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'AI Streaming API is running'})

@app.route('/', methods=['GET'])
def index():
    """API information endpoint"""
    return jsonify({
        'name': 'AI Firestore Query Streaming API',
        'version': '1.0.0',
        'endpoints': {
            'POST /api/stream': 'Stream AI query results with SSE',
            'GET /health': 'Health check'
        }
    })

if __name__ == '__main__':
    import os
    print("\n" + "="*70)
    print(" AI STREAMING API SERVER ".center(70, "="))
    print("="*70)
    port = int(os.environ.get('PORT', 5004))
    print(f"\n🚀 Starting server on http://0.0.0.0:{port}")
    print("\nEndpoints:")
    print("  • POST /api/stream - Stream AI queries")
    print("  • GET /health - Health check")
    print("\n" + "="*70 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
