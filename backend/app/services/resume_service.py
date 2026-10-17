import io
from typing import Dict, Any, Tuple
from pypdf import PdfReader
from app.services.cloudinary_service import upload_resume_file
from app.services.gemini_service import extract_resume_details
from app.models.resume import ResumeExtractedData, ResumeParseResponse

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts readable text content from PDF file bytes using pypdf.
    """
    text_parts = []
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    except Exception as e:
        text_parts.append(f"[Error reading PDF pages: {e}]")
    return "\n".join(text_parts).strip()

async def parse_and_upload_resume(file_bytes: bytes, filename: str) -> ResumeParseResponse:
    """
    Full pipeline:
    1. Extract text from uploaded document.
    2. Upload file to Cloudinary.
    3. Pass text to Gemini to get structured pre-filled data.
    4. Return pre-fill payload with residual fields for student.
    """
    # 1. Extract text
    if filename.lower().endswith(".pdf"):
        raw_text = extract_text_from_pdf(file_bytes)
    else:
        # Fallback for txt/markdown or docx
        try:
            raw_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            raw_text = str(file_bytes[:4000])

    # 2. Upload to Cloudinary
    upload_res = upload_resume_file(file_bytes, filename)
    cloudinary_url = upload_res.get("url")

    # 3. Call Gemini LLM extraction
    extracted_dict = extract_resume_details(raw_text)
    extracted_data = ResumeExtractedData(**extracted_dict)

    return ResumeParseResponse(
        status="success",
        file_name=filename,
        cloudinary_url=cloudinary_url,
        extracted_data=extracted_data,
        residual_fields_needed=[
            "college_tier",
            "backlog_count",
            "communication_rating",
            "work_style_pref",
        ],
        raw_text_length=len(raw_text)
    )
