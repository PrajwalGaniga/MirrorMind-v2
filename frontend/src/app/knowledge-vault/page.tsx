"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
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
    <div className="editorial-page-container">
      <Navbar
        studentName={student?.name || authUser?.displayName || "Student"}
        studentEmail={activeEmail}
        backendOnline={dbStatus === "connected"}
      />

      <div style={{ marginTop: "24px" }}>
        {/* Editorial Subheader */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
            paddingBottom: "18px",
            borderBottom: "1px solid rgba(41, 42, 41, 0.08)",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: "rgba(247, 212, 91, 0.35)",
                fontSize: "0.74rem",
                fontWeight: 700,
                color: "var(--charcoal)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "8px",
              }}
            >
              <span>📚</span> Grounded Multi-Tenant RAG
            </div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                color: "var(--charcoal)",
                margin: "0 0 6px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Knowledge Vault &amp; Vector Explorer
            </h1>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--charcoal-muted)",
                margin: 0,
                maxWidth: "680px",
                lineHeight: 1.5,
              }}
            >
              Ingest verified academic transcripts, project reports, and certificates. Extracted OCR chunks are vectorized into MongoDB Atlas for hallucination-free retrieval by your AI Copilot.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "999px",
                background: dbStatus === "connected" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                color: dbStatus === "connected" ? "#059669" : "#d97706",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: dbStatus === "connected" ? "#10B981" : "#F59E0B",
                }}
              />
              <span>{dbStatus === "connected" ? "Atlas Vector Search: Live" : "Vector DB: Syncing"}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div
            style={{
              padding: "80px 20px",
              textAlign: "center",
              color: "var(--charcoal-muted)",
              background: "#FFFFFF",
              borderRadius: "var(--radius-card)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>⚡</div>
            <div style={{ fontWeight: 600, color: "var(--charcoal)" }}>Loading Knowledge Vault &amp; Vector Index...</div>
            <div style={{ fontSize: "0.82rem", marginTop: "4px" }}>Synchronizing indexed chunks from MongoDB Atlas</div>
          </div>
        ) : student ? (
          <KnowledgeVault student={student} apiUrl={apiUrl} />
        ) : null}
      </div>
    </div>
  );
}
