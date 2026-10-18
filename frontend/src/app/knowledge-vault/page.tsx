"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { KnowledgeVault } from "@/components/KnowledgeVault";
import { StudentProfile } from "@/types/student";

export default function KnowledgeVaultPage() {
  const { user: authUser, mongoUser } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<string>("checking");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Determine user email to load
  const activeEmail =
    authUser?.email ||
    mongoUser?.email ||
    "prajwal.seed@mirrormind.ai";

  const loadStudentProfile = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check RAG health
      const healthRes = await fetch(`${apiUrl}/api/rag/health`);
      if (healthRes.ok) {
        setDbStatus("connected");
      } else {
        setDbStatus("error");
      }

      // 2. Fetch student profile
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(activeEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      } else {
        // Fallback profile if student not yet in MongoDB
        setStudent({
          name: authUser?.displayName || "Engineering Student",
          email: activeEmail,
          college_tier: "Tier-1",
          branch: "Computer Science & Engineering",
          semester: 7,
          cgpa: 8.8,
          backlog_count: 0,
          communication_rating: 4,
          work_style_pref: "hybrid",
          skills: ["python", "fastapi", "docker", "pytorch", "mongodb", "aws"],
          projects: [],
          internships: [],
          certifications: [],
        });
      }
    } catch (err) {
      console.error("Failed to load student profile:", err);
      setDbStatus("error");
      // Fallback
      setStudent({
        name: "Engineering Student",
        email: activeEmail,
        college_tier: "Tier-1",
        branch: "Computer Science & Engineering",
        semester: 7,
        cgpa: 8.8,
        backlog_count: 0,
        communication_rating: 4,
        work_style_pref: "hybrid",
        skills: ["python", "fastapi", "docker", "pytorch", "mongodb", "aws"],
        projects: [],
        internships: [],
        certifications: [],
      });
    } finally {
      setLoading(false);
    }
  }, [activeEmail, apiUrl, authUser?.displayName]);

  useEffect(() => {
    loadStudentProfile();
  }, [loadStudentProfile]);

  return (
    <div className="voice-page-wrapper">
      <div className="container" style={{ maxWidth: "1150px", padding: "32px 24px 80px" }}>
        {/* Navigation Header */}
        <header className="header" style={{ marginBottom: "28px" }}>
          <div className="brand">
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div className="brand-icon" style={{ background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)" }}>
                📚
              </div>
              <div className="brand-text">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h1 style={{ fontSize: "1.25rem", margin: 0, color: "var(--text-main)" }}>MirrorMind Knowledge Vault</h1>
                  <span className="version-pill" style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc" }}>
                    RAG Engine
                  </span>
                </div>
                <p style={{ fontSize: "0.78rem", margin: 0, color: "var(--text-muted)" }}>
                  Verified Document Intelligence &amp; Multi-Tenant Atlas Vector Search
                </p>
              </div>
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Atlas Vector Status Indicator */}
            <div
              className={`status-badge ${dbStatus === "connected" ? "connected" : "connecting"}`}
              title="MongoDB Atlas Vector Search Status"
            >
              <span className="pulse-dot"></span>
              <span>{dbStatus === "connected" ? "Atlas Vector Search: Live" : "Vector DB: Syncing"}</span>
            </div>

            {/* Voice AI Link */}
            <Link
              href="/voice-chat"
              className="secondary-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none",
                padding: "6px 14px",
                fontSize: "0.82rem",
                borderRadius: "20px",
                color: "#38bdf8",
              }}
            >
              <span>🎙️</span>
              <span>Voice AI</span>
            </Link>

            {/* Return to Dashboard */}
            <Link
              href="/"
              className="primary-button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none",
                padding: "6px 16px",
                fontSize: "0.82rem",
                borderRadius: "20px",
              }}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        {loading ? (
          <div style={{ padding: "80px", textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚡</div>
            Loading Knowledge Vault &amp; Vector Index...
          </div>
        ) : student ? (
          <KnowledgeVault student={student} apiUrl={apiUrl} />
        ) : null}
      </div>
    </div>
  );
}
