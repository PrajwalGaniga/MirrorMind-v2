"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StudentProfile, PredictResponse } from "@/types/student";
import { HeroVoiceAssistant } from "./HeroVoiceAssistant";
import { MLPipelineVisualizer } from "./MLPipelineVisualizer";
import { StudentDossier } from "./StudentDossier";
import { KnowledgeVault } from "./KnowledgeVault";

interface DashboardViewProps {
  student: StudentProfile;
  prediction: PredictResponse | null;
  onEditProfile: () => void;
  onRefreshPrediction: () => Promise<void>;
  apiUrl: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  student,
  prediction,
  onEditProfile,
  onRefreshPrediction,
  apiUrl,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "visualizer" | "knowledge" | "dossier" | "verification">(
    "overview"
  );
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleRerun = async () => {
    setRefreshing(true);
    try {
      await onRefreshPrediction();
    } finally {
      setRefreshing(false);
    }
  };

  const topPrediction = prediction?.predictions?.[0] || null;

  // Real or default showcased projects
  const defaultProjects = [
    {
      title: "MedBridge",
      category: "ML / NLP",
      tagClass: "tag-ml",
      icon: "🏥",
      desc: "Medical English ↔ Kannada Translator (NMT + RAG)",
      link: "/profile#projects",
    },
    {
      title: "Smart Classroom",
      category: "Full Stack",
      tagClass: "tag-fullstack",
      icon: "🎓",
      desc: "AI powered smart classroom with Gemini integration",
      link: "/profile#projects",
    },
    {
      title: "FocusLy",
      category: "Python / Flask",
      tagClass: "tag-python",
      icon: "📋",
      desc: "ToDo & Productivity App with analytics dashboard",
      link: "/profile#projects",
    },
    {
      title: "Immenza True Care",
      category: "Full Stack",
      tagClass: "tag-fullstack",
      icon: "🏥",
      desc: "Hospital Management System with automated scheduling",
      link: "/profile#projects",
    },
  ];

  // Map student's real projects if available, otherwise blend with default mock showcase
  const projectCards =
    student.projects && student.projects.length >= 4
      ? student.projects.slice(0, 4).map((p, idx) => ({
          title: p.title,
          category: p.tech_stack?.[0] || "Full Stack",
          tagClass: idx % 3 === 0 ? "tag-ml" : idx % 3 === 1 ? "tag-fullstack" : "tag-python",
          icon: idx % 2 === 0 ? "💻" : "⚡",
          desc: p.description,
          link: p.github_url || p.live_demo_url || "/profile#projects",
        }))
      : defaultProjects;

  // Real or default skills list
  const displaySkills =
    student.skills && student.skills.length > 0
      ? student.skills
      : ["Python", "TensorFlow", "PyTorch", "Keras", "Flask", "FastAPI", "React", "Kotlin", "MongoDB", "PostgreSQL", "Docker", "Git"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* 1. Full-Width AI Voice Co-Pilot Hero Section (from Mockup) */}
      <HeroVoiceAssistant student={student} apiUrl={apiUrl} onProfileUpdated={onRefreshPrediction} />

      {/* Sub-Navigation Tabs to toggle between Executive Overview and In-Depth Views */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { id: "overview", label: "Dashboard Overview", icon: "📊" },
            { id: "visualizer", label: "PyTorch ML Pipeline", icon: "🧠" },
            { id: "knowledge", label: "Knowledge Vault", icon: "📚" },
            { id: "dossier", label: "Academic Dossier", icon: "📋" },
            { id: "verification", label: "Database Sync", icon: "🔗" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? "var(--charcoal)" : "#FFFFFF",
                color: activeTab === tab.id ? "#FFFFFF" : "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                padding: "8px 18px",
                fontSize: "0.82rem",
                fontWeight: activeTab === tab.id ? 600 : 500,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.18s ease",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleRerun}
            disabled={refreshing}
            style={{
              background: "var(--surface-soft)",
              color: "var(--charcoal)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-pill)",
              padding: "8px 16px",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{refreshing ? "⏳" : "⚡"}</span>
            <span>{refreshing ? "Re-evaluating..." : "Re-run PyTorch AI"}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Executive 3-Row Balanced Grid Layout (Matching Mockup Screenshot) */}
      {activeTab === "overview" && (
        <div className="dashboard-balanced-grid">
          {/* ========================================================
              ROW 1: Profile Overview | Quick Access | Recent Activity
              ======================================================== */}
          <div className="dashboard-row-1">
            {/* Card 1: Profile Overview */}
            <div className="editorial-card">
              <div className="editorial-card-header">
                <div>
                  <h3 className="editorial-card-title">Profile Overview</h3>
                  <p className="editorial-card-subtitle">
                    {student.branch || "Computer Science & Design"} | {student.college_name || "SIT, Mangaluru"}
                  </p>
                </div>
                <Link href="/profile" className="editorial-card-link">
                  <span>View Full Profile</span>
                  <span>→</span>
                </Link>
              </div>

              {/* Student Identity Block */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    background: "var(--charcoal)",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.3rem",
                    flexShrink: 0,
                    overflow: "hidden",
                    border: "2px solid var(--accent)",
                  }}
                >
                  {student.avatar_url ? (
                    <Image
                      src={student.avatar_url}
                      alt={student.name}
                      width={54}
                      height={54}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      unoptimized={student.avatar_url.startsWith("http")}
                    />
                  ) : (
                    student.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                      {student.name}
                    </h4>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "rgba(2, 132, 199, 0.12)",
                        color: "#0284C7",
                      }}
                    >
                      Student
                    </span>
                  </div>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                    BE {student.semester ? Math.ceil(student.semester / 2) : 2}nd Year • CGPA{" "}
                    <strong style={{ color: "var(--text-primary)" }}>{student.cgpa.toFixed(2)}</strong> • Class Rank 1st
                  </p>
                </div>
              </div>

              {/* 4 Metrics Tiles */}
              <div className="metric-tiles-row">
                <div className="metric-tile">
                  <div className="metric-tile-icon">📁</div>
                  <div>
                    <div className="metric-tile-number">{student.projects?.length || 7}+</div>
                    <div className="metric-tile-label">Projects</div>
                  </div>
                </div>

                <div className="metric-tile">
                  <div className="metric-tile-icon">💼</div>
                  <div>
                    <div className="metric-tile-number">{student.internships?.length || 3}</div>
                    <div className="metric-tile-label">Internships</div>
                  </div>
                </div>

                <div className="metric-tile">
                  <div className="metric-tile-icon">⭐</div>
                  <div>
                    <div className="metric-tile-number">{student.certifications?.length || 4}</div>
                    <div className="metric-tile-label">Certifications</div>
                  </div>
                </div>

                <div className="metric-tile">
                  <div className="metric-tile-icon">🏷️</div>
                  <div>
                    <div className="metric-tile-number">{student.skills?.length || 20}+</div>
                    <div className="metric-tile-label">Skills</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Quick Access */}
            <div className="editorial-card">
              <div className="editorial-card-header">
                <h3 className="editorial-card-title">Quick Access</h3>
              </div>

              <div className="quick-access-grid">
                <Link href="/profile#resume" className="quick-access-tile">
                  <div className="quick-access-icon">📄</div>
                  <div className="quick-access-text">
                    <h4>Resume</h4>
                    <p>View / Download</p>
                  </div>
                </Link>

                <Link href="/profile" className="quick-access-tile">
                  <div className="quick-access-icon">🎓</div>
                  <div className="quick-access-text">
                    <h4>Career Dossier</h4>
                    <p>Your Achievements</p>
                  </div>
                </Link>

                <Link href="/voice-chat" className="quick-access-tile">
                  <div className="quick-access-icon">🎙️</div>
                  <div className="quick-access-text">
                    <h4>Voice Studio</h4>
                    <p>AI Voice Assistant</p>
                  </div>
                </Link>

                <Link href="/portfolio" className="quick-access-tile">
                  <div className="quick-access-icon">✨</div>
                  <div className="quick-access-text">
                    <h4>Portfolio</h4>
                    <p>Live Preview</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Card 3: Recent Activity */}
            <div className="editorial-card">
              <div className="editorial-card-header">
                <h3 className="editorial-card-title">Recent Activity</h3>
                <Link href="/profile" className="editorial-card-link">
                  <span>View All</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-icon" style={{ background: "rgba(16, 185, 129, 0.12)" }}>
                      📄
                    </div>
                    <div>
                      <div className="activity-title">Project Demo Submission</div>
                      <div className="activity-time">Today, 11:24 AM</div>
                    </div>
                  </div>
                  <span className="activity-status-pill status-completed">Completed</span>
                </div>

                <div className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-icon" style={{ background: "rgba(14, 165, 233, 0.12)" }}>
                      🧠
                    </div>
                    <div>
                      <div className="activity-title">ML Model Training</div>
                      <div className="activity-time">Yesterday, 4:32 PM</div>
                    </div>
                  </div>
                  <span className="activity-status-pill status-progress">In Progress</span>
                </div>

                <div className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-icon" style={{ background: "rgba(99, 102, 241, 0.12)" }}>
                      💼
                    </div>
                    <div>
                      <div className="activity-title">Internship Application</div>
                      <div className="activity-time">Oct 10, 2025</div>
                    </div>
                  </div>
                  <span className="activity-status-pill status-submitted">Submitted</span>
                </div>

                <div className="activity-item">
                  <div className="activity-item-left">
                    <div className="activity-icon" style={{ background: "rgba(245, 158, 11, 0.12)" }}>
                      ✨
                    </div>
                    <div>
                      <div className="activity-title">Portfolio Updated</div>
                      <div className="activity-time">Oct 8, 2025</div>
                    </div>
                  </div>
                  <span className="activity-status-pill status-updated">Updated</span>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              ROW 2: Projects & Internships | ML / DL & GenAI
              ======================================================== */}
          <div className="dashboard-row-2">
            {/* Card 4: Projects & Internships */}
            <div className="editorial-card">
              <div className="editorial-card-header">
                <div>
                  <h3 className="editorial-card-title">Projects &amp; Internships</h3>
                  <p className="editorial-card-subtitle">
                    Explore my key projects, internships and technical work experience.
                  </p>
                </div>
                <Link href="/profile#projects" className="editorial-card-link">
                  <span>View All</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="projects-grid">
                {projectCards.map((proj, idx) => (
                  <div key={idx} className="project-box-card">
                    <div>
                      <div className="project-box-top">
                        <div className="project-box-icon">{proj.icon}</div>
                        <span className={`project-box-tag ${proj.tagClass}`}>{proj.category}</span>
                      </div>
                      <h4 className="project-box-title">{proj.title}</h4>
                      <p className="project-box-desc">{proj.desc}</p>
                    </div>

                    <Link href={proj.link} className="project-box-link">
                      <span>View Details</span>
                      <span>→</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 5: ML / DL & GenAI */}
            <div className="editorial-card">
              <div className="editorial-card-header">
                <div>
                  <h3 className="editorial-card-title">ML / DL &amp; GenAI</h3>
                  <p className="editorial-card-subtitle">
                    Explore my machine learning, deep learning and generative AI work.
                  </p>
                </div>
                <Link href="/ml-visualizer" className="editorial-card-link">
                  <span>View All</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="domains-grid">
                <div className="domain-tile">
                  <div className="domain-icon">🧬</div>
                  <div className="domain-text">
                    <h4>Deep Learning</h4>
                    <p>CNN • RNN • LSTM</p>
                  </div>
                </div>

                <div className="domain-tile">
                  <div className="domain-icon">📚</div>
                  <div className="domain-text">
                    <h4>NLP &amp; RAG</h4>
                    <p>LLMs • Embeddings</p>
                  </div>
                </div>

                <div className="domain-tile">
                  <div className="domain-icon">👁️</div>
                  <div className="domain-text">
                    <h4>Computer Vision</h4>
                    <p>Classification • Detection</p>
                  </div>
                </div>

                <div className="domain-tile">
                  <div className="domain-icon">⚡</div>
                  <div className="domain-text">
                    <h4>GenAI</h4>
                    <p>Prompt Eng • Agents</p>
                  </div>
                </div>
              </div>

              {/* PyTorch Match Highlight Box */}
              {topPrediction && (
                <div
                  style={{
                    marginTop: "16px",
                    background: "rgba(247, 212, 91, 0.25)",
                    borderRadius: "14px",
                    padding: "12px 14px",
                    border: "1px solid rgba(247, 212, 91, 0.5)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--charcoal)" }}>
                      Top Career Match: {topPrediction.label}
                    </span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--charcoal)" }}>
                      {(topPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(41, 42, 41, 0.15)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${topPrediction.confidence * 100}%`,
                        background: "var(--charcoal)",
                        borderRadius: "3px",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
              ROW 3: Experience & Achievements | Skills
              ======================================================== */}
          <div className="dashboard-row-3">
            {/* Card 6: Experience & Achievements */}
            <div className="editorial-card">
              <div className="editorial-card-header">
                <div>
                  <h3 className="editorial-card-title">Experience &amp; Achievements</h3>
                  <p className="editorial-card-subtitle">
                    Training, internships, hackathons and more.
                  </p>
                </div>
                <Link href="/profile#experience" className="editorial-card-link">
                  <span>View All</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="experience-row">
                <div className="experience-pill">
                  <div className="experience-icon">🏆</div>
                  <div>
                    <h5>Dhaarini Academy</h5>
                    <p>30 Days DL Training</p>
                  </div>
                </div>

                <div className="experience-pill">
                  <div className="experience-icon">💻</div>
                  <div>
                    <h5>SuzioSoft</h5>
                    <p>2 Months Full Stack (Flask)</p>
                  </div>
                </div>

                <div className="experience-pill">
                  <div className="experience-icon">📱</div>
                  <div>
                    <h5>AICTE-EduSkills + Google</h5>
                    <p>Android Dev (10 Weeks)</p>
                  </div>
                </div>

                <div className="experience-pill">
                  <div className="experience-icon">🏅</div>
                  <div>
                    <h5>GDG Hackathon</h5>
                    <p>Top 1000 / 6L+ Participants</p>
                  </div>
                </div>

                <div className="experience-pill">
                  <div className="experience-icon">🥇</div>
                  <div>
                    <h5>Codethon</h5>
                    <p>Top 5 / 60</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 7: Skills */}
            <div className="editorial-card">
              <div className="editorial-card-header">
                <div>
                  <h3 className="editorial-card-title">Skills</h3>
                  <p className="editorial-card-subtitle">
                    Technologies I work with.
                  </p>
                </div>
                <Link href="/profile#skills" className="editorial-card-link">
                  <span>View All</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="skills-cloud">
                {displaySkills.slice(0, 13).map((skill) => (
                  <span key={skill} className="skill-pill">
                    {skill}
                  </span>
                ))}
                {displaySkills.length > 13 && (
                  <Link
                    href="/profile#skills"
                    className="skill-pill"
                    style={{ background: "var(--accent)", color: "var(--charcoal)", border: "none", textDecoration: "none" }}
                  >
                    +{displaySkills.length - 13} More
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Deep ML Pipeline Visualizer */}
      {activeTab === "visualizer" && (
        <MLPipelineVisualizer prediction={prediction} student={student} />
      )}

      {/* Tab 3: Grounded Knowledge Vault */}
      {activeTab === "knowledge" && (
        <KnowledgeVault student={student} apiUrl={apiUrl} />
      )}

      {/* Tab 4: Student Dossier */}
      {activeTab === "dossier" && (
        <StudentDossier student={student} onEditProfile={onEditProfile} />
      )}

      {/* Tab 5: Raw MongoDB Document */}
      {activeTab === "verification" && (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-card)",
            padding: "24px 28px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
            Active Student Document in MongoDB Atlas
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Indexed by unique primary email: <code>{student.email}</code>
          </p>
          <pre
            style={{
              background: "var(--surface-soft)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "14px",
              padding: "16px",
              fontSize: "0.8rem",
              maxHeight: "450px",
              overflow: "auto",
              color: "var(--text-primary)",
            }}
          >
            <code>{JSON.stringify(student, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
