from fastapi import APIRouter, File, UploadFile, HTTPException, status
from database import db
from datetime import datetime
import pytz
import os
import numpy as np

from utils.face_utils import get_embedding_from_image_array, cosine_similarity, image_from_bytes

router = APIRouter(
    prefix="/recognition",
    tags=["Recognition"]
)

# Load the recognition threshold from environment variables with a safe default
try:
    RECOGNITION_THRESHOLD = float(os.getenv('RECOGNITION_THRESHOLD', '0.92'))
except (ValueError, TypeError):
    RECOGNITION_THRESHOLD = 0.92

@router.post("/recognize")
async def recognize_student(file: UploadFile = File(...)):
    """
    Receives an image, finds a face, and compares it against all known students.
    If a match is found, it marks attendance for the day and returns the result.
    """
    contents = await file.read()
    img_array = image_from_bytes(contents)
    unknown_embedding = get_embedding_from_image_array(img_array)

    if unknown_embedding is None:
        raise HTTPException(status_code=400, detail="No face found in the uploaded image.")

    known_students = list(db.students.find({"embedding": {"$ne": None}}))
    if not known_students:
        raise HTTPException(status_code=404, detail="No registered students with embeddings found.")

    best_match_score = -1.0
    best_match_student = None

    for student in known_students:
        # Ensure embedding exists and is a list before comparison
        if student.get('embedding') and isinstance(student['embedding'], list):
            similarity = cosine_similarity(unknown_embedding, student['embedding'])
            if similarity > best_match_score:
                best_match_score = similarity
                best_match_student = student
    
    if best_match_student and best_match_score >= RECOGNITION_THRESHOLD:
        # --- Timezone-Aware Logic ---
        IST = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(IST)
        today_str_ist = now_ist.date().isoformat()
        
        # Determine status based on the time in IST
        status = "late" if now_ist.hour >= 12 else "present"
        
        # Atomically mark attendance only if it doesn't already exist for today
        db.attendance.update_one(
            {'student_id': best_match_student['student_id'], 'day': today_str_ist},
            {'$setOnInsert': {
                'timestamp': now_ist,
                'day': today_str_ist,
                'status': status,
                'source': 'recognition'
            }},
            upsert=True
        )
        
        # --- IMPROVEMENT: Return the full record for the frontend ---
        return {
            "status": "match_found",
            "student_id": best_match_student["student_id"],
            "name": best_match_student["name"],
            "similarity": best_match_score,
            "record": {
                "student_id": best_match_student["student_id"],
                "name": best_match_student["name"],
                "photo_url": best_match_student.get("photo_url"),
                "status": status,
                "timestamp": now_ist.isoformat()
            }
        }

    raise HTTPException(status_code=404, detail="No match found.")