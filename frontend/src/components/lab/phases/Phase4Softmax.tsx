"use client";

import React, { useMemo } from "react";
import { useLabStore } from "@/lib/lab/store";

export const Phase4Softmax: React.FC = () => {
  const { trace, currentTime, mode } = useLabStore();

  if (!trace) return null;

  // Phase duration: 19s to 24s (5 seconds total)
  const softmaxProgress = Math.max(0, Math.min((currentTime - 19) / 5, 1));

  // Running sum convergence towards 100%
  const runningSum = Math.min(softmaxProgress * 105, 100);

  // Raw logits and probabilities
  const logits = trace.logits || [];
  const probs = trace.probs || [];
  const roles = trace.roles || [];

  return (
    <div className="phase-view phase4-container">
      <div className="phase-banner">
        <span className="phase-pill">PHASE 04 : 19s – 24s</span>
        <h3>Softmax Multi-Class Normalization Chamber</h3>
        <p className="phase-sub">
          Raw real-valued logits from the classification head are exponentiated and calibrated so that all probabilities sum to exactly 100.0%.
        </p>
      </div>

      <div className="softmax-stage-card">
        <div className="softmax-header-line">
          <div>
            <strong>10-Class Logit to Probability Calibration</strong>
            <div className="softmax-formula-sub">
              {mode === "story"
                ? "Turning raw model scores into intuitive percentages."
                : "P(y_i) = exp(z_i) / Σ exp(z_j) with numerical stability"}
            </div>
          </div>

          <div className="sum-counter-pill">
            <span className="sum-label">Sum Total:</span>
            <span className="sum-val mono">{runningSum.toFixed(1)}%</span>
            {runningSum >= 99.9 && <span className="sum-check">✓</span>}
          </div>
        </div>

        {/* Comparative 10-Class Transformation Grid */}
        <div className="softmax-bars-list">
          {roles.map((roleMeta, idx) => {
            const rawLogit = logits[idx] !== undefined ? logits[idx] : 0;
            const probPct = (probs[idx] !== undefined ? probs[idx] : 0) * 100;
            const isTopClass = probPct > 15;

            // Bar width interpolates from neutral raw score to final probability
            const barWidth = Math.max(probPct * softmaxProgress, 1.5);

            return (
              <div key={roleMeta.token} className={`softmax-row ${isTopClass ? "highlight" : ""}`}>
                <div className="role-meta-col">
                  <span className="role-short-name">{roleMeta.label}</span>
                  <span className="role-token-mono">({roleMeta.token})</span>
                </div>

                <div className="logit-col mono">
                  <span className={`logit-badge ${rawLogit >= 0 ? "pos" : "neg"}`}>
                    z = {rawLogit >= 0 ? `+${rawLogit.toFixed(2)}` : rawLogit.toFixed(2)}
                  </span>
                </div>

                <div className="bar-col">
                  <div className="softmax-track">
                    <div
                      className={`softmax-bar ${isTopClass ? "top-bar" : "sub-bar"}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <div className="prob-col mono">
                  <span className="prob-pct">
                    {softmaxProgress > 0.2 ? `${(probPct * softmaxProgress).toFixed(1)}%` : "..."}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
