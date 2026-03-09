"""
Delete Operations Module
Handles company and round cascading deletions with optimized Firestore queries
"""

import logging
from firebase_admin import firestore
from firebase_init import db
from config import FIRESTORE_BATCH_SIZE

logger = logging.getLogger(__name__)


def delete_company_cascade(company_year_id: str, company_name: str, year: int) -> dict:
    """
    Delete company and all associated data (cascading delete)
    
    Args:
        company_year_id: Company year ID (e.g., "google_2026")
        company_name: Company name
        year: Year
        
    Returns:
        dict: Summary of deleted items
    """
    logger.info(f"Starting cascading delete for company: {company_year_id}")
    
    # Track what we delete
    deleted_items = {
        'rounds': 0,
        'round_data': 0,
        'placements': 0,
        'students_updated': 0
    }
    
    # Step 1: Get company data
    company_ref = db.collection('companies').document(company_year_id)
    company_doc = company_ref.get()
    
    if not company_doc.exists:
        raise ValueError(f"Company {company_year_id} not found")
    
    company_data = company_doc.to_dict()
    total_placed = company_data.get('totalPlaced', 0)
    
    # Step 2: Delete all rounds subcollection and their data
    rounds_ref = company_ref.collection('rounds')
    rounds_docs = list(rounds_ref.stream())
    
    for round_doc in rounds_docs:
        # Delete data subcollection within each round
        data_ref = rounds_ref.document(round_doc.id).collection('data')
        data_docs = list(data_ref.stream())
        
        for data_doc in data_docs:
            data_doc.reference.delete()
            deleted_items['round_data'] += 1
        
        # Delete the round document
        round_doc.reference.delete()
        deleted_items['rounds'] += 1
    
    # Step 3: Delete all placements subcollection
    placements_ref = company_ref.collection('placements')
    placements_docs = list(placements_ref.stream())
    
    for placement_doc in placements_docs:
        placement_doc.reference.delete()
        deleted_items['placements'] += 1
    
    # Step 4: Update all student records
    # ✅ FIXED: Update ALL students who participated in this company
    # Query by companyStatus to get all students, not just placed ones
    logger.info(f"Updating students affected by company: {company_year_id}")
    students_ref = db.collection('students')
    
    # Get ALL students (we'll filter by companyStatus in memory)
    students_docs = list(students_ref.stream())
    
    batch = db.batch()
    batch_count = 0
    
    for student_doc in students_docs:
        student_data = student_doc.to_dict()
        company_status = student_data.get('companyStatus', {})
        selected_companies = student_data.get('selectedCompanies', [])
        
        # Check if student has this company in their status
        if company_year_id in company_status:
            logger.debug(f"Updating student {student_doc.id}")
            
            # Remove company from companyStatus
            del company_status[company_year_id]
            
            # Remove from selectedCompanies (handle all variants)
            company_name_str = company_name or ''
            
            if company_year_id in selected_companies:
                selected_companies.remove(company_year_id)
            if company_name_str in selected_companies:
                selected_companies.remove(company_name_str)
            if company_name_str.lower() in selected_companies:
                selected_companies.remove(company_name_str.lower())
            
            # Recalculate totals
            total_offers = len(selected_companies)
            current_status = 'placed' if total_offers > 0 else 'not_placed'
            
            # Update student document
            batch.update(student_doc.reference, {
                'companyStatus': company_status,
                'selectedCompanies': selected_companies,
                'totalOffers': total_offers,
                'currentStatus': current_status,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            
            deleted_items['students_updated'] += 1
            batch_count += 1
            
            # Commit batch every FIRESTORE_BATCH_SIZE
            if batch_count >= FIRESTORE_BATCH_SIZE:
                batch.commit()
                batch = db.batch()
                batch_count = 0
    
    # Commit remaining student updates
    if batch_count > 0:
        batch.commit()
    
    # Step 5: Update year statistics
    year_ref = db.collection('years').document(str(year))
    year_doc = year_ref.get()
    
    if year_doc.exists:
        year_data = year_doc.to_dict()
        company_wise = year_data.get('companyWise', {})
        
        if company_year_id in company_wise:
            placed_count = company_wise[company_year_id].get('placed', 0)
            company_status_in_year = company_wise[company_year_id].get('status', 'running')
            
            # Remove company from companyWise
            del company_wise[company_year_id]
            
            # ✅ NEW: Calculate students who participated in this company
            # This counts total participations, not unique students
            students_participated_count = deleted_items['students_updated']
            
            # Update year document with atomic decrements
            update_data = {
                'companyWise': company_wise,
                'totalCompanies': firestore.Increment(-1),
                'totalPlaced': firestore.Increment(-placed_count),
                'totalStudentsParticipated': firestore.Increment(-students_participated_count)  # ✅ Decrement participations
            }
            
            # Decrement correct status counter
            if company_status_in_year == 'completed':
                update_data['completedCompanies'] = firestore.Increment(-1)
            else:
                update_data['runningCompanies'] = firestore.Increment(-1)
            
            year_ref.update(update_data)
            logger.info(f"Updated year {year} statistics (participations: -{students_participated_count})")
    
    # Step 6: systemStats updates removed (no longer maintained)
    
    # Step 7: Delete the company document itself
    company_ref.delete()
    logger.info(f"✅ Deleted company document: {company_year_id}")
    
    return deleted_items


def delete_round(company_year_id: str, round_id: str, round_number: int) -> dict:
    """
    Delete a round and all associated data
    
    Args:
        company_year_id: Company year ID
        round_id: Round ID
        round_number: Round number
        
    Returns:
        dict: Summary of deleted items
    """
    logger.info(f"Deleting round: {round_id} from company: {company_year_id}")
    
    deleted_items = {
        'round_data': 0,
        'placements': 0,
        'students_updated': 0
    }
    


    # Step 1: Get company and round data
    company_ref = db.collection('companies').document(company_year_id)
    company_doc = company_ref.get()
    
    if not company_doc.exists:
        raise ValueError(f"Company {company_year_id} not found")
    
    company_data = company_doc.to_dict()
    
    round_ref = company_ref.collection('rounds').document(round_id)
    round_doc = round_ref.get()
    
    if not round_doc.exists:
        raise ValueError(f"Round {round_id} not found")
    
    round_data = round_doc.to_dict()
    is_final_round = round_data.get('isFinalRound', False)

    # Step 0: User Requirement - If Round 1 is deleted, delete the entire company
    if round_number == 1:
        logger.info(f"Round 1 deletion requested for {company_year_id}. Triggering full company deletion.")
        return delete_company_cascade(company_year_id, company_data.get('companyName', ''), company_data.get('year', 0))

    # Step 2: Identify students to update
    # User Optimization: "instead of looking both round we can look the previous round"
    # Logic: Participants of Round N-1 include everyone who made it to Round N, PLUS those rejected at N-1.
    # So finding Round N-1 participants is the most efficient way to get the complete list of people to reset.
    
    student_ids_to_update = set()
    
    # 2a. Delete Current Round (Round N) Data - we must do this to clean up
    data_ref = round_ref.collection('data')
    round_data_docs = list(data_ref.stream())
    
    for doc in round_data_docs:
        # We don't necessarily need these IDs for the update list if we trust Round N-1 has them all,
        # but technically someone could be in R2 but not R1? (Unlikely in this flow).
        # We'll just delete them here.
        deleted_items['round_data'] += 1
        doc.reference.delete()
            
    # 2b. Get students from Previous Round (Round N-1) to update everyone
    if round_number > 1:
        prev_round_number = round_number - 1
        rounds_ref = company_ref.collection('rounds')
        # We expect only one round doc with this number, but stream is safe
        prev_rounds = rounds_ref.where('roundNumber', '==', prev_round_number).stream()
        
        for r in prev_rounds:
            logger.info(f"Fetching students from Previous Round {prev_round_number} for state reset")
            prev_data_ref = r.reference.collection('data')
            # Stream IDs only if possible, but Firestore streams full docs. 
            # This is the "minimum reads" part - one stream for the superset.
            for pd in prev_data_ref.stream():
                sid = pd.to_dict().get('studentId')
                if sid:
                    student_ids_to_update.add(sid)
    
    # Step 3: Delete the round document
    round_ref.delete()
    
    # Step 4: Update company statistics (Total Rounds, Current Round)
    remaining_rounds = list(company_ref.collection('rounds').stream())
    new_total_rounds = len(remaining_rounds)
    
    # If no rounds left (should be covered by R1 check, but for safety)
    if new_total_rounds == 0:
        company_status_val = 'completed'
    else:
        company_status_val = 'running' # Usually reverting a round means it's still running
        
    # Recalculate current round (max round number)
    new_current_round = max([r.to_dict().get('roundNumber', 0) for r in remaining_rounds], default=0)
    
    # Update Company Doc
    company_ref.update({
        'totalRounds': new_total_rounds,
        'currentRound': new_current_round,
        'status': company_status_val
    })

    # Step 5: Update Students
    # We iterate through the superset of students involved in Round N and Round N-1
    if student_ids_to_update:
        logger.info(f"Updating {len(student_ids_to_update)} students affected by Round {round_number} deletion")
        
        students_ref = db.collection('students')
        batch = db.batch()
        batch_count = 0
        
        for student_id in student_ids_to_update:
            student_doc = students_ref.document(student_id).get()
            if not student_doc.exists:
                continue
                
            student_data = student_doc.to_dict()
            company_status = student_data.get('companyStatus', {})
            selected_companies = student_data.get('selectedCompanies', [])
            
            if company_year_id in company_status:
                c_stat = company_status[company_year_id]
                
                # Logic: Revert to previous round state
                # roundReached becomes N - 1
                c_stat['roundReached'] = max(0, round_number - 1)
                
                # specific to Final Round deletion
                if is_final_round:
                     # Remove from selectedCompanies if it was there (offer revoked)
                     # Check if they were placed
                     if c_stat.get('finalSelection') is not None:
                         c_stat['finalSelection'] = None
                         
                         # Remove from selectedCompanies (offer revoked)
                         # Handle variants
                         c_name = company_data.get('companyName', '')
                         for variant in [company_year_id, c_name, c_name.lower()]:
                             if variant in selected_companies:
                                 selected_companies.remove(variant)
                
                # Logic: "make them all qualify" / "set to in_progress"
                # If they were rejected in this round (or passed), they are now 'in_process' waiting for next steps (or just back to prev round)
                c_stat['status'] = 'in_process'
                
                # Recalculate totals
                total_offers = len(selected_companies)
                current_status = 'placed' if total_offers > 0 else 'not_placed'
                
                batch.update(student_doc.reference, {
                    'companyStatus': company_status,
                    'selectedCompanies': selected_companies,
                    'totalOffers': total_offers,
                    'currentStatus': current_status,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
                
                deleted_items['students_updated'] += 1
                batch_count += 1
                
                if batch_count >= FIRESTORE_BATCH_SIZE:
                    batch.commit()
                    batch = db.batch()
                    batch_count = 0
        
        if batch_count > 0:
            batch.commit()

    # Step 6: Cleanup Placements if Final Round
    placed_students_removed = 0
    if is_final_round:
        placements_ref = company_ref.collection('placements')
        for p in placements_ref.stream():
            p.reference.delete()
            placed_students_removed += 1
            deleted_items['placements'] += 1
            
        # Update Year Analytics
        year = company_data.get('year')
        if year and placed_students_removed > 0:
            year_ref = db.collection('years').document(str(year))
            # ... (Atomic decrement logic, reusing existing pattern if possible or rewriting)
            # Re-implementing atomic decrement for succinctness since I'm blocking a large chunk
            year_ref.update({
                'totalPlaced': firestore.Increment(-placed_students_removed),
                f'companyWise.{company_year_id}.placed': 0
            })

        # ✅ Update Company Placed Count to 0 (since final round is gone)
        company_ref.update({
            'totalPlaced': 0
        })

    logger.info(f"✅ Deleted Round {round_number} and updated {deleted_items['students_updated']} students")
    return deleted_items
