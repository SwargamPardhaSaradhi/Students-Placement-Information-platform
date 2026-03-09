"""
JWT Authentication utilities for Excel to Delete Service
Handles token validation from cookies and Authorization headers
"""

import jwt
from functools import wraps
from flask import request, jsonify
from config import JWT_SECRET_KEY, JWT_ALGORITHM
import logging

logger = logging.getLogger(__name__)


def token_required(f):
    """
    Decorator to protect routes that require JWT authentication
    Checks for token in cookies first, then Authorization header
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Try to get token from cookies first (preferred)
        token = request.cookies.get('accessToken')
        
        # If not in cookies, try Authorization header
        if not token:
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            logger.warning("No token provided in request")
            return jsonify({'error': 'Authentication required', 'code': 'NO_TOKEN'}), 401
        
        try:
            # Decode and verify token
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            request.user = payload  # Attach user info to request
            logger.info(f"Authenticated user: {payload.get('username', 'unknown')}")
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return jsonify({'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return jsonify({'error': 'Invalid token', 'code': 'INVALID_TOKEN'}), 401
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return jsonify({'error': 'Authentication failed', 'code': 'AUTH_FAILED'}), 401
        
        return f(*args, **kwargs)
    
    return decorated


def get_current_user():
    """Get current authenticated user from request context"""
    return getattr(request, 'user', None)
