import pytz
from fastapi import APIRouter, HTTPException, Body
from database import db
from datetime import datetime
from pydantic import BaseModel

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

class MarkAttendanceRequest(BaseModel):
    student_id: str

# --------------------------------------------------------------------------
# --- Endpoint to MARK attendance (POST) ---
# --------------------------------------------------------------------------
@router.post("")
async def mark_attendance(payload: MarkAttendanceRequest):
    """
    Marks attendance for a given student.
    Automatically determines if the student is 'present' or 'late' based on IST time.
    """
    student_id = payload.student_id
    
    # 1. Check if the student exists
    student = db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with ID '{student_id}' not found.")

    # 2. Get the current time and date in your timezone (IST)
    IST = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(IST)
    day_str = now_ist.isoformat()

    # 3. Determine status based on the time
    # This uses the 12 PM threshold we discussed
    status = "late" if now_ist.hour >= 12 else "present"

    # 4. Use update_one with upsert to efficiently mark attendance only once per day
    result = db.attendance.update_one(
        {"student_id": student_id, "day": day_str},
        {
            "$setOnInsert": {
                "timestamp": now_ist,
                "status": status,
                "source": "recognition" # Or another source
            }
        },
        upsert=True
    )
    
    # If a new record was created (upserted_id exists)
    if result.upserted_id:
        new_record = db.attendance.find_one({"_id": result.upserted_id})
        return {
            "msg": "Attendance marked successfully",
            "record": {
                "student_id": student["student_id"],
                "name": student["name"],
                "photo_url": student.get("photo_url"),
                "status": new_record["status"],
                "timestamp": new_record["timestamp"].isoformat()
            }
        }
    else:
        # If the record already existed, no update was made
        return {"msg": "Attendance already marked for today", "record": None}


# --------------------------------------------------------------------------
# --- Endpoint to GET today's attendance log (GET) ---
# --------------------------------------------------------------------------
@router.get("/today")
async def get_todays_attendance():
    """
    Retrieves a list of all students who have marked attendance today,
    enriched with their name and photo URL, and sorted by most recent.
    """
    IST = pytz.timezone('Asia/Kolkata')
    today_str = datetime.now(IST).date().isoformat()

    # Use a MongoDB aggregation pipeline to join attendance with student details
    pipeline = [
        {"$match": {"day": today_str}},
        {"$sort": {"timestamp": -1}},
        {"$lookup": {
            "from": "students",
            "localField": "student_id",
            "foreignField": "student_id",
            "as": "student_details"
        }},
        {"$unwind": "$student_details"},
        {"$project": {
            "_id": 0,
            "student_id": "$student_id",
            "status": "$status",
            "timestamp": "$timestamp",
            "name": "$student_details.name",
            "photo_url": "$student_details.photo_url"
        }}
    ]
    
    todays_log = list(db.attendance.aggregate(pipeline))
    return todays_log