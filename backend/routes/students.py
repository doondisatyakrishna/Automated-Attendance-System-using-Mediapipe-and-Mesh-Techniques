import os
import shutil
import uuid
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, status, HTTPException, Response
from database import db
from models.student import StudentModel 
from utils.face_utils import image_from_bytes, get_embedding_from_image_array

router = APIRouter(
    prefix="/students",
    tags=["Students"]
)

# Define the path to the uploads directory relative to the project root
UPLOADS_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOADS_DIR, exist_ok=True)


@router.post("", status_code=status.HTTP_201_CREATED, response_model=StudentModel)
async def create_student(
    student_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    department: str = Form(...),
    photo: Optional[UploadFile] = File(None) 
):
    """
    Creates a new student, saves their photo, generates a face embedding,
    and stores the information in the database.
    """
    # Check if a student with this ID already exists
    if db.students.find_one({"student_id": student_id}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A student with ID '{student_id}' already exists."
        )

    doc = {
        'student_id': student_id,
        'name': name,
        'email': email,
        'department': department,
        'photo_url': None,
        'embedding': None
    }

    if photo and photo.filename:
        # 1. Save the uploaded file with a unique name
        file_extension = os.path.splitext(photo.filename)[1]
        filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(UPLOADS_DIR, filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(photo.file, buffer)
        finally:
            photo.file.close()

        doc['photo_url'] = f"/uploads/{filename}"

        # 2. Generate the face embedding from the saved file
        try:
            with open(file_path, 'rb') as f:
                image_bytes = f.read()
                img_array = image_from_bytes(image_bytes)
                embedding = get_embedding_from_image_array(img_array)
                if embedding is not None:
                    doc['embedding'] = embedding
        except Exception as e:
            print(f"Embedding generation failed for {student_id}: {e}")
    
    # 3. Insert the final document into the database
    result = db.students.insert_one(doc)
    created_student = db.students.find_one({"_id": result.inserted_id})
    
    # The return value is automatically processed and validated by StudentModel
    return created_student


@router.get("", response_model=List[StudentModel])
def list_students():
    """
    Retrieves a list of all students.
    """
    docs = list(db.students.find({}))
    return docs

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: str):
    """
    Deletes a student and all associated data including their photo and attendance records.
    """
    # 1. Find the student document in the database
    student_to_delete = db.students.find_one({"student_id": student_id})

    if not student_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found."
        )

    # 2. Delete the student's photo file from the server's 'uploads' folder
    if "photo_url" in student_to_delete and student_to_delete["photo_url"]:
        # Construct the full file path from the URL
        # e.g., turn "/uploads/filename.jpg" into "uploads/filename.jpg"
        photo_path = os.path.join(UPLOADS_DIR, os.path.basename(student_to_delete["photo_url"]))
        if os.path.exists(photo_path):
            os.remove(photo_path)
            print(f"Deleted photo: {photo_path}")

    # 3. Delete the student's attendance records
    db.attendance.delete_many({"student_id": student_id})
    
    # 4. Delete the student document itself
    result = db.students.delete_one({"student_id": student_id})

    # If for some reason the delete operation failed
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete student with ID '{student_id}'."
        )

    # Return a 204 No Content response, which is standard for successful deletions
    return Response(status_code=status.HTTP_204_NO_CONTENT)