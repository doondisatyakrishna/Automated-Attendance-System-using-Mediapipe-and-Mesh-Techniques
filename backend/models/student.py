from pydantic import BaseModel, Field, EmailStr, ConfigDict
from pydantic_core import core_schema
from bson import ObjectId
from typing import Optional, List, Any

# Pydantic V2 compatible helper class for MongoDB's ObjectId
class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.chain_schema([
                    core_schema.str_schema(),
                    core_schema.no_info_plain_validator_function(cls.validate),
                ])
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

# Main Pydantic model for Student data
class StudentModel(BaseModel):
    # The alias="_id" maps this field from MongoDB's "_id"
    id: PyObjectId = Field(alias="_id", default=None)
    student_id: str
    name: str
    email: EmailStr
    department: str
    photo_url: Optional[str] = None
    embedding: Optional[List[float]] = None

    # model_config is used for Pydantic V2
    model_config = ConfigDict(
        populate_by_name=True, # Replaces `allow_population_by_field_name`
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}, # Converts ObjectId to string in JSON
    )