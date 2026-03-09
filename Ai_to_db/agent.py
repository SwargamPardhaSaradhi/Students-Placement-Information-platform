"""
Multi-Level AI Agent Orchestrator
Handles iteration, context management, and intelligent termination
"""
import json
from groq_client import GroqClient
from prompts import get_system_prompt, get_iteration_prompt

class Agent:
    def __init__(self):
        self.groq = GroqClient()
        self.max_iterations = 5  # Allow more iterations for complex multi-step queries
        self.context = {}
        self.all_results = []
        self.iteration_history = []
        self.verbose = True  # Controls output verbosity
        
        # Large dataset storage
        self.stored_data = {}  # Stores large datasets by reference ID
        self.data_counter = 0  # Counter for generating unique IDs
    
    def _is_conversational_query(self, user_request):
        """
        Detect if the user request is conversational/general rather than a database query
        
        Returns:
            bool: True if conversational, False if database query
        """
        user_lower = user_request.lower().strip()
        
        # Conversational greeting patterns
        greetings = ['hey', 'hi', 'hello', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening']
        
        # Questions about the AI itself
        self_questions = [
            'what are you', 'who are you', 'what can you do', 'what do you do',
            'what are your capabilities', 'help', 'how can you help', 'what is this',
            'tell me about yourself', 'introduce yourself', 'your purpose',
            'what can i ask', 'how does this work', 'explain yourself'
        ]
        
        # Small talk patterns
        small_talk = [
            'how are you', 'whats up', "what's up", 'how is it going',
            'nice to meet you', 'thank you', 'thanks', 'bye', 'goodbye'
        ]
        
        # Check if it's a simple greeting
        if user_lower in greetings or any(user_lower.startswith(g) for g in greetings):
            return True
        
        # Check if asking about the AI itself
        if any(phrase in user_lower for phrase in self_questions):
            return True
        
        # Check for small talk
        if any(phrase in user_lower for phrase in small_talk):
            return True
        
        # Very short queries (1-3 words) without database keywords
        words = user_request.split()
        db_keywords = ['student', 'company', 'placement', 'year', 'data', 'show', 'get', 'count', 'how many', 'list', 'find', 'search']
        if len(words) <= 3 and not any(keyword in user_lower for keyword in db_keywords):
            return True
        
        return False
    
    def _handle_conversational_query(self, user_request, stream_callback=None):
        """
        Handle conversational/general queries with appropriate responses
        
        Returns:
            dict: Response in the same format as process_request
        """
        user_lower = user_request.lower().strip()
        
        # Generate conversational response using AI
        conversational_prompt = f"""You are a friendly AI assistant for a placement management system. 
Respond naturally and helpfully to the user's message.

User said: "{user_request}"

Provide a brief, friendly response. If they're greeting you, greet them back and offer help.
If they're asking what you can do, explain that you can:
- Answer questions about students and their placement status
- Provide company information and round details
- Show placement statistics and analytics
- Search for specific student or company data
- Generate reports and counts

Keep your response concise, warm, and helpful. Use 2-3 sentences max."""
        
        try:
            # Use Groq API for natural conversation
            response = self.groq.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful, friendly AI assistant. Be warm, concise, and helpful."
                    },
                    {
                        "role": "user",
                        "content": conversational_prompt
                    }
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            ai_response = response.choices[0].message.content.strip()
            
        except Exception as e:
            # Fallback responses if AI call fails
            if any(word in user_lower for word in ['hey', 'hi', 'hello', 'hola']):
                ai_response = "👋 Hello! I'm your AI placement assistant. I can help you find information about students, companies, placements, and analytics. What would you like to know?"
            elif 'what can you do' in user_lower or 'what are your capabilities' in user_lower:
                ai_response = """I can help you with:
• 📊 Student placement information and status
• 🏢 Company details and hiring rounds
• 📈 Placement statistics and analytics
• 🔍 Search for specific students or companies
• 📋 Generate reports and counts

Just ask me anything about placements!"""
            elif 'what are you' in user_lower or 'who are you' in user_lower:
                ai_response = "I'm an AI assistant designed to help you manage and query placement data. I can answer questions about students, companies, and placement statistics from your database."
            elif 'how are you' in user_lower:
                ai_response = "I'm doing great, thanks for asking! 😊 How can I assist you with placement data today?"
            else:
                ai_response = "Hello! I'm here to help you with placement-related queries. You can ask me about students, companies, statistics, or any placement data. What would you like to know?"
        
        # Stream final response immediately
        if stream_callback:
            stream_callback('final', {
                'response': ai_response,
                'iterations': 0
            })
        
        return {
            "response": ai_response,
            "success": True,
            "iterations": 0,
            "conversational": True,
            "token_usage": {"total": 0}
        }
    
    def process_request(self, user_request, stream_callback=None):
        """
        Main orchestrator - handles both conversational and database queries
        
        Args:
            user_request: The user's query string
            stream_callback: Optional callback function(event_type, data) for streaming
        
        Returns:
            dict: {
                "response": str,
                "success": bool,
                "iterations": int,
                "token_usage": dict
            }
        """
        # Check if this is a conversational query first
        if self._is_conversational_query(user_request):
            if self.verbose:
                print(f"\n{'='*70}")
                print(f" CONVERSATIONAL QUERY DETECTED ".center(70, '='))
                print(f"{'='*70}")
                print(f"\nUser: {user_request}\n")
            return self._handle_conversational_query(user_request, stream_callback)
        
        # Otherwise, proceed with database query processing
        if self.verbose:
            print(f"\n{'='*70}")
            print(f" PROCESSING DATABASE QUERY ".center(70, '='))
            print(f"{'='*70}")
            print(f"\nUser: {user_request}\n")
        
        iteration = 0
        previous_results = None
        
        while iteration < self.max_iterations:
            iteration += 1
            if self.verbose:
                print(f"\n{'─'*70}")
                print(f"ITERATION {iteration}/{self.max_iterations}")
                print('─'*70)
            
            # Stream iteration start event
            if stream_callback:
                stream_callback('iteration_start', {
                    'iteration': iteration,
                    'message': f"Starting iteration {iteration}/{self.max_iterations}"
                })
            
            # Early termination: If we already have successful data from previous iteration, don't continue
            if iteration > 1 and self.all_results:
                if self.verbose:
                    print(f"\n🔍 Checking for early termination...")
                    print(f"   Total results so far: {len(self.all_results)}")
                
                last_result = self.all_results[-1] if self.all_results else None
                
                if self.verbose and last_result:
                    print(f"   Last result type: {type(last_result)}")
                    if isinstance(last_result, dict):
                        print(f"   Last result success: {last_result.get('success')}")
                        print(f"   Last result count: {last_result.get('count')}")
                        print(f"   Last result has data: {'data' in last_result}")
                        print(f"   Last result stored: {last_result.get('stored')}")
                
                if last_result and isinstance(last_result, dict):
                    # Check if we have successful data (count, data list, OR stored flag)
                    has_count = last_result.get('success') and last_result.get('count', 0) > 0
                    has_data = last_result.get('success') and last_result.get('data') and len(last_result.get('data', [])) > 0
                    has_stored = last_result.get('success') and last_result.get('stored')  # Large dataset was stored
                    
                    if has_count or has_data or has_stored:
                        # Get count from either count field or stored data
                        if has_stored and last_result.get('data_id'):
                            data_id = last_result['data_id']
                            if data_id in self.stored_data:
                                count = len(self.stored_data[data_id]['data'])
                            else:
                                count = last_result.get('count', 0)
                        else:
                            count = last_result.get('count', len(last_result.get('data', [])))
                        
                        if self.verbose:
                            print(f"\n⚠️⚠️⚠️ EARLY TERMINATION TRIGGERED ⚠️⚠️⚠️")
                            print(f"   Already have {count} items from iteration {iteration-1}")
                            print(f"   Skipping AI call and returning final response")
                        
                        final_response = self._generate_final_response(user_request)
                        
                        if stream_callback:
                            stream_callback('final', {
                                'response': final_response,
                                'iterations': iteration - 1
                            })
                        
                        return {
                            "response": final_response,
                            "iterations": iteration - 1,
                            "success": True,
                            "results": self.all_results
                        }
                    else:
                        if self.verbose:
                            print(f"   No early termination: has_count={has_count}, has_data={has_data}, has_stored={has_stored}")
            
            # Build messages for AI
            messages = self._build_messages(user_request, iteration, previous_results)
            
            # Call AI
            if self.verbose:
                print(f"⏳ Calling AI...")
            ai_response = self.groq.call_ai(messages)
            
            # Log token usage
            tokens = ai_response['tokens']
            if self.verbose:
                print(f"✓ Tokens: {tokens['prompt']} prompt + {tokens['completion']} completion = {tokens['total']} total")
            
            # Parse AI response
            try:
                ai_decision = json.loads(ai_response['response'])
            except json.JSONDecodeError as e:
                if self.verbose:
                    print(f"❌ AI returned invalid JSON: {e}")
                    print(f"   Raw response: {ai_response['response'][:200]}...")
                # Try to continue with empty decision
                ai_decision = {"decision": "terminate", "reason": "JSON parsing error"}
            
            # Validate AI decision structure
            if not isinstance(ai_decision, dict):
                if self.verbose:
                    print(f"❌ AI response is not a dict: {type(ai_decision)}")
                ai_decision = {"decision": "terminate", "reason": "Invalid response structure"}
            
            if 'decision' not in ai_decision:
                if self.verbose:
                    print(f"❌ AI response missing 'decision' field")
                ai_decision = {"decision": "terminate", "reason": "Missing decision field"}
            
            # Log AI decision
            decision = ai_decision.get('decision', 'unknown').lower()
            if self.verbose:
                print(f"\n📋 AI Decision: {decision}")
                print(f"   Reason: {ai_decision.get('reason', 'N/A')}")
            
            # Stream AI decision details
            if stream_callback:
                stream_callback('ai_decision', {
                    'decision': decision,
                    'reason': ai_decision.get('reason', 'N/A'),
                    'iteration': iteration
                })
            
            # Update context
            if 'ctx' in ai_decision:
                self.context.update(ai_decision['ctx'])
            
            # Check for termination
            if decision == 'terminate':
                if self.verbose:
                    print(f"\n✓ AI decided to terminate")
                # Generate final response
                final_response = self._generate_final_response(user_request)
                
                # Stream final event
                if stream_callback:
                    stream_callback('final', {
                        'response': final_response,
                        'iterations': iteration
                    })
                
                return {
                    "response": final_response,
                    "success": True,
                    "iterations": iteration,
                    "token_usage": self.groq.get_total_tokens()
                }
            
            # Execute action if present
            if 'action' in ai_decision:
                action = ai_decision['action']
                
                # Validate action structure
                if not isinstance(action, dict):
                    if self.verbose:
                        print(f"❌ Action is not a dict (got {type(action)}): {action}")
                    # Try to fix string action
                    if isinstance(action, str):
                        try:
                            action = json.loads(action)
                        except:
                            if self.verbose:
                                print(f"   Could not parse action string as JSON")
                            # Force termination
                            final_response = self._generate_final_response(user_request)
                            return {
                                "response": final_response,
                                "success": True,
                                "iterations": iteration,
                                "token_usage": self.groq.get_total_tokens()
                            }
                
                if self.verbose:
                    print(f"\n⚡ Executing: {action.get('function', 'unknown')}")
                
                # Stream function execution details
                if stream_callback:
                    stream_callback('function_start', {
                        'function': action.get('function', 'unknown'),
                        'params': action.get('params', {}),
                        'iteration': iteration
                    })
                
                try:
                    result = self._execute_action(action)
                    
                    # Handle large datasets
                    if isinstance(result, dict) and result.get('success') and result.get('data'):
                        data = result['data']
                        count = result.get('count', 0)
                        
                        # Check if data contains company rounds - extract student data for table display
                        has_round_data = False
                        extracted_students = []
                        
                        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                            # Check if this is company data with rounds
                            if 'rounds' in data[0] and 'round' in user_request.lower():
                                has_round_data = True
                                
                                # Extract all student data from rounds for table display
                                for company_item in data:
                                    company_name = company_item.get('companyName', 'Unknown')
                                    rounds = company_item.get('rounds', [])
                                    
                                    for round_item in rounds:
                                        round_num = round_item.get('roundNumber', 'N/A')
                                        round_name = round_item.get('roundName', 'N/A')
                                        round_data = round_item.get('data', [])
                                        
                                        # Extract each student with round context
                                        for student in round_data:
                                            row_data = student.get('rowData', {})
                                            
                                            # Combine student info with round context
                                            student_row = {
                                                'Company': company_name,
                                                'Round': f"{round_num} - {round_name}",
                                                'Student ID': student.get('studentId', 'N/A'),
                                                'Status': student.get('status', 'N/A')
                                            }
                                            
                                            # Add all rowData fields
                                            student_row.update(row_data)
                                            
                                            extracted_students.append(student_row)
                        
                        # If we extracted round student data, send it as huge_data
                        if has_round_data and extracted_students:
                            # Extract column headers from data
                            headers = []
                            if extracted_students and isinstance(extracted_students[0], dict):
                                headers = list(extracted_students[0].keys())
                            
                            # Stream huge data event with headers - ALWAYS send for round data
                            if stream_callback:
                                stream_callback('huge_data', {
                                    'headers': headers,
                                    'data': extracted_students,
                                    'count': len(extracted_students),
                                    'collection': 'round_data',
                                    'ai_summary': f"📊 Company Round Data: {len(extracted_students)} student records across all rounds"
                                })
                            
                            # Store the original company data for reference
                            self.data_counter += 1
                            data_id = f"dataset_{self.data_counter}"
                            
                            self.stored_data[data_id] = {
                                'data': data,
                                'count': count,
                                'collection': 'companies_with_rounds'
                            }
                            
                            previous_results = {
                                'success': True,
                                'stored': True,
                                'data_id': data_id,
                                'round_data': True,  # Flag to indicate this is round data
                                'extracted_students': len(extracted_students),
                                'total_count': count,
                                'message': f'Retrieved round data with {len(extracted_students)} student records'
                            }
                            
                            if self.verbose:
                                print(f"   📊 Extracted {len(extracted_students)} student records from rounds for table display")
                        
                        # Smart data handling based on size:
                        # - Small (≤10): Send full data to AI for nice formatting, NO table
                        # - Large (>10): Send sample to AI, FULL data as table to user
                        elif isinstance(data, list) and count > 10 and data:
                            # Check if this is structured data (list of dicts)
                            if isinstance(data[0], dict):
                                self.data_counter += 1
                                data_id = f"dataset_{self.data_counter}"
                                
                                # Store full dataset
                                self.stored_data[data_id] = {
                                    'data': data,
                                    'count': count,
                                    'collection': action.get('params', {}).get('collection', 'unknown')
                                }
                                
                                # Extract column headers from data
                                headers = []
                                if data and isinstance(data[0], dict):
                                    headers = list(data[0].keys())
                                
                                # Stream as huge_data for table display (only for large datasets)
                                if stream_callback:
                                    collection_name = action.get('params', {}).get('collection', 'unknown')
                                    
                                    # Create appropriate summary based on collection
                                    if collection_name == 'students':
                                        summary = f"📚 Retrieved {count} student records"
                                    elif collection_name == 'companies':
                                        summary = f"🏢 Retrieved {count} company records"
                                    elif collection_name == 'years':
                                        summary = f"📊 Retrieved {count} year analytics records"
                                    else:
                                        summary = f"Retrieved {count} records from {collection_name}"
                                    
                                    stream_callback('huge_data', {
                                        'headers': headers,
                                        'data': data,
                                        'count': count,
                                        'collection': collection_name,
                                        'ai_summary': summary
                                    })
                                
                                # Send only sample to AI (2 rows)
                                sample = data[:2]
                                
                                # Replace result data with reference
                                previous_results = {
                                    'success': True,
                                    'stored': True,
                                    'data_id': data_id,
                                    'sample': sample,
                                    'total_count': count,
                                    'message': f'Large dataset ({count} items) sent as table. Showing 2 samples to AI.',
                                    'collection': action.get('params', {}).get('collection')
                                }
                                
                                if self.verbose:
                                    print(f"   📊 Large dataset: Sent {count} items as table, AI sees 2 samples")
                            else:
                                # Not structured data, pass as-is
                                previous_results = result
                        else:
                            # Small dataset (≤10) - send full data to AI for nice formatting
                            # NO table sent to user
                            previous_results = result
                            if self.verbose and isinstance(data, list) and len(data) <= 10:
                                print(f"   📝 Small dataset ({len(data)} items): Full data sent to AI for text formatting")
                    else:
                        previous_results = result
                    
                    self.all_results.append(previous_results)

                    
                    # Show result summary
                    if isinstance(result, dict):
                        if result.get('success'):
                            if self.verbose:
                                print(f"   ✓ Success: {result.get('message', 'Operation completed')}")
                            if 'count' in result:
                                if self.verbose:
                                    print(f"   📊 Count: {result['count']}")
                            
                            # Stream function result
                            if stream_callback:
                                stream_callback('function_result', {
                                    'function': action.get('function', 'unknown'),
                                    'success': True,
                                    'message': result.get('message', 'Operation completed'),
                                    'count': result.get('count'),
                                    'iteration': iteration
                                })
                        else:
                            if self.verbose:
                                print(f"   ❌ Error: {result.get('message', 'Unknown error')}")
                except Exception as e:
                    if self.verbose:
                        print(f"   ❌ Exception: {str(e)}")
                    previous_results = {
                        "success": False,
                        "error": str(e),
                        "message": f"Exception executing action: {str(e)}"
                    }
                    self.all_results.append(previous_results)
                
                # Store iteration
                self.iteration_history.append({
                    'iteration': iteration,
                    'action': action.get('function', 'unknown'),
                    'decision': decision
                })
            
            # Auto-termination: if we got data successfully, terminate
            if iteration > 0:
                for result in self.all_results:
                    if isinstance(result, dict) and result.get('success') and result.get('count', 0) > 0:
                        if self.verbose:
                            print(f"\n✓ Auto-terminating: Data successfully retrieved")
                        final_response = self._generate_final_response(user_request)
                        return {
                            "response": final_response,
                            "success": True,
                            "iterations": iteration,
                            "token_usage": self.groq.get_total_tokens()
                        }
            
            # Loop detection
            if self._detect_loop():
                if self.verbose:
                    print(f"\n⚠️  Loop detected, forcing termination")
                final_response = self._generate_final_response(user_request)
                return {
                    "response": final_response,
                    "success": True,
                    "iterations": iteration,
                    "token_usage": self.groq.get_total_tokens()
                }
        
        # Max iterations reached
        if self.verbose:
            print(f"\n⚠️  Maximum iterations ({self.max_iterations}) reached")
        
        final_response = self._generate_final_response(user_request)
        return {
            "response": final_response,
            "success": True,
            "iterations": iteration,
            "token_usage": self.groq.get_total_tokens()
        }
    
    def _build_messages(self, user_request, iteration, previous_results):
        """Build message array for AI"""
        messages = [
            {
                "role": "system",
                "content": get_system_prompt()
            }
        ]
        
        # Add iteration-specific prompt
        iteration_prompt = get_iteration_prompt(
            user_request,
            iteration,
            self.context,
            previous_results
        )
        
        messages.append({
            "role": "user",
            "content": iteration_prompt
        })
        
        return messages
    
    def _execute_action(self, action):
        """Execute the requested database action"""
        function_name = action.get('function', '')
        params = action.get('params', {})
        
        if function_name == 'query_database':
            from db_functions import query_database
            return query_database(params)
        
        elif function_name == 'get_metadata':
            from db_functions import get_metadata
            return get_metadata()
        
        elif function_name == 'manipulate_stored_data':
            # Manipulate data that's already stored in memory
            return self._manipulate_stored_data(params)
        
        elif function_name == 'deep_search_field':
            # Deep search for specific field in student's round data
            from deep_search import deep_search_student_field
            from firebase_config import get_db
            db = get_db()
            return deep_search_student_field(
                db,
                params.get('student_name'),
                params.get('field_name')
            )
        
        elif function_name == 'export_to_json':
            # Export data to JSON file
            return self._export_to_json(params)
        
        else:
            return {
                "success": False,
                "message": f"Unknown function: {function_name}"
            }
    
    def _manipulate_stored_data(self, params):
        """
        Manipulate stored dataset(s) - supports single or multiple datasets
        
        Args:
            params = {
                "data_id": "dataset_1" | ["dataset_1", "dataset_2", "dataset_3"],  // single or multiple
                "operation": "filter" | "select_fields" | "limit" | "sort" | "combine",
                "filters": {"field": "value"},  // for filter operation
                "fields": ["name", "email"],     // for select_fields
                "limit": 10,                      // for limit operation
                "sort_by": "totalOffers",         // for sort operation
                "sort_direction": "desc"          // "asc" or "desc"
            }
        """
        from data_operations import filter_rows, select_fields_from_data, limit_data, query_multiple_datasets, sort_data, get_top_n
        
        try:
            data_id = params.get('data_id')
            operation = params.get('operation', 'filter')
            
            # Handle multiple data_ids
            if isinstance(data_id, list):
                # Query across multiple datasets
                datasets = []
                total_original = 0
                
                for did in data_id:
                    if did in self.stored_data:
                        datasets.append(self.stored_data[did]['data'])
                        total_original += self.stored_data[did]['count']
                    else:
                        return {
                            "success": False,
                            "message": f"Data ID '{did}' not found in storage"
                        }
                
                # Use multi-dataset query function
                result_data = query_multiple_datasets(
                    datasets,
                    filters=params.get('filters'),
                    fields=params.get('fields'),
                    limit=params.get('limit')
                )
                
                # Apply sorting if requested
                if params.get('sort_by'):
                    result_data = sort_data(
                        result_data,
                        params.get('sort_by'),
                        params.get('sort_direction', 'asc')
                    )
                
                return {
                    "success": True,
                    "data": result_data,
                    "count": len(result_data),
                    "original_count": total_original,
                    "datasets_combined": len(data_id),
                    "message": f"Combined {len(data_id)} datasets, returned {len(result_data)}/{total_original} items"
                }
            
            else:
                # Single dataset manipulation
                if data_id not in self.stored_data:
                    return {
                        "success": False,
                        "message": f"Data ID '{data_id}' not found in storage"
                    }
                
                stored = self.stored_data[data_id]
                data = stored['data'].copy()  # Work on a copy
                
                # Apply operations in order
                if operation == 'filter' or params.get('filters'):
                    filters = params.get('filters', {})
                    data = filter_rows(data, filters)
                
                if operation == 'select_fields' or params.get('fields'):
                    fields = params.get('fields', [])
                    data = select_fields_from_data(data, fields)
                
                if operation == 'sort' or params.get('sort_by'):
                    sort_by = params.get('sort_by')
                    sort_direction = params.get('sort_direction', 'asc')
                    data = sort_data(data, sort_by, sort_direction)
                
                if operation == 'limit' or params.get('limit'):
                    limit_val = params.get('limit')
                    data = limit_data(data, limit_val)
                
                return {
                    "success": True,
                    "data": data,
                    "count": len(data),
                    "original_count": stored['count'],
                    "message": f"Manipulated {len(data)}/{stored['count']} items from {data_id}"
                }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": f"Error manipulating data: {str(e)}"
            }
    
    def _export_to_json(self, params):
        """Export data to JSON file"""
        from export_utils import export_to_json, export_stored_dataset
        
        data_id = params.get('data_id')
        filename = params.get('filename')
        
        if data_id:
            return export_stored_dataset(data_id, self.stored_data, filename)
        else:
            return {
                "success": False,
                "message": "No data_id provided for export"
            }
    
    def _detect_loop(self):
        """Detect if AI is repeating same actions"""
        if len(self.iteration_history) < 3:
            return False
        
        # Check last 3 iterations
        recent = self.iteration_history[-3:]
        actions = [h['action'] for h in recent]
        
        # If all 3 are the same, it's a loop
        if len(set(actions)) == 1:
            return True
        
        return False
    
    def _generate_final_response(self, user_request):
        """Generate final user-facing response"""
        if self.verbose:
            print(f"\n📝 Generating final response...")
        
        # Check if round data was already sent as huge_data table
        for result in self.all_results:
            if isinstance(result, dict) and result.get('round_data'):
                # Round data was sent as table, generate natural AI response
                student_count = result.get('extracted_students', 0)
                
                # Use AI to generate a natural, conversational response
                try:
                    if self.verbose:
                        print(f"   🤖 Generating natural response for round data...")
                    
                    ai_prompt = f"""You are a helpful assistant. Generate a brief, natural, and conversational response (2-3 sentences maximum).

User asked: "{user_request}"
Found: {student_count} student records in the company round data

Generate ONLY a friendly, natural language response telling the user about the data that was found. No markdown formatting, no emojis, no structured tables - just a simple, human-like conversational response. Make it sound natural like you're talking to a friend."""

                    # Direct AI call for natural response
                    ai_response = self.groq.client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a helpful assistant. Provide brief, natural, conversational responses. No markdown, no emojis, no structured formatting - just friendly, natural language like talking to a person."
                            },
                            {
                                "role": "user",
                                "content": ai_prompt
                            }
                        ],
                        temperature=0.7,
                        max_tokens=150
                    )
                    
                    response = ai_response.choices[0].message.content.strip()
                    
                except Exception as e:
                    # Simple fallback if AI fails
                    if self.verbose:
                        print(f"   ⚠️ AI response generation failed: {e}")
                    response = f"I found a total of {student_count} student records in the ITC company round data. The complete information is displayed in the table above for your review."
                
                return response
        
        # Check if this was a COUNT operation first
        for result in self.all_results:
            if isinstance(result, dict) and result.get('success'):
                # Check if this is a count result (has count but no data or empty data)
                if 'count' in result and (not result.get('data') or result.get('data') == []):
                    count = result['count']
                    message = result.get('message', '')
                    
                    # Generate natural language count response
                    response = f"✅ **Count Result**\n\n"
                    response += f"**Total:** {count}\n\n"
                    
                    # Add context based on the query
                    if 'student' in user_request.lower():
                        response += f"There are **{count} students** in the database.\n"
                    elif 'compan' in user_request.lower():
                        response += f"There are **{count} companies** in the database.\n"
                    elif 'placement' in user_request.lower():
                        response += f"There are **{count} placements** in the database.\n"
                    else:
                        response += f"Found **{count} records** matching your query.\n"
                    
                    return response
        
        # Extract actual data from results (including stored large datasets)
        all_data = []
        data_was_sent_as_table = False
        
        for result in self.all_results:
            if isinstance(result, dict):
                # Check if data was sent as table
                if result.get('stored') and result.get('data_id') and not result.get('round_data'):
                    data_was_sent_as_table = True
                    # Don't extract data - it was already sent as table
                    continue
                    
                if result.get('stored') and result.get('data_id'):
                    # Retrieve full dataset from storage
                    data_id = result['data_id']
                    if data_id in self.stored_data:
                        stored = self.stored_data[data_id]
                        all_data.extend(stored['data'])
                elif result.get('success') and result.get('data'):
                    data = result['data']
                    if isinstance(data, list):
                        all_data.extend(data)
                    else:
                        all_data.append(data)
        
        # If data was sent as table, provide simple summary
        if data_was_sent_as_table:
            # Find the stored result to get count and collection info
            for result in self.all_results:
                if isinstance(result, dict) and result.get('stored') and not result.get('round_data'):
                    count = result.get('total_count', 0)
                    collection = result.get('collection', 'records')
                    
                    # Capitalize collection name nicely
                    collection_display = collection.replace('_', ' ').title()
                    
                    response = "✅ **Query Results**\n\n"
                    response += f"📊 **Total Records**: {count} {collection_display}\n\n"
                    response += "---\n\n"
                    response += "The complete data is displayed in the **interactive table above**.\n\n"
                    response += "**Quick Actions**:\n"
                    response += "- 🔍 Use the search bar to filter specific records\n"
                    response += "- 📑 Click column headers to sort data\n"
                    response += "- 👁️ Scroll to view all records\n\n"
                    response += f"� **Tip**: {count} records loaded successfully!"
                    return response
        
        # If no data found, return helpful message
        if not all_data:
            return (f"No data found for your query: '{user_request}'\n\n"
                   f"Possible reasons:\n"
                   f"- The data doesn't exist in the database\n"
                   f"- Check spelling/capitalization\n"
                   f"- The filters may be too specific")
        
        
        # For large datasets, use separate AI to generate display summary
        if len(all_data) > 10:
            # Determine what type of data this is
            data_type = "records"
            emoji = "📊"
            if all_data and isinstance(all_data[0], dict):
                if 'name' in all_data[0] and 'rollNumber' in all_data[0]:
                    data_type = "students"
                    emoji = "👨‍🎓"
                elif 'companyName' in all_data[0]:
                    data_type = "companies"
                    emoji = "🏢"
                elif 'year' in all_data[0]:
                    data_type = "year analytics"
                    emoji = "📅"
            
            # Create a minimal sample of the data
            data_sample = all_data[:2]  # Just first 2 items
            
            # Use separate simple AI call ONLY for generating display text
            if self.verbose:
                print(f"   🤖 Generating display summary for {len(all_data)} items...")
            
            try:
                # Simple prompt - NO commands, ONLY summary text
                summary_prompt = f"""You are a helpful assistant. Generate a SHORT, friendly summary (2-3 sentences max).

User asked: "{user_request}"
Found: {len(all_data)} {data_type}

Sample data: {str(data_sample)[:500]}

Generate ONLY a brief, natural summary. Do NOT include any JSON, commands, or actions. Just plain text explaining what was found."""

                # Direct AI call using self.groq
                response = self.groq.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a helpful assistant. Provide brief, natural language summaries only. No JSON, no commands, just friendly text."
                        },
                        {
                            "role": "user",
                            "content": summary_prompt
                        }
                    ],
                    temperature=0.3,
                    max_tokens=200
                )
                
                ai_summary = response.choices[0].message.content.strip()
                
            except Exception as e:
                # Simple fallback if AI fails
                if self.verbose:
                    print(f"   ⚠️ AI summary failed: {e}")
                ai_summary = f"Found {len(all_data)} {data_type} matching your query."
            
            # Return clean response with AI summary
            response = f"✅ **Query Results**\n\n{ai_summary}\n\n"
            response += f"� **Total Items:** {len(all_data)}\n"
            response += f"📁 **Data Type:** {data_type.title()}\n"
            
            return response
        
        
        
        # Small dataset - use AI for beautiful natural formatting
        else:
            data_summary = str(all_data)[:2000]
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Format database query results into a clear, natural language response for the user. Be concise and friendly. If the data contains company rounds information, suggest the user query for detailed round data to see it in a table format."
                },
                {
                    "role": "user",
                    "content": f"""User asked: "{user_request}"

Database returned {len(all_data)} result(s):
{data_summary}

Generate a natural, friendly response explaining what was found. Include the important details like name, email, status, etc. Make it easy to read.

IMPORTANT: If this is company data with rounds metadata (containing roundNumber, roundName, studentCount), tell the user they can query "show me [company] round details" or "show me round data" to see the full student data in a nice table format."""
                }
            ]
            
            try:
                ai_response = self.groq.call_ai(messages, temperature=0.3, force_json=False)
                return ai_response['response']
            except Exception as e:
                # Fallback - show JSON
                import json
                return json.dumps(all_data, indent=2, ensure_ascii=False, default=str)
    
    def print_summary(self):
        """Print execution summary"""
        self.groq.print_usage_summary()
