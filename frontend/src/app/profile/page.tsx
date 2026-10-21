"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { StudentProfile } from "@/types/student";

export default function ProfilePage() {
  const { user: authUser, mongoUser, logout } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<"academics" | "skills" | "projects" | "internships" | "resume">("academics");
  const [saveStatus, setSaveStatus] = useState<string>("");

  // New item inputs
  const [newSkill, setNewSkill] = useState<string>("");
  const [skillCategory, setSkillCategory] = useState<string>("All");

  const [projectTitle, setProjectTitle] = useState<string>("");
  const [projectDesc, setProjectDesc] = useState<string>("");
  const [projectStack, setProjectStack] = useState<string>("");
  const [projectGithub, setProjectGithub] = useState<string>("");
  const [showAddProject, setShowAddProject] = useState<boolean>(false);

  const [internRole, setInternRole] = useState<string>("");
  const [internCompany, setInternCompany] = useState<string>("");
  const [internDesc, setInternDesc] = useState<string>("");
  const [showAddIntern, setShowAddIntern] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mirrormind-backend-z9vb.onrender.com";

  const fetchProfile = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const email = authUser?.email || "prajwal.seed@mirrormind.ai";
    fetchProfile(email);
  }, [authUser, fetchProfile]);

  const handleSaveAcademics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    setSaveStatus("Saving to MongoDB Atlas...");

    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(student.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: student.name,
          college_name: student.college_name,
          college_tier: student.college_tier,
          branch: student.branch,
          semester: student.semester,
          cgpa: student.cgpa,
          backlog_count: student.backlog_count,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setStudent(updated);
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } catch {
      setSaveStatus("Save failed. Check backend.");
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !student) return;
    const skillClean = newSkill.trim().toLowerCase();
    const updatedSkills = Array.from(new Set([...student.skills, skillClean]));

    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(student.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: updatedSkills }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent(updated);
        setNewSkill("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    if (!student) return;
    const updatedSkills = student.skills.filter((s) => s !== skillToRemove);
    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(student.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills: updatedSkills }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() || !student) return;

    const stackList = projectStack.split(",").map((s) => s.trim()).filter(Boolean);
    const newProj = {
      id: "proj_" + Date.now().toString(36),
      title: projectTitle.trim(),
      description: projectDesc.trim(),
      tech_stack: stackList,
      github_url: projectGithub.trim() || null,
      live_demo_url: null,
    };

    const updatedProjects = [newProj, ...student.projects];

    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(student.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: updatedProjects }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent(updated);
        setProjectTitle("");
        setProjectDesc("");
        setProjectStack("");
        setProjectGithub("");
        setShowAddProject(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internRole.trim() || !internCompany.trim() || !student) return;

    const newIntern = {
      id: "intern_" + Date.now().toString(36),
      role: internRole.trim(),
      company_name: internCompany.trim(),
      description: internDesc.trim(),
      start_date: "2026-01",
      end_date: "Present",
      is_current: true,
    };

    const updatedInternships = [newIntern, ...student.internships];

    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(student.email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internships: updatedInternships }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStudent(updated);
        setInternRole("");
        setInternCompany("");
        setInternDesc("");
        setShowAddIntern(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Loading Career Dossier...</h2>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Profile not found</h2>
        <Link href="/" className="primary-button" style={{ marginTop: "16px", display: "inline-block" }}>
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <Navbar
        authUser={authUser}
        mongoUser={mongoUser}
        studentProfile={student}
        onLogout={logout}
        dbConnected={true}
        backendOnline={true}
        mlLoaded={true}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
        {/* Profile Header & Summary */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-card)",
            padding: "24px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid var(--accent)",
                background: "var(--surface-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {student.avatar_url ? (
                <Image
                  src={student.avatar_url}
                  alt={student.name}
                  width={64}
                  height={64}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  unoptimized={student.avatar_url.startsWith("http")}
                />
              ) : (
                <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{student.name.charAt(0)}</span>
              )}
            </div>

            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                {student.name}
              </h1>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                {student.email} • {student.branch} • Semester {student.semester} • CGPA {student.cgpa}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/"
              style={{
                background: "var(--charcoal)",
                color: "#FFFFFF",
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.84rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              📊 Back to Dashboard
            </Link>
            <Link
              href="/portfolio"
              style={{
                background: "var(--accent)",
                color: "var(--charcoal)",
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.84rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              ✨ View Portfolio
            </Link>
          </div>
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "academics", label: "University & Academics", icon: "🎓" },
            { id: "skills", label: `Technical Skills (${student.skills.length})`, icon: "⚡" },
            { id: "projects", label: `Projects (${student.projects.length})`, icon: "🚀" },
            { id: "internships", label: `Internships (${student.internships.length})`, icon: "💼" },
            { id: "resume", label: "Cloudinary Resume", icon: "📄" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              style={{
                background: activeSection === tab.id ? "var(--charcoal)" : "var(--surface)",
                color: activeSection === tab.id ? "#FFFFFF" : "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                padding: "8px 18px",
                fontSize: "0.84rem",
                fontWeight: activeSection === tab.id ? 600 : 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.18s ease",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* SECTION 1: ACADEMICS FORM */}
        {activeSection === "academics" && (
          <form
            onSubmit={handleSaveAcademics}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              padding: "28px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Academic Credentials
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Used directly by PyTorch CareerMLP to predict role fit and placement probability
                </p>
              </div>
              {saveStatus && (
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#059669" }}>
                  {saveStatus}
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px" }}>Full Name</label>
                <input
                  type="text"
                  value={student.name}
                  onChange={(e) => setStudent({ ...student, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-soft)", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px" }}>College / University</label>
                <input
                  type="text"
                  value={student.college_name || ""}
                  onChange={(e) => setStudent({ ...student, college_name: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-soft)", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px" }}>College Tier</label>
                <select
                  value={student.college_tier || "Tier-2"}
                  onChange={(e) => setStudent({ ...student, college_tier: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-soft)", fontSize: "0.88rem" }}
                >
                  <option value="Tier-1">Tier-1 (IIT, NIT, BITS, Top Universities)</option>
                  <option value="Tier-2">Tier-2 (State Govt, Autonomous, Accredited)</option>
                  <option value="Tier-3">Tier-3 (Affiliated Colleges)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px" }}>Engineering Branch</label>
                <input
                  type="text"
                  value={student.branch}
                  onChange={(e) => setStudent({ ...student, branch: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-soft)", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px" }}>Semester (1 to 8)</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={student.semester}
                  onChange={(e) => setStudent({ ...student, semester: parseInt(e.target.value) || 1 })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-soft)", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px" }}>Cumulative CGPA (0.0 to 10.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  max="10.0"
                  value={student.cgpa}
                  onChange={(e) => setStudent({ ...student, cgpa: parseFloat(e.target.value) || 0.0 })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-soft)", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "6px" }}>Backlogs Count</label>
                <input
                  type="number"
                  min="0"
                  value={student.backlog_count || 0}
                  onChange={(e) => setStudent({ ...student, backlog_count: parseInt(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-subtle)", background: "var(--surface-soft)", fontSize: "0.88rem" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
              <button
                type="submit"
                style={{
                  background: "var(--charcoal)",
                  color: "#FFFFFF",
                  padding: "10px 24px",
                  borderRadius: "var(--radius-pill)",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Save Academic Credentials
              </button>
            </div>
          </form>
        )}

        {/* SECTION 2: SKILLS MATRIX */}
        {activeSection === "skills" && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              padding: "28px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Technical Skills Matrix
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                Add or remove programming languages, frameworks, cloud tools, and databases
              </p>
            </div>

            {/* Quick Add Bar */}
            <div style={{ display: "flex", gap: "10px", maxWidth: "480px" }}>
              <input
                type="text"
                placeholder="Enter skill name (e.g. Kubernetes, Golang, GraphQL)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "var(--radius-pill)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--surface-soft)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button
                onClick={handleAddSkill}
                style={{
                  background: "var(--charcoal)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  padding: "10px 20px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Skill
              </button>
            </div>

            {/* Current Skills Grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
              {student.skills.map((skill) => (
                <span
                  key={skill}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.84rem",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      padding: "0 2px",
                    }}
                    title="Remove Skill"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: PROJECTS */}
        {activeSection === "projects" && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              padding: "28px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Verified Engineering Projects ({student.projects.length})
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Showcase projects with tech stacks and GitHub links
                </p>
              </div>

              <button
                onClick={() => setShowAddProject(!showAddProject)}
                style={{
                  background: "var(--charcoal)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  padding: "8px 18px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showAddProject ? "Cancel" : "+ Add Project"}
              </button>
            </div>

            {/* Add Project Form Drawer */}
            {showAddProject && (
              <form
                onSubmit={handleAddProject}
                style={{
                  background: "var(--surface-soft)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Add New Project</h4>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Distributed Cache Layer"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>Description</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Concise overview of architecture and features..."
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Go, Redis, Docker"
                    value={projectStack}
                    onChange={(e) => setProjectStack(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>GitHub Repository Link</label>
                  <input
                    type="url"
                    placeholder="https://github.com/username/project"
                    value={projectGithub}
                    onChange={(e) => setProjectGithub(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    style={{
                      background: "var(--accent)",
                      color: "var(--charcoal)",
                      border: "none",
                      borderRadius: "var(--radius-pill)",
                      padding: "8px 20px",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    Save Project to Portfolio
                  </button>
                </div>
              </form>
            )}

            {/* Existing Projects List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {student.projects.map((proj, idx) => (
                <div
                  key={proj.id || idx}
                  style={{
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "16px 20px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {proj.title}
                    </h4>
                    {proj.github_url && (
                      <a href={proj.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                        GitHub ↗
                      </a>
                    )}
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "6px 0 10px" }}>
                    {proj.description}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {proj.tech_stack.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "var(--surface)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: INTERNSHIPS */}
        {activeSection === "internships" && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              padding: "28px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Work Experiences &amp; Internships ({student.internships.length})
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                  Record industry internships and technical apprenticeships
                </p>
              </div>

              <button
                onClick={() => setShowAddIntern(!showAddIntern)}
                style={{
                  background: "var(--charcoal)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "var(--radius-pill)",
                  padding: "8px 18px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {showAddIntern ? "Cancel" : "+ Add Internship"}
              </button>
            </div>

            {showAddIntern && (
              <form
                onSubmit={handleAddInternship}
                style={{
                  background: "var(--surface-soft)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>Role / Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Backend Engineering Intern"
                    value={internRole}
                    onChange={(e) => setInternRole(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>Company / Organization</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZenLog Technologies"
                    value={internCompany}
                    onChange={(e) => setInternCompany(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "4px" }}>Key Responsibilities</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Summary of contributions and technologies used..."
                    value={internDesc}
                    onChange={(e) => setInternDesc(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)" }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="submit"
                    style={{
                      background: "var(--accent)",
                      color: "var(--charcoal)",
                      border: "none",
                      borderRadius: "var(--radius-pill)",
                      padding: "8px 20px",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                    }}
                  >
                    Save Internship
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {student.internships.map((intern, idx) => (
                <div
                  key={intern.id || idx}
                  style={{
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "16px 20px",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>
                    {intern.role} <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>@ {intern.company_name}</span>
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "6px 0" }}>
                    {intern.description}
                  </p>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {intern.start_date || "2026"} - {intern.end_date || "Present"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 5: RESUME & ASSETS */}
        {activeSection === "resume" && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-card)",
              padding: "28px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Cloudinary Asset &amp; Resume PDF
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                Stored securely on Cloudinary CDN and linked with your MongoDB profile
              </p>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {student.avatar_url && (
                <a
                  href={student.avatar_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--surface-soft)",
                    border: "1px solid var(--border-subtle)",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                  }}
                >
                  🖼️ View Cloudinary Avatar ↗
                </a>
              )}

              {student.resume_url && (
                <a
                  href={student.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "10px 18px",
                    borderRadius: "var(--radius-pill)",
                    background: "var(--charcoal)",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                  }}
                >
                  📄 View Cloudinary Resume PDF ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
