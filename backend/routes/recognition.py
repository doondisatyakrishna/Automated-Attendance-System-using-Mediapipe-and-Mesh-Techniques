import os
from fastapi import APIRouter, File, UploadFile, HTTPException
from database import db
from datetime import datetime
import pytz
import face_recognition
import numpy as np
from typing import List, Optional
# Import our utils
from utils.face_utils import (
    image_from_bytes, 
    get_embedding_from_image_array, 
    check_liveness_cnn, 
    check_blink_liveness,
    check_face_quality,
)

router = APIRouter(
    prefix="/recognition",
    tags=["Recognition"]
)

# Thresholds from your environment or defaults
RECOGNITION_THRESHOLD = float(os.getenv("RECOGNITION_THRESHOLD", 0.50))
MATCH_MARGIN = float(os.getenv("MATCH_MARGIN", 0.15))
print(f"[INFO] Recognition distance threshold set to {RECOGNITION_THRESHOLD}")
print(f"[INFO] Match margin (best vs second-best) set to {MATCH_MARGIN}")


@router.post("/check-liveness")
async def check_liveness_endpoint(frames: List[UploadFile] = File(...)):
    """
    (Optional endpoint if you still want blink detection elsewhere)
    """
    try:
        image_arrays = []
        for frame in frames:
            contents = await frame.read()
            img_array = image_from_bytes(contents)
            image_arrays.append(img_array)
        is_live = check_blink_liveness(image_arrays)
        if not is_live:
            raise HTTPException(status_code=400, detail="Liveness check failed. Please blink clearly at the camera.")
        return {"live": True, "detail": "Liveness check successful."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Liveness check endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during liveness check.")


@router.post("/recognize")
async def recognize_student(
    # We only expect 'file', not 'frames'
    file: UploadFile = File(default=None)
):
    """
    Receives a SINGLE image, performs liveness check, generates an embedding, 
    finds a match, and marks attendance (if not manually overridden).
    """
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No image provided.")
        
        contents = await file.read()
        img_array = image_from_bytes(contents)
        
        if img_array is None:
             raise HTTPException(status_code=400, detail="Failed to process image.")

        ok, reason = check_face_quality(img_array)
        if not ok:
            raise HTTPException(status_code=400, detail=reason)
        
        # --- Liveness Logic ---
        print("[DEBUG] Performing CNN liveness check on single frame")
        # Ensure your utils/face_utils.py has the lowered 0.50 threshold if you want higher success rate
        is_live = check_liveness_cnn(img_array)
        if not is_live:
            raise HTTPException(
                status_code=400, 
                detail="Liveness check failed. Image appears to be a photo or screen."
            )
        print("[DEBUG] CNN liveness check passed.")
        
        # --- RECOGNITION LOGIC (SINGLE FRAME) ---
        unknown_embedding = get_embedding_from_image_array(img_array)

        if unknown_embedding is None:
            raise HTTPException(status_code=400, detail="Could not detect or process a face from the image.")

        # --- Standard Recognition Logic ---
        # Supports both legacy: {embedding: [..]} and new: {embeddings: [[..],[..],...]}
        known_students = list(
            db.students.find(
                {
                    "$or": [
                        {"embeddings": {"$exists": True, "$ne": None}},
                        {"embedding": {"$exists": True, "$ne": None}},
                    ]
                }
            )
        )
        if not known_students:
            raise HTTPException(status_code=404, detail="No registered students with embeddings found.")

        # Flatten all enrolled embeddings so we can match against all of them
        flat_embeddings: List[List[float]] = []
        embedding_owner_idx: List[int] = []
        for i, student in enumerate(known_students):
            if isinstance(student.get("embeddings"), list) and student.get("embeddings"):
                for emb in student["embeddings"]:
                    flat_embeddings.append(emb)
                    embedding_owner_idx.append(i)
            elif student.get("embedding") is not None:
                flat_embeddings.append(student["embedding"])
                embedding_owner_idx.append(i)

        if not flat_embeddings:
            raise HTTPException(status_code=404, detail="No registered students with embeddings found.")

        face_distances = face_recognition.face_distance(
            flat_embeddings, np.array(unknown_embedding)
        )

        sorted_flat = np.argsort(face_distances)
        best_flat_idx = int(sorted_flat[0])
        best_match_distance = float(face_distances[best_flat_idx])
        best_match_index = embedding_owner_idx[best_flat_idx]
        
        second_best_distance = (
            float(face_distances[int(sorted_flat[1])]) if len(sorted_flat) > 1 else float("inf")
        )
        margin = second_best_distance - best_match_distance
        
        best_match_student = None
        if best_match_distance <= RECOGNITION_THRESHOLD and margin >= MATCH_MARGIN:
            best_match_student = known_students[best_match_index]
            print(f"[DEBUG] ✓ Match confirmed: {best_match_student['name']}")
            print(f"[DEBUG]   Best distance: {best_match_distance:.4f}")
            print(f"[DEBUG]   Margin: {margin:.4f}")
        
        if not best_match_student:
            print(f"[DEBUG] ✗ No reliable match found")
            print(f"[DEBUG]   Best distance: {best_match_distance:.4f} (threshold: {RECOGNITION_THRESHOLD})")
            if len(sorted_flat) > 1:
                print(f"[DEBUG]   Margin: {margin:.4f} (required: {MATCH_MARGIN})")
            raise HTTPException(status_code=404, detail="No matching student found.")
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Unexpected error during recognition: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during recognition.")

    # --- Attendance Recording (Protected against overwriting manual edits) ---
    try:
        IST = pytz.timezone("Asia/Kolkata")
        now_ist = datetime.now(IST)
        today_str = now_ist.date().isoformat()

        # 1. CHECK if record exists and was manually updated
        existing_record = db.attendance.find_one({
            'student_id': best_match_student['student_id'],
            'day': today_str
        })

        if existing_record and existing_record.get('source') == 'manual_update':
            print(f"[INFO] Skipping auto-update for {best_match_student['name']}: locked by manual update.")
            # Return success so frontend doesn't show error, but don't change DB
            return {
                "status": "match_found",
                "student_id": best_match_student["student_id"],
                "name": best_match_student["name"],
                "distance": round(best_match_distance, 4),
                "info": "Attendance already manually verified."
            }

        # 2. If NOT manually updated, proceed with automated marking
        status_str = "late" if now_ist.hour >= 12 else "present"
        now_utc = now_ist.astimezone(pytz.UTC)

        db.attendance.update_one(
            {'student_id': best_match_student['student_id'], 'day': today_str},
            {'$set': {'timestamp': now_utc, 'status': status_str, 'source': 'recognition'}},
            upsert=True
        )
        
        return {
            "status": "match_found",
            "student_id": best_match_student["student_id"],
            "name": best_match_student["name"],
            "distance": round(best_match_distance, 4)
        }
    except Exception as e:
        print(f"[ERROR] Failed to record attendance to DB: {str(e)}")
        raise HTTPException(status_code=500, detail="Face recognized, but failed to record attendance.")