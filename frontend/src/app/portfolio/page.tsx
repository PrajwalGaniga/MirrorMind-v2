"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { StudentProfile } from "@/types/student";

type TemplateType = "editorial" | "cyberpunk" | "brutalist" | "modernist";

export default function PortfolioPage() {
  const { user: authUser, mongoUser, logout } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("editorial");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchProfile = useCallback(async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/student/profile/${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    const email = authUser?.email || "prajwal.seed@mirrormind.ai";
    fetchProfile(email);
  }, [authUser, fetchProfile]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadHTML = () => {
    if (!student) return;
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${student.name} | Portfolio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F2F1E8; color: #171817; margin: 0; padding: 40px 20px; display: flex; justify-content: center; }
    .portfolio-card { max-width: 900px; width: 100%; background: #FAFAF7; border-radius: 32px; padding: 48px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); }
    h1 { font-size: 2.2rem; margin: 0 0 8px; }
    .badge { display: inline-block; background: #F7D45B; color: #292A29; font-weight: 700; padding: 4px 12px; border-radius: 999px; font-size: 0.8rem; margin-bottom: 20px; }
    .skill-pill { display: inline-block; background: #F0F0EC; padding: 6px 14px; border-radius: 999px; margin: 4px; font-size: 0.85rem; }
    .project-card { background: #F0F0EC; border-radius: 18px; padding: 20px; margin-top: 14px; }
  </style>
</head>
<body>
  <div class="portfolio-card">
    <span class="badge">${student.top_prediction || "Software Engineer"}</span>
    <h1>${student.name}</h1>
    <p>${student.branch} • CGPA: ${student.cgpa} • ${student.college_name || ""}</p>
    <hr style="border: 0; border-top: 1px solid #D8D9D3; margin: 24px 0;" />
    <h2>Technical Skills</h2>
    <div>${student.skills.map((s) => `<span class="skill-pill">${s}</span>`).join(" ")}</div>
    <h2 style="margin-top: 32px;">Projects</h2>
    ${student.projects.map((p) => `<div class="project-card"><h3>${p.title}</h3><p>${p.description}</p><small>Stack: ${p.tech_stack.join(", ")}</small></div>`).join("")}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${student.name.toLowerCase().replace(/\s+/g, "_")}_portfolio.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Generating Portfolio Preview...</h2>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>Student Profile not found</h2>
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
        {/* Template Selector & Action Toolbar */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-card)",
            padding: "20px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* Template Choice Tabs */}
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
              Select Design Template
            </div>
            <div style={{ display: "inline-flex", background: "var(--surface-soft)", padding: "4px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-subtle)", gap: "4px" }}>
              {[
                { id: "editorial", label: "Minimal Editorial", badge: "Warm Ivory" },
                { id: "cyberpunk", label: "Glassmorphic Cyber", badge: "Obsidian" },
                { id: "brutalist", label: "Neo-Brutalist", badge: "Monospace" },
                { id: "modernist", label: "Clean Modernist", badge: "Linear" },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id as any)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    border: "none",
                    background: selectedTemplate === tmpl.id ? "var(--charcoal)" : "transparent",
                    color: selectedTemplate === tmpl.id ? "#FFFFFF" : "var(--text-secondary)",
                    fontWeight: selectedTemplate === tmpl.id ? 600 : 500,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.18s ease",
                  }}
                >
                  <span>{tmpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={handleCopyLink}
              style={{
                background: "var(--surface-soft)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-pill)",
                padding: "8px 16px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copiedLink ? "✓ Link Copied!" : "🔗 Share Link"}
            </button>

            <button
              onClick={handleDownloadHTML}
              style={{
                background: "var(--charcoal)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-pill)",
                padding: "8px 18px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(41, 42, 41, 0.2)",
              }}
            >
              ⬇️ Export Standalone HTML
            </button>
          </div>
        </div>

        {/* Live Template Render Canvas */}
        <div style={{ width: "100%" }}>
          {/* TEMPLATE 1: MINIMAL EDITORIAL (Warm Ivory & Charcoal - UI_reference.md style) */}
          {selectedTemplate === "editorial" && (
            <div
              style={{
                background: "#FAFAF7",
                borderRadius: "32px",
                padding: "48px 56px",
                border: "1px solid #D8D9D3",
                boxShadow: "0 16px 40px -10px rgba(41, 42, 41, 0.08)",
                color: "#171817",
                maxWidth: "960px",
                margin: "0 auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div>
                  <span
                    style={{
                      background: "#F7D45B",
                      color: "#292A29",
                      padding: "4px 14px",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      display: "inline-block",
                      marginBottom: "12px",
                    }}
                  >
                    {student.top_prediction ? student.top_prediction.replace(/_/g, " ") : "SOFTWARE ENGINEER"}
                  </span>
                  <h1 style={{ fontSize: "2.5rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
                    {student.name}
                  </h1>
                  <p style={{ fontSize: "1rem", color: "#5F605C", margin: "8px 0 0" }}>
                    {student.branch} • {student.college_name || "National Institute of Technology Karnataka"}
                  </p>
                </div>

                {student.avatar_url && (
                  <div style={{ width: "96px", height: "96px", borderRadius: "50%", overflow: "hidden", border: "2px solid #F7D45B" }}>
                    <Image
                      src={student.avatar_url}
                      alt={student.name}
                      width={96}
                      height={96}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      unoptimized={student.avatar_url.startsWith("http")}
                    />
                  </div>
                )}
              </div>

              {/* Bio & CGPA Pill */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "36px" }}>
                <span style={{ background: "#292A29", color: "#FFFFFF", padding: "6px 16px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 600 }}>
                  CGPA: {student.cgpa.toFixed(1)} / 10.0
                </span>
                <span style={{ background: "#F0F0EC", color: "#171817", padding: "6px 16px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 600 }}>
                  Semester {student.semester}
                </span>
                {student.github_url && (
                  <a href={student.github_url} target="_blank" rel="noopener noreferrer" style={{ color: "#5F605C", textDecoration: "none", fontSize: "0.82rem", fontWeight: 600 }}>
                    GitHub ↗
                  </a>
                )}
              </div>

              {/* Technical Skills */}
              <div style={{ marginBottom: "40px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5F605C", marginBottom: "12px" }}>
                  Verified Skills
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {student.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        background: "#F0F0EC",
                        color: "#171817",
                        padding: "6px 16px",
                        borderRadius: "999px",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div style={{ marginBottom: "40px" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5F605C", marginBottom: "16px" }}>
                  Selected Engineering Projects
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {student.projects.map((proj) => (
                    <div
                      key={proj.title}
                      style={{
                        background: "#F0F0EC",
                        borderRadius: "20px",
                        padding: "24px 28px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{proj.title}</h4>
                        {proj.github_url && (
                          <a href={proj.github_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8rem", color: "#292A29", fontWeight: 600 }}>
                            View Code ↗
                          </a>
                        )}
                      </div>
                      <p style={{ fontSize: "0.88rem", color: "#5F605C", margin: "8px 0 14px", lineHeight: "1.5" }}>
                        {proj.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {proj.tech_stack.map((t) => (
                          <span
                            key={t}
                            style={{
                              background: "#FAFAF7",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.76rem",
                              fontWeight: 600,
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

              {/* Work Experience */}
              {student.internships.length > 0 && (
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5F605C", marginBottom: "16px" }}>
                    Work Experience
                  </h3>
                  {student.internships.map((intern) => (
                    <div key={intern.company_name} style={{ borderLeft: "2px solid #F7D45B", paddingLeft: "16px", marginBottom: "16px" }}>
                      <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                        {intern.role} <span style={{ fontWeight: 400, color: "#5F605C" }}>@ {intern.company_name}</span>
                      </h4>
                      <p style={{ margin: "4px 0", fontSize: "0.84rem", color: "#5F605C" }}>
                        {intern.description}
                      </p>
                      <small style={{ color: "#898A84" }}>{intern.start_date || "2026"} - {intern.end_date || "Present"}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TEMPLATE 2: DARK GLASSMORPHIC CYBER */}
          {selectedTemplate === "cyberpunk" && (
            <div
              style={{
                background: "#080c14",
                borderRadius: "32px",
                padding: "48px 56px",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(6, 182, 212, 0.15)",
                color: "#f8fafc",
                maxWidth: "960px",
                margin: "0 auto",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                <div>
                  <span
                    style={{
                      background: "rgba(6, 182, 212, 0.15)",
                      color: "#38bdf8",
                      border: "1px solid rgba(6, 182, 212, 0.4)",
                      padding: "4px 14px",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      display: "inline-block",
                      marginBottom: "12px",
                    }}
                  >
                    ⚡ {student.top_prediction || "AI ENGINEER"}
                  </span>
                  <h1 style={{ fontSize: "2.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em", color: "#ffffff" }}>
                    {student.name}
                  </h1>
                  <p style={{ fontSize: "0.95rem", color: "#94a3b8", margin: "6px 0 0" }}>
                    {student.branch} • CGPA: {student.cgpa}
                  </p>
                </div>

                {student.avatar_url && (
                  <div style={{ width: "90px", height: "90px", borderRadius: "50%", overflow: "hidden", border: "2px solid #38bdf8", boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" }}>
                    <Image
                      src={student.avatar_url}
                      alt={student.name}
                      width={90}
                      height={90}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      unoptimized={student.avatar_url.startsWith("http")}
                    />
                  </div>
                )}
              </div>

              {/* Skills */}
              <div style={{ marginBottom: "36px" }}>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "#38bdf8", marginBottom: "12px", letterSpacing: "0.08em" }}>
                  Neural Stack
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {student.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        color: "#e2e8f0",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        fontSize: "0.84rem",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h3 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "#38bdf8", marginBottom: "16px", letterSpacing: "0.08em" }}>
                  Deployments &amp; Repositories
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {student.projects.map((proj) => (
                    <div
                      key={proj.title}
                      style={{
                        background: "rgba(18, 24, 38, 0.75)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "18px",
                        padding: "20px 24px",
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: "1.05rem", color: "#ffffff" }}>{proj.title}</h4>
                      <p style={{ fontSize: "0.84rem", color: "#94a3b8", margin: "6px 0 12px" }}>
                        {proj.description}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {proj.tech_stack.map((t) => (
                          <span
                            key={t}
                            style={{
                              fontSize: "0.72rem",
                              background: "rgba(6, 182, 212, 0.1)",
                              color: "#38bdf8",
                              border: "1px solid rgba(6, 182, 212, 0.25)",
                              padding: "2px 8px",
                              borderRadius: "6px",
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
            </div>
          )}

          {/* TEMPLATE 3: NEO-BRUTALIST TECH */}
          {selectedTemplate === "brutalist" && (
            <div
              style={{
                background: "#fef08a",
                borderRadius: "12px",
                padding: "48px 56px",
                border: "3px solid #000000",
                boxShadow: "8px 8px 0px #000000",
                color: "#000000",
                maxWidth: "960px",
                margin: "0 auto",
                fontFamily: "monospace",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <span style={{ background: "#000000", color: "#ffffff", padding: "4px 12px", fontSize: "0.85rem", fontWeight: 700 }}>
                    ROLE: {student.top_prediction || "ENGINEER"}
                  </span>
                  <h1 style={{ fontSize: "2.4rem", fontWeight: 900, margin: "12px 0 4px" }}>
                    {student.name}
                  </h1>
                  <p style={{ margin: 0, fontSize: "0.95rem" }}>
                    {student.branch} // CGPA: {student.cgpa}
                  </p>
                </div>
              </div>

              <div style={{ border: "2px solid #000000", background: "#ffffff", padding: "20px", marginBottom: "24px", boxShadow: "4px 4px 0px #000000" }}>
                <h3 style={{ margin: "0 0 12px", textTransform: "uppercase" }}>[SKILLS_INDEX]</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {student.skills.map((s) => (
                    <span key={s} style={{ background: "#000000", color: "#ffffff", padding: "4px 10px", fontSize: "0.8rem", fontWeight: 700 }}>
                      {s.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ border: "2px solid #000000", background: "#ffffff", padding: "20px", boxShadow: "4px 4px 0px #000000" }}>
                <h3 style={{ margin: "0 0 16px", textTransform: "uppercase" }}>[PROJECTS_LOG]</h3>
                {student.projects.map((p) => (
                  <div key={p.title} style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px dashed #000000" }}>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{p.title}</h4>
                    <p style={{ fontSize: "0.85rem", margin: "4px 0" }}>{p.description}</p>
                    <small>STACK: {p.tech_stack.join(" | ")}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEMPLATE 4: CLEAN MODERNIST */}
          {selectedTemplate === "modernist" && (
            <div
              style={{
                background: "#ffffff",
                borderRadius: "28px",
                padding: "48px 56px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)",
                color: "#0f172a",
                maxWidth: "960px",
                margin: "0 auto",
              }}
            >
              <div style={{ marginBottom: "36px" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b" }}>
                  Engineering Portfolio
                </span>
                <h1 style={{ fontSize: "2.4rem", fontWeight: 700, margin: "6px 0 8px", letterSpacing: "-0.03em" }}>
                  {student.name}
                </h1>
                <p style={{ color: "#475569", fontSize: "1rem", margin: 0 }}>
                  {student.branch} student focusing on {student.top_prediction ? student.top_prediction.replace(/_/g, " ").toLowerCase() : "software engineering"}.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px", marginBottom: "36px" }}>
                {student.projects.map((proj) => (
                  <div
                    key={proj.title}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "18px",
                      padding: "20px",
                      background: "#f8fafc",
                    }}
                  >
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 600, margin: "0 0 6px" }}>{proj.title}</h4>
                    <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 12px", lineHeight: "1.5" }}>
                      {proj.description}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {proj.tech_stack.map((t) => (
                        <span key={t} style={{ fontSize: "0.72rem", background: "#ffffff", border: "1px solid #e2e8f0", padding: "2px 8px", borderRadius: "4px" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#64748b", marginBottom: "12px" }}>
                  Core Competencies
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {student.skills.map((s) => (
                    <span key={s} style={{ background: "#f1f5f9", padding: "4px 12px", borderRadius: "999px", fontSize: "0.82rem", color: "#334155" }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
