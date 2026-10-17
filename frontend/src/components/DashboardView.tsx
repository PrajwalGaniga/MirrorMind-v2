"use client";

import React, { useState } from "react";
import Image from "next/image";
import { StudentProfile, PredictResponse } from "@/types/student";
import { MLPipelineVisualizer } from "./MLPipelineVisualizer";
import { StudentDossier } from "./StudentDossier";

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
}) => {
  const [activeTab, setActiveTab] = useState<"visualizer" | "dossier" | "verification">(
    "visualizer"
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

  return (
    <div className="dashboard-container" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Top Student Header Card */}
      <div className="dossier-hero-card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="dossier-avatar-box" style={{ width: "64px", height: "64px" }}>
              {student.avatar_url ? (
                <Image
                  src={student.avatar_url}
                  alt={student.name}
                  width={64}
                  height={64}
                  className="dossier-avatar"
                  unoptimized={student.avatar_url.startsWith("http")}
                />
              ) : (
                <div className="dossier-avatar-fallback">
                  {student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.35rem", margin: 0 }}>{student.name}</h2>
                <span className="badge-tier">{student.college_tier || "Tier-2"}</span>
                <span className="badge-branch">{student.branch}</span>
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                {student.email} • CGPA: <strong style={{ color: "var(--accent-cyan)" }}>{student.cgpa.toFixed(1)}</strong> • Semester {student.semester}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handleRerun}
              disabled={refreshing}
              className="primary-button"
              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
            >
              {refreshing ? "Re-evaluating..." : "⚡ Re-run Career AI"}
            </button>
            <button
              onClick={onEditProfile}
              className="secondary-button"
              style={{ fontSize: "0.85rem", padding: "8px 16px" }}
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
        <button
          onClick={() => setActiveTab("visualizer")}
          className={`pipeline-step-btn ${activeTab === "visualizer" ? "active" : ""}`}
          style={{ minWidth: "180px" }}
        >
          <span className="step-tag-pill">AI PIPELINE</span>
          <span className="step-btn-title">🧠 Career ML Visualizer</span>
        </button>

        <button
          onClick={() => setActiveTab("dossier")}
          className={`pipeline-step-btn ${activeTab === "dossier" ? "active" : ""}`}
          style={{ minWidth: "180px" }}
        >
          <span className="step-tag-pill">PROFILE DOSSIER</span>
          <span className="step-btn-title">📋 Academic &amp; Projects</span>
        </button>

        <button
          onClick={() => setActiveTab("verification")}
          className={`pipeline-step-btn ${activeTab === "verification" ? "active" : ""}`}
          style={{ minWidth: "180px" }}
        >
          <span className="step-tag-pill">RAW DATA</span>
          <span className="step-btn-title">🔗 Database Verification</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === "visualizer" && (
        <MLPipelineVisualizer prediction={prediction} student={student} />
      )}

      {activeTab === "dossier" && (
        <StudentDossier student={student} onEditProfile={onEditProfile} />
      )}

      {activeTab === "verification" && (
        <div className="pipeline-card">
          <div className="stage-header">
            <div className="stage-num">MONGODB</div>
            <div>
              <h3>Active Student Document in MongoDB Atlas</h3>
              <p>Collection: <code>mirrormind_db.students</code> (Indexed by unique email: {student.email})</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            {student.avatar_url && (
              <a
                href={student.avatar_url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-chip"
              >
                🖼️ Cloudinary Avatar URL ↗
              </a>
            )}
            {student.resume_url && (
              <a
                href={student.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-chip resume-chip"
              >
                📄 Cloudinary Resume PDF ↗
              </a>
            )}
          </div>

          <pre className="json-preview" style={{ maxHeight: "450px", overflow: "auto" }}>
            <code>{JSON.stringify(student, null, 2)}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
