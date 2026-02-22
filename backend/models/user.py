from pydantic import BaseModel, Field, EmailStr, ConfigDict
from bson import ObjectId
from typing import Optional
from .student import PyObjectId # Reuse the helper from student model

# This model accurately represents a user in your 'users' collection
class UserModel(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    username: str
    name: Optional[str] = None
    email: EmailStr
    is_verified: bool = False
    phone_number: Optional[str] = None
    is_phone_verified: bool = False
    department: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
    )