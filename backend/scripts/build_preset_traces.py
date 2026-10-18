import json
import os
import sys
from pathlib import Path

# Add backend to python path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.routers.ml_trace import get_ml_trace, ProfileTraceIn
from app.services.ml_service import ml_service

# Define the 5 verified archetype presets
PRESETS = [
    {
        "id": "fullstack_ui_polyglot",
        "name": "Fullstack & UI Polyglot",
        "category": "Web & Client Platforms",
        "tagline": "Modern responsive interfaces, mobile cross-platform apps, and high-velocity full-stack delivery.",
        "skills": ["React", "Next.js", "Flutter", "TailwindCSS", "TypeScript", "GraphQL", "Mobile UI/UX", "CSS"],
        "cgpa": 8.5,
        "projects_count": 4,
        "internships_count": 1,
    },
    {
        "id": "applied_ai_data_scientist",
        "name": "Applied AI & Data Scientist",
        "category": "Machine Learning & Analytics",
        "tagline": "Predictive modeling, deep learning architectures, statistical hypothesis testing, and FastAPI inference.",
        "skills": ["Python", "Data Science", "Machine Learning", "FastAPI", "SQL", "Pandas"],
        "cgpa": 8.6,
        "projects_count": 3,
        "internships_count": 1,
    },
    {
        "id": "backend_cloud_architect",
        "name": "Backend & Cloud API Architect",
        "category": "Distributed Systems & APIs",
        "tagline": "Robust microservice APIs, relational schemas, caching tiers, and containerized deployment pipelines.",
        "skills": ["Python", "SQL", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
        "cgpa": 8.6,
        "projects_count": 3,
        "internships_count": 1,
    },
    {
        "id": "devops_cloud_sre",
        "name": "DevOps & Cloud SRE",
        "category": "Cloud Infrastructure & SRE",
        "tagline": "Automated CI/CD build matrixes, infrastructure as code, container orchestration, and reliability monitoring.",
        "skills": ["Docker", "Kubernetes", "Jenkins", "Ansible", "AWS", "Python", "Git"],
        "cgpa": 8.5,
        "projects_count": 3,
        "internships_count": 1,
    },
    {
        "id": "data_platform_systems",
        "name": "Data Platform & Systems Specialist",
        "category": "Data Systems & AI Integration",
        "tagline": "Distributed data pipelines, Transformer model integration, document ingestion, and scalable databases.",
        "skills": ["Python", "FastAPI", "PyTorch", "Docker", "Deep Learning", "React", "MongoDB", "Transformers"],
        "cgpa": 9.2,
        "projects_count": 4,
        "internships_count": 2,
    },
]

def main():
    print("=" * 60)
    print("MirrorMind v2: Generating Real Model Traces for 5 Presets")
    print("=" * 60)

    ml_service.load_models()

    output_dir = BACKEND_DIR.parent / "frontend" / "public" / "presets"
    output_dir.mkdir(parents=True, exist_ok=True)

    manifest = []

    for preset in PRESETS:
        print(f"\nProcessing preset: {preset['name']} ({preset['id']})...")
        profile_in = ProfileTraceIn(
            skills=preset["skills"],
            cgpa=preset["cgpa"],
            projects_count=preset["projects_count"],
            internships_count=preset["internships_count"]
        )

        trace = get_ml_trace(profile_in)

        # Merge preset metadata into trace bundle
        bundle = {
            "preset_id": preset["id"],
            "name": preset["name"],
            "category": preset["category"],
            "tagline": preset["tagline"],
            "input_profile": {
                "skills": preset["skills"],
                "cgpa": preset["cgpa"],
                "projects_count": preset["projects_count"],
                "internships_count": preset["internships_count"],
            },
            "trace": trace,
        }

        file_path = output_dir / f"{preset['id']}.json"
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(bundle, f, indent=2)

        print(f" -> Saved to: {file_path.name} ({len(trace['tokens'])} tokens, norm={trace['embedding_norm']})")
        print(f" -> Top 3 Roles:")
        for pred in trace["predictions"][:3]:
            print(f"    #{pred['rank']} {pred['label']} -> {round(pred['confidence'] * 100, 2)}%")

        manifest.append({
            "id": preset["id"],
            "name": preset["name"],
            "category": preset["category"],
            "tagline": preset["tagline"],
            "skills": preset["skills"],
            "cgpa": preset["cgpa"],
            "top_role": trace["predictions"][0]["label"],
            "top_confidence": round(trace["predictions"][0]["confidence"] * 100, 1),
            "secondary_role": trace["predictions"][1]["label"] if len(trace["predictions"]) > 1 else None,
            "secondary_confidence": round(trace["predictions"][1]["confidence"] * 100, 1) if len(trace["predictions"]) > 1 else None,
            "json_path": f"/presets/{preset['id']}.json",
        })

    # Save manifest index
    manifest_path = output_dir / "index.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nSuccessfully generated {len(PRESETS)} preset trace JSONs + manifest at {output_dir}!")

if __name__ == "__main__":
    main()
