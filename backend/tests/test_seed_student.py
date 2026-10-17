import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app
from app.services.cloudinary_service import upload_avatar_image
from app.core.database import get_students_collection

# Locate sample-img.jpg
WORKSPACE_ROOT = BACKEND_DIR.parent
SAMPLE_IMG_PATH = WORKSPACE_ROOT / "sample-img.jpg"

client = TestClient(app)

# Global test state to share across steps
TEST_STATE = {
    "avatar_url": None,
    "student_email": "prajwal.seed@mirrormind.ai",
    "student_id": None,
}


class TestSeedStudentWorkflow:
    """
    End-to-end integration test suite:
    1. Uploads sample-img.jpg to Cloudinary for student avatar.
    2. Seeds a full student profile into MongoDB Atlas.
    3. Fetches and validates student data integrity.
    4. Runs PyTorch CareerMLP prediction and verifies MongoDB persistence.
    5. Validates system health across all infrastructure services.
    """

    def test_01_avatar_upload_to_cloudinary(self):
        """Uploads sample-img.jpg to Cloudinary and verifies secure URL generation."""
        assert SAMPLE_IMG_PATH.exists(), f"Image not found at {SAMPLE_IMG_PATH}"

        with open(SAMPLE_IMG_PATH, "rb") as f:
            img_bytes = f.read()

        assert len(img_bytes) > 0, "sample-img.jpg is empty"

        upload_result = upload_avatar_image(img_bytes, user_id="student_prajwal_seed")

        assert upload_result["status"] == "success", f"Cloudinary upload failed: {upload_result.get('error')}"
        assert upload_result["url"] is not None, "Missing secure Cloudinary URL"
        assert upload_result["url"].startswith("https://res.cloudinary.com/"), "Invalid Cloudinary CDN URL"

        TEST_STATE["avatar_url"] = upload_result["url"]
        print(f"\n[PASS] Cloudinary Avatar URL: {TEST_STATE['avatar_url']}")

    def test_02_seed_student_profile(self):
        """Seeds full student profile into MongoDB 'students' collection via POST /api/student/profile."""
        assert TEST_STATE["avatar_url"] is not None, "Avatar URL must be ready before seeding"

        student_payload = {
            "name": "Prajwal Ganiga",
            "email": TEST_STATE["student_email"],
            "phone": "+91 9876543210",
            "avatar_url": TEST_STATE["avatar_url"],
            "github_url": "https://github.com/prajwalganiga",
            "linkedin_url": "https://linkedin.com/in/prajwalganiga",
            "college_name": "National Institute of Technology Karnataka (NITK)",
            "college_tier": "Tier-1",
            "branch": "Computer Science & Engineering",
            "semester": 7,
            "cgpa": 8.8,
            "backlog_count": 0,
            "career_interest": "AIML_ENGINEER",
            "communication_rating": 5,
            "work_style_pref": "hybrid",
            "skills": [
                "python",
                "pytorch",
                "fastapi",
                "docker",
                "postgresql",
                "scikit-learn",
                "git",
                "mongodb"
            ],
            "certifications": [
                "DeepLearning.AI Machine Learning Specialization",
                "AWS Certified Cloud Practitioner"
            ],
            "projects": [
                {
                    "title": "MirrorMind AI Platform",
                    "description": "Engineered career prediction and placement intelligence service using PyTorch and FastAPI.",
                    "tech_stack": ["Python", "PyTorch", "FastAPI", "Next.js", "Docker", "MongoDB"],
                    "github_url": "https://github.com/prajwalganiga/mirrormind",
                    "live_demo_url": "https://mirrormind.ai"
                },
                {
                    "title": "Real-Time Distributed Chat Service",
                    "description": "High-throughput messaging server handling 10k concurrent WebSockets with Redis Pub/Sub.",
                    "tech_stack": ["TypeScript", "Node.js", "Redis", "PostgreSQL"],
                    "github_url": "https://github.com/prajwalganiga/chat-service",
                    "live_demo_url": None
                }
            ],
            "internships": [
                {
                    "company_name": "ZenLog Technologies",
                    "domain": "AI / ML",
                    "role": "Machine Learning Engineering Intern",
                    "start_date": "2026-01-10",
                    "end_date": "2026-06-30",
                    "is_current": False,
                    "description": "Designed LLM extraction pipelines and deployed PyTorch inference microservices."
                }
            ]
        }

        response = client.post("/api/student/profile", json=student_payload)
        assert response.status_code == 200, f"Failed to seed student profile: {response.text}"

        data = response.json()
        assert data["email"] == TEST_STATE["student_email"]
        assert data["name"] == "Prajwal Ganiga"
        assert data["avatar_url"] == TEST_STATE["avatar_url"]
        assert data["college_tier"] == "Tier-1"
        assert data["cgpa"] == 8.8
        assert len(data["skills"]) == 8
        assert len(data["projects"]) == 2
        assert len(data["internships"]) == 1
        assert "id" in data, "MongoDB record ID missing"

        TEST_STATE["student_id"] = data["id"]
        print(f"\n[PASS] Seeded Student Record in MongoDB with ID: {TEST_STATE['student_id']}")

    def test_03_get_student_profile(self):
        """Fetches seeded student profile by email and verifies data persistence."""
        email = TEST_STATE["student_email"]
        response = client.get(f"/api/student/profile/{email}")

        assert response.status_code == 200, f"Failed to fetch student profile: {response.text}"
        data = response.json()

        assert data["email"] == email
        assert data["avatar_url"] == TEST_STATE["avatar_url"]
        assert data["college_name"] == "National Institute of Technology Karnataka (NITK)"
        assert data["branch"] == "Computer Science & Engineering"
        assert data["career_interest"] == "AIML_ENGINEER"
        print(f"\n[PASS] Verified Student Data Retrieval for: {email}")

    def test_04_career_prediction_and_persistence(self):
        """Runs PyTorch CareerMLP prediction on seeded student and verifies persistence."""
        email = TEST_STATE["student_email"]

        # Request prediction using the seeded student email
        response = client.post("/api/ml/predict", json={"email": email})
        assert response.status_code == 200, f"Prediction endpoint failed: {response.text}"

        pred_data = response.json()

        assert "profile_text" in pred_data
        assert "top_prediction" in pred_data
        assert "top_label" in pred_data
        assert "confidence" in pred_data
        assert pred_data["confidence"] > 0, "Confidence score must be greater than 0"
        assert len(pred_data["predictions"]) == 5, "Expected Top 5 predictions"

        print(f"\n[PASS] ML Prediction Top Role: {pred_data['top_label']} ({pred_data['confidence']*100:.2f}%)")
        for p in pred_data["predictions"]:
            print(f"       Rank {p['rank']}: {p['label']:<32} | {p['confidence']*100:.2f}%")

        if pred_data.get("top_insight"):
            print(f"       Gemini Insight: {pred_data['top_insight']}")

        # Verify that prediction was automatically persisted to the student record in MongoDB
        get_res = client.get(f"/api/student/profile/{email}")
        assert get_res.status_code == 200
        updated_student = get_res.json()

        assert len(updated_student["predictions"]) == 5, "Predictions not persisted to MongoDB"
        assert updated_student["top_prediction"] == pred_data["top_prediction"]
        print(f"[PASS] Successfully Verified MongoDB Persistence of Predictions")

    def test_05_system_health(self):
        """Validates /api/health endpoint confirms all connected infrastructure is healthy."""
        response = client.get("/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"

        health = response.json()
        assert health["status"] == "healthy"
        assert health["services"]["database"]["status"] == "connected"
        assert health["services"]["gemini_ai"]["configured"] is True
        assert health["services"]["cloudinary"]["configured"] is True
        assert health["services"]["ml_engine"]["loaded"] is True
        print(f"\n[PASS] System Health Verified: All 4 services healthy")


if __name__ == "__main__":
    # Allow running directly via python tests/test_seed_student.py
    suite = TestSeedStudentWorkflow()
    print("=== Running MirrorMind Seed & Integration Test Suite ===")
    suite.test_01_avatar_upload_to_cloudinary()
    suite.test_02_seed_student_profile()
    suite.test_03_get_student_profile()
    suite.test_04_career_prediction_and_persistence()
    suite.test_05_system_health()
    print("\n========================================================")
    print("       ALL SEED DATA AND TEST CASES PASSED!            ")
    print("========================================================")
