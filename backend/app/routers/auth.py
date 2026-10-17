from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel
from pymongo import ReturnDocument
from app.core.database import get_users_collection, serialize_doc

router = APIRouter(prefix="/auth", tags=["Authentication & User Sync"])

class UserSyncPayload(BaseModel):
    firebase_uid: str
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None
    auth_provider: str = "google"
    providers: List[str] = []
    email_verified: bool = False

@router.post("/sync")
def sync_user(payload: UserSyncPayload):
    """
    Synchronizes Firebase user with MongoDB Atlas 'mirrormind' collection.
    - Matches by email to prevent duplicate accounts.
    - Merges providers (e.g. ['google.com', 'password']).
    - Updates last_login timestamp.
    """
    try:
        col = get_users_collection()
        now = datetime.now(timezone.utc)
        email = payload.email.strip().lower()

        incoming_provider = payload.auth_provider or "google"
        incoming_providers = payload.providers or [incoming_provider]

        update_doc = {
            "$set": {
                "firebase_uid": payload.firebase_uid,
                "email": email,
                "name": payload.name or email.split("@")[0],
                "photo_url": payload.photo_url,
                "email_verified": payload.email_verified,
                "last_login": now,
            },
            "$addToSet": {
                "providers": {"$each": incoming_providers}
            },
            "$setOnInsert": {
                "created_at": now,
                "initial_auth_provider": incoming_provider,
                "role": "student",
            }
        }

        result = col.find_one_and_update(
            {"email": email},
            update_doc,
            upsert=True,
            return_document=ReturnDocument.AFTER
        )

        return {
            "status": "synced",
            "message": "User successfully synchronized with MongoDB",
            "user": serialize_doc(result),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync user: {str(e)}")

@router.get("/user")
def get_user_profile(email: str):
    col = get_users_collection()
    user = col.find_one({"email": email.strip().lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found in MongoDB")
    return serialize_doc(user)

@router.get("/users")
def get_recent_users(limit: int = 20):
    col = get_users_collection()
    cursor = col.find().sort("last_login", -1).limit(limit)
    return [serialize_doc(doc) for doc in cursor]
