import pytest
from fastapi.testclient import TestClient
from pathlib import Path
from main import app

client = TestClient(app)

def test_avatar_upload_endpoint():
    sample_path = Path(__file__).resolve().parent.parent.parent / "sample-img.jpg"
    assert sample_path.exists(), f"Sample image not found: {sample_path}"

    with open(sample_path, "rb") as f:
        response = client.post(
            "/api/student/upload-avatar",
            files={"file": ("luffy.jpg", f, "image/jpeg")},
            data={"user_id": "test_avatar_user"}
        )

    assert response.status_code == 200, f"Error: {response.text}"
    data = response.json()
    assert data["status"] == "success"
    assert "cloudinary.com" in data["url"]
    print(f"\n[AVATAR ENDPOINT TEST] Uploaded successfully: {data['url']}")
