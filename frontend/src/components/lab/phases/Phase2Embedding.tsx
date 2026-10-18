"use client";

import React, { useMemo } from "react";
import { useLabStore } from "@/lib/lab/store";
import { getVectorColorScale } from "@/lib/lab/colors";

export const Phase2Embedding: React.FC = () => {
  const { trace, currentTime, mode } = useLabStore();

  const colorScale = useMemo(() => {
    if (!trace) return getVectorColorScale(0.15);
    const maxVal = Math.max(...trace.embedding.map(Math.abs));
    return getVectorColorScale(maxVal);
  }, [trace]);

  if (!trace) return null;

  // Embedding phase is 5s to 11s (duration 6s)
  const phaseProgress = Math.max(0, Math.min((currentTime - 5) / 6, 1));
  const cellsIlluminated = Math.floor(phaseProgress * 384);

  // Attention links calculation (top-2 attention partners for the first 8 tokens)
  const tokens = trace.tokens.slice(0, 16);
  const attentionLinks = useMemo(() => {
    const links: { source: number; target: number; weight: number }[] = [];
    const matrix = trace.attention;
    const n = Math.min(tokens.length, matrix.length);

    for (let i = 0; i < n; i++) {
      const row = matrix[i] || [];
      const sorted = row
        .map((weight, target) => ({ target, weight }))
        .filter((item) => item.target !== i && item.target < n)
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 2);

      sorted.forEach((s) => {
        links.push({ source: i, target: s.target, weight: s.weight });
      });
    }
    return links;
  }, [trace.attention, tokens.length]);

  return (
    <div className="phase-view phase2-container">
      <div className="phase-banner">
        <span className="phase-pill">PHASE 02 : 5s – 11s</span>
        <h3>MiniLM-L6 Semantic Hypersphere &amp; 384-D Vector Grid</h3>
        <p className="phase-sub">
          The tokenized sequence is contextualized via 12 attention heads, mean-pooled, and projected onto a 384-dimensional unit sphere.
        </p>
      </div>

      {/* Attention Beams Preview */}
      <div className="attention-preview-card">
        <div className="attention-header">
          <span>Multi-Head Self-Attention Beams (Contextual Word Pairing)</span>
          <span className="attn-badge">12 Heads • Layer 6</span>
        </div>

        <div className="attention-token-row">
          {tokens.map((tok, idx) => (
            <span key={idx} className="attn-token-chip">
              {tok}
            </span>
          ))}
        </div>

        {/* Dynamic Attention Arc Overlay */}
        <div className="attention-svg-wrap">
          <svg className="attention-svg" viewBox="0 0 800 60">
            {attentionLinks.slice(0, 12).map((link, idx) => {
              const x1 = 30 + link.source * 46;
              const x2 = 30 + link.target * 46;
              const cx = (x1 + x2) / 2;
              const cy = Math.max(10, 50 - Math.abs(x1 - x2) * 0.15);
              const opacity = Math.min(Math.max(link.weight * 3, 0.25), 0.9);

              return (
                <path
                  key={idx}
                  d={`M ${x1} 55 Q ${cx} ${cy} ${x2} 55`}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="1.5"
                  strokeOpacity={phaseProgress > 0.1 ? opacity : 0}
                  className="attn-arc"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* 384-D Heatmap Grid */}
      <div className="heatmap-card">
        <div className="heatmap-top-line">
          <div>
            <strong>384-D Semantic Vector Heatmap (24 &times; 16 Grid)</strong>
            <div className="heatmap-caption-truthful">
              &ldquo;Each cell is one number. No single cell means anything alone; the meaning is in the whole pattern.&rdquo;
            </div>
          </div>
          <div className="heatmap-meta-pill">
            <span className="mono">‖v‖₂ = {trace.embedding_norm.toFixed(4)}</span>
            <span className="pill-sub">Unit Hypersphere</span>
          </div>
        </div>

        <div className="vector-grid-384">
          {trace.embedding.map((val, idx) => {
            const isLit = idx <= cellsIlluminated;
            const bg = isLit ? colorScale(val) : "#E5E7EB";
            const isPositive = val >= 0;

            return (
              <div
                key={idx}
                className={`grid-cell-384 ${isLit ? "lit" : ""}`}
                style={{
                  backgroundColor: bg,
                  borderColor: isLit ? (isPositive ? "#0284C7" : "#7C3AED") : "#D1D5DB",
                }}
                title={`d_${idx + 1}: ${val.toFixed(5)}`}
              />
            );
          })}
        </div>

        <div className="heatmap-footer-legend">
          <div className="legend-item">
            <span className="legend-swatch purple"></span>
            <span>Negative Semantic Projection</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch neutral"></span>
            <span>Near Zero (0.000)</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch blue"></span>
            <span>Positive Semantic Projection</span>
          </div>
        </div>
      </div>
    </div>
  );
};
