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

def get_user_documents_collection():
    db = get_database()
    return db[settings.MONGO_COLLECTION_DOCUMENTS]

def get_document_chunks_collection():
    db = get_database()
    return db[settings.MONGO_COLLECTION_CHUNKS]

def ensure_vector_search_index() -> Dict[str, Any]:
    """
    Ensure the MongoDB Atlas Vector Search index exists on the document_chunks collection.
    Idempotent: verifies if index is already present or creates it.
    """
    from pymongo.operations import SearchIndexModel
    import logging
    logger = logging.getLogger(__name__)

    col = get_document_chunks_collection()
    index_name = settings.MONGO_VECTOR_INDEX_NAME

    try:
        existing_indexes = list(col.list_search_indexes())
        for idx in existing_indexes:
            if idx.get("name") == index_name:
                logger.info(f"MongoDB Atlas Vector Search index '{index_name}' exists (Status: {idx.get('status')}).")
                return {"status": idx.get("status", "READY"), "index_name": index_name}

        # Index not found -> Create it
        logger.info(f"Creating MongoDB Atlas Vector Search index '{index_name}' on collection '{settings.MONGO_COLLECTION_CHUNKS}'...")
        index_model = SearchIndexModel(
            definition={
                "fields": [
                    {
                        "type": "vector",
                        "path": "embedding",
                        "numDimensions": 384,
                        "similarity": "cosine"
                    },
                    {
                        "type": "filter",
                        "path": "user_id"
                    }
                ]
            },
            name=index_name,
            type="vectorSearch"
        )
        col.create_search_index(model=index_model)
        logger.info(f"Vector search index '{index_name}' creation initiated.")
        return {"status": "INITIATED", "index_name": index_name}
    except Exception as e:
        logger.warning(f"Note on Atlas vector search index verification: {e}")
        return {"status": "WARNING", "error": str(e), "index_name": index_name}


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
