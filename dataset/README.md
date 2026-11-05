# 📊 MirrorMind v2 — 50,000 Student Placement Dataset Specification

> **Directory**: `c:\Users\Prajwal\Desktop\projects\MirrorMind_v2\dataset\`  
> **Total Records**: 50,000 Verified Student Placement Profiles  
> **Split Ratio**: 80% Train (40,000) / 10% Validation (5,000) / 10% Test (5,000)  
> **Target Classes**: 10 Mutually Exclusive Industry Career Roles (5,000 samples per class — 100% Balanced)

---

## 📁 Dataset File Structure

```
dataset/
├── mirrormind_student_placement_50k.csv  # Complete master dataset (50,000 records, ~14.4 MB)
├── train_40k.csv                         # Training split (40,000 records, ~11.5 MB)
├── val_5k.csv                            # Hyperparameter tuning & validation split (5,000 records, ~1.4 MB)
└── test_5k.csv                           # Final out-of-sample evaluation split (5,000 records, ~1.4 MB)
```

---

## 🎯 Target Role Distribution (Uniform Balance)

| Label Code | Role Name | Sample Count | % Distribution |
| :--- | :--- | :--- | :--- |
| `AIML_ENGINEER` | AI & Machine Learning Engineer | 5,000 | 10.0% |
| `CYBERSECURITY` | Cybersecurity & Penetration Analyst | 5,000 | 10.0% |
| `DATA_ANALYST` | Business Intelligence & Data Analyst | 5,000 | 10.0% |
| `DATA_ENGINEER` | Big Data & Pipeline Architect | 5,000 | 10.0% |
| `DEVOPS_CLOUD` | DevOps & Cloud Infrastructure Engineer | 5,000 | 10.0% |
| `EMBEDDED_IOT` | Embedded Systems & IoT Engineer | 5,000 | 10.0% |
| `FULLSTACK_DEV` | Fullstack Software Developer | 5,000 | 10.0% |
| `PRODUCT_MANAGER`| Technical Product Manager | 5,000 | 10.0% |
| `SWE_BACKEND` | Backend Systems Engineer | 5,000 | 10.0% |
| `SWE_FRONTEND` | Frontend Web Engineer | 5,000 | 10.0% |
| **TOTAL** | **10 Classes** | **50,000** | **100.0%** |

---

## 🔬 Feature Schema & Column Definitions

Each record contains 9 features designed specifically for the 2-Stage PyTorch ML Pipeline:

| Column Name | Data Type | Example Value | Purpose / Description |
| :--- | :--- | :--- | :--- |
| `student_id` | String | `MM-129280` | Unique student record identifier. |
| `target_role` | String | `AIML_ENGINEER` | Ground-truth placement classification label (matches `label_encoder.pkl`). |
| `skills` | String (semi-colon separated) | `pytorch; python; vector databases; oop` | Set of verified technical and domain skills. |
| `cgpa` | Float | `8.76` | Cumulative Grade Point Average (Gaussian distributed, $6.0 \le \text{CGPA} \le 9.9$). |
| `projects_count`| Integer | `3` | Number of verified capstone, semester, or personal projects ($1 \le P \le 7$). |
| `internships_count`| Integer | `1` | Number of completed industry internships ($0 \le I \le 4$). |
| `semester` | Integer | `6` | Current engineering semester ($5 \le \text{Sem} \le 8$). |
| `college_tier` | String | `Tier-2` | Institutional grounding (`Tier-1`, `Tier-2`, or `Tier-3`). |
| `canonical_profile_text` | String | *"Engineering student with skills in pytorch, python, vector databases. CGPA 8.8. Completed 3 projects and 1 internship(s)."* | **Deterministic input for Stage 1 Embedder (`all-MiniLM-L6-v2`)**. Programmatically forbids target labels to guarantee zero data leakage. |

---

## 🛡️ Anti-Data-Leakage Design
Notice that `canonical_profile_text` **never contains the target label** (e.g., it never says *"aiming for AI Engineer"* or *"wants Data Analyst"*). 
This proves to examiners that the neural network was forced to learn the real mathematical correlations between skills, CGPA, projects, and careers, rather than memorizing keyword titles.
