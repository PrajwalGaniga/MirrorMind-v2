from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.student import PredictionItem

class PredictRequest(BaseModel):
    # Optional lookup from existing student in MongoDB
    student_id: Optional[str] = None
    email: Optional[str] = None

    # OR direct features for ad-hoc prediction
    skills: List[str] = Field(default_factory=list, description="Array of skills")
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0, description="Cumulative GPA")
    projects_count: Optional[int] = Field(None, ge=0, description="Number of completed projects")
    internships_count: Optional[int] = Field(None, ge=0, description="Number of completed internships")

class PredictResponse(BaseModel):
    profile_text: str = Field(..., description="Deterministic serialized narrative string")
    top_prediction: str = Field(..., description="Top predicted role token")
    top_label: str = Field(..., description="Human readable top role label")
    confidence: float = Field(..., description="Probability of top prediction (0.0 to 1.0)")
    predictions: List[PredictionItem] = Field(..., description="Top 5 ranked career roles with confidences")
    top_insight: Optional[str] = Field(None, description="Personalized AI analysis of skills alignment")
    skill_radar: Optional[Dict[str, int]] = Field(
        None,
        description="5-dimension proficiency radar: Core Programming, Framework Mastery, etc."
    )
    embedding_dim: int = Field(default=384, description="Sentence transformer vector dimension")
    embedding_preview: Optional[List[float]] = Field(default=None, description="Preview of first 16 dimensions of normalized embedding")
    all_probabilities: Optional[Dict[str, float]] = Field(default=None, description="Probability distribution across all 10 role classes")
    nn_layers: Optional[List[Dict[str, Any]]] = Field(default=None, description="Deep neural network architectural layer flow")

