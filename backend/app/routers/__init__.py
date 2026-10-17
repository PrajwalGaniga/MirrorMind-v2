from .resume import router as resume_router
from .student import router as student_router
from .ml import router as ml_router
from .auth import router as auth_router
from .health import router as health_router
from .voice_chat import router as voice_chat_router

__all__ = [
    "resume_router",
    "student_router",
    "ml_router",
    "auth_router",
    "health_router",
    "voice_chat_router",
]

