"""
Data Manipulation Functions
Allows AI to filter, select, and transform stored large datasets
"""

def filter_stored_data(params):
    """
    Filter rows in stored dataset based on conditions
    
    Args:
        params = {
            "data_id": "dataset_1",
            "filters": {"name": "vighnan", "status": "in_process"},
            "operation": "filter"  // filter, select_fields, limit
        }
    
    Returns:
        dict: {"success": bool, "data": list, "count": int, "message": str}
    """
    try:
        data_id = params.get('data_id')
        filters = params.get('filters', {})
        operation = params.get('operation', 'filter')
        fields = params.get('fields', [])
        limit = params.get('limit', None)
        
        # This will be called by agent with access to stored_data
        # Placeholder - actual implementation in agent.py
        return {
            "success": True,
            "operation": operation,
            "filters": filters,
            "fields": fields,
            "limit": limit,
            "message": "Data operation requested"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Error in data operation: {str(e)}"
        }

def select_fields_from_data(data, fields):
    """
    Select only specific fields from dataset
    
    Args:
        data: list of dicts
        fields: list of field names to keep
    
    Returns:
        list: filtered data with only selected fields
    """
    if not fields:
        return data
    
    result = []
    for item in data:
        if isinstance(item, dict):
            filtered_item = {k: v for k, v in item.items() if k in fields or k == '_id'}
            result.append(filtered_item)
        else:
            result.append(item)
    
    return result

def filter_rows(data, filters):
    """
    Filter rows based on conditions
    
    Args:
        data: list of dicts
        filters: dict of field: value conditions
                Value can be simple value or dict with operators: {'>', '<', '>=', '<=', '!=', '=='}
    
    Returns:
        list: filtered data matching all conditions
    """
    if not filters:
        return data
    
    result = []
    for item in data:
        if isinstance(item, dict):
            match = True
            for field, value in filters.items():
                # Handle nested fields (e.g., "companyStatus.btc_2024.status")
                if '.' in field:
                    parts = field.split('.')
                    current = item
                    for part in parts:
                        if isinstance(current, dict) and part in current:
                            current = current[part]
                        else:
                            match = False
                            break
                    
                    if match:
                        # Check if value is a comparison operator dict
                        if isinstance(value, dict):
                            for op, compare_val in value.items():
                                if not _compare_values(current, op, compare_val):
                                    match = False
                                    break
                        else:
                            # Case-insensitive comparison for strings
                            if isinstance(value, str) and isinstance(current, str):
                                if value.lower() not in str(current).lower():
                                    match = False
                            elif current != value:
                                match = False
                else:
                    # Simple field comparison
                    if field in item:
                        item_value = item[field]
                        
                        # Check if value is a comparison operator dict
                        if isinstance(value, dict):
                            for op, compare_val in value.items():
                                if not _compare_values(item_value, op, compare_val):
                                    match = False
                                    break
                        else:
                            # Case-insensitive for strings
                            if isinstance(value, str) and isinstance(item_value, str):
                                if value.lower() not in str(item_value).lower():
                                    match = False
                            elif item_value != value:
                                match = False
                    else:
                        match = False
            
            if match:
                result.append(item)
    
    return result

def _compare_values(field_value, operator, compare_value):
    """
    Compare two values using the given operator
    
    Args:
        field_value: Value from the data
        operator: Comparison operator ('>', '<', '>=', '<=', '!=', '==')
        compare_value: Value to compare against
    
    Returns:
        bool: True if comparison passes, False otherwise
    """
    try:
        # Try to convert to numbers for numeric comparison
        if isinstance(compare_value, (int, float)):
            try:
                field_value = float(field_value)
            except (ValueError, TypeError):
                # If can't convert to number, treat as string comparison
                pass
        
        if operator == '>':
            return field_value > compare_value
        elif operator == '>=':
            return field_value >= compare_value
        elif operator == '<':
            return field_value < compare_value
        elif operator == '<=':
            return field_value <= compare_value
        elif operator == '!=':
            return field_value != compare_value
        elif operator == '==':
            return field_value == compare_value
        else:
            # Unknown operator, return False
            return False
    except (TypeError, ValueError):
        # Comparison failed (e.g., comparing incompatible types)
        return False


def limit_data(data, limit):
    """
    Limit number of results
    
    Args:
        data: list
        limit: int, max number of items
    
    Returns:
        list: limited data
    """
    if limit and isinstance(limit, int) and limit > 0:
        return data[:limit]
    return data

def combine_datasets(datasets):
    """
    Combine multiple datasets into one
    
    Args:
        datasets: list of lists (multiple datasets)
    
    Returns:
        list: combined data
    """
    combined = []
    for dataset in datasets:
        if isinstance(dataset, list):
            combined.extend(dataset)
        else:
            combined.append(dataset)
    return combined

def query_multiple_datasets(datasets, filters=None, fields=None, limit=None):
    """
    Query across multiple datasets
    
    Args:
        datasets: list of lists (multiple datasets to search)
        filters: dict of conditions to match
        fields: list of fields to select
        limit: max results
    
    Returns:
        list: filtered and formatted results
    """
    # Combine all datasets
    combined = combine_datasets(datasets)
    
    # Apply filters
    if filters:
        combined = filter_rows(combined, filters)
    
    # Select fields
    if fields:
        combined = select_fields_from_data(combined, fields)
    
    # Limit
    if limit:
        combined = limit_data(combined, limit)
    
    return combined

def sort_data(data, field, direction='asc'):
    """
    Sort data by a specific field
    
    Args:
        data: list of dicts
        field: field name to sort by
        direction: 'asc' for ascending, 'desc' for descending
    
    Returns:
        list: sorted data
    """
    if not data or not field:
        return data
    
    try:
        # Create a copy to avoid modifying original
        sorted_data = data.copy()
        
        # Handle nested fields (e.g., "companyStatus.totalOffers")
        if '.' in field:
            def get_nested_value(item, field_path):
                parts = field_path.split('.')
                current = item
                for part in parts:
                    if isinstance(current, dict) and part in current:
                        current = current[part]
                    else:
                        return None
                return current
            
            sorted_data.sort(
                key=lambda x: get_nested_value(x, field) or '',
                reverse=(direction == 'desc')
            )
        else:
            # Simple field sorting
            sorted_data.sort(
                key=lambda x: x.get(field, ''),
                reverse=(direction == 'desc')
            )
        
        return sorted_data
    except Exception as e:
        print(f"Error sorting data: {e}")
        return data

def get_top_n(data, n, sort_by=None, direction='desc'):
    """
    Get top N items from dataset, optionally sorted
    
    Args:
        data: list of dicts
        n: number of items to return
        sort_by: optional field to sort by first
        direction: 'asc' or 'desc' (default: 'desc' for top N)
    
    Returns:
        list: top N items
    """
    if not data:
        return data
    
    # Sort if requested
    if sort_by:
        data = sort_data(data, sort_by, direction)
    
    # Limit to N items
    return limit_data(data, n)

