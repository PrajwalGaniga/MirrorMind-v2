import sys
from pathlib import Path
from pprint import pprint

print("--- 1. Testing Configuration & Core ---")
from app.core.config import settings
print(f"App: {settings.APP_NAME} v{settings.APP_VERSION}")
print(f"Mongo URI present: {bool(settings.MONGO_URI)}")
print(f"Gemini API Key present: {bool(settings.GEMINI_API_KEY)}")
print(f"Cloudinary Cloud: {settings.CLOUDINARY_CLOUD_NAME}")

print("\n--- 2. Testing MongoDB Atlas ---")
from app.core.database import check_mongo_health
mongo_health = check_mongo_health()
print("MongoDB Health:", mongo_health)
assert mongo_health["status"] == "connected", "MongoDB should be connected"

print("\n--- 3. Testing Cloudinary Configuration ---")
import cloudinary
print("Cloudinary Cloud Name:", cloudinary.config().cloud_name)
assert cloudinary.config().cloud_name == settings.CLOUDINARY_CLOUD_NAME

print("\n--- 4. Testing ML Pipeline (PyTorch + SentenceTransformers) ---")
from app.services.ml_service import ml_service, build_profile_text

sample_skills = ["python", "pytorch", "fastapi", "docker", "postgresql", "scikit-learn", "git"]
sample_cgpa = 8.4
sample_projects = 2
sample_internships = 1

print("Calling ml_service.predict()... (this loads SentenceTransformers & PyTorch weights)")
pred_result = ml_service.predict(
    skills=sample_skills,
    cgpa=sample_cgpa,
    projects_count=sample_projects,
    internships_count=sample_internships,
    include_gemini_insights=True
)

print("\nPrediction Result:")
print("Profile Text:", pred_result["profile_text"])
print("Top Prediction:", pred_result["top_prediction"], f"({pred_result['top_label']})")
print("Confidence:", f"{pred_result['confidence'] * 100:.2f}%")
print("Top 5 Predictions:")
for p in pred_result["predictions"]:
    print(f"  Rank {p['rank']}: {p['label']:<30} | {p['confidence'] * 100:.2f}%")

if pred_result.get("top_insight"):
    print("Gemini Top Insight:", pred_result["top_insight"])
if pred_result.get("skill_radar"):
    print("Skill Radar:", pred_result["skill_radar"])

assert len(pred_result["predictions"]) == 5, "Should return 5 ranked predictions"
assert pred_result["confidence"] > 0, "Confidence should be positive"

print("\n--- 5. Testing FastAPI App Startup ---")
from main import app
route_paths = []
for route in app.routes:
    if hasattr(route, "path"):
        route_paths.append(route.path)
    elif hasattr(route, "routes"):
        for sub in route.routes:
            if hasattr(sub, "path"):
                route_paths.append(sub.path)

print(f"Registered {len(route_paths)} endpoint routes:")
for r in sorted(set(route_paths)):
    print("  ", r)

print("\n ALL SYSTEM CHECKS PASSED SUCCESSFULLY!")

