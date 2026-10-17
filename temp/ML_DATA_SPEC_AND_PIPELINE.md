# 📊 MirrorMind: Student Data Specification, Resume Parsing & ML Pipeline

> Comprehensive architectural specification covering:
> 1. Complete student profile data schema (Basic, Academic, Personal, Technical)
> 2. Resume-first auto-extraction & form pre-fill flow
> 3. MongoDB database schema
> 4. Exact ML model input/output contract
> 5. End-to-end 384-D dense embedding & PyTorch neural network pipeline
> 6. Model file locations and standalone Python loading script

---

## 📑 Table of Contents
1. [Student Data Architecture: What We Collect](#1-student-data-architecture-what-we-collect)
2. [Resume Parsing & Auto-Extraction Workflow](#2-resume-parsing--auto-extraction-workflow)
3. [MongoDB Database Schema Design](#3-mongodb-database-schema-design)
4. [What the ML Model Actually Needs](#4-what-the-ml-model-actually-needs)
5. [The End-to-End Machine Learning Pipeline](#5-the-end-to-end-machine-learning-pipeline)
6. [ML Model Output Specification](#6-ml-model-output-specification)
7. [Model File Storage & Download Locations](#7-model-file-storage--download-locations)
8. [Standalone Python Inference Code](#8-standalone-python-inference-code)

---

## 1. Student Data Architecture: What We Collect

The student profile is divided into four distinct categories:

### A. Basic / Identity Details
| Field Name | Type | Required? | Source | Description |
| :--- | :--- | :---: | :--- | :--- |
| `name` | String | Yes | Form / Resume | Full name of student |
| `email` | String | Yes | Auth (JWT) | Unique email ID |
| `phone` | String | No | Form / Resume | Contact phone number |
| `avatar_url` | String | No | Form / Cloudinary | Profile picture |
| `github_url` | String | No | Form / Resume | GitHub profile link |
| `linkedin_url` | String | No | Form / Resume | LinkedIn profile link |

### B. Academic Details
| Field Name | Type | Required? | Source | Description |
| :--- | :--- | :---: | :--- | :--- |
| `college_name` | String | No | Form / Resume | University or Institute name |
| `college_tier` | String | Yes | Form | Tier-1, Tier-2, Tier-3 (placement context) |
| `branch` | String | Yes | Form / Resume | CSE, ISE, ECE, AI/DS, Mechanical, etc. |
| `semester` | Integer (1–8) | Yes | Form | Current semester of study |
| `cgpa` | Float (0.0–10.0)| Yes | Form / Resume | Cumulative Grade Point Average |
| `backlog_count`| Integer | Yes | Form | Number of active or cleared backlogs |
| `semester_records`| Array[Object]| No | Form | Optional semester-by-semester SGPA breakdown |

### C. Personal & Behavioral Preferences
| Field Name | Type | Required? | Source | Description |
| :--- | :--- | :---: | :--- | :--- |
| `career_interest` | String | Yes | Form | Student's self-selected dream role (e.g., "AI Engineer") |
| `communication_rating` | Integer (1–5) | Yes | Form | Self-assessed communication confidence |
| `work_style_pref` | String | Yes | Form | `remote`, `hybrid`, `startup`, or `enterprise` |

### D. Technical & Practical Experience (Consumed by ML)
| Field Name | Type | Required? | Source | Description |
| :--- | :--- | :---: | :--- | :--- |
| `skills` | List[String] | Yes | Form / Resume | Tech skills (e.g. `['Python', 'PyTorch', 'FastAPI', 'Docker']`) |
| `projects` | List[Object] | Yes | Form / Resume | Projects with title, description, tech stack, and links |
| `internships` | List[Object] | No | Form / Resume | Work experiences with company, role, domain, dates, description |
| `certifications` | List[String] | No | Form / Resume | Licenses / certifications (AWS, Coursera, etc.) |

---

## 2. Resume Parsing & Auto-Extraction Workflow

Instead of forcing students to manually fill 15+ input fields from scratch, MirrorMind implements a **Resume-First Onboarding**:

```
[Student Uploads PDF/DOCX Resume]
                │
                ▼
  [Text Extraction: PyMuPDF / pdfplumber]
                │
                ▼
  [LLM / NER Extraction Engine]
  - Name, Email, Phone, Links
  - Branch, College, CGPA
  - Extracted Technical Skills Array
  - Parsed Projects (Title, Desc, Stack)
  - Parsed Internships (Company, Role, Dates)
                │
                ▼
[Pre-Fill Onboarding Form in Frontend]
  ✓ Basic info pre-filled
  ✓ Academic metrics pre-filled
  ✓ Skills & Projects tagged into arrays
                │
                ▼
[Student Fills ONLY Leftover Fields]
  - College Tier (Tier 1/2/3)
  - Active Backlogs (0, 1, 2+)
  - Communication Rating (1-5)
  - Work Style Preference (Remote/Hybrid)
                │
                ▼
   [Final Save to MongoDB & Run ML Model]
```

### Residual Field Fill Matrix
| Field | Auto-Extracted from Resume? | Left for Student to Confirm/Fill? |
| :--- | :---: | :---: |
| Full Name, Email, Phone | **Yes (95%)** | Verify only |
| Skills & Tools | **Yes (90%)** | Add/Remove tags |
| Projects & Tech Stacks | **Yes (85%)** | Confirm details |
| Internships & Roles | **Yes (80%)** | Confirm dates |
| CGPA & Degree | **Yes (75%)** | Verify accuracy |
| **College Tier (1 / 2 / 3)** | No | **Must Select** |
| **Backlog Count** | No | **Must Select** |
| **Communication Rating** | No | **Must Select** |
| **Work Style Preference** | No | **Must Select** |

---

## 3. MongoDB Database Schema Design

Stored in the `students` collection:

```json
{
  "_id": "ObjectId('...')",
  "user_id": "usr_94f8a12c8b",
  "name": "Alex Mercer",
  "branch": "Computer Science & Engineering",
  "semester": 7,
  "college_tier": "Tier-2",
  "cgpa": 8.4,
  "backlog_count": 0,
  
  "career_interest": "AIML_ENGINEER",
  "communication_rating": 4,
  "work_style_pref": "hybrid",
  
  "skills": [
    "python", "pytorch", "fastapi", "docker", "postgresql", "scikit-learn", "git"
  ],
  
  "certifications": [
    "AWS Certified Cloud Practitioner",
    "DeepLearning.AI Machine Learning Specialization"
  ],
  
  "projects": [
    {
      "id": "proj_01",
      "title": "Real-time Defect Detection",
      "description": "Built YOLOv8 edge computer vision inference pipeline with FastAPI backend.",
      "tech_stack": ["Python", "YOLOv8", "FastAPI", "OpenCV"],
      "github_url": "https://github.com/...",
      "live_demo_url": null
    }
  ],
  
  "internships": [
    {
      "id": "intern_01",
      "company_name": "DataScale Labs",
      "domain": "AI / ML",
      "role": "Machine Learning Intern",
      "start_date": "2024-01-10T00:00:00Z",
      "end_date": "2024-04-15T00:00:00Z",
      "is_current": 0,
      "description": "Trained and benchmarked PyTorch classification models on AWS EC2."
    }
  ],
  
  "predictions": [
    {"rank": 1, "role": "AIML_ENGINEER", "label": "AI / ML Engineer", "confidence": 0.8842},
    {"rank": 2, "role": "DATA_ENGINEER", "label": "Data Engineer", "confidence": 0.0615},
    {"rank": 3, "role": "SWE_BACKEND", "label": "Backend Developer", "confidence": 0.0312},
    {"rank": 4, "role": "DATA_ANALYST", "label": "Data Analyst", "confidence": 0.0150},
    {"rank": 5, "role": "DEVOPS_CLOUD", "label": "DevOps Engineer", "confidence": 0.0081}
  ],
  
  "updated_at": "2026-10-17T12:00:00Z",
  "created_at": "2026-10-01T08:30:00Z"
}
```

---

## 4. What the ML Model Actually Needs

The active PyTorch `NeuralNet` prediction model does **not** need raw names, emails, phone numbers, or passwords.

### Exact Input Features Extracted for the ML Model:
1. `skills`: Array of strings (e.g., `["python", "docker", "fastapi"]`)
2. `cgpa`: Float (e.g., `8.4`)
3. `projects`: Count of verified projects (e.g., `2`)
4. `internships`: Count of verified internships (e.g., `1`)

### Deterministic Profile Text Serializer (`build_profile_text`)
These 4 features are passed into a deterministic string formatter:

```python
def build_profile_text(skills: list, cgpa: float = None,
                       projects: int = None, internships: int = None) -> str:
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
```

**Example Serialized Output:**
> `"Engineering student with skills in python, pytorch, fastapi, docker, postgresql, scikit-learn, git. CGPA 8.4. Completed 2 projects and 1 internship(s)."`

> ⚠️ **Important Data Integrity Rule**: Notice that the string explicitly **does not include** words like *"Aiming for an AI Engineer role"*. This prevents trivial label leakage and forces the model to predict purely based on technical skills and depth.

---

## 5. The End-to-End Machine Learning Pipeline

```
[Raw Student Record in MongoDB]
               │
               ▼
   [build_profile_text()]
   Clean serialized narrative string
               │
               ▼
[SentenceTransformer: all-MiniLM-L6-v2]
   Dense semantic vectorization
   Output: Float32 array of shape (1, 384) (L2-normalized)
               │
               ▼
  [PyTorch CareerMLP Deep NeuralNet]
   Input:  384 dimensions
   L1:     Linear(384 -> 512) + BatchNorm1d + GELU + Dropout(0.35)
   L2:     Linear(512 -> 256) + BatchNorm1d + GELU + Dropout(0.35)
   L3:     Linear(256 -> 128) + BatchNorm1d + GELU + Dropout(0.245)
   Output: Linear(128 -> 10) -> Raw Logits
               │
               ▼
         [Softmax Layer]
   torch.nn.functional.softmax(logits, dim=1)
   Converts 10 logits into calibrated probabilities (sum = 1.0)
               │
               ▼
      [Label Encoder Mapping]
   Decodes class indices 0..9 into role strings
               │
               ▼
[Top-5 Sorted Predictions with Match %]
```

---

## 6. ML Model Output Specification

When the backend calls `predict_career(...)`, it returns a structured JSON payload:

```json
{
  "profile_text": "Engineering student with skills in python, pytorch, fastapi, docker. CGPA 8.4. Completed 2 projects and 1 internship(s).",
  "top_prediction": "AIML_ENGINEER",
  "confidence": 0.8842,
  "predictions": [
    {
      "rank": 1,
      "role": "AIML_ENGINEER",
      "label": "AI / ML Engineer",
      "confidence": 0.8842
    },
    {
      "rank": 2,
      "role": "DATA_ENGINEER",
      "label": "Data Engineer",
      "confidence": 0.0615
    },
    {
      "rank": 3,
      "role": "SWE_BACKEND",
      "label": "Backend Developer",
      "confidence": 0.0312
    },
    {
      "rank": 4,
      "role": "DATA_ANALYST",
      "label": "Data Analyst",
      "confidence": 0.0150
    },
    {
      "rank": 5,
      "role": "DEVOPS_CLOUD",
      "label": "DevOps Engineer",
      "confidence": 0.0081
    }
  ],
  "top_insight": "Strong alignment with AI / ML Engineer. Your combination of PyTorch and FastAPI puts you in the top tier for ML deployment roles.",
  "skill_radar": {
    "Core Programming": 85,
    "Framework Mastery": 80,
    "System & Cloud": 65,
    "Data & Mathematics": 78,
    "Engineering Practices": 70
  }
}
```

---

## 7. Model File Storage & Download Locations

All machine learning model weights, encoders, and architectures are saved locally inside:
`backend/ml_models/`

### File Manifest:
| Local File Path | Size | Description | Needed for Inference? |
| :--- | :---: | :--- | :---: |
| [`backend/ml_models/nn_best.pt`](file:///c:/Users/ASUS/Desktop/Projects/MirrorMind/backend/ml_models/nn_best.pt) | **1.47 MB** | **Active PyTorch model weights** (Best checkpoint at 99.67% test accuracy) | **YES** |
| [`backend/ml_models/nn_arch.json`](file:///c:/Users/ASUS/Desktop/Projects/MirrorMind/backend/ml_models/nn_arch.json) | 37 B | Architecture configuration: `{"input_dim": 384, "num_classes": 10}` | **YES** |
| [`backend/ml_models/label_encoder.pkl`](file:///c:/Users/ASUS/Desktop/Projects/MirrorMind/backend/ml_models/label_encoder.pkl) | 840 B | Scikit-learn LabelEncoder mapping integer IDs to the 10 role names | **YES** |
| [`backend/ml_models/best_model_name.txt`](file:///c:/Users/ASUS/Desktop/Projects/MirrorMind/backend/ml_models/best_model_name.txt) | 9 B | Active model selector flag: contains string `NeuralNet` | **YES** |
| [`backend/ml_models/embedding_model.txt`](file:///c:/Users/ASUS/Desktop/Projects/MirrorMind/backend/ml_models/embedding_model.txt) | 16 B | Text file containing `all-MiniLM-L6-v2` | **YES** |
| `sentence-transformers/all-MiniLM-L6-v2` | ~80 MB | Pretrained HuggingFace sentence transformer weights (auto-cached on first run) | **YES** |

### Optional Benchmark Baselines in the same folder:
* `backend/ml_models/logistic_regression.pkl` (16 KB)
* `backend/ml_models/xgboost_model.pkl` (3.11 MB)
* `backend/ml_models/lightgbm_model.pkl` (10.4 MB)

---

## 8. Standalone Python Inference Code

You can run this exact script in any independent environment to load the model and test predictions:

```python
import json
import pickle
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from pathlib import Path
from sentence_transformers import SentenceTransformer

MODEL_DIR = Path("./backend/ml_models")

# 1. Define Deep MLP Architecture
class CareerMLP(nn.Module):
    def __init__(self, input_dim=384, num_classes=10, dropout=0.35):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 512), nn.BatchNorm1d(512), nn.GELU(), nn.Dropout(dropout),
            nn.Linear(512, 256),       nn.BatchNorm1d(256), nn.GELU(), nn.Dropout(dropout),
            nn.Linear(256, 128),       nn.BatchNorm1d(128), nn.GELU(), nn.Dropout(dropout * 0.7),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        return self.net(x)

# 2. Load Models and Encoders
print("Loading all-MiniLM-L6-v2...")
embedder = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")

print("Loading PyTorch NeuralNet weights...")
with open(MODEL_DIR / "nn_arch.json") as f:
    arch = json.load(f)

model = CareerMLP(arch["input_dim"], arch["num_classes"])
model.load_state_dict(torch.load(MODEL_DIR / "nn_best.pt", map_location="cpu", weights_only=False))
model.eval()

with open(MODEL_DIR / "label_encoder.pkl", "rb") as f:
    label_encoder = pickle.load(f)

# 3. Sample Student Input
sample_skills = ["python", "pytorch", "fastapi", "docker", "postgresql", "git"]
sample_cgpa = 8.4
sample_projects_count = 2
sample_internships_count = 1

# 4. Serialization
profile_text = (
    f"Engineering student with skills in {', '.join(sample_skills)}. "
    f"CGPA {sample_cgpa:.1f}. "
    f"Completed {sample_projects_count} projects and {sample_internships_count} internship(s)."
)
print(f"\nSerialized Profile: \"{profile_text}\"")

# 5. Embedding
dense_vector = embedder.encode([profile_text], normalize_embeddings=True)  # Shape (1, 384)

# 6. Forward Pass
with torch.no_grad():
    tensor_input = torch.tensor(dense_vector, dtype=torch.float32)
    logits = model(tensor_input)
    probabilities = F.softmax(logits, dim=1).numpy()[0]

# 7. Extract Top 5 Results
top_indices = np.argsort(probabilities)[::-1][:5]
print("\n--- ML Predictions ---")
for rank, idx in enumerate(top_indices, 1):
    role = label_encoder.classes_[idx]
    confidence = probabilities[idx]
    print(f"Rank {rank}: {role:<16} | Confidence: {confidence * 100:.2f}%")
```
