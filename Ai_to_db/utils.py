"""
Utility functions for data processing
"""
import json
from datetime import datetime
from google.cloud.firestore_v1 import DocumentSnapshot

def format_firestore_doc(doc):
    """Convert Firestore document to dict"""
    if isinstance(doc, DocumentSnapshot):
        data = doc.to_dict()
        if data:
            data['_id'] = doc.id
        return data
    return doc

def format_timestamp(ts):
    """Format Firestore timestamp to ISO string"""
    if hasattr(ts, 'isoformat'):
        return ts.isoformat()
    return str(ts)

def clean_data(data):
    """Clean data for JSON serialization"""
    if isinstance(data, dict):
        return {k: clean_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [clean_data(item) for item in data]
    elif hasattr(data, 'isoformat'):
        return data.isoformat()
    return data

def pretty_print(data, title=None):
    """Pretty print JSON data"""
    if title:
        print(f"\n{'='*60}")
        print(f"{title:^60}")
        print('='*60)
    print(json.dumps(clean_data(data), indent=2))
    print()
