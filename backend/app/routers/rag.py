import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException, status
from app.models.rag import RAGQueryRequest, RAGQueryResponse, UserDocument
from app.services.rag_service import rag_service
from app.core.database import get_document_chunks_collection, get_user_documents_collection, ensure_vector_search_index

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/rag", tags=["Grounded RAG & Document Vault"])

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    category: str = Form("other"),
):
    """
    Upload and ingest an academic or career document (Certificate, Resume, Transcript, Project Report).
    - Digital PDF text extraction with automatic Gemini Vision OCR fallback for scanned certificates.
    - Sliding window chunking (1000 chars, 200 overlap).
    - 384-D dense embedding generation via all-MiniLM-L6-v2.
    - Idempotent insertion into MongoDB Atlas Vector Search.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid file must be provided."
        )

    clean_user = user_id.strip()
    if not clean_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required."
        )

    try:
        content = await file.read()
        res = rag_service.ingest_document(
            user_id=clean_user,
            file_bytes=content,
            filename=file.filename,
            category=category.strip().lower(),
        )
        return {
            "success": True,
            "message": f"Successfully ingested and embedded {file.filename}.",
            "data": res
        }
    except Exception as e:
        logger.error(f"Error during document ingestion: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to ingest document: {str(e)}"
        )

@router.get("/documents")
def list_documents(user_id: str = Query(..., description="Student email or user identifier")):
    """
    List all uploaded documents and their ingestion/embedding statuses for a student.
    """
    clean_user = user_id.strip()
    if not clean_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required.")
    
    docs = rag_service.list_user_documents(clean_user)
    return {
        "user_id": clean_user,
        "count": len(docs),
        "documents": docs
    }

@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, user_id: str = Query(...)):
    """
    Delete a document and all its associated vector chunks from MongoDB Atlas.
    """
    clean_user = user_id.strip()
    success = rag_service.delete_document(clean_user, doc_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document '{doc_id}' not found or does not belong to user."
        )
    return {
        "success": True,
        "message": f"Document '{doc_id}' and all associated vector chunks purged."
    }

@router.post("/query", response_model=RAGQueryResponse)
def query_grounded_rag(request: RAGQueryRequest):
    """
    Execute Dual-Source Grounded RAG Query:
    - Fetches structured student metrics (CGPA, skills, PyTorch ML predictions).
    - Runs MongoDB Atlas $vectorSearch for user-isolated semantic document chunks.
    - Employs Context Budget Manager (<= 20,000 characters).
    - Generates grounded factual answers with verifiable citations and anti-hallucination guardrails.
    """
    if not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    target_user = (request.user_id or "").strip()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id is required for grounded context retrieval."
        )

    try:
        response_data = rag_service.generate_grounded_answer(
            user_id=target_user,
            question=request.question.strip(),
            top_k=request.top_k or 5
        )
        return RAGQueryResponse(**response_data)
    except Exception as e:
        logger.error(f"Error executing grounded RAG query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG query execution failed: {str(e)}"
        )

@router.get("/health")
def rag_health():
    """
    Diagnostic status of the RAG engine and Atlas Vector Search index.
    """
    doc_col = get_user_documents_collection()
    chunk_col = get_document_chunks_collection()
    index_check = ensure_vector_search_index()

    return {
        "service": "Grounded RAG Engine",
        "vector_store": "MongoDB Atlas Vector Search",
        "index_status": index_check,
        "total_documents_ingested": doc_col.count_documents({}),
        "total_chunks_embedded": chunk_col.count_documents({}),
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2 (384-D)",
        "status": "online"
    }
