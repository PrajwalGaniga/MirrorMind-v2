from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.resume_service import parse_and_upload_resume
from app.models.resume import ResumeParseResponse
from app.core.database import get_resumes_collection
from datetime import datetime, timezone

router = APIRouter(prefix="/resume", tags=["Resume Parsing"])

@router.post("/parse", response_model=ResumeParseResponse)
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Resume-first auto-extraction & form pre-fill:
    1. Extracts text from uploaded PDF/DOCX resume using pypdf.
    2. Uploads file to Cloudinary.
    3. Prompts Gemini 2.5 Flash to extract structured profile data.
    4. Saves extraction log to MongoDB 'resumes' collection.
    5. Returns structured JSON for pre-filling the onboarding form.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename")

    allowed_exts = (".pdf", ".docx", ".txt")
    if not file.filename.lower().endswith(allowed_exts):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Please upload one of: {', '.join(allowed_exts)}"
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # Parse with pypdf + Cloudinary + Gemini
        parse_result = await parse_and_upload_resume(content, file.filename)

        # Log to MongoDB 'resumes' collection
        try:
            resumes_col = get_resumes_collection()
            resumes_col.insert_one({
                "filename": file.filename,
                "cloudinary_url": parse_result.cloudinary_url,
                "parsed_data": parse_result.extracted_data.model_dump(),
                "created_at": datetime.now(timezone.utc),
            })
        except Exception as db_err:
            # Non-blocking log error
            pass

        return parse_result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")
