import pytz
from fastapi import APIRouter, HTTPException, Body
from database import db
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

class MarkAttendanceRequest(BaseModel):
    student_id: str

class UpdateAttendanceRequest(BaseModel):
    student_id: str
    date: str
    status: str

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
    
    # 1. Verify student
    student = db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail=f"Student with ID '{student_id}' not found.")

    # 2. Get current time (IST)
    IST = pytz.timezone('Asia/Kolkata')
    now_ist = datetime.now(IST)
    day_str = now_ist.date().isoformat()

    # 3. Determine status
    status = "late" if now_ist.hour >= 12 else "present"

    # 4. Convert IST -> UTC before saving
    now_utc = now_ist.astimezone(pytz.UTC)

    result = db.attendance.update_one(
        {"student_id": student_id, "day": day_str},
        {
            "$setOnInsert": {
                "timestamp": now_utc,
                "status": status,
                "source": "recognition"
            }
        },
        upsert=True
    )
    
    if result.upserted_id:
        new_record = db.attendance.find_one({"_id": result.upserted_id})
        return {
            "msg": "Attendance marked successfully",
            "record": {
                "student_id": student["student_id"],
                "name": student["name"],
                "photo_url": student.get("photo_url"),
                "status": new_record["status"],
                "timestamp": now_ist.isoformat()  # Display IST
            }
        }
    else:
        return {"msg": "Attendance already marked for today", "record": None}

# --------------------------------------------------------------------------
# --- Endpoint to MANUALLY UPDATE attendance (PUT) ---
# --------------------------------------------------------------------------
@router.put("/update")
async def update_attendance(payload: UpdateAttendanceRequest):
    """
    Manually updates the attendance status for a student on a specific day.
    Used by admins from the dashboard.
    """
    if payload.status not in ['present', 'late', 'absent']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present', 'late', or 'absent'.")

    IST = pytz.timezone('Asia/Kolkata')
    
    # Try to find existing record for that day
    existing = db.attendance.find_one({
        'student_id': payload.student_id, 
        'day': payload.date
    })
    
    update_data = {
        'status': payload.status, 
        'source': 'manual_update'
    }

    # If marking present/late and no timestamp exists, add one now.
    if payload.status in ['present', 'late'] and (not existing or not existing.get('timestamp')):
         update_data['timestamp'] = datetime.now(IST)

    result = db.attendance.update_one(
        {'student_id': payload.student_id, 'day': payload.date},
        {'$set': update_data},
        upsert=True # Create record if it was 'absent' (no record) before
    )

    return {"msg": "Attendance status updated successfully"}

# --------------------------------------------------------------------------
# --- Endpoint to GET today's attendance log (GET) ---
# --------------------------------------------------------------------------
@router.get("/today")
async def get_todays_attendance():
    """
    Retrieves all attendance records for today, joined with student details,
    and timestamps converted to IST for display.
    """
    IST = pytz.timezone('Asia/Kolkata')
    today_str = datetime.now(IST).date().isoformat()

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
            "timestamp": {
                "$dateToString": {
                    "format": "%Y-%m-%dT%H:%M:%S",
                    "date": "$timestamp",
                    "timezone": "Asia/Kolkata"
                }
            },
            "name": "$student_details.name",
            "photo_url": "$student_details.photo_url"
        }}
    ]
    
    todays_log = list(db.attendance.aggregate(pipeline))
    return todays_log