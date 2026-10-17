from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timezone
from app.models.ml import PredictRequest, PredictResponse
from app.services.ml_service import ml_service, ROLE_LABELS
from app.core.database import get_students_collection

router = APIRouter(prefix="/ml", tags=["Career ML Prediction"])

@router.post("/predict", response_model=PredictResponse)
def predict_career_endpoint(request: PredictRequest):
    """
    Executes end-to-end career prediction pipeline:
    1. Extracts technical features from request or student profile in MongoDB.
    2. Builds deterministic serialized text narrative.
    3. SentenceTransformer encodes into dense 384-D vector.
    4. PyTorch CareerMLP executes forward pass & Softmax.
    5. Returns Top 5 ranked career roles with confidence scores.
    6. Generates personalized Gemini career insight and 5-pillar skill radar.
    7. Automatically persists predictions to student record in MongoDB if email provided.
    """
    skills = request.skills
    cgpa = request.cgpa
    projects_count = request.projects_count
    internships_count = request.internships_count
    student_email = request.email

    # If student email or ID provided, pull profile from database
    if student_email or request.student_id:
        col = get_students_collection()
        query = {"email": student_email.strip().lower()} if student_email else {"user_id": request.student_id}
        student_doc = col.find_one(query)
        if student_doc:
            skills = student_doc.get("skills", skills)
            cgpa = student_doc.get("cgpa", cgpa)
            projects_count = len(student_doc.get("projects", [])) if projects_count is None else projects_count
            internships_count = len(student_doc.get("internships", [])) if internships_count is None else internships_count
            student_email = student_doc.get("email")

    if not skills:
        raise HTTPException(
            status_code=400,
            detail="At least one technical skill is required to perform career prediction."
        )

    try:
        prediction_result = ml_service.predict(
            skills=skills,
            cgpa=cgpa,
            projects_count=projects_count,
            internships_count=internships_count,
            include_gemini_insights=True
        )

        # Persist prediction result to MongoDB student record if student found
        if student_email:
            try:
                col = get_students_collection()
                col.update_one(
                    {"email": student_email.strip().lower()},
                    {
                        "$set": {
                            "predictions": prediction_result["predictions"],
                            "top_prediction": prediction_result["top_prediction"],
                            "top_insight": prediction_result.get("top_insight"),
                            "skill_radar": prediction_result.get("skill_radar"),
                            "updated_at": datetime.now(timezone.utc),
                        }
                    }
                )
            except Exception as db_err:
                # Non-blocking update failure
                pass

        return PredictResponse(**prediction_result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.get("/model-info")
def get_model_info():
    """
    Returns metadata about active ML model, architecture, and role categories.
    """
    return {
        "model_name": "CareerMLP (Deep Neural Network)",
        "framework": "PyTorch",
        "input_dimension": 384,
        "embedding_model": "all-MiniLM-L6-v2",
        "classes_count": 10,
        "roles": [
            {"token": token, "label": label}
            for token, label in ROLE_LABELS.items()
        ],
        "is_loaded": ml_service.is_loaded
    }
