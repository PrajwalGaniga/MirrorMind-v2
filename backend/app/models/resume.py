from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.student import ProjectItem, InternshipItem

class ResumeExtractedData(BaseModel):
    name: Optional[str] = Field(None, description="Candidate full name")
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Phone number")
    github_url: Optional[str] = Field(None, description="GitHub URL")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn URL")
    college_name: Optional[str] = Field(None, description="College / University")
    branch: Optional[str] = Field(None, description="Degree & Branch")
    cgpa: Optional[float] = Field(None, description="CGPA or percentage converted to 10 scale")
    skills: List[str] = Field(default_factory=list, description="Extracted technical skills")
    projects: List[ProjectItem] = Field(default_factory=list, description="Extracted projects")
    internships: List[InternshipItem] = Field(default_factory=list, description="Extracted internships / experience")
    certifications: List[str] = Field(default_factory=list, description="Extracted certifications")

class ResumeParseResponse(BaseModel):
    status: str = "success"
    file_name: str
    cloudinary_url: Optional[str] = None
    extracted_data: ResumeExtractedData
    residual_fields_needed: List[str] = Field(
        default_factory=lambda: [
            "college_tier",
            "backlog_count",
            "communication_rating",
            "work_style_pref",
        ],
        description="Fields student needs to confirm/select on frontend"
    )
    raw_text_length: int
