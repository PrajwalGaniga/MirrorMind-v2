import csv
import random
import os
from pathlib import Path

# Fix seed for reproducible academic dataset generation
random.seed(42)

# Define the 10 target classes matching MirrorMind v2 PyTorch LabelEncoder
ROLES = [
    "AIML_ENGINEER",
    "CYBERSECURITY",
    "DATA_ANALYST",
    "DATA_ENGINEER",
    "DEVOPS_CLOUD",
    "EMBEDDED_IOT",
    "FULLSTACK_DEV",
    "PRODUCT_MANAGER",
    "SWE_BACKEND",
    "SWE_FRONTEND"
]

# Domain-specific authentic skill vocabularies
SKILL_POOLS = {
    "AIML_ENGINEER": [
        "python", "pytorch", "tensorflow", "scikit-learn", "deep learning", "nlp", "computer vision",
        "transformers", "bert", "huggingface", "opencv", "numpy", "pandas", "mlops", "onnx", "cuda",
        "keras", "xgboost", "llm", "rag", "langchain", "vector databases", "reinforcement learning"
    ],
    "CYBERSECURITY": [
        "python", "wireshark", "nmap", "metasploit", "penetration testing", "linux", "cryptography",
        "network security", "burp suite", "siem", "soc", "firewalls", "incident response", "reverse engineering",
        "ethical hacking", "owasp", "kali linux", "vulnerability assessment", "splunk", "bash"
    ],
    "DATA_ANALYST": [
        "sql", "python", "power bi", "tableau", "excel", "pandas", "numpy", "data visualization",
        "exploratory data analysis", "statistics", "business intelligence", "a/b testing", "r",
        "data cleaning", "dashboards", "seaborn", "matplotlib", "google data studio", "reporting"
    ],
    "DATA_ENGINEER": [
        "python", "sql", "apache spark", "apache kafka", "hadoop", "airflow", "postgresql", "etl",
        "snowflake", "bigquery", "data warehousing", "dbt", "docker", "pyspark", "aws s3", "redshift",
        "nosql", "mongodb", "hive", "scala", "data pipelines", "elasticsearch"
    ],
    "DEVOPS_CLOUD": [
        "docker", "kubernetes", "aws", "terraform", "ci/cd", "jenkins", "linux", "git", "ansible",
        "bash", "prometheus", "grafana", "helm", "azure", "gcp", "nginx", "github actions",
        "cloudformation", "argocd", "microservices", "infrastructure as code"
    ],
    "EMBEDDED_IOT": [
        "c", "c++", "embedded c", "microcontrollers", "arm cortex", "arduino", "raspberry pi",
        "rtos", "free rtos", "spi", "i2c", "uart", "stm32", "pcb design", "firmware", "iot protocols",
        "mqtt", "ble", "sensors", "linux kernel", "fpga", "verilog", "assembly"
    ],
    "FULLSTACK_DEV": [
        "javascript", "typescript", "react", "node.js", "express", "next.js", "mongodb", "postgresql",
        "html5", "css3", "tailwind css", "rest api", "graphql", "docker", "git", "redux", "prisma",
        "material ui", "jwt", "redis", "fullstack architecture", "vite"
    ],
    "PRODUCT_MANAGER": [
        "product strategy", "agile", "scrum", "jira", "wireframing", "figma", "user stories", "roadmap planning",
        "market research", "kpi tracking", "a/b testing", "product lifecycle", "prds", "stakeholder management",
        "data analytics", "customer discovery", "mvp design", "ui/ux design principles", "sql basics"
    ],
    "SWE_BACKEND": [
        "python", "fastapi", "django", "flask", "java", "spring boot", "go", "postgresql", "mysql",
        "redis", "docker", "rest apis", "grpc", "microservices", "kafka", "orm", "sqlalchemy",
        "git", "unit testing", "system design", "distributed systems", "linux"
    ],
    "SWE_FRONTEND": [
        "javascript", "typescript", "react", "next.js", "vue.js", "html5", "css3", "tailwind css",
        "redux", "sass", "web performance", "responsive design", "figma to code", "webpack", "vite",
        "state management", "framer motion", "ui/ux design", "browser apis", "jest"
    ]
}

# Cross-cutting foundational skills that any engineering student might have
COMMON_FOUNDATIONS = ["git", "github", "linux", "data structures", "algorithms", "problem solving", "oop", "sql"]

# Tier distribution
TIER_DISTRIBUTION = [("Tier-1", 0.15), ("Tier-2", 0.50), ("Tier-3", 0.35)]

def get_tier():
    r = random.random()
    cumulative = 0.0
    for tier, prob in TIER_DISTRIBUTION:
        cumulative += prob
        if r <= cumulative:
            return tier
    return "Tier-2"

def generate_profile(student_id: int):
    # Select target role with uniform prior (5,000 samples per class = 50,000 total)
    target_role = ROLES[student_id % len(ROLES)]
    
    # Skills: pick 3 to 7 core domain skills + 1 to 3 foundation skills + 0 to 2 cross-disciplinary skills
    domain_skills = random.sample(SKILL_POOLS[target_role], k=random.randint(4, 7))
    foundation_skills = random.sample(COMMON_FOUNDATIONS, k=random.randint(1, 3))
    
    # 30% chance to have cross-disciplinary skill (e.g. backend dev with docker or react)
    cross_skills = []
    if random.random() < 0.35:
        other_roles = [r for r in ROLES if r != target_role]
        random_other = random.choice(other_roles)
        cross_skills = random.sample(SKILL_POOLS[random_other], k=random.randint(1, 2))
        
    all_skills = list(dict.fromkeys(domain_skills + foundation_skills + cross_skills))
    random.shuffle(all_skills)
    
    # Realistic CGPA distribution (bell-curve around 7.8, bounded between 6.0 and 9.9)
    cgpa = round(min(max(random.gauss(7.85, 0.85), 6.1), 9.9), 2)
    
    # Projects: 1 to 6 projects (higher CGPA slightly correlates with more projects)
    projects_count = min(max(int(random.gauss(2.8 + (cgpa - 7.5) * 0.4, 1.2)), 1), 7)
    
    # Internships: 0 to 3
    internships_count = min(max(int(random.choices([0, 1, 2, 3], weights=[0.45, 0.35, 0.15, 0.05])[0]), 0), 4)
    
    # Semester: mostly sem 6, 7, 8 (placement years)
    semester = random.choices([5, 6, 7, 8], weights=[0.10, 0.35, 0.45, 0.10])[0]
    
    # College tier
    tier = get_tier()
    
    # Deterministic Canonical Text format matching build_profile_text() contract:
    # Does NOT include target label to strictly prevent data leakage!
    skills_clean = [s.strip().lower() for s in all_skills]
    skills_str = ", ".join(skills_clean)
    
    canonical_text = f"Engineering student with skills in {skills_str}. CGPA {cgpa:.1f}."
    extras = []
    if projects_count > 0:
        extras.append(f"{projects_count} projects")
    if internships_count > 0:
        extras.append(f"{internships_count} internship(s)")
    if extras:
        canonical_text += f" Completed {' and '.join(extras)}."
        
    return {
        "student_id": f"MM-{100000 + student_id}",
        "target_role": target_role,
        "skills": "; ".join(skills_clean),
        "cgpa": cgpa,
        "projects_count": projects_count,
        "internships_count": internships_count,
        "semester": semester,
        "college_tier": tier,
        "canonical_profile_text": canonical_text
    }

def main():
    output_dir = Path("dataset")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    total_records = 50000
    train_size = int(total_records * 0.80)  # 40,000 train
    val_size = int(total_records * 0.10)    # 5,000 val
    test_size = total_records - train_size - val_size # 5,000 test
    
    print(f"[*] Generating {total_records} balanced student placement records...")
    
    records = [generate_profile(i) for i in range(total_records)]
    random.shuffle(records)
    
    fieldnames = [
        "student_id",
        "target_role",
        "skills",
        "cgpa",
        "projects_count",
        "internships_count",
        "semester",
        "college_tier",
        "canonical_profile_text"
    ]
    
    # 1. Master dataset (50,000 records)
    master_csv = output_dir / "mirrormind_student_placement_50k.csv"
    with open(master_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
    print(f"[+] Master dataset saved: {master_csv} ({total_records} rows)")
    
    # 2. Train split (40,000 records)
    train_csv = output_dir / "train_40k.csv"
    with open(train_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records[:train_size])
    print(f"[+] Train split saved: {train_csv} ({train_size} rows)")
    
    # 3. Validation split (5,000 records)
    val_csv = output_dir / "val_5k.csv"
    with open(val_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records[train_size:train_size+val_size])
    print(f"[+] Validation split saved: {val_csv} ({val_size} rows)")
    
    # 4. Test split (5,000 records)
    test_csv = output_dir / "test_5k.csv"
    with open(test_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records[train_size+val_size:])
    print(f"[+] Test split saved: {test_csv} ({test_size} rows)")
    
    # Compute class distribution summary
    class_counts = {}
    for r in records:
        class_counts[r["target_role"]] = class_counts.get(r["target_role"], 0) + 1
        
    print("\n[+] Class Distribution (Uniform Multi-Class Balance):")
    for role, count in sorted(class_counts.items()):
        print(f"    - {role:20s}: {count:,} samples ({count/total_records*100:.1f}%)")

if __name__ == "__main__":
    main()
