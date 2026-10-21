"use client";

import React, { useState } from "react";
import { useLabStore } from "@/lib/lab/store";
import { TraceResponse } from "@/types/trace";

interface CustomSandboxModalProps {
  onCustomTraceLoaded: (trace: TraceResponse) => void;
  onClose: () => void;
}

export const CustomSandboxModal: React.FC<CustomSandboxModalProps> = ({
  onCustomTraceLoaded,
  onClose,
}) => {
  const [skillsInput, setSkillsInput] = useState<string>(
    "Python, PyTorch, FastAPI, React, Docker, PostgreSQL, Machine Learning"
  );
  const [cgpa, setCgpa] = useState<number>(8.8);
  const [projectsCount, setProjectsCount] = useState<number>(4);
  const [internshipsCount, setInternshipsCount] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (skills.length === 0) {
      setErrorMsg("Please enter at least one skill.");
      setLoading(false);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://mirrormind-backend-z9vb.onrender.com";
      const res = await fetch(`${apiUrl}/api/ml/trace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          cgpa,
          projects_count: projectsCount,
          internships_count: internshipsCount,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error: ${res.statusText}`);
      }

      const traceData: TraceResponse = await res.json();
      onCustomTraceLoaded(traceData);
      onClose();
    } catch (err: any) {
      console.error("Custom trace fetch failed:", err);
      setErrorMsg(err.message || "Failed to execute pipeline trace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="custom-modal-backdrop" onClick={onClose}>
      <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>🧪 Custom Profile Sandbox</h3>
            <p className="modal-sub">
              Compose any custom technical dossier to observe its real-time 30-second neural traversal.
            </p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="custom-form">
          <div className="form-group">
            <label>Skills Feature Array (comma-separated):</label>
            <textarea
              rows={3}
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. Python, React, PyTorch, Docker, Kubernetes, SQL"
              className="custom-textarea"
              required
            />
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label>CGPA (0 - 10):</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={cgpa}
                onChange={(e) => setCgpa(parseFloat(e.target.value) || 7.5)}
                className="custom-input"
              />
            </div>

            <div className="form-group">
              <label>Completed Projects:</label>
              <input
                type="number"
                min="0"
                max="20"
                value={projectsCount}
                onChange={(e) => setProjectsCount(parseInt(e.target.value, 10) || 0)}
                className="custom-input"
              />
            </div>

            <div className="form-group">
              <label>Internships:</label>
              <input
                type="number"
                min="0"
                max="10"
                value={internshipsCount}
                onChange={(e) => setInternshipsCount(parseInt(e.target.value, 10) || 0)}
                className="custom-input"
              />
            </div>
          </div>

          {errorMsg && <div className="modal-error-pill">{errorMsg}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Running PyTorch Trace..." : "Launch Lab Replay 🚀"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
