"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { StudentProfile, UserDocumentItem, CitationSourceItem, RAGQueryResponseData } from "@/types/student";

interface KnowledgeVaultProps {
  student: StudentProfile;
  apiUrl: string;
}

const CATEGORY_OPTIONS = [
  { value: "certificate", label: "🎓 Course / Skill Certificate", desc: "Coursera, AWS, Udemy, Hackathons" },
  { value: "resume", label: "📄 Resume / CV", desc: "Detailed work history and achievements" },
  { value: "transcript", label: "📑 Academic Transcript / Grade Card", desc: "Semester marks and university grades" },
  { value: "project_report", label: "📊 Capstone / Project Report", desc: "System design, schemas, and algorithms" },
  { value: "lor", label: "✉️ Letter of Recommendation (LoR)", desc: "Performance & qualitative evaluations" },
  { value: "other", label: "📁 Other Career Document", desc: "Miscellaneous verified credentials" },
];

export const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({ student, apiUrl }) => {
  // Document Management State
  const [documents, setDocuments] = useState<UserDocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("certificate");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // RAG Q&A State
  const [queryText, setQueryText] = useState<string>("");
  const [querying, setQuerying] = useState<boolean>(false);
  const [ragResult, setRagResult] = useState<RAGQueryResponseData | null>(null);
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch registered documents for this student
  const fetchDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${apiUrl}/api/rag/documents?user_id=${encodeURIComponent(student.email)}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  }, [apiUrl, student.email]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle Document Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadStatus("Uploading & extracting text (PyPDF / Gemini Vision OCR)...");

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("user_id", student.email);
    formData.append("category", selectedCategory);

    try {
      setUploadStatus("Generating 384-D dense embeddings & indexing in Atlas Vector Search...");
      const res = await fetch(`${apiUrl}/api/rag/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload failed");
      }

      setUploadStatus("Document embedded and indexed successfully!");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchDocuments();

      setTimeout(() => setUploadStatus(""), 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle Document Deletion
  const handleDeleteDocument = async (docId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete '${filename}' and purge its vector chunks from Atlas?`)) {
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/rag/documents/${docId}?user_id=${encodeURIComponent(student.email)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchDocuments();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Handle Grounded RAG Query
  const handleExecuteQuery = async (questionToAsk?: string) => {
    const q = questionToAsk || queryText;
    if (!q.trim()) return;

    setQuerying(true);
    setRagResult(null);

    try {
      const res = await fetch(`${apiUrl}/api/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.trim(),
          user_id: student.email,
          top_k: 5,
        }),
      });

      if (res.ok) {
        const data: RAGQueryResponseData = await res.json();
        setRagResult(data);
      } else {
        const err = await res.json();
        alert(`RAG Query failed: ${err.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Query error:", err);
    } finally {
      setQuerying(false);
    }
  };

  const totalChunks = documents.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Header Banner */}
      <div className="dossier-hero-card" style={{ padding: "24px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.6rem" }}>📚</span>
              <h2 style={{ fontSize: "1.35rem", margin: 0 }}>Grounded Knowledge Vault &amp; Vector Intelligence</h2>
              <span className="badge-tier" style={{ background: "rgba(6, 182, 212, 0.2)", color: "#06b6d4" }}>
                MongoDB Atlas Vector Search
              </span>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "6px", maxWidth: "780px", lineHeight: "1.5" }}>
              Dual-source grounding engine combining your verified student record with exact text chunks extracted from uploaded
              certificates, transcripts, and project reports with strict user-level vector isolation.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <div className="metric-box" style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.04)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>Vault Docs</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-main)" }}>{documents.length}</div>
            </div>
            <div className="metric-box" style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.04)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", textTransform: "uppercase" }}>384-D Chunks</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent-cyan)" }}>{totalChunks}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Dropzone on Left, Documents Table on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "24px" }}>
        {/* Left Column: Upload New Artifact */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>📤</span>
            <h3 style={{ fontSize: "1.05rem", margin: 0 }}>Ingest Document / Certificate</h3>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Upload PDFs or certificate images. Scanned files are automatically transcribed with Gemini Vision OCR.
          </p>

          <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Category Selector */}
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", display: "block", marginBottom: "6px" }}>
                Document Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-color)",
                  color: "#fff",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ background: "#090d16", color: "#fff" }}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* File Dropzone */}
            <div
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "14px",
                padding: "24px 16px",
                textAlign: "center",
                background: uploadFile ? "rgba(6, 182, 212, 0.05)" : "rgba(255, 255, 255, 0.02)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>
                {uploadFile ? "📄" : "📁"}
              </div>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-main)" }}>
                {uploadFile ? uploadFile.name : "Click to browse or drop file here"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "4px" }}>
                {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : "Supports PDF, PNG, JPG, or Scanned Certificates"}
              </div>
            </div>

            {/* Status Message */}
            {uploadStatus && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                  background: uploadStatus.includes("Error") ? "rgba(239, 68, 68, 0.15)" : "rgba(6, 182, 212, 0.15)",
                  color: uploadStatus.includes("Error") ? "#f87171" : "#38bdf8",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {uploadStatus}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="primary-button"
              style={{
                padding: "10px 16px",
                fontSize: "0.88rem",
                borderRadius: "10px",
                opacity: !uploadFile || uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "⚡ Indexing into Atlas..." : "📥 Ingest & Generate Embeddings"}
            </button>
          </form>
        </div>

        {/* Right Column: Registered Documents Table */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>📑</span>
              <h3 style={{ fontSize: "1.05rem", margin: 0 }}>Indexed Vault Documents ({documents.length})</h3>
            </div>
            <button
              onClick={fetchDocuments}
              className="secondary-button"
              style={{ padding: "4px 10px", fontSize: "0.75rem" }}
            >
              🔄 Refresh
            </button>
          </div>

          {loadingDocs ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Loading indexed documents...
            </div>
          ) : documents.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 16px",
                textAlign: "center",
                border: "1px dashed var(--border-color)",
                borderRadius: "12px",
                color: "var(--text-subtle)",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📭</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>No Documents Ingested Yet</div>
              <div style={{ fontSize: "0.78rem", maxWidth: "300px", marginTop: "4px" }}>
                Upload your course certificates, semester transcripts, or capstone project reports to ground the AI mentor.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-subtle)" }}>
                    <th style={{ padding: "8px 10px" }}>Document</th>
                    <th style={{ padding: "8px 10px" }}>Category</th>
                    <th style={{ padding: "8px 10px" }}>Chunks</th>
                    <th style={{ padding: "8px 10px" }}>Status</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => {
                    const docId = doc.id || doc._id || "";
                    return (
                      <tr
                        key={docId}
                        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)", transition: "background 0.2s" }}
                      >
                        <td style={{ padding: "10px", fontWeight: 600, color: "var(--text-main)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>📄</span>
                            <span title={doc.filename} style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {doc.filename}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", marginTop: "2px" }}>
                            {(doc.file_size / 1024).toFixed(0)} KB • {doc.page_count} page(s)
                          </div>
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              background:
                                doc.category === "certificate"
                                  ? "rgba(168, 85, 247, 0.15)"
                                  : doc.category === "project_report"
                                  ? "rgba(6, 182, 212, 0.15)"
                                  : "rgba(99, 102, 241, 0.15)",
                              color:
                                doc.category === "certificate"
                                  ? "#c084fc"
                                  : doc.category === "project_report"
                                  ? "#38bdf8"
                                  : "#818cf8",
                            }}
                          >
                            {doc.category}
                          </span>
                        </td>
                        <td style={{ padding: "10px", color: "var(--accent-cyan)", fontWeight: 600 }}>
                          {doc.chunk_count}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{ color: "#34d399", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399" }}></span>
                            {doc.embedding_status}
                          </span>
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <button
                            onClick={() => handleDeleteDocument(docId, doc.filename)}
                            className="secondary-button"
                            style={{
                              padding: "4px 8px",
                              fontSize: "0.72rem",
                              color: "#f87171",
                              borderColor: "rgba(239, 68, 68, 0.3)",
                            }}
                            title="Delete document and purge vectors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Grounded RAG Chat Console */}
      <div className="glass-card" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.3rem" }}>🔍</span>
            <div>
              <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Grounded Intelligence Q&amp;A</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                Ask specific questions about your academic credentials, verified skills, and project reports.
              </p>
            </div>
          </div>
          <span className="badge-branch" style={{ fontSize: "0.72rem" }}>
            Anti-Hallucination Guardrails Active
          </span>
        </div>

        {/* Suggested Queries Chips */}
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
            Quick Suggested Inquiries
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                setQueryText("What certifications do I have and what specific skills did they validate?");
                handleExecuteQuery("What certifications do I have and what specific skills did they validate?");
              }}
              className="prompt-chip"
            >
              🎓 "What certifications do I have and what skills did they validate?"
            </button>
            <button
              onClick={() => {
                setQueryText("Do my capstone projects or certificates cover Docker, Kubernetes, or cloud caching?");
                handleExecuteQuery("Do my capstone projects or certificates cover Docker, Kubernetes, or cloud caching?");
              }}
              className="prompt-chip"
            >
              🐳 "Do my projects cover Docker, Kubernetes, or cloud caching?"
            </button>
            <button
              onClick={() => {
                setQueryText("Am I eligible for a DevOps or Cloud Engineer role based on my certificates and CGPA?");
                handleExecuteQuery("Am I eligible for a DevOps or Cloud Engineer role based on my certificates and CGPA?");
              }}
              className="prompt-chip"
            >
              ☁️ "Am I eligible for a DevOps or Cloud Engineer role?"
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="Ask a question about your certificates, projects, or grades..."
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !querying) handleExecuteQuery();
            }}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-color)",
              color: "#fff",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleExecuteQuery()}
            disabled={!queryText.trim() || querying}
            className="primary-button"
            style={{
              padding: "12px 24px",
              fontSize: "0.9rem",
              borderRadius: "12px",
              opacity: !queryText.trim() || querying ? 0.6 : 1,
            }}
          >
            {querying ? "⚡ Reasoning..." : "Ask Vault"}
          </button>
        </div>

        {/* Results Area */}
        {ragResult && (
          <div
            style={{
              background: "rgba(18, 24, 38, 0.8)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <div style={{ fontSize: "0.82rem", color: "var(--text-subtle)" }}>
                Question: <strong style={{ color: "var(--text-main)" }}>"{ragResult.question}"</strong>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)" }}>
                {ragResult.retrieved_chunks_count} chunk(s) retrieved from Atlas
              </div>
            </div>

            {/* Answer Text */}
            <div
              style={{
                fontSize: "0.93rem",
                lineHeight: "1.65",
                color: "var(--text-main)",
                whiteSpace: "pre-wrap",
              }}
            >
              {ragResult.answer}
            </div>

            {/* Citations List */}
            {ragResult.citations && ragResult.citations.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)", paddingTop: "14px" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-subtle)", marginBottom: "8px", textTransform: "uppercase" }}>
                  Verified Document Sources &amp; Citations ({ragResult.citations.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ragResult.citations.map((cite, idx) => {
                    const isExpanded = expandedCitation === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          fontSize: "0.82rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                          }}
                          onClick={() => setExpandedCitation(isExpanded ? null : idx)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>📎</span>
                            <strong style={{ color: "var(--accent-cyan)" }}>{cite.filename}</strong>
                            <span style={{ color: "var(--text-subtle)" }}>• Page {cite.page_start}</span>
                            <span style={{ fontSize: "0.72rem", background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4", padding: "2px 6px", borderRadius: "4px" }}>
                              Score: {cite.score.toFixed(3)}
                            </span>
                          </div>
                          <span style={{ color: "var(--text-subtle)", fontSize: "0.75rem" }}>
                            {isExpanded ? "▲ Hide excerpt" : "▼ View source excerpt"}
                          </span>
                        </div>

                        {/* Expandable Chunk Excerpt */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: "10px",
                              padding: "10px 12px",
                              background: "rgba(0, 0, 0, 0.3)",
                              borderRadius: "6px",
                              borderLeft: "3px solid var(--accent-cyan)",
                              color: "var(--text-muted)",
                              fontSize: "0.8rem",
                              lineHeight: "1.5",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {cite.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
