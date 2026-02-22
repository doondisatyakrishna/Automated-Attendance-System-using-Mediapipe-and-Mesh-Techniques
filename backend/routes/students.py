import os
import shutil
import uuid
from typing import Optional, List

from fastapi import APIRouter, UploadFile, File, Form, status, HTTPException, Response
from pydantic import BaseModel

from database import db
from models.student import StudentModel
from utils.face_utils import (
    image_from_bytes,
    get_embedding_from_image_array,
    check_face_quality,
    estimate_face_quality_score,
)

router = APIRouter(
    prefix="/students",
    tags=["Students"]
)

UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)

class UpdateStudentModel(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None

# --- Create student ---
@router.post("", status_code=status.HTTP_201_CREATED, response_model=StudentModel)
async def create_student(
    student_id: str = Form(...),
    name: str = Form(...),
    email: str = Form(...),
    department: str = Form(...),
    photo: Optional[UploadFile] = File(default=None),
    photos: Optional[List[UploadFile]] = File(default=None),
):
    if db.students.find_one({"student_id": student_id}):
        raise HTTPException(status_code=400, detail="Student ID exists.")

    upload_list: List[UploadFile] = []
    if photos:
        upload_list.extend(photos)
    elif photo:
        upload_list.append(photo)
    else:
        raise HTTPException(status_code=400, detail="No photo(s) provided.")

    if len(upload_list) < 5:
        raise HTTPException(status_code=400, detail="Please upload 5 photos to enroll 5 embeddings.")

    upload_list = upload_list[:5]

    embeddings: List[List[float]] = []
    saved_paths: List[str] = []
    saved_filenames: List[str] = []
    quality_scores: List[float] = []

    for idx, up in enumerate(upload_list):
        file_ext = os.path.splitext(up.filename)[1]
        this_filename = f"{uuid.uuid4().hex}{file_ext}"
        this_path = os.path.join(UPLOADS_DIR, this_filename)

        try:
            with open(this_path, "wb") as f:
                shutil.copyfileobj(up.file, f)
        finally:
            up.file.close()

        with open(this_path, "rb") as f:
            img_array = image_from_bytes(f.read())

        ok, reason = check_face_quality(img_array)
        if not ok:
            os.remove(this_path)
            raise HTTPException(status_code=400, detail=f"Photo {idx+1}: {reason}")

        emb = get_embedding_from_image_array(img_array)
        if emb is None:
            os.remove(this_path)
            raise HTTPException(status_code=400, detail=f"Photo {idx+1}: No face detected.")

        embeddings.append([float(x) for x in emb])
        saved_paths.append(this_path)
        saved_filenames.append(this_filename)
        quality_scores.append(estimate_face_quality_score(img_array))

    if not saved_filenames:
        raise HTTPException(status_code=400, detail="Failed to process photos.")

    # Pick the best-quality photo as profile picture and delete the rest
    best_idx = max(range(len(quality_scores)), key=lambda i: quality_scores[i])
    filename = saved_filenames[best_idx]
    for i, path in enumerate(saved_paths):
        if i != best_idx and os.path.exists(path):
            os.remove(path)

    doc = {
        "student_id": student_id,
        "name": name,
        "email": email,
        "department": department,
        "photo_url": f"/uploads/{filename}",
        # Backward-compatible single embedding (first) + new embeddings list
        "embedding": embeddings[0],
        "embeddings": embeddings,
    }
    result = db.students.insert_one(doc)
    return db.students.find_one({"_id": result.inserted_id})

# --- List students ---
@router.get("", response_model=List[StudentModel])
def list_students():
    return list(db.students.find({}))

# --- Update student details ---
@router.put("/{student_id}", response_model=StudentModel)
def update_student_details(student_id: str, update: UpdateStudentModel):
    data = update.dict(exclude_unset=True)
    if not data:
        raise HTTPException(400, detail="No update data.")
    result = db.students.update_one({"student_id": student_id}, {"$set": data})
    if result.matched_count == 0:
        raise HTTPException(404, detail="Student not found.")
    return db.students.find_one({"student_id": student_id})

# --- Update photo ---
@router.put("/{student_id}/photo")
async def update_student_photo(
    student_id: str,
    photo: Optional[UploadFile] = File(default=None),
    photos: Optional[List[UploadFile]] = File(default=None),
):
    student = db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(404, detail="Student not found.")

    # Delete old photo
    if student.get("photo_url"):
        old_path = os.path.join(UPLOADS_DIR, os.path.basename(student["photo_url"]))
        if os.path.exists(old_path):
            os.remove(old_path)

    upload_list: List[UploadFile] = []
    if photos:
        upload_list.extend(photos)
    elif photo:
        upload_list.append(photo)
    else:
        raise HTTPException(status_code=400, detail="No photo(s) provided.")

    if len(upload_list) < 1:
        raise HTTPException(status_code=400, detail="No photo provided.")

    upload_list = upload_list[:5]

    embeddings: List[List[float]] = []
    saved_paths: List[str] = []
    saved_filenames: List[str] = []
    quality_scores: List[float] = []

    for idx, up in enumerate(upload_list):
        file_ext = os.path.splitext(up.filename)[1]
        this_filename = f"{uuid.uuid4().hex}{file_ext}"
        this_path = os.path.join(UPLOADS_DIR, this_filename)

        try:
            with open(this_path, "wb") as f:
                shutil.copyfileobj(up.file, f)
        finally:
            up.file.close()

        with open(this_path, "rb") as f:
            img_array = image_from_bytes(f.read())

        ok, reason = check_face_quality(img_array)
        if not ok:
            os.remove(this_path)
            raise HTTPException(status_code=400, detail=f"Photo {idx+1}: {reason}")

        emb = get_embedding_from_image_array(img_array)
        if emb is None:
            os.remove(this_path)
            raise HTTPException(status_code=400, detail=f"Photo {idx+1}: No face detected.")

        embeddings.append([float(x) for x in emb])
        saved_paths.append(this_path)
        saved_filenames.append(this_filename)
        quality_scores.append(estimate_face_quality_score(img_array))

    if not saved_filenames:
        raise HTTPException(status_code=400, detail="Failed to process photos.")

    best_idx = max(range(len(quality_scores)), key=lambda i: quality_scores[i])
    filename = saved_filenames[best_idx]
    for i, path in enumerate(saved_paths):
        if i != best_idx and os.path.exists(path):
            os.remove(path)

    db.students.update_one(
        {"student_id": student_id},
        {
            "$set": {
                "photo_url": f"/uploads/{filename}",
                "embedding": embeddings[0],
                "embeddings": embeddings,
            }
        },
    )
    return {"message": "Photo updated successfully."}

# --- Delete student ---
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: str):
    student = db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(404, detail="Student not found.")

    if student.get("photo_url"):
        path = os.path.join(UPLOADS_DIR, os.path.basename(student["photo_url"]))
        if os.path.exists(path):
            os.remove(path)

    db.attendance.delete_many({"student_id": student_id})
    db.students.delete_one({"student_id": student_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
