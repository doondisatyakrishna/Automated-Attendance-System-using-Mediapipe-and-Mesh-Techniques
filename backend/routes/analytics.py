import pytz
from fastapi import APIRouter, HTTPException, Query
from database import db
from datetime import datetime, timezone, timedelta
from tasks.attendance_lazy import fill_absent_records

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"]
)

# --------------------------------------------------------------------------
# --- Helper function to get IST today ---
# --------------------------------------------------------------------------
def get_today_ist():
    utc_now = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=5, minutes=30)
    now_ist = utc_now + ist_offset
    return now_ist, now_ist.date().isoformat()

# --------------------------------------------------------------------------
# --- Dashboard Summary ---
# --------------------------------------------------------------------------
@router.get("/dashboard-summary")
async def get_dashboard_summary():
    """
    Returns today's attendance summary (present, late, absent) and log.
    """
    fill_absent_records()
    now_ist, today_str = get_today_ist()

    students_collection = db.get_collection("students")
    attendance_collection = db.get_collection("attendance")

    # Total students
    total_students = students_collection.count_documents({})

    # Today's attendance records
    todays_attendance = list(attendance_collection.find({"day": today_str}))

    present_ids = {rec["student_id"] for rec in todays_attendance if rec.get("status") == "present"}
    late_ids = {rec["student_id"] for rec in todays_attendance if rec.get("status") == "late"}
    present_or_late_ids = present_ids.union(late_ids)
    all_student_ids = {s["student_id"] for s in students_collection.find({}, {"student_id": 1})}
    absent_count = len(all_student_ids - present_or_late_ids)

    # Attendance log
    todays_attendance_map = {rec["student_id"]: rec for rec in todays_attendance}
    all_students_list = list(students_collection.find({}, {"embedding": 0}))
    attendance_log = []

    for student in all_students_list:
        student_id = student["student_id"]
        record = {
            "student_id": student_id,
            "name": student["name"],
            "photo_url": student.get("photo_url"),
            "status": "absent",
            "check_in_time": None
        }
        if student_id in todays_attendance_map:
            att_rec = todays_attendance_map[student_id]
            record["status"] = att_rec.get("status", "absent")
            record["check_in_time"] = att_rec.get("timestamp")
        attendance_log.append(record)

    stats = {
        "total": total_students,
        "present": len(present_ids),
        "absent": absent_count,
        "late": len(late_ids),
    }

    return {"stats": stats, "log": attendance_log}

# --------------------------------------------------------------------------
# --- Overall Status ---
# --------------------------------------------------------------------------
@router.get("/overall-status")
async def get_overall_status(period: str = Query("7", enum=["7", "30", "all"])):
    """
    Aggregates total present, late, and absent records for the given period.
    """
    # Ensure absent records are filled for accurate historical data
    fill_absent_records()
    
    attendance_collection = db.get_collection("attendance")
    
    # Determine start day string based on period
    utc_now = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=5, minutes=30)
    today_ist = (utc_now + ist_offset).date()
    end_day_str = today_ist.isoformat()

    if period == "all":
        start_day_str = "0000-01-01" # Effectively from the beginning
    else:
        start_date = today_ist - timedelta(days=int(period))
        start_day_str = start_date.isoformat()

    pipeline = [
        {
            "$match": {
                "day": {"$gte": start_day_str, "$lte": end_day_str}
            }
        },
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]

    results = list(attendance_collection.aggregate(pipeline))
    
    # Format output ensuring all keys exist even if count is 0
    output = {"present": 0, "late": 0, "absent": 0}
    for r in results:
        # Handle potential statuses not in our standard set just in case
        status = r["_id"]
        if status in output:
            output[status] = r["count"]

    return output

# --------------------------------------------------------------------------
# --- Attendance by Department ---
# --------------------------------------------------------------------------
@router.get("/attendance-by-department")
async def get_attendance_by_department(
    period: str = Query("7", enum=["7", "30", "all"])
):
    """
    Accurate attendance percentages by department for a given period.
    'all' automatically spans from earliest attendance date till today.
    """
    fill_absent_records()
    attendance_collection = db.get_collection("attendance")
    students_collection = db.get_collection("students")

    # --- Determine date window ---
    # Using UTC now for consistency, similar to get_today_ist but simpler for just date
    utc_now = datetime.now(timezone.utc)
    end_date = utc_now.date()

    if period == "all":
        first_doc = attendance_collection.find_one(sort=[("day", 1)])
        if not first_doc or "day" not in first_doc:
             # If no data, return empty list instead of error for better UI handling
             return []
        start_day_str = first_doc["day"]
        # Calculate total days from start to today (inclusive)
        total_days = (end_date - datetime.fromisoformat(start_day_str).date()).days + 1
    else:
        start_date = end_date - timedelta(days=int(period))
        start_day_str = start_date.isoformat()
        total_days = int(period)

    end_day_str = end_date.isoformat()

    # --- Aggregate ---
    pipeline = [
        {"$match": {"day": {"$gte": start_day_str, "$lte": end_day_str}}},
        {
            "$lookup": {
                "from": "students",
                "localField": "student_id",
                "foreignField": "student_id",
                "as": "student_info",
            }
        },
        {"$unwind": "$student_info"},
        {
            "$group": {
                "_id": {"department": "$student_info.department", "status": "$status"},
                "count": {"$sum": 1},
            }
        },
    ]

    data = list(attendance_collection.aggregate(pipeline))

    # --- Organize counts ---
    dept_data = {}
    for record in data:
        dept = record["_id"]["department"]
        status = record["_id"]["status"]
        count = record["count"]
        dept_data.setdefault(dept, {"present": 0, "late": 0, "absent": 0})
        # Use .get() to be safe against unexpected statuses
        dept_data[dept][status] = dept_data[dept].get(status, 0) + count

    # --- Totals per department ---
    total_students = list(
        students_collection.aggregate([
            {"$match": {"department": {"$ne": None}}},
            {"$group": {"_id": "$department", "total_students": {"$sum": 1}}},
        ])
    )
    total_map = {t["_id"]: t["total_students"] for t in total_students}

    # --- Calculate percentages ---
    result = []
    for dept, total in total_map.items():
        counts = dept_data.get(dept, {"present": 0, "late": 0, "absent": 0})
        present_days = counts["present"] + counts["late"]
        total_possible_days = total * total_days
        percentage = (present_days / total_possible_days) * 100 if total_possible_days else 0
        result.append({
            "department": dept,
            "present_count": present_days,
            "absent_count": counts["absent"],
            "total_students": total,
            "percentage": round(percentage, 2),
        })

    result.sort(key=lambda x: x["percentage"], reverse=True)
    return result


# --------------------------------------------------------------------------
# --- Top Late Students ---
# --------------------------------------------------------------------------
@router.get("/top-late-students")
async def get_top_late_students(period: str = Query("30", enum=["7", "30", "all"]), limit: int = 5):
    """
    Returns top N students with the most late attendances in the given period.
    """
    # Using UTC date to match other functions for consistency
    end_day_str = datetime.now(timezone.utc).date().isoformat()
    
    match_stage = {"status": "late"}
    if period != "all":
        start_date = datetime.now(timezone.utc).date() - timedelta(days=int(period))
        match_stage["day"] = {"$gte": start_date.isoformat(), "$lte": end_day_str}
    else:
         match_stage["day"] = {"$lte": end_day_str}

    pipeline = [
        {"$match": match_stage},
        {"$group": {"_id": "$student_id", "late_count": {"$sum": 1}}},
        {"$sort": {"late_count": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "students",
                "localField": "_id",
                "foreignField": "student_id",
                "as": "student_info"
            }
        },
        {"$unwind": "$student_info"},
        {
            "$project": {
                "_id": 0,
                "student_id": "$_id",
                "name": "$student_info.name",
                "department": "$student_info.department",
                "late_count": 1
            }
        }
    ]

    return list(db.attendance.aggregate(pipeline))