"use client";

import React, { useMemo } from "react";
import { useLabStore } from "@/lib/lab/store";

export const Phase3Network: React.FC = () => {
  const { trace, currentTime, mode } = useLabStore();

  if (!trace) return null;

  // Phase duration: 11s to 19s (8 seconds total)
  const networkProgress = Math.max(0, Math.min((currentTime - 11) / 8, 1));

  // Determine active computational stage
  const stageIndex =
    networkProgress < 0.25 ? 0 : networkProgress < 0.5 ? 1 : networkProgress < 0.75 ? 2 : 3;

  // Representative node sampling
  // Input: 16 nodes from 384
  const sampleInput = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const idx = Math.floor((i * 384) / 16);
      return Math.abs(trace.embedding[idx] || 0.05);
    });
  }, [trace.embedding]);

  // Layer 1: 18 nodes from 512
  const sampleLayer1 = useMemo(() => {
    const l1 = trace.activations.layer1 || [];
    return Array.from({ length: 18 }, (_, i) => {
      const idx = Math.floor((i * l1.length) / 18);
      return Math.min(Math.max(l1[idx] || 0.1, 0), 2.5);
    });
  }, [trace.activations.layer1]);

  // Layer 2: 14 nodes from 256
  const sampleLayer2 = useMemo(() => {
    const l2 = trace.activations.layer2 || [];
    return Array.from({ length: 14 }, (_, i) => {
      const idx = Math.floor((i * l2.length) / 14);
      return Math.min(Math.max(l2[idx] || 0.1, 0), 2.5);
    });
  }, [trace.activations.layer2]);

  // Layer 3: 10 nodes from 128
  const sampleLayer3 = useMemo(() => {
    const l3 = trace.activations.layer3 || [];
    return Array.from({ length: 10 }, (_, i) => {
      const idx = Math.floor((i * l3.length) / 10);
      return Math.min(Math.max(l3[idx] || 0.1, 0), 2.5);
    });
  }, [trace.activations.layer3]);

  // Output: 10 logits
  const outputLogits = trace.logits || [];

  return (
    <div className="phase-view phase3-container">
      <div className="phase-banner">
        <span className="phase-pill">PHASE 03 : 11s – 19s</span>
        <h3>PyTorch CareerMLP Deep Neural Network Forward Pass</h3>
        <p className="phase-sub">
          Feed-forward feature extraction through 3 dense transformation blocks with Batch Normalization and GELU activation curves.
        </p>
      </div>

      {/* SVG Neural Network Architecture Visualizer */}
      <div className="network-svg-card">
        <div className="network-columns-header">
          <div className={`col-header ${stageIndex >= 0 ? "active" : ""}`}>
            <span>Input Space</span>
            <strong>384 Nodes</strong>
          </div>
          <div className={`col-header ${stageIndex >= 1 ? "active" : ""}`}>
            <span>Block 1 (GELU)</span>
            <strong>512 Nodes</strong>
          </div>
          <div className={`col-header ${stageIndex >= 2 ? "active" : ""}`}>
            <span>Block 2 (GELU)</span>
            <strong>256 Nodes</strong>
          </div>
          <div className={`col-header ${stageIndex >= 3 ? "active" : ""}`}>
            <span>Block 3 (GELU)</span>
            <strong>128 Nodes</strong>
          </div>
          <div className={`col-header ${networkProgress > 0.9 ? "active" : ""}`}>
            <span>Class Logits</span>
            <strong>10 Roles</strong>
          </div>
        </div>

        {/* Scalable Vector Graphic Net */}
        <div className="network-canvas-wrap">
          <svg className="network-svg" viewBox="0 0 760 300">
            <defs>
              <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0284C7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Connecting Synaptic Edges between columns */}
            {sampleInput.slice(0, 8).map((_, i) =>
              sampleLayer1.slice(0, 8).map((_, j) => (
                <line
                  key={`e1-${i}-${j}`}
                  x1={50}
                  y1={25 + i * 32}
                  x2={210}
                  y2={15 + j * 16}
                  stroke={stageIndex >= 1 ? "#0284C7" : "#E5E7EB"}
                  strokeWidth="0.8"
                  strokeOpacity={stageIndex >= 1 ? 0.25 : 0.08}
                />
              ))
            )}

            {sampleLayer1.slice(0, 8).map((_, i) =>
              sampleLayer2.slice(0, 7).map((_, j) => (
                <line
                  key={`e2-${i}-${j}`}
                  x1={210}
                  y1={15 + i * 16}
                  x2={380}
                  y2={25 + j * 20}
                  stroke={stageIndex >= 2 ? "#4F46E5" : "#E5E7EB"}
                  strokeWidth="0.8"
                  strokeOpacity={stageIndex >= 2 ? 0.3 : 0.08}
                />
              ))
            )}

            {sampleLayer2.slice(0, 7).map((_, i) =>
              sampleLayer3.slice(0, 6).map((_, j) => (
                <line
                  key={`e3-${i}-${j}`}
                  x1={380}
                  y1={25 + i * 20}
                  x2={550}
                  y2={35 + j * 24}
                  stroke={stageIndex >= 3 ? "#7C3AED" : "#E5E7EB"}
                  strokeWidth="0.8"
                  strokeOpacity={stageIndex >= 3 ? 0.35 : 0.08}
                />
              ))
            )}

            {sampleLayer3.slice(0, 6).map((_, i) =>
              outputLogits.slice(0, 5).map((_, j) => (
                <line
                  key={`e4-${i}-${j}`}
                  x1={550}
                  y1={35 + i * 24}
                  x2={710}
                  y2={30 + j * 26}
                  stroke={networkProgress > 0.9 ? "#059669" : "#E5E7EB"}
                  strokeWidth="0.8"
                  strokeOpacity={networkProgress > 0.9 ? 0.4 : 0.08}
                />
              ))
            )}

            {/* Nodes Column 0: Input (x=50) */}
            {sampleInput.map((val, idx) => (
              <circle
                key={`in-${idx}`}
                cx={50}
                cy={20 + idx * 16}
                r={4}
                fill="#0284C7"
                fillOpacity={0.4 + val * 3}
                stroke="#0369A1"
                strokeWidth="1"
              />
            ))}

            {/* Nodes Column 1: Block 1 (x=210) */}
            {sampleLayer1.map((val, idx) => (
              <circle
                key={`l1-${idx}`}
                cx={210}
                cy={15 + idx * 15}
                r={4}
                fill={stageIndex >= 1 ? "#4F46E5" : "#D1D5DB"}
                fillOpacity={stageIndex >= 1 ? 0.4 + Math.min(val * 0.4, 0.6) : 0.2}
                stroke={stageIndex >= 1 ? "#3730A3" : "#9CA3AF"}
                strokeWidth="1"
              />
            ))}

            {/* Nodes Column 2: Block 2 (x=380) */}
            {sampleLayer2.map((val, idx) => (
              <circle
                key={`l2-${idx}`}
                cx={380}
                cy={25 + idx * 18}
                r={4.5}
                fill={stageIndex >= 2 ? "#7C3AED" : "#D1D5DB"}
                fillOpacity={stageIndex >= 2 ? 0.4 + Math.min(val * 0.4, 0.6) : 0.2}
                stroke={stageIndex >= 2 ? "#5B21B6" : "#9CA3AF"}
                strokeWidth="1"
              />
            ))}

            {/* Nodes Column 3: Block 3 (x=550) */}
            {sampleLayer3.map((val, idx) => (
              <circle
                key={`l3-${idx}`}
                cx={550}
                cy={35 + idx * 23}
                r={5}
                fill={stageIndex >= 3 ? "#9333EA" : "#D1D5DB"}
                fillOpacity={stageIndex >= 3 ? 0.5 + Math.min(val * 0.4, 0.5) : 0.2}
                stroke={stageIndex >= 3 ? "#6B21A8" : "#9CA3AF"}
                strokeWidth="1.2"
              />
            ))}

            {/* Nodes Column 4: Logits (x=710) */}
            {outputLogits.map((val, idx) => (
              <g key={`out-${idx}`}>
                <circle
                  cx={710}
                  cy={25 + idx * 26}
                  r={6}
                  fill={networkProgress > 0.85 ? (val > 0 ? "#059669" : "#DC2626") : "#D1D5DB"}
                  stroke="#171817"
                  strokeWidth="1.5"
                />
                <text
                  x={724}
                  y={29 + idx * 26}
                  fontSize="9"
                  fontFamily="monospace"
                  fill="#171817"
                  fontWeight="600"
                >
                  {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Educational Truthfulness Sidebar regarding Dropout */}
      <div className="network-truth-box">
        <div className="truth-badge">💡 Architectural Fact</div>
        <p>
          <strong>Dropout is disabled during inference (`model.eval()`):</strong> In training, 20% to 35% of nodes were
          randomly masked to prevent co-adaptation. At prediction time, 100% of weights are utilized with stored BatchNorm running statistics.
        </p>
      </div>
    </div>
  );
};
