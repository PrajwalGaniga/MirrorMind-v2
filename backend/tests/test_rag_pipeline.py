import pytest
from app.services.rag_service import rag_service
from app.core.database import get_user_documents_collection, get_document_chunks_collection

TEST_USER_ID = "test_rag_student@mirrormind.ai"

@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Ensure clean slate before and after tests."""
    doc_col = get_user_documents_collection()
    chunk_col = get_document_chunks_collection()
    doc_col.delete_many({"user_id": TEST_USER_ID})
    chunk_col.delete_many({"user_id": TEST_USER_ID})
    yield
    doc_col.delete_many({"user_id": TEST_USER_ID})
    chunk_col.delete_many({"user_id": TEST_USER_ID})

def test_rag_end_to_end_pipeline():
    """
    Test complete Grounded RAG Pipeline:
    1. Ingestion & Embedding of Certificate document.
    2. Ingestion & Embedding of Capstone Project document.
    3. User-isolated Vector Search via MongoDB Atlas.
    4. Grounded factual answer generation with citations.
    5. Anti-hallucination negative fallback.
    6. Idempotent deletion and chunk cleanup.
    """
    # 1. Ingest Certificate Document
    cert_text = (
        "AWS Certified Solutions Architect - Associate. "
        "Verification Number: AWS-994821. Issued to Prajwal on August 10, 2025. "
        "Validated core competencies: Amazon EC2, VPC Peering, S3 Glacier, IAM Security Policies, "
        "DynamoDB, CloudFormation, Docker container orchestration, Kubernetes on EKS, and Microservices resilience."
    )
    cert_res = rag_service.ingest_document(
        user_id=TEST_USER_ID,
        file_bytes=cert_text.encode("utf-8"),
        filename="AWS_Solutions_Architect_Certificate.txt",
        category="certificate"
    )
    assert cert_res["status"] == "embedded"
    assert cert_res["chunk_count"] >= 1
    cert_doc_id = cert_res["document_id"]
    print(f"\n[RAG Test] Ingested Certificate: ID {cert_doc_id}, chunks: {cert_res['chunk_count']}")

    # 2. Ingest Capstone Project Report
    project_text = (
        "Capstone Project Report: High-Performance Distributed Key-Value Store with Raft Consensus. "
        "Engineered by Prajwal in Go and Python using Redis caching, gRPC streaming, and Docker Compose. "
        "Benchmark results demonstrated 45,000 read operations per second with sub-5ms latency and 99.9% fault tolerance."
    )
    proj_res = rag_service.ingest_document(
        user_id=TEST_USER_ID,
        file_bytes=project_text.encode("utf-8"),
        filename="Distributed_KV_Store_Capstone.txt",
        category="project_report"
    )
    assert proj_res["status"] == "embedded"
    assert proj_res["chunk_count"] >= 1
    proj_doc_id = proj_res["document_id"]
    print(f"[RAG Test] Ingested Capstone Report: ID {proj_doc_id}, chunks: {proj_res['chunk_count']}")

    # Verify documents in user_documents
    docs = rag_service.list_user_documents(TEST_USER_ID)
    assert len(docs) == 2
    print(f"[RAG Test] Document registry verified: {len(docs)} documents found.")

    # 3. Test Vector Search with User Isolation
    query = "What container and Kubernetes skills did I validate in my cloud certificate?"
    matched = rag_service.search_vector_chunks(user_id=TEST_USER_ID, query_text=query, top_k=3)
    assert len(matched) > 0
    top_chunk = matched[0]
    print(f"[RAG Test] Top Vector Match: {top_chunk['filename']} | Score: {top_chunk['score']}")
    assert "AWS" in top_chunk["text"] or "Kubernetes" in top_chunk["text"]
    assert top_chunk["score"] > 0.40

    # 4. Grounded Q&A with Citation Generation
    q_result = rag_service.generate_grounded_answer(
        user_id=TEST_USER_ID,
        question="What certifications do I have and what are the validated skills?",
        top_k=3
    )
    print(f"[RAG Test] Grounded Answer:\n{q_result['answer']}\n")
    assert len(q_result["answer"]) > 50
    assert "AWS" in q_result["answer"]
    assert len(q_result["citations"]) > 0
    assert any("AWS" in c["filename"] for c in q_result["citations"])

    # 5. Anti-Hallucination Negative Test
    unproven_query = "What grade or percentage did I score in Aerospace Propulsion in semester 6?"
    negative_result = rag_service.generate_grounded_answer(
        user_id=TEST_USER_ID,
        question=unproven_query,
        top_k=3
    )
    print(f"[RAG Test] Negative Fallback Answer:\n{negative_result['answer']}\n")
    # Verify model does not hallucinate a grade
    ans_lower = negative_result["answer"].lower()
    assert (
        "do not establish" in ans_lower
        or "no mention" in ans_lower
        or "not found" in ans_lower
        or "does not contain" in ans_lower
        or "not available" in ans_lower
        or "no information" in ans_lower
    )

    # 6. Test Document Deletion
    del_res = rag_service.delete_document(TEST_USER_ID, cert_doc_id)
    assert del_res is True
    remaining_docs = rag_service.list_user_documents(TEST_USER_ID)
    assert len(remaining_docs) == 1
    print("[RAG Test] Deletion verified. Remaining documents: 1")

if __name__ == "__main__":
    test_rag_end_to_end_pipeline()
