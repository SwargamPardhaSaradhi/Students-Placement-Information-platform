"""
Universal Database Query Functions
Handles ALL retrieval scenarios with maximum flexibility
"""
from firebase_config import get_db
from utils import format_firestore_doc, clean_data
from google.cloud import firestore
import re

def get_metadata():
    """
    Returns comprehensive database structure for AI context
    Matches the system prompt schema
    """
    return {
        "collections": ["companies", "students", "years"],
        
        "companies": {
            "fields": ["companyYearId", "companyName", "year", "status", "currentRound", 
                      "finalRound", "totalRounds", "totalPlaced", "totalApplied", 
                      "createdAt", "updatedAt"],
            "subcollections": {
                "rounds": {
                    "fields": ["roundId", "roundNumber", "roundName", "rawColumns", 
                              "studentCount", "isFinalRound", "timestamp"],
                    "subcollections": {
                        "data": {
                            "fields": ["rowId", "rowData", "studentId", "status"]
                        }
                    }
                },
                "placements": {
                    "fields": ["rowData", "timestamp"]
                }
            }
        },
        
        "students": {
            "fields": ["studentId", "name", "rollNumber", "email", "companyStatus", 
                      "selectedCompanies", "currentStatus", "totalOffers", "updatedAt"],
            "nested_fields": {
                "companyStatus": "dict - per company tracking {companyYearId: {status, roundReached, finalSelection, year}}",
                "selectedCompanies": "list - companyYearIds where student is selected"
            },
            "status_values": {
                "currentStatus": ["placed", "not_placed"],
                "companyStatus.status": ["selected", "not_selected", "in_process"]
            }
        },
        
        "years": {
            "fields": ["year", "totalCompanies", "completedCompanies", "runningCompanies", 
                      "totalPlaced", "totalStudentsParticipated", "companyWise"],
            "nested_fields": {
                "companyWise": "dict - per company stats {companyYearId: {companyName, placed, status}}"
            },
            "description": "Analytics collection - use for yearly statistics and aggregate data"
        }
    }

def query_database(params):
    """
    Universal query function - handles ALL retrieval scenarios
    
    Parameters:
    {
        "collection": str,           # companies | students | years
        "filters": dict,             # field: value pairs, supports nested and operators
        "fields": list,              # fields to return, [] = all
        "subcollections": list,      # ["rounds", "placements", "companyStatus"]
        "operation": str,            # "get" | "count" | "list_ids"
        "search_in": str,            # "rowData" for deep search in dynamic fields
        "limit": int,                # max results, None = all
        "order_by": str,             # field to sort by
        "order_direction": str       # "asc" | "desc"
    }
    
    Returns:
    {
        "success": bool,
        "data": list | dict | int,
        "count": int,
        "message": str
    }
    """
    db = get_db()
    
    try:
        collection = params.get('collection')
        filters = params.get('filters', {})
        fields = params.get('fields', [])
        subcollections = params.get('subcollections', [])
        operation = params.get('operation', 'get')
        search_in = params.get('search_in')
        limit = params.get('limit')
        order_by = params.get('order_by')
        order_direction = params.get('order_direction', 'asc')
        
        # Start building query
        query = db.collection(collection)
        
        # Separate case-sensitive and case-insensitive filters
        case_sensitive_filters = {}
        case_insensitive_filters = {}
        
        if filters:
            for field, value in filters.items():
                # Name, email, rollNumber need case-insensitive matching - handle in Python
                if isinstance(value, str) and field in ['name', 'companyName', 'rollNumber', 'email']:
                    case_insensitive_filters[field] = value.lower()
                else:
                    case_sensitive_filters[field] = value
        
        # Apply only case-sensitive filters to Firestore query
        if case_sensitive_filters:
            for field, value in case_sensitive_filters.items():
                if isinstance(value, dict):
                    # Handle comparison operators
                    for op, val in value.items():
                        if op == '>':
                            query = query.where(filter=firestore.FieldFilter(field, '>', val))
                        elif op == '>=':
                            query = query.where(filter=firestore.FieldFilter(field, '>=', val))
                        elif op == '<':
                            query = query.where(filter=firestore.FieldFilter(field, '<', val))
                        elif op == '<=':
                            query = query.where(filter=firestore.FieldFilter(field, '<=', val))
                        elif op == '!=':
                            query = query.where(filter=firestore.FieldFilter(field, '!=', val))
                        elif op == 'in':
                            query = query.where(filter=firestore.FieldFilter(field, 'in', val))
                        elif op == 'array_contains':
                            query = query.where(filter=firestore.FieldFilter(field, 'array_contains', val))
                        elif op == 'array_contains_any':
                            query = query.where(filter=firestore.FieldFilter(field, 'array_contains_any', val))
                else:
                    # Simple equality - use FieldFilter to avoid warning
                    query = query.where(filter=firestore.FieldFilter(field, '==', value))
        
        # Apply ordering
        if order_by:
            direction = 'DESCENDING' if order_direction == 'desc' else 'ASCENDING'
            query = query.order_by(order_by, direction=direction)
        
        # Apply limit
        if limit:
            query = query.limit(limit)
        
        # Execute query
        docs = query.stream()
        results = []
        
        for doc in docs:
            doc_data = format_firestore_doc(doc)
            
            # Apply case-insensitive filtering (for fields excluded from Firestore query)
            if case_insensitive_filters:
                skip = False
                for field, search_value in case_insensitive_filters.items():
                    if field in doc_data:
                        doc_value = str(doc_data[field]).lower()
                        # Partial match for name fields
                        if search_value not in doc_value:
                            skip = True
                            break
                    else:
                        skip = True
                        break
                
                if skip:
                    continue
            
            # Handle subcollections
            if subcollections and doc_data:
                for subcoll in subcollections:
                    if subcoll == 'rounds':
                        # Get rounds metadata ONLY (no student data) for speed
                        rounds = get_subcollection_data(db, collection, doc.id, 'rounds')
                        doc_data['rounds'] = rounds
                        
                    elif subcoll == 'rounds.data':
                        # Get rounds AND their full student data (heavy operation)
                        rounds = get_subcollection_data(db, collection, doc.id, 'rounds')
                        # For each round, get the data subcollection (student rows)
                        for round_doc in rounds:
                            round_id = round_doc.get('_id')
                            if round_id:
                                # Get all student data rows for this round
                                data_rows = get_round_data(db, collection, doc.id, round_id)
                                round_doc['data'] = data_rows
                        doc_data['rounds'] = rounds
                        
                    elif subcoll == 'placements':
                        doc_data['placements'] = get_subcollection_data(db, collection, doc.id, 'placements')
            
            # Handle deep search in rowData
            if search_in == 'rowData' and subcollections:
                matched_data = search_in_rowdata(db, collection, doc.id, filters)
                if matched_data:
                    doc_data['matched_rows'] = matched_data
                    results.append(doc_data)
            else:
                # Filter fields if specified
                if fields:
                    doc_data = {k: v for k, v in doc_data.items() if k in fields or k == '_id'}
                
                results.append(doc_data)
        
        # Handle operation type
        if operation == 'count':
            return {
                "success": True,
                "count": len(results),
                "message": f"Found {len(results)} documents"
            }
        elif operation == 'list_ids':
            return {
                "success": True,
                "data": [doc.get('_id') for doc in results],
                "count": len(results),
                "message": f"Found {len(results)} document IDs"
            }
        else:
            return {
                "success": True,
                "data": results,
                "count": len(results),
                "message": f"Retrieved {len(results)} documents"
            }
    
    except Exception as e:
        return {
            "success": False,
            "data": None,
            "count": 0,
            "message": f"Query error: {str(e)}"
        }

def get_subcollection_data(db, parent_path, doc_id, subcoll_name):
    """Get all documents from a subcollection"""
    try:
        subcoll_ref = db.collection(parent_path).document(doc_id).collection(subcoll_name)
        docs = subcoll_ref.stream()
        return [format_firestore_doc(doc) for doc in docs]
    except:
        return []

def get_round_data(db, parent_collection, company_id, round_id):
    """
    Get all data rows for a specific round
    Returns list of student data with rowData
    """
    try:
        data_ref = db.collection(parent_collection).document(company_id).collection('rounds').document(round_id).collection('data')
        docs = data_ref.stream()
        
        data_rows = []
        for doc in docs:
            data_item = format_firestore_doc(doc)
            # Extract rowData for cleaner output
            row_data = data_item.get('rowData', {})
            data_rows.append({
                'studentId': data_item.get('studentId'),
                'status': data_item.get('status'),
                'rowData': row_data,
                '_id': data_item.get('_id')
            })
        
        return data_rows
    except Exception as e:
        print(f"Error getting round data: {e}")
        return []

def search_in_rowdata(db, collection, doc_id, filters):
    """
    Deep search in dynamic rowData fields within rounds
    Used for finding specific student data in round spreadsheets
    """
    try:
        matched_rows = []
        
        # Get all rounds for this company
        rounds_ref = db.collection(collection).document(doc_id).collection('rounds')
        rounds = rounds_ref.stream()
        
        for round_doc in rounds:
            round_data = format_firestore_doc(round_doc)
            
            # Get data rows within this round
            data_ref = rounds_ref.document(round_doc.id).collection('data')
            data_docs = data_ref.stream()
            
            for data_doc in data_docs:
                data_item = format_firestore_doc(data_doc)
                row_data = data_item.get('rowData', {})
                
                # Check if any filter matches in rowData
                match = True
                for field, value in filters.items():
                    # Remove 'rowData.' prefix if present
                    field_name = field.replace('rowData.', '')
                    
                    if isinstance(value, dict):
                        # Handle comparison operators
                        for op, val in value.items():
                            field_val = row_data.get(field_name)
                            if field_val is None:
                                match = False
                                break
                            
                            try:
                                field_val = float(field_val) if isinstance(val, (int, float)) else field_val
                                if op == '>' and not (field_val > val):
                                    match = False
                                elif op == '>=' and not (field_val >= val):
                                    match = False
                                elif op == '<' and not (field_val < val):
                                    match = False
                                elif op == '<=' and not (field_val <= val):
                                    match = False
                            except:
                                match = False
                    else:
                        # Simple equality or contains
                        if field_name not in row_data:
                            match = False
                        elif isinstance(value, str):
                            # Case-insensitive partial match
                            if value.lower() not in str(row_data[field_name]).lower():
                                match = False
                        elif row_data[field_name] != value:
                            match = False
                
                if match:
                    matched_rows.append({
                        'round': round_data.get('roundNumber'),
                        'roundName': round_data.get('roundName'),
                        'rowData': row_data,
                        'studentId': data_item.get('studentId'),
                        'status': data_item.get('status')
                    })
        
        return matched_rows
    except Exception as e:
        print(f"Error in deep search: {e}")
        return []

def query_with_wildcard(db, collection, field_pattern, value, operation='get'):
    """
    Handle wildcard queries like 'companyStatus.*.status'
    Used for cross-company queries on students
    """
    try:
        all_docs = db.collection(collection).stream()
        results = []
        
        # Parse field pattern (e.g., 'companyStatus.*.status')
        parts = field_pattern.split('.')
        
        for doc in all_docs:
            doc_data = format_firestore_doc(doc)
            
            # Navigate through nested structure
            if len(parts) == 3 and parts[1] == '*':
                parent_field = parts[0]
                target_field = parts[2]
                
                if parent_field in doc_data and isinstance(doc_data[parent_field], dict):
                    # Check all nested objects
                    for key, nested_obj in doc_data[parent_field].items():
                        if isinstance(nested_obj, dict) and target_field in nested_obj:
                            if nested_obj[target_field] == value:
                                results.append(doc_data)
                                break
        
        if operation == 'count':
            return len(results)
        return results
    except:
        return [] if operation == 'get' else 0
