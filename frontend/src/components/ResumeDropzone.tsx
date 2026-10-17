"use client";

import React, { useState, useRef } from "react";
import { ResumeParseResponse } from "@/types/student";

interface ResumeDropzoneProps {
  onExtracted: (
    data: ResumeParseResponse["extracted_data"],
    cloudinaryUrl: string,
    filename: string
  ) => void;
  apiUrl: string;
}

export const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({
  onExtracted,
  apiUrl,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    filename: string;
    skillsCount: number;
    url: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessInfo(null);

    const validExtensions = [".pdf", ".docx", ".txt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type. Please upload a PDF or DOCX resume.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("File size exceeds 15MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadStep("Uploading resume to Cloudinary & parsing document...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulated step message transition for friendly UX
      const timer1 = setTimeout(() => {
        setUploadStep("Gemini 3.8 Flash extracting skills, projects & education...");
      }, 1800);

      const res = await fetch(`${apiUrl}/api/resume/parse`, {
        method: "POST",
        body: formData,
      });

      clearTimeout(timer1);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
      }

      const result: ResumeParseResponse = await res.json();
      const skillsFound = result.extracted_data.skills?.length || 0;

      setSuccessInfo({
        filename: file.name,
        skillsCount: skillsFound,
        url: result.cloudinary_url,
      });

      onExtracted(result.extracted_data, result.cloudinary_url, file.name);
    } catch (err: unknown) {
      console.error("Resume extraction failed:", err);
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to process resume. Please try again."
      );
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  return (
    <div className="resume-dropzone-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.docx,.txt"
        style={{ display: "none" }}
      />

      <div
        className={`dropzone-box ${isDragging ? "dragging" : ""} ${isUploading ? "uploading" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="dropzone-loading">
            <div className="spinner-glow"></div>
            <p className="loading-title">AI Resume Parsing In Progress</p>
            <p className="loading-step">{uploadStep}</p>
            <div className="step-pipeline">
              <span className="step-tag active">1. Cloudinary Upload</span>
              <span className="step-tag active">2. PyPDF Extraction</span>
              <span className="step-tag active">3. Gemini 3.8 Flash</span>
            </div>
          </div>
        ) : (
          <div className="dropzone-content">
            <div className="dropzone-icon">📄</div>
            <div className="dropzone-text">
              <h3>Fast-Track: Upload Resume (PDF / DOCX)</h3>
              <p>
                Drag &amp; drop your resume here, or <span className="browse-link">browse file</span>
              </p>
              <div className="dropzone-meta">
                <span>⚡ Powered by Cloudinary &amp; Gemini 3.8 Flash</span>
                <span>• Auto-extracts skills, projects, and CGPA into form</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successInfo && (
        <div className="dropzone-success-alert">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>✅</span>
            <div>
              <strong>Successfully parsed {successInfo.filename}!</strong>
              <div style={{ fontSize: "0.8rem", color: "var(--accent-emerald)" }}>
                Auto-extracted {successInfo.skillsCount} technical skills and pre-filled the form below.
              </div>
            </div>
          </div>
          {successInfo.url && (
            <a
              href={successInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="dropzone-view-link"
              onClick={(e) => e.stopPropagation()}
            >
              View Stored Resume ↗
            </a>
          )}
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="dropzone-error-alert">
          ⚠️ <strong>Parsing Notice:</strong> {errorMsg}
        </div>
      )}
    </div>
  );
};
