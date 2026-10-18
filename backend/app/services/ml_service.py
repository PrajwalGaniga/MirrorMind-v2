import json
import logging
import pickle
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
from typing import Dict, Any, List, Optional
from sentence_transformers import SentenceTransformer
from app.core.config import settings
from app.services.gemini_service import generate_career_insights

logger = logging.getLogger(__name__)

# Human-readable label mappings for all 10 role tokens
ROLE_LABELS: Dict[str, str] = {
    "AIML_ENGINEER": "AI / ML Engineer",
    "CYBERSECURITY": "Cybersecurity Analyst",
    "DATA_ANALYST": "Data Analyst",
    "DATA_ENGINEER": "Data Engineer",
    "DEVOPS_CLOUD": "DevOps & Cloud Engineer",
    "EMBEDDED_IOT": "Embedded Systems & IoT Engineer",
    "FULLSTACK_DEV": "Fullstack Developer",
    "PRODUCT_MANAGER": "Technical Product Manager",
    "SWE_BACKEND": "Backend Developer",
    "SWE_FRONTEND": "Frontend Developer",
}

class CareerMLP(nn.Module):
    def __init__(self, input_dim: int = 384, num_classes: int = 10, dropout: float = 0.35):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.BatchNorm1d(512),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(512, 256),
            nn.BatchNorm1d(256),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.BatchNorm1d(128),
            nn.GELU(),
            nn.Dropout(dropout * 0.7),
            nn.Linear(128, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)

def build_profile_text(
    skills: List[str],
    cgpa: Optional[float] = None,
    projects: Optional[int] = None,
    internships: Optional[int] = None
) -> str:
    """
    Deterministic string formatter specified by ML pipeline contract.
    Does NOT include target labels to prevent data leakage.
    """
    skills_clean = [str(s).strip().lower() for s in skills if s]
    if skills_clean:
        text = f"Engineering student with skills in {', '.join(skills_clean)}."
    else:
        text = "Engineering student with technical skills."

    if cgpa is not None:
        text += f" CGPA {float(cgpa):.1f}."

    extras = []
    if projects is not None:
        extras.append(f"{int(projects)} projects")
    if internships is not None:
        extras.append(f"{int(internships)} internship(s)")
    if extras:
        text += f" Completed {' and '.join(extras)}."

    return text.strip()

class MLService:
    _instance = None

    def __init__(self):
        self.embedder: Optional[SentenceTransformer] = None
        self.model: Optional[CareerMLP] = None
        self.label_encoder = None
        self.is_loaded: bool = False
        self.model_dir: Path = settings.ML_MODEL_DIR

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MLService()
        return cls._instance

    def load_models(self):
        """
        Loads SentenceTransformer and PyTorch model into memory once.
        """
        if self.is_loaded:
            return

        logger.info(f"Loading ML models from {self.model_dir}...")
        arch_path = self.model_dir / "nn_arch.json"
        weights_path = self.model_dir / "nn_best.pt"
        encoder_path = self.model_dir / "label_encoder.pkl"

        # 1. Load Architecture
        if not arch_path.exists():
            raise FileNotFoundError(f"Missing architecture config: {arch_path}")
        with open(arch_path, "r") as f:
            arch = json.load(f)

        # 2. Load PyTorch model weights
        if not weights_path.exists():
            raise FileNotFoundError(f"Missing model weights: {weights_path}")
        self.model = CareerMLP(arch["input_dim"], arch["num_classes"])
        state_dict = torch.load(weights_path, map_location="cpu", weights_only=False)
        self.model.load_state_dict(state_dict)
        self.model.eval()

        # 3. Load Label Encoder
        if not encoder_path.exists():
            raise FileNotFoundError(f"Missing label encoder: {encoder_path}")
        with open(encoder_path, "rb") as f:
            self.label_encoder = pickle.load(f)

        # 4. Load Sentence Transformer
        logger.info("Initializing SentenceTransformer('all-MiniLM-L6-v2')...")
        self.embedder = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
        self.is_loaded = True
        logger.info("ML Service models loaded successfully.")


    @property
    def embedding_model(self) -> SentenceTransformer:
        """Convenience property returning loaded SentenceTransformer embedder."""
        if not self.is_loaded or self.embedder is None:
            self.load_models()
        return self.embedder


    def predict(
        self,
        skills: List[str],
        cgpa: Optional[float] = None,
        projects_count: Optional[int] = None,
        internships_count: Optional[int] = None,
        include_gemini_insights: bool = True
    ) -> Dict[str, Any]:
        """
        Executes end-to-end career prediction pipeline:
        Serialization -> Dense 384-D Embedding -> PyTorch MLP -> Softmax -> Top 5 Sorting.
        """
        if not self.is_loaded:
            self.load_models()

        # 1. Profile Serialization
        profile_text = build_profile_text(skills, cgpa, projects_count, internships_count)

        # 2. Embedding (L2 normalized 384-D vector)
        dense_vector = self.embedder.encode([profile_text], normalize_embeddings=True)

        # 3. PyTorch Forward Pass
        with torch.no_grad():
            tensor_input = torch.tensor(dense_vector, dtype=torch.float32)
            logits = self.model(tensor_input)
            probabilities = F.softmax(logits, dim=1).numpy()[0]

        # 4. Extract Top 5 Predictions
        top_indices = np.argsort(probabilities)[::-1][:5]
        predictions = []
        for rank, idx in enumerate(top_indices, 1):
            role_token = str(self.label_encoder.classes_[idx])
            conf = float(probabilities[idx])
            label = ROLE_LABELS.get(role_token, role_token.replace("_", " ").title())
            predictions.append({
                "rank": rank,
                "role": role_token,
                "label": label,
                "confidence": round(conf, 4)
            })

        top_pred = predictions[0]

        # 5. Full Probabilities & Layer Flow
        all_probabilities = {
            str(self.label_encoder.classes_[i]): round(float(probabilities[i]), 4)
            for i in range(len(self.label_encoder.classes_))
        }

        nn_layers = [
            {
                "id": "embed_in",
                "name": "Input Embedding Space",
                "type": "Dense Vector",
                "input_shape": [1, 384],
                "output_shape": [1, 384],
                "activation": "L2 Normalized",
                "description": "SentenceTransformers (all-MiniLM-L6-v2) semantic projection"
            },
            {
                "id": "block1",
                "name": "Hidden Dense Block 1",
                "type": "Linear + BatchNorm + GELU + Dropout",
                "input_shape": [1, 384],
                "output_shape": [1, 512],
                "activation": "GELU",
                "regularization": "BatchNorm1d(512), Dropout(p=0.35)",
                "description": "Initial feature expansion to higher-dimensional latent space"
            },
            {
                "id": "block2",
                "name": "Hidden Dense Block 2",
                "type": "Linear + BatchNorm + GELU + Dropout",
                "input_shape": [1, 512],
                "output_shape": [1, 256],
                "activation": "GELU",
                "regularization": "BatchNorm1d(256), Dropout(p=0.35)",
                "description": "Intermediate representation compression"
            },
            {
                "id": "block3",
                "name": "Hidden Dense Block 3",
                "type": "Linear + BatchNorm + GELU + Dropout",
                "input_shape": [1, 256],
                "output_shape": [1, 128],
                "activation": "GELU",
                "regularization": "BatchNorm1d(128), Dropout(p=0.245)",
                "description": "Deep abstraction bottleneck before classification"
            },
            {
                "id": "output",
                "name": "Output Classification Layer",
                "type": "Linear + Softmax",
                "input_shape": [1, 128],
                "output_shape": [1, 10],
                "activation": "Softmax (dim=1)",
                "description": "Final probability distribution across 10 career role classes"
            }
        ]

        # 6. Gemini Career Insight & Radar
        top_insight = None
        skill_radar = None
        if include_gemini_insights and settings.GEMINI_API_KEY:
            try:
                insights_res = generate_career_insights(profile_text, predictions)
                top_insight = insights_res.get("top_insight")
                skill_radar = insights_res.get("skill_radar")
            except Exception as e:
                logger.warning(f"Could not generate Gemini insights: {e}")

        # Vector preview (first 16 float values)
        embedding_preview = [round(float(v), 4) for v in dense_vector[0][:16]]

        return {
            "profile_text": profile_text,
            "top_prediction": top_pred["role"],
            "top_label": top_pred["label"],
            "confidence": top_pred["confidence"],
            "predictions": predictions,
            "top_insight": top_insight,
            "skill_radar": skill_radar,
            "embedding_dim": 384,
            "embedding_preview": embedding_preview,
            "all_probabilities": all_probabilities,
            "nn_layers": nn_layers,
        }

ml_service = MLService.get_instance()
