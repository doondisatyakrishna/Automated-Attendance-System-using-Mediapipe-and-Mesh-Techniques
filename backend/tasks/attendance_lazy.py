# tasks/attendance_lazy.py
from datetime import datetime, timedelta
from database import db

def _to_date(d):
    """Return a date object from possible types (datetime, iso-string, date)."""
    if d is None:
        return None
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, str):
        try:
            return datetime.fromisoformat(d).date()
        except Exception:
            # try parsing date-only string YYYY-MM-DD
            return datetime.strptime(d[:10], "%Y-%m-%d").date()
    # else assume it's already a date
    return d

def fill_absent_records():
    """
    Fill absent entries for days between last_checked_date and yesterday.
    Uses 'day' field as ISO date string (YYYY-MM-DD) to be consistent with other code.
    """
    today = datetime.utcnow().date()

    # load last checked
    settings_doc = db.settings.find_one({"_id": "attendance_last_checked"})
    if settings_doc and "last_checked_date" in settings_doc:
        last_checked_dt = settings_doc["last_checked_date"]
        last_checked_date = _to_date(last_checked_dt)
    else:
        # try to get latest 'day' from attendance, or fallback to yesterday
        last_att = db.attendance.find_one(
            sort=[("day", -1)]
        )
        if last_att and "day" in last_att:
            last_checked_date = _to_date(last_att["day"])
        else:
            # fallback: yesterday
            last_checked_date = today - timedelta(days=1)

    # start from next day after last checked
    check_date = last_checked_date + timedelta(days=1)

    while check_date < today:
        day_str = check_date.isoformat()  # YYYY-MM-DD, consistent
        students = list(db.students.find({}, {"student_id": 1}))
        if not students:
            break
        student_ids = [s["student_id"] for s in students]

        # who already has a PRESENT or LATE record for that day
        present_ids = set(db.attendance.distinct(
            "student_id",
            {"day": day_str, "status": {"$in": ["present", "late"]}}
        ))

        absent_ids = set(student_ids) - present_ids
        if absent_ids:
            now_ts = datetime.utcnow()
            absent_records = [
                {
                    "student_id": sid,
                    "status": "absent",
                    "day": day_str,
                    "timestamp": now_ts
                }
                for sid in absent_ids
            ]
            db.attendance.insert_many(absent_records)

        check_date += timedelta(days=1)

    # store last-checked as datetime (midnight) for compatibility
    last_checked_datetime = datetime.combine(today - timedelta(days=1), datetime.min.time())
    db.settings.update_one(
        {"_id": "attendance_last_checked"},
        {"$set": {"last_checked_date": last_checked_datetime}},
        upsert=True
    )
