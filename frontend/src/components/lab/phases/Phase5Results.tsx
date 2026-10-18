"use client";

import React, { useMemo } from "react";
import { useLabStore } from "@/lib/lab/store";
import { ROLE_THEME_COLORS } from "@/lib/lab/colors";

export const Phase5Results: React.FC = () => {
  const { trace, currentTime, isOffline } = useLabStore();

  if (!trace) return null;

  // Phase duration: 24s to 30s
  const resultsProgress = Math.max(0, Math.min((currentTime - 24) / 6, 1));

  const top1 = trace.predictions[0];
  const top2 = trace.predictions[1];

  // Dynamic synergy explanation generated directly from top 2 roles
  const synergyText = useMemo(() => {
    if (!top1 || !top2) return "Distinct technical career focus identified.";
    return `${top1.label} primary orientation with substantial ${top2.label} cross-functional alignment. The student demonstrates technical versatility across both disciplines.`;
  }, [top1, top2]);

  return (
    <div className="phase-view phase5-container">
      <div className="phase-banner">
        <span className="phase-pill">PHASE 05 : 24s – 30s</span>
        <h3>Multi-Role Career Pathway Synthesis</h3>
        <p className="phase-sub">
          Final model consensus reveals multi-role career affinities rather than artificial single-role spikes.
        </p>
      </div>

      {/* Top 5 Predicted Roles Split */}
      <div className="results-top-grid">
        <div className="predictions-card">
          <div className="card-header-clean">
            <strong>Ranked Multi-Role Career Probabilities</strong>
            {isOffline && <span className="offline-pill">Offline Verified Trace</span>}
          </div>

          <div className="predictions-list">
            {trace.predictions.map((pred) => {
              const pct = (pred.confidence * 100).toFixed(1);
              const color = ROLE_THEME_COLORS[pred.role] || "#0284C7";
              const isFirst = pred.rank === 1;

              return (
                <div key={pred.role} className={`prediction-row ${isFirst ? "top-pred" : ""}`}>
                  <div className="pred-label-line">
                    <div className="pred-title-group">
                      <span className={`pred-rank ${isFirst ? "first" : ""}`}>#{pred.rank}</span>
                      <span className="pred-name">{pred.label}</span>
                      <span className="pred-token-mono">({pred.role})</span>
                    </div>
                    <span className="pred-pct mono">{pct}%</span>
                  </div>

                  <div className="pred-track">
                    <div
                      className="pred-fill"
                      style={{
                        width: `${Math.max(pred.confidence * 100 * resultsProgress, 2)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Synergy & Multi-Role Synthesis Box */}
        <div className="synergy-card">
          <div className="synergy-header">
            <span className="synergy-icon">🎯</span>
            <div>
              <strong>Multi-Role Synergy Synthesis</strong>
              <div className="synergy-sub">Top Dual Pathway Alignment</div>
            </div>
          </div>

          <p className="synergy-body">{synergyText}</p>

          <div className="synergy-stats">
            <div className="stat-pill">
              <span className="stat-num">{trace.token_count}</span>
              <span className="stat-lbl">Tokens Encoded</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">384</span>
              <span className="stat-lbl">Vector Dimension</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">{trace.latency_ms.total} ms</span>
              <span className="stat-lbl">Real Inference</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
