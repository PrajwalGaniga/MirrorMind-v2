"use client";

import React from "react";
import Image from "next/image";
import { StudentProfile } from "@/types/student";

interface StudentDossierProps {
  student: StudentProfile;
  onEditProfile: () => void;
}

export const StudentDossier: React.FC<StudentDossierProps> = ({
  student,
  onEditProfile,
}) => {
  return (
    <div className="dossier-container">
      {/* Top Profile Card */}
      <div className="dossier-hero-card">
        <div className="dossier-user-row">
          <div className="dossier-avatar-box">
            {student.avatar_url ? (
              <Image
                src={student.avatar_url}
                alt={student.name}
                width={72}
                height={72}
                className="dossier-avatar"
                unoptimized={student.avatar_url.startsWith("http")}
              />
            ) : (
              <div className="dossier-avatar-fallback">
                {student.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="dossier-user-details">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 className="dossier-name">{student.name}</h2>
              <span className="badge-tier">{student.college_tier || "Tier-2"}</span>
              <span className="badge-branch">{student.branch}</span>
            </div>

            <p className="dossier-meta">
              <span>{student.email}</span>
              {student.phone && <span>• {student.phone}</span>}
              {student.college_name && <span>• {student.college_name}</span>}
            </p>

            <div className="dossier-links">
              {student.github_url && (
                <a
                  href={student.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-chip"
                >
                  🐙 GitHub
                </a>
              )}
              {student.linkedin_url && (
                <a
                  href={student.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-chip"
                >
                  💼 LinkedIn
                </a>
              )}
              {student.resume_url && (
                <a
                  href={student.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-chip resume-chip"
                >
                  📄 Resume PDF (Cloudinary) ↗
                </a>
              )}
            </div>
          </div>

          <button onClick={onEditProfile} className="secondary-button edit-btn">
            ✏️ Edit Dossier
          </button>
        </div>

        {/* Academic Scorecard Row */}
        <div className="academic-scorecard-grid">
          <div className="scorecard-item">
            <span className="score-val">{student.cgpa.toFixed(1)}</span>
            <span className="score-lbl">Cumulative GPA (CGPA)</span>
          </div>
          <div className="scorecard-item">
            <span className="score-val">Semester {student.semester}</span>
            <span className="score-lbl">Current Academic Level</span>
          </div>
          <div className="scorecard-item">
            <span className="score-val">
              {student.backlog_count === 0 ? "0 (Clean)" : `${student.backlog_count} Active`}
            </span>
            <span className="score-lbl">Backlog Status</span>
          </div>
          <div className="scorecard-item">
            <span className="score-val" style={{ textTransform: "capitalize" }}>
              {student.work_style_pref}
            </span>
            <span className="score-lbl">Work Preference</span>
          </div>
        </div>
      </div>

      {/* Skills Inventory */}
      <div className="dossier-card">
        <div className="dossier-card-title">
          <span>🛠️ Verified Technical Skills ({student.skills.length})</span>
        </div>
        <div className="skills-cloud">
          {student.skills.map((skill) => (
            <span key={skill} className="skill-pill-readonly">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Projects Showcase */}
      <div className="dossier-card">
        <div className="dossier-card-title">
          <span>💻 Engineering Projects ({student.projects.length})</span>
        </div>

        {student.projects.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No projects listed.</p>
        ) : (
          <div className="projects-grid">
            {student.projects.map((proj, idx) => (
              <div key={proj.id || idx} className="project-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <h4 className="project-title">{proj.title}</h4>
                  {proj.github_url && (
                    <a
                      href={proj.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="proj-link-icon"
                      title="View GitHub Repository"
                    >
                      ↗
                    </a>
                  )}
                </div>

                <p className="project-desc">{proj.description}</p>

                <div className="proj-tech-stack">
                  {proj.tech_stack.map((t) => (
                    <span key={t} className="tech-chip">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Internships & Work Experience */}
      <div className="dossier-card">
        <div className="dossier-card-title">
          <span>💼 Work Experience &amp; Internships ({student.internships.length})</span>
        </div>

        {student.internships.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No internships listed.</p>
        ) : (
          <div className="internships-list">
            {student.internships.map((intern, idx) => (
              <div key={intern.id || idx} className="internship-item-box">
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "6px" }}>
                  <div>
                    <h4 className="intern-company">{intern.company_name}</h4>
                    <div className="intern-role">
                      {intern.role} {intern.domain && <span>&bull; {intern.domain}</span>}
                    </div>
                  </div>
                  {(intern.start_date || intern.end_date) && (
                    <span className="intern-dates">
                      {intern.start_date || "Past"} &mdash; {intern.end_date || "Present"}
                    </span>
                  )}
                </div>

                {intern.description && (
                  <p className="intern-desc">{intern.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
