import cloudinary
import cloudinary.uploader
from typing import Dict, Any, Optional
from app.core.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)

def upload_resume_file(file_content: bytes, filename: str) -> Dict[str, Any]:
    """
    Uploads a resume file (PDF or DOCX) to Cloudinary.
    Returns upload result with secure_url, public_id, and format.
    """
    try:
        # Sanitize filename for public_id
        safe_name = filename.rsplit(".", 1)[0].replace(" ", "_")
        response = cloudinary.uploader.upload(
            file_content,
            resource_type="auto",
            folder="mirrormind/resumes",
            public_id=f"resume_{safe_name}",
            use_filename=True,
            unique_filename=True,
        )
        return {
            "status": "success",
            "url": response.get("secure_url"),
            "public_id": response.get("public_id"),
            "format": response.get("format"),
            "bytes": response.get("bytes"),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "url": None,
        }

def upload_avatar_image(file_content: bytes, user_id: str) -> Dict[str, Any]:
    """
    Uploads user avatar image to Cloudinary.
    """
    try:
        response = cloudinary.uploader.upload(
            file_content,
            resource_type="image",
            folder="mirrormind/avatars",
            public_id=f"avatar_{user_id}",
            overwrite=True,
            transformation=[
                {"width": 300, "height": 300, "crop": "fill", "gravity": "face"}
            ]
        )
        return {
            "status": "success",
            "url": response.get("secure_url"),
            "public_id": response.get("public_id"),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "url": None,
        }
