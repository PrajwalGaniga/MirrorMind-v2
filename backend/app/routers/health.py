from fastapi import APIRouter
from app.core.database import check_mongo_health
from app.core.config import settings
from app.services.ml_service import ml_service
from datetime import datetime, timezone

router = APIRouter(tags=["System Health"])

@router.get("/health")
def health_check():
    """
    Comprehensive system health report across all connected infrastructure:
    - MongoDB Atlas status & available collections
    - Gemini AI API configuration
    - Cloudinary credentials status
    - PyTorch ML model loaded in memory
    """
    mongo_status = check_mongo_health()
    return {
        "status": "healthy" if mongo_status.get("status") == "connected" else "degraded",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": mongo_status,
            "gemini_ai": {
                "configured": bool(settings.GEMINI_API_KEY),
                "model": settings.GEMINI_MODEL_NAME,
            },
            "cloudinary": {
                "configured": bool(settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY),
                "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
            },
            "ml_engine": {
                "loaded": ml_service.is_loaded,
                "framework": "PyTorch",
                "embedding_model": "all-MiniLM-L6-v2",
            }
        }
    }

@router.get("/db-status")
def db_status_endpoint():
    """
    MongoDB connection status endpoint.
    """
    return check_mongo_health()

@router.get("/ping")
def ping_endpoint():
    """
    Lightweight keep-alive heartbeat endpoint for cron-job monitoring.
    """
    return {
        "status": "pong",
        "message": "MirrorMind v2 backend is awake and healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
