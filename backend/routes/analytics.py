import pytz
from fastapi import APIRouter, HTTPException, Query
from database import db
from datetime import datetime, timezone, timedelta

router = APIRouter(
    prefix="/analytics", 
    tags=["Analytics"]
)

# --------------------------------------------------------------------------
# --- Endpoint for the Main Dashboard UI ---
# --------------------------------------------------------------------------

@router.get("/dashboard-summary")
async def get_dashboard_summary():
    """
    Provides all necessary data for the main dashboard UI in one call.
    This includes overall attendance stats and a detailed log for today.
    """
    # Define the Indian Standard Time timezone for accurate "today" calculation
    utc_now = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=5, minutes=30)
    now_ist = utc_now + ist_offset
    today_str = now_ist.date().isoformat()
    
    students_collection = db.get_collection("students")
    attendance_collection = db.get_collection("attendance")

    # 1. Get total number of students
    total_students = students_collection.count_documents({})

    # 2. Get today's attendance records and categorize them efficiently
    todays_attendance = list(attendance_collection.find({"day": today_str}))
    
    present_ids = {rec["student_id"] for rec in todays_attendance if rec.get("status") == "present"}
    late_ids = {rec["student_id"] for rec in todays_attendance if rec.get("status") == "late"}
    
    # Calculate absent count using efficient set operations
    present_or_late_ids = present_ids.union(late_ids)
    all_student_ids = {s["student_id"] for s in students_collection.find({}, {"student_id": 1})}
    absent_count = len(all_student_ids - present_or_late_ids)

    # Compile the final stats object
    stats = {
        "total": total_students,
        "present": len(present_ids),
        "absent": absent_count,
        "late": len(late_ids),
    }

    # 3. Create the detailed attendance log for all students for today
    all_students_list = list(students_collection.find({}, {"embedding": 0})) # Exclude embedding
    attendance_log = []
    
    # Create a lookup map for efficient status checking
    todays_attendance_map = {rec["student_id"]: rec for rec in todays_attendance}

    for student in all_students_list:
        student_id = student["student_id"]
        record = {
            "student_id": student_id,
            "name": student["name"],
            "photo_url": student.get("photo_url"),
            "status": "absent",  # Default to absent
            "check_in_time": None
        }
        
        # If the student has an attendance record today, update their status
        if student_id in todays_attendance_map:
            att_rec = todays_attendance_map[student_id]
            record["status"] = att_rec.get("status", "absent")
            record["check_in_time"] = att_rec.get("timestamp")

        attendance_log.append(record)
        
    return {"stats": stats, "log": attendance_log}

# --------------------------------------------------------------------------
# --- Endpoint for the Analytics Page Chart ---
# --------------------------------------------------------------------------

@router.get("/attendance-by-department")
async def get_attendance_by_department(
    period: str = Query("7", enum=["7", "30", "all"])
):
    """
    Calculates attendance percentages by department for a given period.
    This version has a corrected and more robust aggregation pipeline.
    """
    end_date = datetime.utcnow()
    start_date = None
    if period != "all":
        start_date = end_date - timedelta(days=int(period))

    try:
        # Stage 1: Match records within the date range
        match_stage = {"$match": {"status": {"$in": ["present", "late"]}}}
        if start_date:
            match_stage["$match"]["timestamp"] = {"$gte": start_date, "$lte": end_date}
        
        # Stage 2: Look up student's department
        lookup_stage = {
            "$lookup": {
                "from": "students",
                "localField": "student_id",
                "foreignField": "student_id",
                "as": "student_info"
            }
        }

        # Stage 3: Unwind student_info and filter out records with no matching student
        unwind_stage = {"$unwind": "$student_info"}
        
        # Stage 4: Group by department and day to count unique check-ins
        group_by_day_stage = {
            "$group": {
                "_id": {
                    "department": "$student_info.department",
                    "day": "$day",
                    "student_id": "$student_id"
                }
            }
        }
        
        # Stage 5: Group again by department to count unique daily attendances
        final_group_stage = {
            "$group": {
                "_id": "$_id.department",
                "present_count": {"$sum": 1}
            }
        }
        
        # Pipeline to get total students per department
        total_students_pipeline = [
            {"$match": {"department": {"$ne": None}}},
            {"$group": {"_id": "$department", "total_students": {"$sum": 1}}}
        ]
        
        # Assemble and execute the pipelines
        pipeline = [
            match_stage,
            lookup_stage,
            unwind_stage,
            group_by_day_stage,
            final_group_stage,
        ]

        present_data = list(db.attendance.aggregate(pipeline))
        total_data = list(db.students.aggregate(total_students_pipeline))
        
        # Merge the results
        total_map = {item['_id']: item['total_students'] for item in total_data}
        result = []

        for department_name in total_map:
            present_item = next((item for item in present_data if item["_id"] == department_name), None)
            
            present_count = present_item["present_count"] if present_item else 0
            total_students = total_map.get(department_name, 0)
            
            percentage = (present_count / total_students * 100) if total_students > 0 else 0

            result.append({
                "department": department_name,
                "present_count": present_count,
                "total_students": total_students,
                "percentage": round(percentage, 2)
            })

        return result
    except Exception as e:
        print(f"--- AN ERROR OCCURRED IN ANALYTICS AGGREGATION ---")
        print(e)
        print(f"--- END OF ERROR ---")
        raise HTTPException(status_code=500, detail="An error occurred while processing analytics data.")