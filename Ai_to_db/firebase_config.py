"""
Firebase Firestore Configuration and Initialization
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase
def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    creds_path = os.getenv('FIREBASE_CREDS_PATH')
    
    if not creds_path:
        raise ValueError("FIREBASE_CREDS_PATH not found in .env file")
    
    if not os.path.exists(creds_path):
        raise FileNotFoundError(f"Firebase credentials file not found at: {creds_path}")
    
    # Check if already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred)
    
    return firestore.client()

# Global Firestore client
db = None

def get_db():
    """Get Firestore database client"""
    global db
    if db is None:
        db = initialize_firebase()
    return db
