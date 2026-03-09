"""
Deep Search Function
Searches for specific fields in student's round data (rowData) with intelligent synonym matching
"""

def get_field_synonyms(field_name):
    """
    Get all possible synonyms for a field name
    
    Args:
        field_name: Field to search for
    
    Returns:
        list: All possible variations
    """
    field_lower = field_name.lower()
    
    # Common synonym mappings
    synonym_groups = {
        'phone': ['phone', 'mobile', 'contact', 'phonenumber', 'mobilenumber', 'contactnumber', 
                  'phoneNo', 'mobileNo', 'contactNo', 'tel', 'telephone', 'cell', 'cellphone'],
        'mobile': ['phone', 'mobile', 'contact', 'phonenumber', 'mobilenumber', 'contactnumber',
                   'phoneNo', 'mobileNo', 'contactNo', 'tel', 'telephone', 'cell', 'cellphone'],
        'email': ['email', 'emailid', 'emailaddress', 'mail', 'e-mail'],
        'address': ['address', 'addr', 'location', 'residence', 'homeaddress'],
        'name': ['name', 'fullname', 'studentname', 'candidatename'],
        'father': ['father', 'fathername', 'fathersname', 'guardianname'],
        'mother': ['mother', 'mothername', 'mothersname'],
        'dob': ['dob', 'dateofbirth', 'birthdate', 'birthday'],
        'age': ['age'],
        'gender': ['gender', 'sex'],
        'branch': ['branch', 'department', 'stream', 'specialization'],
        'cgpa': ['cgpa', 'gpa', 'marks', 'percentage', 'grade'],
        'year': ['year', 'yearofstudy', 'semester'],
    }
    
    # Find matching synonym group
    synonyms = set()
    for key, values in synonym_groups.items():
        if field_lower in key or key in field_lower:
            synonyms.update(values)
            break
    
    # If no match, create variations of the original
    if not synonyms:
        synonyms = {
            field_name.lower(),
            field_name.upper(),
            field_name.title(),
            field_name.capitalize(),
            field_name.replace(' ', ''),
            field_name.replace('_', ''),
            field_name.replace('-', ''),
        }
    
    # Add case variations
    all_variations = set()
    for syn in synonyms:
        all_variations.add(syn)
        all_variations.add(syn.lower())
        all_variations.add(syn.upper())
        all_variations.add(syn.title())
        all_variations.add(syn.capitalize())
    
    return list(all_variations)

def deep_search_student_field(db, student_name, field_name):
    """
    Smart deep search for student fields in round data
    
    Strategy:
    1. Find student in students collection
    2. Get all companies student participated in
    3. For each company, check rawColumns to see if field exists
    4. If field found in rawColumns, search that round's data for the student
    5. Use partial matching for field names
    
    Args:
        db: Firestore client
        student_name: Student name to search for
        field_name: Field to find (e.g., 'mobile', 'meeting link')
    
    Returns:
        dict: {"success": bool, "data": dict, "found_in": str, "message": str}
    """
    from firebase_admin import firestore
    from utils import format_firestore_doc
    
    try:
        # Step 1: Find student
        students_ref = db.collection('students')
        students = students_ref.stream()
        
        target_student = None
        for student_doc in students:
            student_data = format_firestore_doc(student_doc)
            if student_name.lower() in str(student_data.get('name', '')).lower():
                target_student = student_data
                break
        
        if not target_student:
            return {
                "success": False,
                "message": f"Student '{student_name}' not found in students collection"
            }
        
        # Step 2: Get companies student participated in
        company_status = target_student.get('companyStatus', {})
        
        if not company_status:
            return {
                "success": False,
                "message": f"Student '{target_student.get('name')}' has not participated in any companies"
            }
        
        # Step 3: Generate search variations
        search_variations = get_all_search_variations(field_name)
        
        # Step 4: For each company, check rawColumns first
        all_found_fields = []
        
        for company_year_id in company_status.keys():
            # Get company document
            company_ref = db.collection('companies').document(company_year_id)
            company_doc = company_ref.get()
            
            if not company_doc.exists:
                continue
            
            # Get all rounds for this company
            rounds_ref = company_ref.collection('rounds')
            rounds = rounds_ref.stream()
            
            for round_doc in rounds:
                round_data = format_firestore_doc(round_doc)
                round_number = round_data.get('roundNumber', '?')
                raw_columns = round_data.get('rawColumns', [])
                
                # Check if any of our search variations match the rawColumns
                matching_column = None
                for col in raw_columns:
                    for search_term in search_variations:
                        if matches_field(col, search_term):
                            matching_column = col
                            break
                    if matching_column:
                        break
                
                # If this round has the field we're looking for
                if matching_column:
                    # Data is ALWAYS stored in subcollection, not as dict field
                    data_ref = rounds_ref.document(round_doc.id).collection('data')
                    
                    for data_doc in data_ref.stream():
                        data_item = format_firestore_doc(data_doc)
                        student_id_in_row = data_item.get('studentId')
                        
                        # Match student by ID or by partial name in rowData
                        is_match = False
                        
                        if student_id_in_row == target_student.get('_id'):
                            is_match = True
                        else:
                            # Also check if student name appears in rowData (partial match)
                            row_data = data_item.get('rowData', {})
                            for val in row_data.values():
                                if student_name.lower() in str(val).lower():
                                    is_match = True
                                    break
                        
                        if is_match:
                            row_data = data_item.get('rowData', {})
                            
                            # Get the value for the matching column
                            if matching_column in row_data:
                                all_found_fields.append({
                                    "field_name": matching_column,
                                    "field_value": row_data[matching_column],
                                    "company": company_year_id,
                                    "round": round_number,
                                    "search_term_used": field_name
                                })
                            break
        
        # Return results
        if all_found_fields:
            best_match = all_found_fields[0]
            return {
                "success": True,
                "data": {
                    "student_name": target_student.get('name'),
                    "student_id": target_student.get('_id'),
                    "field_name": best_match['field_name'],
                    "field_value": best_match['field_value'],
                    "all_matches": all_found_fields
                },
                "found_in": f"Company: {best_match['company']}, Round: {best_match['round']}",
                "count": len(all_found_fields),
                "search_term_used": field_name,
                "message": f"Found '{best_match['field_name']}': {best_match['field_value']}"
            }
        
        # Not found
        return {
            "success": False,
            "message": f"Field '{field_name}' not found in rawColumns of any company that '{target_student.get('name')}' participated in."
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Error in deep search: {str(e)}"
        }

def get_all_search_variations(field_name):
    """Get all possible search term variations"""
    variations = [field_name]
    
    # Split compound terms
    words = field_name.replace('_', ' ').replace('-', ' ').split()
    if len(words) > 1:
        variations.append('_'.join(words))
        variations.append(''.join(words))
        variations.extend(words)
    
    # Add specific synonyms
    field_lower = field_name.lower()
    if 'meeting' in field_lower or 'meet' in field_lower:
        variations.extend(['meeting', 'meet', 'link', 'url', 'Meeting Link'])
    elif 'link' in field_lower or 'url' in field_lower:
        variations.extend(['link', 'url', 'Link', 'URL', 'Meeting Link'])
    elif 'mobile' in field_lower or 'phone' in field_lower or 'contact' in field_lower:
        variations.extend(['phone', 'mobile', 'contact', 'Phone', 'Mobile', 'Contact'])
    elif 'email' in field_lower:
        variations.extend(['email', 'Email', 'mail', 'Mail'])
    
    # Add shortened versions
    for word in words:
        if len(word) > 3:
            variations.append(word[:4])
            variations.append(word[:3])
    
    return list(set(variations))  # Remove duplicates

def matches_field(column_name, search_term):
    """Check if column name matches search term (case-insensitive partial match)"""
    col_clean = column_name.lower().replace('_', '').replace('-', '').replace(' ', '')
    search_clean = search_term.lower().replace('_', '').replace('-', '').replace(' ', '')
    
    # Exact match
    if col_clean == search_clean:
        return True
    
    # Partial match (search term in column or vice versa)
    if len(search_clean) >= 3:
        if search_clean in col_clean or col_clean in search_clean:
            return True
    
    return False
    """
    Search for a specific field (like phone, mobile) in a student's round data
    Uses intelligent synonym matching and progressive keyword simplification
    
    Args:
        db: Firestore client
        student_name: Student name to search for
        field_name: Field to find (e.g., 'mobile', 'phone', 'contact')
    
    Returns:
        dict: {"success": bool, "data": dict, "found_in": str, "message": str}
    """
    from firebase_admin import firestore
    from utils import format_firestore_doc
    
    try:
        # Step 1: Find student
        students_ref = db.collection('students')
        students = students_ref.stream()
        
        target_student = None
        for student_doc in students:
            student_data = format_firestore_doc(student_doc)
            if student_name.lower() in str(student_data.get('name', '')).lower():
                target_student = student_data
                break
        
        if not target_student:
            return {
                "success": False,
                "message": f"Student '{student_name}' not found in students collection"
            }
        
        # Step 2: Get companies student participated in
        company_status = target_student.get('companyStatus', {})
        
        if not company_status:
            return {
                "success": False,
                "message": f"Student '{target_student.get('name')}' has not participated in any companies"
            }
        
        # Step 3: Progressive keyword simplification
        # Try multiple search passes with increasingly simplified keywords
        search_variations = [
            field_name,  # Original (e.g., "meeting link")
        ]
        
        # Split compound terms (e.g., "meeting link" → ["meeting", "link"])
        words = field_name.replace('_', ' ').replace('-', ' ').split()
        if len(words) > 1:
            # Add combined versions
            search_variations.append('_'.join(words))  # "meeting_link"
            search_variations.append(''.join(words))   # "meetinglink"
            # Add individual words
            search_variations.extend(words)  # ["meeting", "link"]
        
        # Add core synonym groups
        field_lower = field_name.lower()
        if 'mobile' in field_lower or 'phone' in field_lower or 'contact' in field_lower:
            search_variations.extend(['phone', 'mobile', 'contact', 'pho', 'mob', 'con'])
        elif 'email' in field_lower or 'mail' in field_lower:
            search_variations.extend(['email', 'mail', 'ema'])
        elif 'address' in field_lower or 'addr' in field_lower:
            search_variations.extend(['address', 'addr', 'add'])
        elif 'meeting' in field_lower or 'meet' in field_lower:
            search_variations.extend(['meeting', 'meet', 'link', 'url', 'lin'])
        elif 'link' in field_lower or 'url' in field_lower:
            search_variations.extend(['link', 'url', 'href', 'lin'])
        else:
            # Generic simplification - try first 3-4 chars of each word
            for word in words:
                if len(word) > 3:
                    search_variations.append(word[:4])
                    search_variations.append(word[:3])
        
        # Try each variation
        for search_term in search_variations:
            field_variations = get_field_synonyms(search_term)
            
            # Step 4: Search through each company's rounds
            all_found_fields = []
            
            for company_year_id in company_status.keys():
                # Get company document
                company_ref = db.collection('companies').document(company_year_id)
                company_doc = company_ref.get()
                
                if not company_doc.exists:
                    continue
                
                # Get all rounds for this company
                rounds_ref = company_ref.collection('rounds')
                rounds = rounds_ref.stream()
                
                for round_doc in rounds:
                    round_data = format_firestore_doc(round_doc)
                    round_number = round_data.get('roundNumber', '?')
                    
                    # Check data rows in this round
                    data_rows = round_data.get('data', {})
                    for row_id, row_info in data_rows.items():
                        row_data = row_info.get('rowData', {})
                        student_id_in_row = row_info.get('studentId')
                        
                        # Check if this row belongs to our student
                        if student_id_in_row == target_student.get('_id'):
                            # Search for ANY matching field in rowData
                            for actual_field_name, field_value in row_data.items():
                                # METHOD 1: Exact case-insensitive match
                                exact_match = actual_field_name.lower() in [v.lower() for v in field_variations]
                                
                                # METHOD 2: Advanced partial match - check if ANY search term appears ANYWHERE
                                partial_match = False
                                match_type = "none"
                                
                                actual_field_lower = actual_field_name.lower().replace('_', '').replace('-', '').replace(' ', '')
                                
                                # Check synonym variations
                                for variation in field_variations:
                                    variation_clean = variation.lower().replace('_', '').replace('-', '').replace(' ', '')
                                    if variation_clean in actual_field_lower or actual_field_lower in variation_clean:
                                        partial_match = True
                                        match_type = "synonym_partial"
                                        break
                                
                                # METHOD 3: Ultra-aggressive - check if search_term itself appears in field name
                                if not partial_match:
                                    search_clean = search_term.lower().replace('_', '').replace('-', '').replace(' ', '')
                                    if len(search_clean) >= 3 and search_clean in actual_field_lower:
                                        partial_match = True
                                        match_type = "keyword_partial"
                                
                                # If either exact or partial match, add to results
                                if exact_match or partial_match:
                                    all_found_fields.append({
                                        "field_name": actual_field_name,
                                        "field_value": field_value,
                                        "company": company_year_id,
                                        "round": round_number,
                                        "match_type": "exact" if exact_match else match_type,
                                        "search_term_used": search_term
                                    })
            
            # If we found something, return immediately
            if all_found_fields:
                best_match = all_found_fields[0]
                return {
                    "success": True,
                    "data": {
                        "student_name": target_student.get('name'),
                        "student_id": target_student.get('_id'),
                        "field_name": best_match['field_name'],
                        "field_value": best_match['field_value'],
                        "all_matches": all_found_fields
                    },
                    "found_in": f"Company: {best_match['company']}, Round: {best_match['round']}",
                    "count": len(all_found_fields),
                    "search_term_used": search_term,
                    "message": f"Found '{best_match['field_name']}': {best_match['field_value']} (matched using '{search_term}')"
                }
        
        # Not found with any variation
        return {
            "success": False,
            "message": f"Field '{field_name}' not found. Tried variations: {', '.join(search_variations[:5])}. Student '{target_student.get('name')}' has data in {len(company_status)} company(ies)."
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Error in deep search: {str(e)}"
        }
    """
    Search for a specific field (like phone, mobile) in a student's round data
    
    Args:
        db: Firestore client
        student_name: Student name to search for
        field_name: Field to find (e.g., 'mobile', 'phone', 'contact')
    
    Returns:
        dict: {"success": bool, "data": dict, "found_in": str, "message": str}
    """
    from firebase_admin import firestore
    from utils import format_firestore_doc
    
    try:
        # Step 1: Find student
        students_ref = db.collection('students')
        students = students_ref.stream()
        
        target_student = None
        for student_doc in students:
            student_data = format_firestore_doc(student_doc)
            if student_name.lower() in str(student_data.get('name', '')).lower():
                target_student = student_data
                break
        
        if not target_student:
            return {
                "success": False,
                "message": f"Student '{student_name}' not found"
            }
        
        # Step 2: Get companies student participated in
        company_status = target_student.get('companyStatus', {})
        
        if not company_status:
            return {
                "success": False,
                "message": f"Student '{student_name}' has not participated in any companies"
            }
        
        # Step 3: Search through each company's rounds
        field_variations = [field_name.lower(), field_name.upper(), field_name.title()]
        if 'phone' in field_name.lower() or 'mobile' in field_name.lower():
            field_variations.extend(['phone', 'Phone', 'PHONE', 'mobile', 'Mobile', 'MOBILE', 
                                    'contact', 'Contact', 'CONTACT', 'phoneNumber', 'mobileNumber'])
        
        for company_year_id in company_status.keys():
            # Get company document
            company_ref = db.collection('companies').document(company_year_id)
            company_doc = company_ref.get()
            
            if not company_doc.exists:
                continue
            
            # Get all rounds for this company
            rounds_ref = company_ref.collection('rounds')
            rounds = rounds_ref.stream()
            
            for round_doc in rounds:
                round_data = format_firestore_doc(round_doc)
                
                # Check data rows in this round
                data_rows = round_data.get('data', {})
                for row_id, row_info in data_rows.items():
                    row_data = row_info.get('rowData', {})
                    student_id_in_row = row_info.get('studentId')
                    
                    # Check if this row belongs to our student
                    if student_id_in_row == target_student.get('_id'):
                        # Search for the field in rowData
                        for field_var in field_variations:
                            if field_var in row_data:
                                return {
                                    "success": True,
                                    "data": {
                                        "student_name": target_student.get('name'),
                                        "field_name": field_var,
                                        "field_value": row_data[field_var],
                                        "student_id": target_student.get('_id'),
                                        "all_row_data": row_data
                                    },
                                    "found_in": f"Company: {company_year_id}, Round: {round_data.get('roundNumber')}",
                                    "message": f"Found '{field_var}': {row_data[field_var]}"
                                }
        
        # Not found in any round
        return {
            "success": False,
            "message": f"Field '{field_name}' not found in any round data for student '{student_name}'"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": f"Error in deep search: {str(e)}"
        }
