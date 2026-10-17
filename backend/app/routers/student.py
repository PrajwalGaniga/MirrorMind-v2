from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime, timezone
from pymongo import ReturnDocument
from app.models.student import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileResponse
)
from app.core.database import get_students_collection, serialize_doc
from app.services.cloudinary_service import upload_avatar_image

router = APIRouter(prefix="/student", tags=["Student Profile"])

@router.post("/profile", response_model=StudentProfileResponse)
def save_student_profile(payload: StudentProfileCreate):
    """
    Creates or updates a student profile in MongoDB 'students' collection.
    - Uses email as the unique primary key.
    - Automatically sets created_at and updated_at timestamps.
    """
    col = get_students_collection()
    now = datetime.now(timezone.utc)
    email = payload.email.strip().lower()

    doc_data = payload.model_dump()
    doc_data["email"] = email
    doc_data["updated_at"] = now

    update_query = {
        "$set": doc_data,
        "$setOnInsert": {
            "created_at": now,
            "predictions": [],
            "top_prediction": None,
            "top_insight": None,
            "skill_radar": None,
        }
    }

    result = col.find_one_and_update(
        {"email": email},
        update_query,
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    serialized = serialize_doc(result)
    return StudentProfileResponse(**serialized)

@router.get("/profile/{email}", response_model=StudentProfileResponse)
def get_student_profile(email: str):
    """
    Fetches student profile by email.
    """
    col = get_students_collection()
    doc = col.find_one({"email": email.strip().lower()})
    if not doc:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return StudentProfileResponse(**serialize_doc(doc))

@router.put("/profile/{email}", response_model=StudentProfileResponse)
def update_student_profile(email: str, update_data: StudentProfileUpdate):
    """
    Updates specific fields of an existing student profile.
    """
    col = get_students_collection()
    clean_email = email.strip().lower()

    fields_to_update = {k: v for k, v in update_data.model_dump(exclude_unset=True).items() if v is not None}
    if not fields_to_update:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    fields_to_update["updated_at"] = datetime.now(timezone.utc)

    result = col.find_one_and_update(
        {"email": clean_email},
        {"$set": fields_to_update},
        return_document=ReturnDocument.AFTER
    )

    if not result:
        raise HTTPException(status_code=404, detail="Student profile not found")

    return StudentProfileResponse(**serialize_doc(result))

@router.get("/all", response_model=List[StudentProfileResponse])
def list_students(limit: int = Query(default=20, le=100), skip: int = Query(default=0, ge=0)):
    """
    Lists student profiles with pagination.
    """
    col = get_students_collection()
    cursor = col.find().sort("updated_at", -1).skip(skip).limit(limit)
    return [StudentProfileResponse(**serialize_doc(doc)) for doc in cursor]

@router.post("/upload-avatar")
async def upload_avatar_endpoint(file: UploadFile = File(...), user_id: str = Form("student")):
    """
    Uploads a student profile avatar image to Cloudinary folder 'mirrormind/avatars'.
    Returns public secure URL.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename")
    
    allowed = (".jpg", ".jpeg", ".png", ".webp")
    if not file.filename.lower().endswith(allowed):
        raise HTTPException(status_code=400, detail=f"Image must be one of: {', '.join(allowed)}")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    res = upload_avatar_image(content, user_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=500, detail=res.get("error", "Cloudinary upload failed"))

    return {
        "status": "success",
        "url": res.get("url"),
        "public_id": res.get("public_id")
    }

