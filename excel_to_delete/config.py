"""
Configuration for Excel to Delete Service
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Firebase Configuration
FIREBASE_CREDENTIALS_PATH = os.getenv(
    'FIREBASE_CREDENTIALS_PATH',
    '../authentication/serviceAccountKey.json'
)

# Flask Configuration
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5002))
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')
JWT_ALGORITHM = 'HS256'

# Firestore Configuration
FIRESTORE_BATCH_SIZE = int(os.getenv('FIRESTORE_BATCH_SIZE', 500))

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
