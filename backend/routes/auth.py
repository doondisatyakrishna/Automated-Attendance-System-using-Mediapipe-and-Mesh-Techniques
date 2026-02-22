import os
from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from database import db
from utils.auth_utils import get_password_hash, verify_password, create_access_token
from utils.sms_utils import send_verification_sms, check_verification_code
from models.user import UserModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- Pydantic Models ---
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone_number: str  # Required for SMS verification

class VerifyRequest(BaseModel):
    username: str
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class VerifyResponse(TokenResponse):
    user: UserModel


# --- Routes ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(req: RegisterRequest, background_tasks: BackgroundTasks):
    """Register user and send SMS verification code."""
    if db.users.find_one({"email": req.email}) or db.users.find_one({"username": req.username}):
        raise HTTPException(status_code=400, detail="Email or username already registered")

    if not req.phone_number.startswith('+'):
        raise HTTPException(status_code=400, detail="Phone number must be in E.164 format (e.g., +919876543210)")

    # Check if phone number already exists
    if db.users.find_one({"phone_number": req.phone_number}):
        raise HTTPException(status_code=400, detail="Phone number already registered")

    user_doc = {
        "username": req.username,
        "email": req.email,
        "name": req.username,
        "hashed_password": get_password_hash(req.password),
        "is_verified": False,
        "phone_number": req.phone_number,
        "department": None,
        "avatar_url": None,
    }

    # Send SMS verification
    sms_response = send_verification_sms(req.phone_number)
    if sms_response.get("status") == "error":
        raise HTTPException(status_code=500, detail=sms_response.get("message"))

    db.users.insert_one(user_doc)
    return {"message": f"Registration successful. Verification code sent to {req.phone_number}."}


@router.post("/verify", response_model=VerifyResponse)
async def verify_account(req: VerifyRequest):
    """Verify phone number using the SMS code."""
    user = db.users.find_one({"username": req.username})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("is_verified"):
        raise HTTPException(status_code=400, detail="User already verified")

    phone_number = user.get("phone_number")
    if not phone_number:
        raise HTTPException(status_code=400, detail="User has no phone number associated")

    # Check verification code with Twilio
    if not check_verification_code(phone_number, req.code):
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    # Mark user as verified
    db.users.update_one(
        {"username": req.username},
        {"$set": {"is_verified": True}}
    )

    verified_user = db.users.find_one({"username": req.username})
    access_token = create_access_token(data={"sub": verified_user["username"]})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": verified_user
    }


@router.post("/token", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login user after verification."""
    user = db.users.find_one({"username": form_data.username})

    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    if not user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Account not verified. Please verify your phone number.")

    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}
