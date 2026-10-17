import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    # Application Config
    APP_NAME: str = "MirrorMind API"
    APP_VERSION: str = "0.2.0"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")

    # MongoDB Atlas
    MONGO_URI: str = os.getenv(
        "MONGO_URI",
        "mongodb+srv://zenlogdatabase:zenlogpass@zenlog.qhcnaoq.mongodb.net/?appName=ZenLog"
    )
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "mirrormind_db")
    MONGO_COLLECTION_STUDENTS: str = "students"
    MONGO_COLLECTION_RESUMES: str = "resumes"
    MONGO_COLLECTION_USERS: str = "mirrormind"

    # Google Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL_NAME: str = os.getenv("GEMINI_MODEL_NAME", "gemini-3.8-flash")

    # Cloudinary
    CLOUDINARY_URL: str = os.getenv("CLOUDINARY_URL", "")
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "llinkz0a")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "997159583468656")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "819NaJ04kiRvH3hbOOyxiVvGc6M")

    # ML Model Directory
    ML_MODEL_DIR: Path = BASE_DIR / "app" / "ml_models"

    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = SettingsConfigDict(case_sensitive=True, extra="allow")

settings = Settings()
