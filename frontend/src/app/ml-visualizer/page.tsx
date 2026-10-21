"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { MLPipelineVisualizer } from "@/components/MLPipelineVisualizer";
import { StudentProfile, PredictResponse } from "@/types/student";

export default function MLVisualizerPage() {
  const { user: authUser, mongoUser, logout } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mirrormind-backend-z9vb.onrender.com";
  const activeEmail =
    authUser?.email ||
    mongoUser?.email ||
    "prajwal.seed@mirrormind.ai";

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(activeEmail)}`);
      if (res.ok) {
        const data: StudentProfile = await res.json();
        setStudent(data);

        if (data.predictions && data.predictions.length > 0) {
          const top = data.predictions[0];
          setPrediction({
            profile_text: `Engineering student with skills in ${data.skills.join(", ")}. CGPA ${data.cgpa}. Completed ${data.projects.length} projects and ${data.internships.length} internship(s).`,
            top_prediction: data.top_prediction || top.role,
            top_label: top.label,
            confidence: top.confidence,
            predictions: data.predictions,
            top_insight: data.top_insight,
            skill_radar: data.skill_radar,
            embedding_dim: 384,
          });
        } else {
          // Trigger initial prediction
          await runRecalculation(data);
        }
      } else {
        // Fallback demo data
        const fallbackStudent: StudentProfile = {
          name: authUser?.displayName || "Engineering Student",
          email: activeEmail,
          college_tier: "Tier-1",
          branch: "Computer Science & Engineering",
          semester: 7,
          cgpa: 8.8,
          backlog_count: 0,
          communication_rating: 4,
          work_style_pref: "hybrid",
          skills: ["python", "fastapi", "docker", "pytorch", "mongodb", "aws", "react", "typescript"],
          projects: [
            {
              title: "Autonomous Agentic Copilot",
              description: "Full-stack AI assistant with real-time audio and vector intelligence.",
              tech_stack: ["Python", "PyTorch", "FastAPI", "Next.js"],
              live_demo_url: "https://mirrormind.ai",
              github_url: "https://github.com/PrajwalGaniga/MirrorMind-v2",
            },
          ],
          internships: [],
          certifications: [],
        };
        setStudent(fallbackStudent);
        await runRecalculation(fallbackStudent);
      }
    } catch (err) {
      console.error("Failed to load profile for ML visualizer:", err);
      setBackendOnline(false);
    } finally {
      setLoading(false);
    }
  }, [activeEmail, apiUrl, authUser?.displayName]);

  const runRecalculation = async (prof: StudentProfile) => {
    setCalculating(true);
    try {
      const res = await fetch(`${apiUrl}/api/ml/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: prof.email,
          skills: prof.skills,
          cgpa: prof.cgpa,
          projects_count: prof.projects.length,
          internships_count: prof.internships.length,
        }),
      });

      if (res.ok) {
        const pred: PredictResponse = await res.json();
        setPrediction(pred);
        setBackendOnline(true);
      }
    } catch (err) {
      console.error("ML prediction execution error:", err);
      setBackendOnline(false);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="editorial-page-container">
      <Navbar
        studentName={student?.name || authUser?.displayName || "Student"}
        studentEmail={activeEmail}
        backendOnline={backendOnline}
        onLogout={logout}
      />

      <div style={{ marginTop: "24px" }}>
        {/* Header Bar */}
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
              <span>🔬</span> Deep Neural Architecture
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
              PyTorch Career Inference Pipeline
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
              Step through the multi-stage neural network that vectorizes your career portfolio,
              applies deep feedforward classification, and generates 5-pillar skill distributions.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <Link
              href="/ml-visualizer/developer"
              className="editorial-action-btn"
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #292A29 0%, #171817 100%)",
                color: "#F7D45B",
                fontSize: "0.85rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "1.5px solid rgba(247, 212, 91, 0.5)",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
                transition: "all 0.2s ease",
              }}
            >
              <span>🔬</span>
              <span>Developer Mode: Live Pipeline Lab</span>
            </Link>

            <button
              onClick={() => student && runRecalculation(student)}
              disabled={calculating || loading}
              className="editorial-action-btn primary"
              style={{
                padding: "10px 20px",
                borderRadius: "999px",
                background: "var(--charcoal)",
                color: "#FFFFFF",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: calculating ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                border: "none",
                transition: "all 0.2s ease",
              }}
            >
              <span>{calculating ? "⏳" : "⚡"}</span>
              <span>{calculating ? "Inferencing Pipeline..." : "Re-run Inference"}</span>
            </button>
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
            <div style={{ fontWeight: 600, color: "var(--charcoal)" }}>Loading PyTorch Neural Model &amp; Student Weights...</div>
            <div style={{ fontSize: "0.82rem", marginTop: "4px" }}>Querying MongoDB Atlas cache for pre-computed vectors</div>
          </div>
        ) : (
          <MLPipelineVisualizer prediction={prediction} student={student} />
        )}
      </div>
    </div>
  );
}
