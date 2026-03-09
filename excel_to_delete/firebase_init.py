"""
Firebase initialization for Excel to Delete Service
"""

import firebase_admin
from firebase_admin import credentials, firestore
import logging
from config import FIREBASE_CREDENTIALS_PATH

logger = logging.getLogger(__name__)

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Firebase: {e}")
    raise

# Get Firestore client
db = firestore.client()
