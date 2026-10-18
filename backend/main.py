import logging
from contextlib import asynccontextmanager
from typing import Optional
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_mongo_client, ensure_vector_search_index
from app.services.ml_service import ml_service
from app.routers import (
    resume_router,
    student_router,
    ml_router,
    auth_router,
    health_router,
    voice_chat_router,
    rag_router,
    ml_trace_router,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mirrormind")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan manager:
    Pre-loads heavy models (PyTorch + SentenceTransformers) on startup for fast inference,
    and verifies MongoDB Atlas Vector Search index.
    """
    logger.info("Initializing MirrorMind v2 backend services...")

    # 1. Test MongoDB connection
    try:
        client = get_mongo_client()
        client.admin.command("ping")
        logger.info(f"Connected to MongoDB Atlas: {settings.MONGO_DB_NAME}")
    except Exception as e:
        logger.error(f"MongoDB Atlas connection warning: {e}")

    # 2. Verify / ensure Atlas Vector Search Index
    try:
        index_res = ensure_vector_search_index()
        logger.info(f"MongoDB Atlas Vector Search status: {index_res}")
    except Exception as e:
        logger.warning(f"Atlas Vector Search initialization note: {e}")

    # 3. Pre-load PyTorch & SentenceTransformer models
    try:
        ml_service.load_models()
        logger.info("PyTorch CareerMLP & SentenceTransformers loaded into memory.")
    except Exception as e:
        logger.error(f"Failed to load ML models on startup: {e}")

    logger.info("MirrorMind v2 backend startup complete.")
    yield
    logger.info("Shutting down MirrorMind backend services.")

app = FastAPI(
    title=settings.APP_NAME,
    description="Production fullstack FastAPI backend for MirrorMind v2 with PyTorch Career Prediction, Gemini Resume Extraction, Cloudinary Storage, and MongoDB Atlas.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers under /api
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(resume_router, prefix=settings.API_PREFIX)
app.include_router(student_router, prefix=settings.API_PREFIX)
app.include_router(ml_router, prefix=settings.API_PREFIX)
app.include_router(voice_chat_router, prefix=settings.API_PREFIX)
app.include_router(voice_chat_router)  # also mount at root /ws/voice-chat
app.include_router(rag_router, prefix=settings.API_PREFIX)
app.include_router(ml_trace_router, prefix=settings.API_PREFIX)



# Backward-compatibility route for initial starter page
class UserResponse(BaseModel):
    name: str
    message: str
    status: str
    timestamp: str
    version: str

@app.get("/")
def read_root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs_url": "/docs",
        "health_url": f"{settings.API_PREFIX}/health",
        "database": "MongoDB Atlas",
        "status": "online"
    }

@app.get(f"{settings.API_PREFIX}/user", response_model=UserResponse)
def get_user(custom_name: Optional[str] = None):
    target_name = custom_name.strip() if custom_name and custom_name.strip() else "Prajwal"
    return UserResponse(
        name=target_name,
        message=f"Hello {target_name}! MirrorMind v2 backend with PyTorch ML, Gemini, Cloudinary, and MongoDB is live.",
        status="active",
        timestamp=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
        version=settings.APP_VERSION,
    )
