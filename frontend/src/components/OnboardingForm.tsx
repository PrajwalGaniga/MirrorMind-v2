"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  StudentProfile,
  ProjectItem,
  InternshipItem,
  ResumeParseResponse,
  PredictResponse,
} from "@/types/student";
import { ResumeDropzone } from "./ResumeDropzone";

interface OnboardingFormProps {
  initialProfile: StudentProfile | null;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  apiUrl: string;
  onSuccess: (profile: StudentProfile, prediction: PredictResponse) => void;
  onCancel?: () => void;
}

const COMMON_SKILLS = [
  "Python",
  "PyTorch",
  "React",
  "Next.js",
  "FastAPI",
  "MongoDB",
  "Docker",
  "SQL",
  "TypeScript",
  "Node.js",
  "AWS",
  "TensorFlow",
  "Git",
  "TailwindCSS",
  "Machine Learning",
  "Deep Learning",
];

const ROLE_OPTIONS = [
  { value: "AIML_ENGINEER", label: "AI / ML Engineer" },
  { value: "SWE_BACKEND", label: "Backend Developer" },
  { value: "FULLSTACK_DEV", label: "Fullstack Developer" },
  { value: "DATA_ENGINEER", label: "Data Engineer" },
  { value: "DEVOPS_CLOUD", label: "DevOps & Cloud Engineer" },
  { value: "DATA_ANALYST", label: "Data Analyst" },
  { value: "CYBERSECURITY", label: "Cybersecurity Analyst" },
  { value: "EMBEDDED_IOT", label: "Embedded Systems & IoT Engineer" },
  { value: "SWE_FRONTEND", label: "Frontend Developer" },
  { value: "PRODUCT_MANAGER", label: "Technical Product Manager" },
];

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  initialProfile,
  userEmail,
  userName,
  userPhoto,
  apiUrl,
  onSuccess,
  onCancel,
}) => {
  // Form State
  const [name, setName] = useState<string>(initialProfile?.name || userName || "");
  const [email] = useState<string>(initialProfile?.email || userEmail || "");
  const [phone, setPhone] = useState<string>(initialProfile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialProfile?.avatar_url || userPhoto || "/sample-avatar.jpg"
  );
  const [githubUrl, setGithubUrl] = useState<string>(initialProfile?.github_url || "");
  const [linkedinUrl, setLinkedinUrl] = useState<string>(initialProfile?.linkedin_url || "");

  // Academics
  const [collegeName, setCollegeName] = useState<string>(
    initialProfile?.college_name || "Visvesvaraya Technological University"
  );
  const [collegeTier, setCollegeTier] = useState<string>(
    initialProfile?.college_tier || "Tier-2"
  );
  const [branch, setBranch] = useState<string>(
    initialProfile?.branch || "Computer Science & Engineering"
  );
  const [semester, setSemester] = useState<number>(initialProfile?.semester || 6);
  const [cgpa, setCgpa] = useState<number>(initialProfile?.cgpa || 8.4);
  const [backlogCount, setBacklogCount] = useState<number>(
    initialProfile?.backlog_count || 0
  );

  // Preferences
  const [careerInterest, setCareerInterest] = useState<string>(
    initialProfile?.career_interest || "AIML_ENGINEER"
  );
  const [communicationRating, setCommunicationRating] = useState<number>(
    initialProfile?.communication_rating || 4
  );
  const [workStylePref, setWorkStylePref] = useState<string>(
    initialProfile?.work_style_pref || "hybrid"
  );

  // Technical Skills
  const [skills, setSkills] = useState<string[]>(
    initialProfile?.skills || ["Python", "FastAPI", "React", "MongoDB", "PyTorch"]
  );
  const [skillInput, setSkillInput] = useState<string>("");

  // Projects
  const [projects, setProjects] = useState<ProjectItem[]>(
    initialProfile?.projects || [
      {
        id: "p1",
        title: "MirrorMind Career Intelligence AI",
        description: "Deep neural network and dense embedding pipeline for career recommendation.",
        tech_stack: ["Python", "FastAPI", "PyTorch", "Next.js", "MongoDB"],
        github_url: "https://github.com/PrajwalGaniga/MirrorMind-v2",
      },
    ]
  );

  // Internships
  const [internships, setInternships] = useState<InternshipItem[]>(
    initialProfile?.internships || [
      {
        id: "i1",
        company_name: "ZenLog Tech",
        role: "AI & Fullstack Engineering Intern",
        domain: "AI / ML & Cloud",
        start_date: "2024-01-01",
        end_date: "2024-06-30",
        is_current: false,
        description: "Engineered scalable microservices and integrated PyTorch neural models.",
      },
    ]
  );

  // Resume reference
  const [resumeUrl, setResumeUrl] = useState<string>(initialProfile?.resume_url || "");
  const [resumeFilename, setResumeFilename] = useState<string>(
    initialProfile?.resume_filename || ""
  );

  // UI status
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStep, setSubmitStep] = useState<string>("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState<boolean>(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill from resume
  const handleResumeExtracted = (
    data: ResumeParseResponse["extracted_data"],
    cloudinaryUrl: string,
    filename: string
  ) => {
    if (data.name) setName(data.name);
    if (data.phone) setPhone(data.phone);
    if (data.college) setCollegeName(data.college);
    if (data.branch) setBranch(data.branch);
    if (data.cgpa && typeof data.cgpa === "number") setCgpa(data.cgpa);
    if (data.github_url) setGithubUrl(data.github_url);
    if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);

    if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
      setSkills((prev) => {
        const combined = new Set([...prev, ...data.skills!]);
        return Array.from(combined);
      });
    }

    if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
      const mappedProjects: ProjectItem[] = data.projects.map((p, idx) => ({
        id: `resume_p_${idx}`,
        title: p.title || `Project ${idx + 1}`,
        description: p.description || "Project experience extracted from resume.",
        tech_stack: p.tech_stack || [],
      }));
      setProjects(mappedProjects);
    }

    if (data.internships && Array.isArray(data.internships) && data.internships.length > 0) {
      const mappedInternships: InternshipItem[] = data.internships.map((i, idx) => ({
        id: `resume_i_${idx}`,
        company_name: i.company_name || "Company",
        role: i.role || "Intern",
        domain: i.domain || "Technology",
      }));
      setInternships(mappedInternships);
    }

    setResumeUrl(cloudinaryUrl);
    setResumeFilename(filename);
  };

  // Add / Remove Skills
  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Add / Remove Project
  const handleAddProject = () => {
    const newProj: ProjectItem = {
      id: `p_${Date.now()}`,
      title: "",
      description: "",
      tech_stack: [],
      github_url: "",
    };
    setProjects([...projects, newProj]);
  };

  const handleUpdateProject = (index: number, updated: Partial<ProjectItem>) => {
    const next = [...projects];
    next[index] = { ...next[index], ...updated };
    setProjects(next);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Add / Remove Internship
  const handleAddInternship = () => {
    const newIntern: InternshipItem = {
      id: `i_${Date.now()}`,
      company_name: "",
      role: "",
      domain: "",
      description: "",
    };
    setInternships([...internships, newIntern]);
  };

  const handleUpdateInternship = (index: number, updated: Partial<InternshipItem>) => {
    const next = [...internships];
    next[index] = { ...next[index], ...updated };
    setInternships(next);
  };

  const handleRemoveInternship = (index: number) => {
    setInternships(internships.filter((_, i) => i !== index));
  };

  // Avatar Upload to Cloudinary
  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarUploading(true);
    setErrorNotice(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", email.replace(/[^a-zA-Z0-9]/g, "_"));

      const res = await fetch(`${apiUrl}/api/student/upload-avatar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload avatar image");
      }

      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
      }
    } catch (err: unknown) {
      console.error("Avatar upload failed:", err);
      setErrorNotice(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Form Submit & ML Predict
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!name.trim()) {
      setErrorNotice("Please enter your full name");
      return;
    }
    if (skills.length === 0) {
      setErrorNotice("Please add at least one technical skill");
      return;
    }

    setSubmitting(true);
    setSubmitStep("Saving student profile to MongoDB Atlas...");

    try {
      const profilePayload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl || undefined,
        github_url: githubUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        college_name: collegeName.trim() || undefined,
        college_tier: collegeTier,
        branch: branch.trim(),
        semester: Number(semester),
        cgpa: Number(cgpa),
        backlog_count: Number(backlogCount),
        career_interest: careerInterest,
        communication_rating: Number(communicationRating),
        work_style_pref: workStylePref,
        skills,
        projects: projects.filter((p) => p.title.trim() !== ""),
        internships: internships.filter((i) => i.company_name.trim() !== ""),
        resume_url: resumeUrl || undefined,
        resume_filename: resumeFilename || undefined,
      };

      // 1. Save Profile to MongoDB
      const saveRes = await fetch(`${apiUrl}/api/student/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload),
      });

      if (!saveRes.ok) {
        const errJson = await saveRes.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to save student profile");
      }

      const savedStudent: StudentProfile = await saveRes.json();

      // 2. Trigger PyTorch ML Inference & Gemini Mentor
      setSubmitStep("Running SentenceTransformer dense embedding & PyTorch CareerMLP...");

      const predictPayload = {
        email: savedStudent.email,
        skills: savedStudent.skills,
        cgpa: savedStudent.cgpa,
        projects_count: savedStudent.projects.length,
        internships_count: savedStudent.internships.length,
      };

      const predictRes = await fetch(`${apiUrl}/api/ml/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(predictPayload),
      });

      if (!predictRes.ok) {
        const errJson = await predictRes.json().catch(() => ({}));
        throw new Error(errJson.detail || "Prediction inference failed");
      }

      const predictionData: PredictResponse = await predictRes.json();

      // Merge prediction results into student profile
      savedStudent.predictions = predictionData.predictions;
      savedStudent.top_prediction = predictionData.top_prediction;
      savedStudent.top_insight = predictionData.top_insight;
      savedStudent.skill_radar = predictionData.skill_radar;

      onSuccess(savedStudent, predictionData);
    } catch (err: unknown) {
      console.error("Submission failed:", err);
      setErrorNotice(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
      setSubmitStep("");
    }
  };

  return (
    <div className="onboarding-container">
      {/* Page Title & Instruction Banner */}
      <div className="onboarding-hero">
        <span className="hero-tag">Student Intelligence Onboarding</span>
        <h2 style={{ fontSize: "1.75rem", margin: "8px 0" }}>
          Build Your Neural Career Profile
        </h2>
        <p style={{ color: "var(--text-muted)", maxWidth: "680px" }}>
          Upload your resume for instant AI parsing, or manually verify your academic and technical
          dossier to activate your PyTorch career recommendations and skill radar.
        </p>
      </div>

      {/* Fast-Track Resume Dropzone */}
      <div className="onboarding-section">
        <ResumeDropzone onExtracted={handleResumeExtracted} apiUrl={apiUrl} />
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="onboarding-form">
        {errorNotice && (
          <div className="auth-alert-error" style={{ marginBottom: "20px" }}>
            ⚠️ {errorNotice}
          </div>
        )}

        {/* 1. Identity & Contact */}
        <div className="form-card">
          <div className="form-card-header">
            <span className="badge-method">STEP 1</span>
            <h3>Identity &amp; Online Presence</h3>
          </div>

          <div className="avatar-section">
            <div className="avatar-preview-box">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || "Student Avatar"}
                  width={80}
                  height={80}
                  className="avatar-large"
                  unoptimized={avatarUrl.startsWith("http")}
                />
              ) : (
                <div className="avatar-large-fallback">
                  {(name || "S")[0].toUpperCase()}
                </div>
              )}
            </div>

            <div className="avatar-actions">
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFile}
                accept="image/*"
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="secondary-button"
                style={{ fontSize: "0.85rem", padding: "6px 14px" }}
              >
                {avatarUploading ? "Uploading to Cloudinary..." : "📷 Upload Custom Avatar"}
              </button>
              <button
                type="button"
                onClick={() => setAvatarUrl("/sample-avatar.jpg")}
                className="chip-btn"
                style={{ fontSize: "0.78rem" }}
              >
                Use Sample Luffy Avatar
              </button>
              <p style={{ fontSize: "0.75rem", color: "var(--text-subtle)", margin: 0 }}>
                Hosted directly on Cloudinary CDN
              </p>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prajwal Ganiga"
                required
                className="custom-input"
              />
            </div>

            <div className="input-group">
              <label>Email Address (Primary Key)</label>
              <input
                type="email"
                value={email}
                disabled
                className="custom-input disabled"
              />
            </div>

            <div className="input-group">
              <label>Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="custom-input"
              />
            </div>

            <div className="input-group">
              <label>GitHub Profile URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="custom-input"
              />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username"
                className="custom-input"
              />
            </div>
          </div>
        </div>

        {/* 2. Academic Credentials */}
        <div className="form-card">
          <div className="form-card-header">
            <span className="badge-method">STEP 2</span>
            <h3>Academic Background &amp; Performance</h3>
          </div>

          <div className="form-grid-2">
            <div className="input-group">
              <label>College / University</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className="custom-input"
              />
            </div>

            <div className="input-group">
              <label>College Tier</label>
              <select
                value={collegeTier}
                onChange={(e) => setCollegeTier(e.target.value)}
                className="custom-input"
              >
                <option value="Tier-1">Tier-1 (IITs, NITs, Top Centrally Funded)</option>
                <option value="Tier-2">Tier-2 (Top State Universities, Reputed Private)</option>
                <option value="Tier-3">Tier-3 (Affiliated Regional Colleges)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Branch / Engineering Discipline</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="custom-input"
              />
            </div>

            <div className="input-group">
              <label>Current Semester: {semester}</label>
              <div className="semester-selector">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSemester(sem)}
                    className={`sem-btn ${semester === sem ? "active" : ""}`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Cumulative GPA (CGPA 0.0 - 10.0): <strong>{cgpa.toFixed(1)}</strong></label>
              <input
                type="range"
                min="5.0"
                max="10.0"
                step="0.1"
                value={cgpa}
                onChange={(e) => setCgpa(parseFloat(e.target.value))}
                className="custom-range"
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                <span>5.0</span>
                <span>7.5</span>
                <span>10.0</span>
              </div>
            </div>

            <div className="input-group">
              <label>Active or Cleared Backlogs</label>
              <input
                type="number"
                min="0"
                max="15"
                value={backlogCount}
                onChange={(e) => setBacklogCount(parseInt(e.target.value) || 0)}
                className="custom-input"
              />
            </div>
          </div>
        </div>

        {/* 3. Career Aspirations & Behavioral Fit */}
        <div className="form-card">
          <div className="form-card-header">
            <span className="badge-method">STEP 3</span>
            <h3>Career Aspirations &amp; Work Style</h3>
          </div>

          <div className="form-grid-3">
            <div className="input-group">
              <label>Target Dream Role</label>
              <select
                value={careerInterest}
                onChange={(e) => setCareerInterest(e.target.value)}
                className="custom-input"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Communication Self-Rating (1 to 5 Stars)</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCommunicationRating(star)}
                    className={`star-btn ${communicationRating >= star ? "active" : ""}`}
                  >
                    ★
                  </button>
                ))}
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "8px" }}>
                  {communicationRating} / 5
                </span>
              </div>
            </div>

            <div className="input-group">
              <label>Work Style Preference</label>
              <select
                value={workStylePref}
                onChange={(e) => setWorkStylePref(e.target.value)}
                className="custom-input"
              >
                <option value="hybrid">🏢 Hybrid (Office + Remote)</option>
                <option value="remote">🏠 Fully Remote</option>
                <option value="startup">🚀 Fast-Paced Startup</option>
                <option value="enterprise">🏛️ Enterprise MNC</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Technical Skills Inventory */}
        <div className="form-card">
          <div className="form-card-header">
            <span className="badge-method">STEP 4</span>
            <h3>Technical Skills Inventory ({skills.length} skills)</h3>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>
            These skills directly feed the 384-dimensional SentenceTransformer dense embedding space.
          </p>

          {/* Skill Tag Cloud */}
          <div className="skills-cloud">
            {skills.map((skill) => (
              <span key={skill} className="skill-pill">
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="skill-remove-btn"
                  title={`Remove ${skill}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Add custom skill input */}
          <div className="skill-add-bar">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill(skillInput);
                }
              }}
              placeholder="Type a skill (e.g. PyTorch, Docker, Kubernetes) and press Enter..."
              className="custom-input"
            />
            <button
              type="button"
              onClick={() => handleAddSkill(skillInput)}
              className="secondary-button"
              style={{ whiteSpace: "nowrap" }}
            >
              + Add Skill
            </button>
          </div>

          {/* Suggested Skills */}
          <div style={{ marginTop: "14px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--text-subtle)", display: "block", marginBottom: "6px" }}>
              Quick Suggestions (Click to Add):
            </span>
            <div className="suggested-chips">
              {COMMON_SKILLS.filter(
                (s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase())
              ).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddSkill(s)}
                  className="chip-btn"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Projects Portfolio */}
        <div className="form-card">
          <div className="form-card-header" style={{ justifyContent: "space-between" }}>
            <div>
              <span className="badge-method">STEP 5</span>
              <h3>Projects Portfolio ({projects.length})</h3>
            </div>
            <button
              type="button"
              onClick={handleAddProject}
              className="secondary-button"
              style={{ fontSize: "0.85rem", padding: "6px 14px" }}
            >
              + Add Project
            </button>
          </div>

          {projects.map((proj, idx) => (
            <div key={proj.id || idx} className="dynamic-item-card">
              <div className="dynamic-item-header">
                <strong>Project #{idx + 1}</strong>
                <button
                  type="button"
                  onClick={() => handleRemoveProject(idx)}
                  className="item-delete-btn"
                  title="Remove Project"
                >
                  Delete
                </button>
              </div>

              <div className="form-grid-2">
                <div className="input-group">
                  <label>Project Title *</label>
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => handleUpdateProject(idx, { title: e.target.value })}
                    placeholder="e.g. Real-Time Autonomous Object Detector"
                    className="custom-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>GitHub or Live Demo URL</label>
                  <input
                    type="url"
                    value={proj.github_url || ""}
                    onChange={(e) => handleUpdateProject(idx, { github_url: e.target.value })}
                    placeholder="https://github.com/..."
                    className="custom-input"
                  />
                </div>

                <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Description &amp; Engineering Contributions</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => handleUpdateProject(idx, { description: e.target.value })}
                    placeholder="Built deep learning model achieving 94% mAP; optimized inference with TensorRT."
                    className="custom-textarea"
                  />
                </div>

                <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Technologies Used (comma separated)</label>
                  <input
                    type="text"
                    value={proj.tech_stack?.join(", ") || ""}
                    onChange={(e) =>
                      handleUpdateProject(idx, {
                        tech_stack: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="PyTorch, OpenCV, CUDA, FastAPI, Docker"
                    className="custom-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 6. Work Experience & Internships */}
        <div className="form-card">
          <div className="form-card-header" style={{ justifyContent: "space-between" }}>
            <div>
              <span className="badge-method">STEP 6</span>
              <h3>Work Experience &amp; Internships ({internships.length})</h3>
            </div>
            <button
              type="button"
              onClick={handleAddInternship}
              className="secondary-button"
              style={{ fontSize: "0.85rem", padding: "6px 14px" }}
            >
              + Add Internship
            </button>
          </div>

          {internships.map((intern, idx) => (
            <div key={intern.id || idx} className="dynamic-item-card">
              <div className="dynamic-item-header">
                <strong>Experience #{idx + 1}</strong>
                <button
                  type="button"
                  onClick={() => handleRemoveInternship(idx)}
                  className="item-delete-btn"
                  title="Remove Experience"
                >
                  Delete
                </button>
              </div>

              <div className="form-grid-3">
                <div className="input-group">
                  <label>Company / Organization *</label>
                  <input
                    type="text"
                    value={intern.company_name}
                    onChange={(e) => handleUpdateInternship(idx, { company_name: e.target.value })}
                    placeholder="e.g. ZenLog Technologies"
                    className="custom-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Role / Designation *</label>
                  <input
                    type="text"
                    value={intern.role}
                    onChange={(e) => handleUpdateInternship(idx, { role: e.target.value })}
                    placeholder="e.g. ML Engineering Intern"
                    className="custom-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Technical Domain</label>
                  <input
                    type="text"
                    value={intern.domain || ""}
                    onChange={(e) => handleUpdateInternship(idx, { domain: e.target.value })}
                    placeholder="e.g. AI / Cloud Systems"
                    className="custom-input"
                  />
                </div>

                <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Key Responsibilities &amp; Impact</label>
                  <textarea
                    rows={2}
                    value={intern.description || ""}
                    onChange={(e) => handleUpdateInternship(idx, { description: e.target.value })}
                    placeholder="Developed microservice pipelines handling 100k daily queries with sub-50ms latency."
                    className="custom-textarea"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Action Bar */}
        <div className="form-submit-bar">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="secondary-button"
            >
              Cancel &amp; Return to Dashboard
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="primary-button submit-button"
          >
            {submitting ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="pulse-dot"></span>
                <span>{submitStep || "Processing..."}</span>
              </div>
            ) : (
              "🚀 Save Profile & Launch Career AI Engine"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
