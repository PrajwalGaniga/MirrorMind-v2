"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { StudentProfile, UserDocumentItem, CitationSourceItem, RAGQueryResponseData } from "@/types/student";

interface KnowledgeVaultProps {
  student: StudentProfile;
  apiUrl: string;
}

interface ChunkItem {
  chunk_id: string;
  chunk_index: number;
  page_start: number;
  page_end: number;
  text: string;
  char_count: number;
  embedding_dim: number;
  embedding_preview: number[];
}

const CATEGORY_OPTIONS = [
  { value: "certificate", label: "🎓 Course / Skill Certificate", icon: "🎓", desc: "Coursera, AWS, Udemy, Hackathons" },
  { value: "resume", label: "📄 Resume / CV", icon: "📄", desc: "Detailed work history and achievements" },
  { value: "transcript", label: "📑 Academic Transcript / Grade Card", icon: "📑", desc: "Semester marks and university grades" },
  { value: "project_report", label: "📊 Capstone / Project Report", icon: "📊", desc: "System design, schemas, and algorithms" },
  { value: "lor", label: "✉️ Letter of Recommendation (LoR)", icon: "✉️", desc: "Performance & qualitative evaluations" },
  { value: "other", label: "📁 Other Career Document", icon: "📁", desc: "Miscellaneous verified credentials" },
];

export const KnowledgeVault: React.FC<KnowledgeVaultProps> = ({ student, apiUrl }) => {
  // Document Management State
  const [documents, setDocuments] = useState<UserDocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("certificate");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStep, setUploadStep] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  // RAG Q&A State
  const [queryText, setQueryText] = useState<string>("");
  const [querying, setQuerying] = useState<boolean>(false);
  const [ragResult, setRagResult] = useState<RAGQueryResponseData | null>(null);
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null);

  // Chunk Inspection Modal State
  const [inspectingDoc, setInspectingDoc] = useState<UserDocumentItem | null>(null);
  const [inspectChunks, setInspectChunks] = useState<ChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState<boolean>(false);

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

  // Handle Document Upload with multi-step visual feedback
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadStep(1);
    setUploadStatus("Uploading file to MirrorMind gateway...");

    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("user_id", student.email);
    formData.append("category", selectedCategory);

    try {
      // Simulate visual multi-step progression
      setTimeout(() => {
        setUploadStep(2);
        setUploadStatus("Extracting text layer (PyPDF / Gemini Vision OCR for certificates)...");
      }, 700);

      setTimeout(() => {
        setUploadStep(3);
        setUploadStatus("Generating 1,000-char sliding window chunks with page tracking...");
      }, 1500);

      setTimeout(() => {
        setUploadStep(4);
        setUploadStatus("Encoding into 384-D normalized dense embeddings via all-MiniLM-L6-v2...");
      }, 2300);

      const res = await fetch(`${apiUrl}/api/rag/documents/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload failed");
      }

      setUploadStep(5);
      setUploadStatus("Indexed successfully into MongoDB Atlas Vector Search!");
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchDocuments();

      setTimeout(() => {
        setUploadStatus("");
        setUploadStep(0);
      }, 4000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus(`Error: ${err.message}`);
      setUploadStep(0);
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
        if (inspectingDoc && (inspectingDoc.id === docId || inspectingDoc._id === docId)) {
          setInspectingDoc(null);
        }
        await fetchDocuments();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Inspect Chunks for a Document
  const handleInspectChunks = async (doc: UserDocumentItem) => {
    const docId = doc.id || doc._id || "";
    setInspectingDoc(doc);
    setLoadingChunks(true);
    setInspectChunks([]);

    try {
      const res = await fetch(`${apiUrl}/api/rag/documents/${docId}/chunks?user_id=${encodeURIComponent(student.email)}`);
      if (res.ok) {
        const data = await res.json();
        setInspectChunks(data.chunks || []);
      }
    } catch (err) {
      console.error("Failed to load chunks:", err);
    } finally {
      setLoadingChunks(false);
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
      {/* Hero Banner Card */}
      <div className="dossier-hero-card" style={{ padding: "26px 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  color: "#fff",
                  boxShadow: "0 8px 20px rgba(168, 85, 247, 0.35)",
                }}
              >
                📚
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "1.4rem", margin: 0, fontWeight: 700 }}>Grounded Knowledge Vault</h2>
                  <span className="version-pill" style={{ background: "rgba(6, 182, 212, 0.2)", color: "#06b6d4" }}>
                    Atlas Vector Search
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "3px 0 0" }}>
                  Dual-Source Verified Reasoning • User-Isolated Vector Indexing • Gemini Vision OCR
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <div className="metric-box" style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Vault Artifacts</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--text-main)" }}>{documents.length}</div>
            </div>
            <div className="metric-box" style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 600 }}>384-D Chunks</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-cyan)" }}>{totalChunks}</div>
            </div>
            <div className="metric-box" style={{ padding: "10px 18px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 600 }}>Isolation Scope</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#34d399", marginTop: "4px" }}>
                🔒 {student.email.split("@")[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Dropzone on Left, Documents Table on Right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: "24px" }}>
        {/* Left Column: Upload New Artifact */}
        <div className="glass-card" style={{ padding: "26px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.3rem" }}>📤</span>
            <div>
              <h3 style={{ fontSize: "1.08rem", margin: 0 }}>Ingest Academic &amp; Career Artifact</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                Upload PDF, PNG, or JPG. Scanned certificates are transcribed via Gemini Vision OCR.
              </p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Category Selector Grid */}
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-main)", display: "block", marginBottom: "8px" }}>
                Select Document Category
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {CATEGORY_OPTIONS.map((opt) => {
                  const isSelected = selectedCategory === opt.value;
                  return (
                    <div
                      key={opt.value}
                      onClick={() => setSelectedCategory(opt.value)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        border: isSelected ? "1.5px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.08)",
                        background: isSelected ? "rgba(6, 182, 212, 0.12)" : "rgba(255, 255, 255, 0.02)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: isSelected ? "#38bdf8" : "var(--text-main)" }}>
                        {opt.icon} {opt.label.split(" ")[1]}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", marginTop: "2px" }}>
                        {opt.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* File Dropzone */}
            <div
              style={{
                border: "2px dashed var(--border-color)",
                borderRadius: "14px",
                padding: "26px 16px",
                textAlign: "center",
                background: uploadFile ? "rgba(6, 182, 212, 0.06)" : "rgba(255, 255, 255, 0.02)",
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
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                {uploadFile ? "📄" : "📁"}
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>
                {uploadFile ? uploadFile.name : "Click to select or drag & drop document"}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "4px" }}>
                {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB` : "Supports PDF, PNG, JPG, or Scanned Certificates"}
              </div>
            </div>

            {/* Multi-Step Ingestion Progress Bar */}
            {uploading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>Step {uploadStep} of 5</span>
                  <span style={{ color: "var(--accent-cyan)" }}>Embedding Pipeline</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(uploadStep / 5) * 100}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #6366f1, #06b6d4)",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", fontStyle: "italic" }}>
                  {uploadStatus}
                </div>
              </div>
            )}

            {/* Static Success Message */}
            {!uploading && uploadStatus && (
              <div
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  background: uploadStatus.includes("Error") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  color: uploadStatus.includes("Error") ? "#f87171" : "#34d399",
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
                padding: "12px 18px",
                fontSize: "0.9rem",
                borderRadius: "10px",
                opacity: !uploadFile || uploading ? 0.6 : 1,
              }}
            >
              {uploading ? "⚡ Indexing Chunks..." : "📥 Ingest & Generate Embeddings"}
            </button>
          </form>
        </div>

        {/* Right Column: Registered Documents Table */}
        <div className="glass-card" style={{ padding: "26px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>📑</span>
              <h3 style={{ fontSize: "1.08rem", margin: 0 }}>Indexed Vault Documents ({documents.length})</h3>
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
              Loading indexed documents from MongoDB Atlas...
            </div>
          ) : documents.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "44px 16px",
                textAlign: "center",
                border: "1px dashed var(--border-color)",
                borderRadius: "12px",
                color: "var(--text-subtle)",
              }}
            >
              <div style={{ fontSize: "2.4rem", marginBottom: "10px" }}>📭</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-main)" }}>No Documents Ingested Yet</div>
              <div style={{ fontSize: "0.8rem", maxWidth: "340px", marginTop: "6px", lineHeight: "1.5" }}>
                Upload your course certificates, semester marksheets, or capstone reports to ground the AI in verifiable factual proof.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", textAlign: "left", color: "var(--text-subtle)" }}>
                    <th style={{ padding: "10px" }}>Document</th>
                    <th style={{ padding: "10px" }}>Category</th>
                    <th style={{ padding: "10px" }}>Chunks</th>
                    <th style={{ padding: "10px" }}>Vector Index</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
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
                        <td style={{ padding: "12px 10px", fontWeight: 600, color: "var(--text-main)" }}>
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
                        <td style={{ padding: "12px 10px" }}>
                          <span
                            style={{
                              padding: "4px 8px",
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
                        <td style={{ padding: "12px 10px", color: "var(--accent-cyan)", fontWeight: 700 }}>
                          {doc.chunk_count}
                        </td>
                        <td style={{ padding: "12px 10px" }}>
                          <span style={{ color: "#34d399", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem" }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399" }}></span>
                            {doc.embedding_status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 10px", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => handleInspectChunks(doc)}
                              className="secondary-button"
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.72rem",
                                borderColor: "rgba(6, 182, 212, 0.3)",
                                color: "#38bdf8",
                              }}
                              title="Inspect vector chunks and embeddings"
                            >
                              🔍 Chunks
                            </button>
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
                              🗑️
                            </button>
                          </div>
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
      <div className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "1.4rem" }}>🔍</span>
            <div>
              <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: 700 }}>Grounded Intelligence Q&amp;A</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                Queries your verified profile &amp; uploaded documents simultaneously with zero-hallucination citations.
              </p>
            </div>
          </div>
          <span className="badge-branch" style={{ fontSize: "0.75rem", background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
            🛡️ Strict Anti-Hallucination Active
          </span>
        </div>

        {/* Suggested Queries Chips */}
        <div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>
            Suggested Grounded Inquiries
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
            <button
              onClick={() => {
                setQueryText("What grade did I score in semester subjects?");
                handleExecuteQuery("What grade did I score in semester subjects?");
              }}
              className="prompt-chip"
            >
              📑 "What grade did I score in semester subjects?"
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
              fontSize: "0.92rem",
              outline: "none",
            }}
          />
          <button
            onClick={() => handleExecuteQuery()}
            disabled={!queryText.trim() || querying}
            className="primary-button"
            style={{
              padding: "12px 26px",
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
              background: "rgba(18, 24, 38, 0.85)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-subtle)" }}>
                Inquiry: <strong style={{ color: "var(--text-main)" }}>"{ragResult.question}"</strong>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
                {ragResult.retrieved_chunks_count} vector chunk(s) retrieved from Atlas
              </div>
            </div>

            {/* Answer Text */}
            <div
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.65",
                color: "var(--text-main)",
                whiteSpace: "pre-wrap",
              }}
            >
              {ragResult.answer}
            </div>

            {/* Citations List */}
            {ragResult.citations && ragResult.citations.length > 0 && (
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-subtle)", marginBottom: "10px", textTransform: "uppercase" }}>
                  Verified Document Sources &amp; Citations ({ragResult.citations.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {ragResult.citations.map((cite, idx) => {
                    const isExpanded = expandedCitation === idx;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          padding: "12px 16px",
                          fontSize: "0.84rem",
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
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span>📎</span>
                            <strong style={{ color: "var(--accent-cyan)" }}>{cite.filename}</strong>
                            <span style={{ color: "var(--text-subtle)" }}>• Page {cite.page_start}</span>
                            <span style={{ fontSize: "0.72rem", background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4", padding: "2px 8px", borderRadius: "4px" }}>
                              Cosine Score: {cite.score.toFixed(3)}
                            </span>
                          </div>
                          <span style={{ color: "var(--accent-cyan)", fontSize: "0.78rem" }}>
                            {isExpanded ? "▲ Hide Chunk" : "▼ Inspect Chunk Excerpt"}
                          </span>
                        </div>

                        {/* Expandable Chunk Excerpt */}
                        {isExpanded && (
                          <div
                            style={{
                              marginTop: "12px",
                              padding: "12px 14px",
                              background: "rgba(0, 0, 0, 0.35)",
                              borderRadius: "8px",
                              borderLeft: "3px solid var(--accent-cyan)",
                              color: "var(--text-muted)",
                              fontSize: "0.82rem",
                              lineHeight: "1.55",
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

      {/* Chunk Inspection Overlay Modal */}
      {inspectingDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setInspectingDoc(null)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(18, 24, 38, 0.6)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔬</span>
                  <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Vector Chunk Inspector</h3>
                  <span className="badge-tier" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}>
                    384-D Embeddings
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "3px" }}>
                  File: <strong style={{ color: "#fff" }}>{inspectingDoc.filename}</strong> • Category: {inspectingDoc.category}
                </div>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="secondary-button"
                style={{ padding: "6px 12px", fontSize: "0.8rem" }}
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body: Chunk List & Embeddings */}
            <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {loadingChunks ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                  Loading vector chunks from Atlas...
                </div>
              ) : inspectChunks.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--text-subtle)" }}>
                  No vector chunks found for this document.
                </div>
              ) : (
                inspectChunks.map((c) => (
                  <div
                    key={c.chunk_id}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-cyan)", background: "rgba(6, 182, 212, 0.15)", padding: "2px 8px", borderRadius: "4px" }}>
                          Chunk #{c.chunk_index + 1}
                        </span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>
                          Page {c.page_start} • {c.char_count} chars
                        </span>
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Vector Dim: {c.embedding_dim}
                      </span>
                    </div>

                    {/* Vector Coordinate Heatmap (First 16 normalized dims) */}
                    {c.embedding_preview && c.embedding_preview.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-subtle)", fontWeight: 600 }}>
                          Dense Vector Heatmap (First 16 Coordinates):
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "3px" }}>
                          {c.embedding_preview.map((val, idx) => {
                            // Map value from -0.25 to 0.25 to color intensity
                            const normalized = Math.max(-1, Math.min(1, val * 4));
                            const bg = normalized > 0
                              ? `rgba(6, 182, 212, ${Math.abs(normalized).toFixed(2)})`
                              : `rgba(168, 85, 247, ${Math.abs(normalized).toFixed(2)})`;
                            return (
                              <div
                                key={idx}
                                title={`Dim ${idx}: ${val}`}
                                style={{
                                  height: "14px",
                                  borderRadius: "2px",
                                  background: bg,
                                  border: "1px solid rgba(255, 255, 255, 0.05)",
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Verbatim Chunk Text */}
                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        background: "rgba(0, 0, 0, 0.35)",
                        color: "var(--text-main)",
                        fontSize: "0.82rem",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                        maxHeight: "150px",
                        overflowY: "auto",
                      }}
                    >
                      {c.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
