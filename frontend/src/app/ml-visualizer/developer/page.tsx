"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { LabShell } from "@/components/lab/LabShell";

export default function MLDeveloperLabPage() {
  return (
    <div className="lab-page-container">
      <Navbar />

      <main className="lab-main-wrapper">
        <div className="lab-top-header">
          <div>
            <div className="lab-badge-row">
              <span className="lab-badge">🔬 DEVELOPER MODE &bull; 30-SECOND STUDIO REPLAY</span>
              <span className="live-indicator">
                <span className="live-dot"></span> LIVE PYTORCH &bull; EVAL MODE
              </span>
            </div>
            <h1 className="lab-main-heading">Live ML Pipeline Laboratory</h1>
            <p className="lab-sub-heading">
              Watch a student technical dossier travel step-by-step through WordPiece Tokenization, MiniLM-L6
              Embedding Hyperspace, PyTorch CareerMLP Forward Propagation, and Softmax Normalization.
            </p>
          </div>

          <div className="lab-header-actions">
            <Link href="/ml-visualizer" className="back-visualizer-btn">
              &larr; Standard ML Visualizer
            </Link>
          </div>
        </div>

        {/* Master Studio Shell */}
        <LabShell />
      </main>
    </div>
  );
}
