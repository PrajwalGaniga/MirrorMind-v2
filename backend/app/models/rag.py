from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class DocumentCategory(str, Enum):
    RESUME = "resume"
    CERTIFICATE = "certificate"
    TRANSCRIPT = "transcript"
    PROJECT_REPORT = "project_report"
    LOR = "lor"
    OTHER = "other"

class UserDocument(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    filename: str
    category: str = DocumentCategory.OTHER
    file_type: str = "pdf"
    file_size: int = 0
    processing_status: str = "processed"  # "processing", "processed", "failed"
    embedding_status: str = "embedded"    # "pending", "embedded", "failed"
    page_count: int = 1
    chunk_count: int = 0
    uploaded_at: str

    model_config = ConfigDict(populate_by_name=True)

class DocumentChunk(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    document_id: str
    user_id: str
    chunk_index: int
    page_start: int = 1
    page_end: int = 1
    text: str
    embedding: Optional[List[float]] = None
    created_at: str

    model_config = ConfigDict(populate_by_name=True)


class RAGQueryRequest(BaseModel):
    question: str
    user_id: Optional[str] = None
    top_k: int = Field(5, ge=1, le=15)

class CitationSource(BaseModel):
    document_id: str
    filename: str
    category: str
    page_start: int
    page_end: int
    score: float
    text: str

class RAGQueryResponse(BaseModel):
    question: str
    answer: str
    citations: List[CitationSource] = []
    structured_profile_used: bool = True
    retrieved_chunks_count: int = 0
