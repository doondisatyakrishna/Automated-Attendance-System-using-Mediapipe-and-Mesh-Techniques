# scheduler.py
from datetime import date, timedelta, datetime
from apscheduler.schedulers.background import BackgroundScheduler
from database import db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def finalize_daily_attendance():
    """
    Finds all students not marked 'present' on a given day (where attendance was taken)
    and marks them as 'absent'.
    """
    yesterday_str = (date.today() - timedelta(days=1)).isoformat()
    logger.info(f"Running attendance finalization for date: {yesterday_str}")

    students_collection = db.get_collection("students")
    attendance_collection = db.get_collection("attendance")

    # 1. Check if any attendance was recorded yesterday
    was_class_day = attendance_collection.find_one({"day": yesterday_str, "status": "present"})
    
    if not was_class_day:
        logger.info(f"No 'present' records found for {yesterday_str}. Skipping absentee marking.")
        return

    # 2. Get all registered students
    all_student_ids = {s["student_id"] for s in students_collection.find({}, {"student_id": 1})}

    # 3. Get students who were marked present yesterday
    present_student_ids = {
        a["student_id"] for a in attendance_collection.find(
            {"day": yesterday_str, "status": "present"},
            {"student_id": 1}
        )
    }

    # 4. Determine who was absent
    absent_student_ids = all_student_ids - present_student_ids

    # 5. Create "absent" records for those students
    absent_records = []
    for student_id in absent_student_ids:
        absent_records.append({
            'student_id': student_id,
            'timestamp': datetime.combine(datetime.strptime(yesterday_str, "%Y-%m-%d"), datetime.min.time()),
            'day': yesterday_str,
            'status': 'absent',
            'source': 'auto-generated'
        })
    
    if absent_records:
        try:
            attendance_collection.insert_many(absent_records, ordered=False)
            logger.info(f"Successfully marked {len(absent_records)} students as absent for {yesterday_str}.")
        except Exception as e:
            logger.error(f"Error inserting absent records: {e}")
    else:
        logger.info(f"All students were present on {yesterday_str}.")

# Create a scheduler instance
scheduler = BackgroundScheduler(timezone="UTC")

# Schedule the job to run every day at 23:59 UTC
scheduler.add_job(finalize_daily_attendance, 'cron', hour=23, minute=59)

# (Optional) For testing, you can run it every minute:
# scheduler.add_job(finalize_daily_attendance, 'interval', minutes=1)