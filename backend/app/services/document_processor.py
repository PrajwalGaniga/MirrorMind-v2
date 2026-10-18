import io
import re
import logging
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
from app.services.gemini_service import get_gemini_model

logger = logging.getLogger(__name__)

def clean_text(text: str) -> str:
    """Normalize whitespace and linebreaks."""
    if not text:
        return ""
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

class DocumentProcessor:
    """
    Hybrid Document Processor & Ingestion Engine:
    - Extracts text from digital PDFs via pypdf.
    - Uses Gemini 3.8 Flash Vision for OCR on scanned certificates, marksheets, and image files.
    - Implements sliding-window chunking (1000 chars, 200 overlap) with page tracking.
    """

    @staticmethod
    def extract_text_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """
        Extract page-by-page text from PDF with automatic Gemini Vision OCR fallback
        if pages have no digital text layer (scanned certificates / marksheets).
        """
        page_texts = []
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            total_pages = len(reader.pages)

            for idx, page in enumerate(reader.pages):
                page_num = idx + 1
                text = page.extract_text() or ""
                cleaned = clean_text(text)

                # If text is too short (< 30 chars), it's likely a scanned certificate/image
                if len(cleaned) < 30:
                    logger.info(f"Page {page_num} has minimal digital text ({len(cleaned)} chars). Running Gemini Vision OCR...")
                    ocr_text = DocumentProcessor._run_gemini_ocr_for_pdf(pdf_bytes, page_num)
                    if ocr_text:
                        cleaned = clean_text(ocr_text)

                if cleaned:
                    page_texts.append({
                        "page_num": page_num,
                        "text": cleaned
                    })

        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            # Global fallback: send entire PDF to Gemini Vision
            ocr_text = DocumentProcessor._run_gemini_ocr_for_pdf(pdf_bytes, 1)
            if ocr_text:
                page_texts.append({
                    "page_num": 1,
                    "text": clean_text(ocr_text)
                })

        return page_texts

    @staticmethod
    def extract_text_from_image(image_bytes: bytes, mime_type: str = "image/png") -> List[Dict[str, Any]]:
        """
        Extract verbatim text and credentials from certificate images using Gemini Vision.
        """
        try:
            model = get_gemini_model()
            prompt = (
                "You are an expert Optical Character Recognition (OCR) engine. "
                "Extract all text, certificate titles, recipient names, issuer organizations, "
                "credential IDs, issue dates, validated skills, and grades from this document. "
                "Transcribe all legible text verbatim without summarizing."
            )

            response = model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_bytes}
            ])

            text = response.text if response else ""
            cleaned = clean_text(text)
            if cleaned:
                return [{"page_num": 1, "text": cleaned}]
        except Exception as e:
            logger.error(f"Gemini Vision OCR error on image: {e}")

        return []

    @staticmethod
    def _run_gemini_ocr_for_pdf(pdf_bytes: bytes, page_hint: int = 1) -> str:
        """Run Gemini Vision OCR on a PDF document."""
        try:
            model = get_gemini_model()
            prompt = (
                f"You are an expert OCR engine for certificates and academic records. "
                f"Extract all legible text from this document (focusing especially on Page {page_hint} if multiple pages). "
                f"Include certificate titles, recipient name, credential/license verification numbers, issue dates, "
                f"course modules, and validated skills verbatim."
            )
            response = model.generate_content([
                prompt,
                {"mime_type": "application/pdf", "data": pdf_bytes}
            ])
            return response.text if response else ""
        except Exception as e:
            logger.error(f"Gemini Vision OCR failed for PDF: {e}")
            return ""

    @staticmethod
    def chunk_document(
        page_texts: List[Dict[str, Any]],
        chunk_size: int = 1000,
        chunk_overlap: int = 200
    ) -> List[Dict[str, Any]]:
        """
        Sliding-Window Chunking with Page Tracking:
        - Chunk size: ~1000 characters.
        - Chunk overlap: ~200 characters.
        - Preserves start and end page numbers.
        """
        if not page_texts:
            return []

        chunks = []
        chunk_index = 0

        # Process per page or continuous text stream
        for item in page_texts:
            page_num = item["page_num"]
            text = item["text"]

            if len(text) <= chunk_size:
                chunks.append({
                    "chunk_index": chunk_index,
                    "page_start": page_num,
                    "page_end": page_num,
                    "text": text
                })
                chunk_index += 1
                continue

            # Sliding window over the text
            start = 0
            while start < len(text):
                end = min(start + chunk_size, len(text))
                
                # Try to break at a sentence or word boundary if possible
                if end < len(text):
                    last_period = text.rfind(". ", start, end)
                    last_newline = text.rfind("\n", start, end)
                    boundary = max(last_period, last_newline)
                    if boundary > start + (chunk_size // 2):
                        end = boundary + 1

                chunk_str = text[start:end].strip()
                if chunk_str:
                    chunks.append({
                        "chunk_index": chunk_index,
                        "page_start": page_num,
                        "page_end": page_num,
                        "text": chunk_str
                    })
                    chunk_index += 1

                if end >= len(text):
                    break
                start = end - chunk_overlap

        return chunks

document_processor = DocumentProcessor()
