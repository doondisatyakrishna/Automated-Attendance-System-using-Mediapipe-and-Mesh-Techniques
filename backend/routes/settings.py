from fastapi import APIRouter
from pydantic import BaseModel
from database import db

router = APIRouter(prefix="/settings", tags=["Settings"])

class AppSettings(BaseModel):
    late_threshold_hour: int

@router.get("", response_model=AppSettings)
def get_settings():
    settings = db.settings.find_one({"_id": "global_settings"})
    if not settings:
        default_settings = {"_id": "global_settings", "late_threshold_hour": 12}
        db.settings.insert_one(default_settings)
        return default_settings
    return settings

@router.put("", response_model=AppSettings)
def update_settings(settings: AppSettings):
    db.settings.update_one(
        {"_id": "global_settings"},
        {"$set": {"late_threshold_hour": settings.late_threshold_hour}},
        upsert=True
    )
    return settings