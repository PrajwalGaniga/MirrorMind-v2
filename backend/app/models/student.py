from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ProjectItem(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., description="Project title")
    description: str = Field(..., description="Detailed description of the project")
    tech_stack: List[str] = Field(default_factory=list, description="Technologies used")
    github_url: Optional[str] = None
    live_demo_url: Optional[str] = None

class InternshipItem(BaseModel):
    id: Optional[str] = None
    company_name: str = Field(..., description="Name of the company or organization")
    domain: Optional[str] = Field(None, description="Domain e.g. AI / ML, Web Development")
    role: str = Field(..., description="Job role or internship title")
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None

class PredictionItem(BaseModel):
    rank: int = Field(..., description="Rank 1 to 5")
    role: str = Field(..., description="Model class token e.g. AIML_ENGINEER")
    label: str = Field(..., description="Human readable label e.g. AI / ML Engineer")
    confidence: float = Field(..., description="Probability confidence score 0.0 to 1.0")

class StudentProfileBase(BaseModel):
    # Basic / Identity Details
    name: str = Field(..., description="Student full name")
    email: str = Field(..., description="Student email address (unique identifier)")
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None

    # Academic Details
    college_name: Optional[str] = None
    college_tier: str = Field(default="Tier-2", description="Tier-1, Tier-2, or Tier-3")
    branch: str = Field(default="Computer Science", description="Engineering branch/discipline")
    semester: int = Field(default=6, ge=1, le=8, description="Current semester (1-8)")
    cgpa: float = Field(default=7.5, ge=0.0, le=10.0, description="Cumulative GPA")
    backlog_count: int = Field(default=0, ge=0, description="Active or cleared backlogs")
    semester_records: Optional[List[Dict[str, Any]]] = None

    # Personal & Behavioral Preferences
    career_interest: Optional[str] = Field(default="AIML_ENGINEER", description="Self-selected dream career role")
    communication_rating: int = Field(default=4, ge=1, le=5, description="Self-rating 1-5")
    work_style_pref: str = Field(default="hybrid", description="remote, hybrid, startup, enterprise")

    # Technical & Practical Experience
    skills: List[str] = Field(default_factory=list, description="Array of verified skills")
    certifications: List[str] = Field(default_factory=list, description="Licenses / Certifications")
    projects: List[ProjectItem] = Field(default_factory=list, description="Completed verified projects")
    internships: List[InternshipItem] = Field(default_factory=list, description="Work experiences & internships")

    # Resume File Reference
    resume_url: Optional[str] = None
    resume_filename: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    user_id: Optional[str] = None

class StudentProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    college_name: Optional[str] = None
    college_tier: Optional[str] = None
    branch: Optional[str] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = None
    backlog_count: Optional[int] = None
    career_interest: Optional[str] = None
    communication_rating: Optional[int] = None
    work_style_pref: Optional[str] = None
    skills: Optional[List[str]] = None
    certifications: Optional[List[str]] = None
    projects: Optional[List[ProjectItem]] = None
    internships: Optional[List[InternshipItem]] = None
    resume_url: Optional[str] = None

class StudentProfileResponse(StudentProfileBase):
    id: str
    user_id: Optional[str] = None
    predictions: List[PredictionItem] = Field(default_factory=list)
    top_prediction: Optional[str] = None
    top_insight: Optional[str] = None
    skill_radar: Optional[Dict[str, int]] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
