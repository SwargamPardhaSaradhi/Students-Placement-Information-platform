"""
Flask REST API for Excel to Delete Service
Handles company and round deletion operations
"""

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from delete_operations import delete_company_cascade, delete_round
from auth_utils import token_required, get_current_user
from config import FLASK_HOST, FLASK_PORT, FLASK_DEBUG

# Configure logging
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# CORS configuration
CORS(app, 
     resources={
         r"/*": {
             "origins": [
                  "http://localhost:5173",
                 "http://localhost:5000",
                 "https://excel-to-db-iare.onrender.com",
                 "https://ai-to-db-iare.onrender.com",
                 "https://authentication-for-iare.onrender.com",  # Update with your Vercel URL
             ],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }
     })


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Excel to Delete API',
        'version': '1.0.0'
    })


@app.route('/api/auth/set-token', methods=['POST'])
def set_token():
    """
    Receive token from auth service and set cookie for this domain
    """
    data = request.get_json()
    access_token = data.get('accessToken')
    refresh_token = data.get('refreshToken')
    
    if not access_token:
        return jsonify({'error': 'No token provided'}), 400
    
    response = jsonify({'message': 'Token set successfully'})
    
    # Set cookie for delete service domain
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
    
    logger.info("Tokens set successfully for delete service")
    return response


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Clear authentication cookies"""
    response = jsonify({'message': 'Logged out successfully'})
    response.set_cookie('accessToken', '', expires=0)
    response.set_cookie('refreshToken', '', expires=0)
    return response


@app.route('/api/companies/<company_year_id>', methods=['DELETE'])
@token_required
def delete_company(company_year_id):
    """
    Delete a company and all associated data (cascading delete)
    
    Path params:
        company_year_id: Company year ID (e.g., "google_2026")
        
    Query params:
        company_name: Company name (required)
        year: Year (required)
    """
    try:
        # Get parameters
        company_name = request.args.get('company_name')
        year = request.args.get('year')
        
        if not company_name or not year:
            return jsonify({
                'error': 'Missing required parameters: company_name and year'
            }), 400
        
        year = int(year)
        user = get_current_user()
        
        logger.info(f"User {user.get('username')} deleting company: {company_year_id}")
        
        # Perform cascading delete
        deleted_items = delete_company_cascade(company_year_id, company_name, year)
        
        return jsonify({
            'success': True,
            'message': f'Company {company_year_id} deleted successfully',
            'deleted': deleted_items
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error deleting company: {e}", exc_info=True)
        return jsonify({'error': f'Failed to delete company: {str(e)}'}), 500


@app.route('/api/companies/<company_year_id>/rounds/<round_id>', methods=['DELETE'])
@token_required
def delete_company_round(company_year_id, round_id):
    """
    Delete a round from a company
    
    Path params:
        company_year_id: Company year ID
        round_id: Round ID
        
    Query params:
        round_number: Round number (required)
    """
    try:
        # Get round number
        round_number = request.args.get('round_number')
        
        if not round_number:
            return jsonify({
                'error': 'Missing required parameter: round_number'
            }), 400
        
        round_number = int(round_number)
        user = get_current_user()
        
        logger.info(f"User {user.get('username')} deleting round: {round_id}")
        
        # Delete round
        deleted_items = delete_round(company_year_id, round_id, round_number)
        
        return jsonify({
            'success': True,
            'message': f'Round {round_id} deleted successfully',
            'deleted': deleted_items
        })
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Error deleting round: {e}", exc_info=True)
        return jsonify({'error': f'Failed to delete round: {str(e)}'}), 500


if __name__ == '__main__':
    logger.info(f"Starting Excel to Delete Service on {FLASK_HOST}:{FLASK_PORT}")
    app.run(
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=FLASK_DEBUG
    )
