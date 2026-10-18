"use client";

import React from "react";
import { useLabStore } from "@/lib/lab/store";
import katex from "katex";
import "katex/dist/katex.min.css";

export const Caption: React.FC = () => {
  const { mode, activePhase, currentTime } = useLabStore();

  const getEquationHtml = () => {
    try {
      if (activePhase.id === "vectors") {
        return katex.renderToString(
          "\\mathbf{v} = \\frac{\\text{MeanPool}(\\mathbf{H})}{\\|\\text{MeanPool}(\\mathbf{H})\\|_2} \\in \\mathbb{R}^{384}, \\quad \\|\\mathbf{v}\\|_2 = 1.0000",
          { throwOnError: false }
        );
      }
      if (activePhase.id === "network") {
        return katex.renderToString(
          "\\mathbf{h}^{(l)} = \\text{GELU}\\Big(\\text{BatchNorm1d}\\big(\\mathbf{W}^{(l)} \\mathbf{h}^{(l-1)} + \\mathbf{b}^{(l)}\\big)\\Big)",
          { throwOnError: false }
        );
      }
      if (activePhase.id === "softmax") {
        return katex.renderToString(
          "P(y_i) = \\frac{\\exp(z_i)}{\\sum_{j=1}^{10} \\exp(z_j)}, \\quad \\sum_{i=1}^{10} P(y_i) \\equiv 100.0\\%",
          { throwOnError: false }
        );
      }
    } catch {
      return null;
    }
    return null;
  };

  const eqHtml = getEquationHtml();

  return (
    <div className="lab-caption-container">
      <div className="caption-phase-indicator">
        <span className="caption-badge">{activePhase.number}</span>
        <span className="caption-title">{activePhase.shortTitle}</span>
        <span className="caption-timer">{currentTime.toFixed(1)}s / 30.0s</span>
      </div>

      <div className="caption-text-area">
        {mode === "story" ? (
          <p className="caption-story-text">{activePhase.storyCaption}</p>
        ) : (
          <div className="caption-lab-area">
            <p className="caption-lab-text">{activePhase.labCaption}</p>
            {eqHtml && (
              <div
                className="caption-equation"
                dangerouslySetInnerHTML={{ __html: eqHtml }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
