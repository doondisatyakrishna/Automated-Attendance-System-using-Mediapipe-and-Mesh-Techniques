import os
import random
from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime, timedelta
from database import db
from utils.auth_utils import get_password_hash, verify_password, create_access_token
from utils.email_utils import send_verification_email
from utils.sms_utils import send_verification_sms, check_verification_code
from models.user import UserModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

# --- FIX: All Pydantic models are defined here, BEFORE they are used ---

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    verification_method: Literal['email', 'sms']
    phone_number: Optional[str] = None

class VerifyRequest(BaseModel):
    username: str
    code: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class VerifyResponse(TokenResponse):
    user: UserModel

# --- Endpoints are defined AFTER the models they use ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(req: RegisterRequest, background_tasks: BackgroundTasks):
    if db.users.find_one({"email": req.email}) or db.users.find_one({"username": req.username}):
        raise HTTPException(status_code=400, detail="Email or username already registered")

    user_doc = {
        "username": req.username,
        "email": req.email,
        "name": req.username,
        "hashed_password": get_password_hash(req.password),
        "is_verified": False,
        "phone_number": None,
        "is_phone_verified": False,
        "department": None,
        "avatar_url": None
    }

    if req.verification_method == 'email':
        code = f"{random.randint(0, 999999):06d}"
        user_doc["verification_code"] = code
        user_doc["verification_code_expires_at"] = datetime.utcnow() + timedelta(minutes=15)
        background_tasks.add_task(send_verification_email, to_email=req.email, username=req.username, code=code)
        
    elif req.verification_method == 'sms':
        if not req.phone_number or not req.phone_number.startswith('+'):
            raise HTTPException(status_code=400, detail="A valid phone number in E.164 format is required.")
        user_doc["phone_number"] = req.phone_number
        send_verification_sms(req.phone_number)

    db.users.insert_one(user_doc)
    
    return {"message": f"Registration successful. Please check your {req.verification_method} for a code."}


@router.post("/verify", response_model=VerifyResponse)
async def verify_account(req: VerifyRequest):
    user = db.users.find_one({"username": req.username})

    if not user or user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Verification failed: Invalid request")

    if "verification_code" in user: # Email verification
        if datetime.utcnow() > user["verification_code_expires_at"]:
            raise HTTPException(status_code=400, detail="Verification failed: Code has expired")
        if req.code != user["verification_code"]:
            raise HTTPException(status_code=400, detail="Verification failed: Invalid email code")
    
    elif user.get("phone_number"): # SMS verification
        if not check_verification_code(user["phone_number"], req.code):
            raise HTTPException(status_code=400, detail="Verification failed: Invalid SMS code")
            
    else:
        raise HTTPException(status_code=400, detail="Verification failed: No verification method found for user")

    db.users.update_one(
        {"username": req.username},
        {"$set": {"is_verified": True}, "$unset": {"verification_code": "", "verification_code_expires_at": ""}}
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
    user = db.users.find_one({"username": form_data.username})
    
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    if not user.get("is_verified"):
        raise HTTPException(status_code=400, detail="Account not verified. Please check your email or phone.")
        
    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}