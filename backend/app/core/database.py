from typing import Dict, Any, Optional
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings

_client: Optional[MongoClient] = None

def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client

def get_database():
    client = get_mongo_client()
    return client[settings.MONGO_DB_NAME]

def get_students_collection():
    db = get_database()
    return db[settings.MONGO_COLLECTION_STUDENTS]

def get_resumes_collection():
    db = get_database()
    return db[settings.MONGO_COLLECTION_RESUMES]

def get_users_collection():
    db = get_database()
    return db[settings.MONGO_COLLECTION_USERS]

def check_mongo_health() -> Dict[str, Any]:
    try:
        client = get_mongo_client()
        ping = client.admin.command("ping")
        db = get_database()
        return {
            "status": "connected",
            "ping": ping.get("ok") == 1,
            "database": settings.MONGO_DB_NAME,
            "collections": db.list_collection_names(),
        }
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        return {
            "status": "disconnected",
            "error": str(e),
            "database": settings.MONGO_DB_NAME,
        }

def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return None
    d = dict(doc)
    if "_id" in d:
        d["id"] = str(d["_id"])
        del d["_id"]
    for k, v in d.items():
        if hasattr(v, "isoformat"):
            d[k] = v.isoformat()
    return d
