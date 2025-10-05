import os
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from pydantic import BaseModel, EmailStr
from database import db
from utils.auth_utils import get_current_user
from models.user import UserModel 

router = APIRouter(prefix="/profile", tags=["Profile"])

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    
class PhoneVerificationRequest(BaseModel):
    phone_number: str

class CodeVerificationRequest(BaseModel):
    phone_number: str
    code: str

@router.get("/me", response_model=UserModel)
def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserModel)
async def update_my_profile(
    current_user: dict = Depends(get_current_user),
    name: str = Form(...),
    department: str = Form(...),
    # --- FIX: Standardize to 'phone_number' ---
    phone_number: str = Form(...), 
    avatar: Optional[UploadFile] = File(None)
):
    user = db.users.find_one({"username": current_user["username"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # --- FIX: Use 'phone_number' consistently ---
    update_data = {"name": name, "department": department, "phone_number": phone_number}
    
    # Reset phone verification if the number changes
    if user.get("phone_number") != phone_number:
        update_data["is_phone_verified"] = False

    if avatar:
        if user.get("avatar_url"):
            old_avatar_path = os.path.join(UPLOADS_DIR, os.path.basename(user["avatar_url"]))
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)
        
        file_extension = os.path.splitext(avatar.filename)[1]
        avatar_filename = f"avatar_{user['username']}{file_extension}"
        avatar_path = os.path.join(UPLOADS_DIR, avatar_filename)
        
        with open(avatar_path, "wb") as buffer:
            shutil.copyfileobj(avatar.file, buffer)
        
        update_data["avatar_url"] = f"/uploads/{avatar_filename}"

    db.users.update_one({"username": current_user["username"]}, {"$set": update_data})
    
    updated_user = db.users.find_one({"username": current_user["username"]})
    return updated_user

# ... (your other PUT /password and POST verification endpoints are fine)