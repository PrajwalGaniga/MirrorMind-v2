"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { StudentProfile, PredictResponse } from "@/types/student";
import { MLPipelineVisualizer } from "./MLPipelineVisualizer";
import { StudentDossier } from "./StudentDossier";
import { KnowledgeVault } from "./KnowledgeVault";
import { LiveVoiceCopilotCard } from "./LiveVoiceCopilotCard";

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
  const otherPredictions = prediction?.predictions?.slice(1) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
      {/* Top Student Header Card (Editorial Warm Surface) */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-card)",
          padding: "24px 28px",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid var(--accent)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--surface-soft)",
              }}
            >
              {student.avatar_url ? (
                <Image
                  src={student.avatar_url}
                  alt={student.name}
                  width={68}
                  height={68}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  unoptimized={student.avatar_url.startsWith("http")}
                />
              ) : (
                <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--charcoal)" }}>
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.45rem", margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>
                  {student.name}
                </h2>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: "var(--surface-soft)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {student.college_tier || "Tier-2"}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: "rgba(247, 212, 91, 0.2)",
                    color: "var(--charcoal)",
                  }}
                >
                  {student.branch}
                </span>
              </div>
              <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                {student.email} • CGPA: <strong style={{ color: "var(--charcoal)" }}>{student.cgpa.toFixed(1)}</strong> • Semester {student.semester}
                {student.college_name ? ` • ${student.college_name}` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={handleRerun}
              disabled={refreshing}
              style={{
                background: "var(--charcoal)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "9px 18px",
                fontSize: "0.84rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(41, 42, 41, 0.18)",
              }}
            >
              <span>{refreshing ? "⏳" : "⚡"}</span>
              <span>{refreshing ? "Re-evaluating..." : "Re-run PyTorch AI"}</span>
            </button>

            <Link
              href="/profile"
              style={{
                background: "var(--surface)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                padding: "9px 16px",
                fontSize: "0.84rem",
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>✏️</span>
              <span>Edit Profile</span>
            </Link>

            <Link
              href="/portfolio"
              style={{
                background: "var(--accent)",
                color: "var(--charcoal)",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "9px 16px",
                fontSize: "0.84rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 12px rgba(247, 212, 91, 0.3)",
              }}
            >
              <span>✨</span>
              <span>Public Portfolio</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Dashboard Multi-Column Grid */}
      <div className="dashboard-grid-layout">
        {/* Left Column: Primary Insights & Career Engine */}
        <div className="dashboard-main-column">
          {/* Sub-tab Pill Navigation */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { id: "overview", label: "Executive Overview", icon: "📊" },
              { id: "visualizer", label: "ML Visualizer", icon: "🧠" },
              { id: "knowledge", label: "Knowledge Vault", icon: "📚" },
              { id: "dossier", label: "Academic Dossier", icon: "📋" },
              { id: "verification", label: "Raw Database", icon: "🔗" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  background: activeTab === tab.id ? "var(--charcoal)" : "var(--surface)",
                  color: activeTab === tab.id ? "#FFFFFF" : "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-pill)",
                  padding: "7px 16px",
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

          {/* Tab 1: Executive Overview Content */}
          {activeTab === "overview" && (
            <>
              {/* PyTorch Career Recommendation Matrix Card */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "24px 28px",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                      PyTorch Career Recommendation Matrix
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                      Embedded via 384-D SentenceTransformer + 4-Layer Deep Neural Network
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "var(--surface-soft)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Top 5 Ranked Roles
                  </span>
                </div>

                {/* Prominent Rank #1 Career Role */}
                {topPrediction && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, var(--accent) 0%, #fbe78c 100%)",
                      borderRadius: "18px",
                      padding: "20px 24px",
                      color: "var(--charcoal)",
                      marginBottom: "16px",
                      boxShadow: "0 6px 20px rgba(247, 212, 91, 0.25)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", background: "var(--charcoal)", color: "#FFFFFF", padding: "3px 10px", borderRadius: "999px" }}>
                          Rank #1 Strongest Match
                        </span>
                        <span style={{ fontSize: "0.76rem", fontWeight: 600 }}>Highest AI Alignment</span>
                      </div>
                      <span style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                        {(topPrediction.confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <h4 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "4px 0 8px" }}>
                      {topPrediction.label}
                    </h4>

                    {/* Progress Bar Track */}
                    <div style={{ width: "100%", height: "8px", background: "rgba(41, 42, 41, 0.15)", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${topPrediction.confidence * 100}%`,
                          background: "var(--charcoal)",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Secondary Roles (Ranks 2 to 5) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {otherPredictions.map((pred) => (
                    <div
                      key={pred.role}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderRadius: "14px",
                        background: "var(--surface-soft)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, marginRight: "16px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", width: "24px" }}>
                          #{pred.rank}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.86rem", fontWeight: 600, color: "var(--text-primary)" }}>
                              {pred.label}
                            </span>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                              {(pred.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ width: "100%", height: "6px", background: "var(--surface-muted)", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${pred.confidence * 100}%`,
                                background: "var(--charcoal)",
                                borderRadius: "3px",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gemini Personalized Insight */}
                {prediction?.top_insight && (
                  <div
                    style={{
                      marginTop: "18px",
                      padding: "14px 18px",
                      borderRadius: "14px",
                      background: "rgba(247, 212, 91, 0.12)",
                      border: "1px solid rgba(247, 212, 91, 0.35)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>💡</span>
                    <div style={{ fontSize: "0.84rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
                      <strong>Career Intelligence Insight:</strong> {prediction.top_insight}
                    </div>
                  </div>
                )}
              </div>

              {/* 5-Pillar Skill Radar & Competency Card */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "24px 28px",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                      5-Pillar Skill Radar &amp; Competencies
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                      Synthesized from verified projects, internships, and technical coursework
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "var(--surface-soft)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {student.skills.length} Skills Verified
                  </span>
                </div>

                {/* 5 Pillars Progress Bars */}
                {prediction?.skill_radar ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                    {Object.entries(prediction.skill_radar).map(([pillar, score]) => (
                      <div
                        key={pillar}
                        style={{
                          background: "var(--surface-soft)",
                          padding: "12px 14px",
                          borderRadius: "14px",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            {pillar}
                          </span>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--charcoal)" }}>
                            {score}%
                          </span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "var(--surface-muted)", borderRadius: "3px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${score}%`,
                              background: score >= 80 ? "var(--accent)" : "var(--charcoal)",
                              borderRadius: "3px",
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}>
                    Skill Radar scores active. Re-run AI to refresh pillar metrics.
                  </div>
                )}

                {/* Skills Cloud */}
                <div style={{ marginTop: "18px" }}>
                  <div style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase" }}>
                    Verified Technical Skills
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {student.skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          padding: "4px 10px",
                          borderRadius: "999px",
                          background: "var(--surface-soft)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified Projects Card */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-card)",
                  padding: "24px 28px",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                      Verified Portfolio Projects ({student.projects.length})
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                      Real-time synced with MongoDB Atlas &amp; Voice Copilot
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    style={{
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      background: "var(--surface-soft)",
                      padding: "4px 12px",
                      borderRadius: "999px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    + Add Project
                  </Link>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {student.projects.map((proj, idx) => (
                    <div
                      key={proj.id || idx}
                      style={{
                        background: "var(--surface-soft)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "16px",
                        padding: "16px 18px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                          {proj.title}
                        </h4>
                        {proj.github_url && (
                          <a
                            href={proj.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: "0.74rem", color: "var(--text-secondary)", textDecoration: "none" }}
                          >
                            GitHub ↗
                          </a>
                        )}
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "4px 0 10px", lineHeight: "1.4" }}>
                        {proj.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {proj.tech_stack.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 500,
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
            </>
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
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-card)",
                padding: "24px",
              }}
            >
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "8px" }}>
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

        {/* Right Column: Prominent Embedded Live AI Voice Copilot Module */}
        <div className="dashboard-copilot-column">
          <LiveVoiceCopilotCard student={student} apiUrl={apiUrl} />
        </div>
      </div>
    </div>
  );
};
