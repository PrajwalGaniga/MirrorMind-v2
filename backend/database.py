import os
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from pymongo import MongoClient, ReturnDocument
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://zenlogdatabase:zenlogpass@zenlog.qhcnaoq.mongodb.net/?appName=ZenLog"
)
DB_NAME = os.getenv("MONGO_DB_NAME", "mirrormind_db")
COLLECTION_NAME = os.getenv("MONGO_COLLECTION", "mirrormind")

# Global client
client = None
db = None
mirrormind_collection = None

def get_mongo_client():
    global client, db, mirrormind_collection
    if client is None:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        mirrormind_collection = db[COLLECTION_NAME]
    return client

def check_mongo_connection() -> dict:
    try:
        c = get_mongo_client()
        ping = c.admin.command("ping")
        collections = db.list_collection_names()
        return {
            "status": "connected",
            "ping": ping.get("ok") == 1,
            "database": DB_NAME,
            "collection": COLLECTION_NAME,
            "available_collections": collections,
        }
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        return {
            "status": "disconnected",
            "error": str(e),
            "database": DB_NAME,
            "collection": COLLECTION_NAME,
        }

def serialize_user(doc: Dict[str, Any]) -> Dict[str, Any]:
    if not doc:
        return {}
    doc_copy = dict(doc)
    if "_id" in doc_copy:
        doc_copy["_id"] = str(doc_copy["_id"])
    if isinstance(doc_copy.get("created_at"), datetime):
        doc_copy["created_at"] = doc_copy["created_at"].isoformat()
    if isinstance(doc_copy.get("last_login"), datetime):
        doc_copy["last_login"] = doc_copy["last_login"].isoformat()
    return doc_copy

def sync_user_to_db(user_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Syncs Firebase user with MongoDB.
    Uses 'email' as the unique key to prevent duplicate student profiles.
    Merges auth providers (e.g. google.com and password).
    """
    get_mongo_client()
    now = datetime.now(timezone.utc)
    email = user_payload.get("email")
    if not email:
        raise ValueError("Email is required to sync user with MongoDB")

    # Determine primary and linked providers
    incoming_provider = user_payload.get("auth_provider", "google")
    incoming_providers = user_payload.get("providers", [incoming_provider])

    update_doc = {
        "$set": {
            "firebase_uid": user_payload.get("firebase_uid"),
            "email": email,
            "name": user_payload.get("name") or email.split("@")[0],
            "photo_url": user_payload.get("photo_url"),
            "email_verified": user_payload.get("email_verified", False),
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

    result = mirrormind_collection.find_one_and_update(
        {"email": email},
        update_doc,
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return serialize_user(result)

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    get_mongo_client()
    doc = mirrormind_collection.find_one({"email": email})
    return serialize_user(doc) if doc else None

def list_recent_users(limit: int = 10) -> List[Dict[str, Any]]:
    get_mongo_client()
    cursor = mirrormind_collection.find().sort("last_login", -1).limit(limit)
    return [serialize_user(doc) for doc in cursor]
