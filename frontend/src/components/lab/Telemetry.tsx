"use client";

import React from "react";
import { useLabStore } from "@/lib/lab/store";

export const Telemetry: React.FC = () => {
  const { trace, currentTime, activePhase } = useLabStore();

  if (!trace) {
    return (
      <div className="telemetry-panel">
        <h4 className="telemetry-title">⚡ Neural Telemetry</h4>
        <p className="telemetry-empty">Awaiting model trace payload...</p>
      </div>
    );
  }

  // Determine current active tensor shape based on playback time
  const getActiveTensorShape = () => {
    if (currentTime < 5) return `[1, ${trace.token_count}]`;
    if (currentTime < 11) return "[1, 384]";
    if (currentTime < 14) return "[1, 512]";
    if (currentTime < 17) return "[1, 256]";
    if (currentTime < 19) return "[1, 128]";
    return "[1, 10]";
  };

  const getActiveLayerName = () => {
    if (currentTime < 5) return "WordPiece Input Sequence";
    if (currentTime < 11) return "Dense Embedding Hypersphere";
    if (currentTime < 14) return "CareerMLP Block 1 (Linear+BN+GELU)";
    if (currentTime < 17) return "CareerMLP Block 2 (Linear+BN+GELU)";
    if (currentTime < 19) return "CareerMLP Block 3 (Linear+BN+GELU)";
    if (currentTime < 24) return "Classifier Head (Logits)";
    return "Softmax Output Distribution";
  };

  return (
    <div className="telemetry-panel">
      <div className="telemetry-header">
        <span className="telemetry-pulse"></span>
        <h4 className="telemetry-title">⚡ Real Model Telemetry</h4>
      </div>

      <div className="telemetry-metric-group">
        <div className="telemetry-item">
          <span className="telemetry-lbl">Active Tensor</span>
          <span className="telemetry-val mono">{getActiveTensorShape()}</span>
          <span className="telemetry-sub">{getActiveLayerName()}</span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-lbl">L2 Norm (‖v‖₂)</span>
          <span className="telemetry-val mono">{trace.embedding_norm.toFixed(4)}</span>
          <span className="telemetry-sub">Unit Hypersphere Projection</span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-lbl">Real Inference Latency</span>
          <span className="telemetry-val mono">{trace.latency_ms.total} ms</span>
          <span className="telemetry-sub">
            Tok: {trace.latency_ms.tokenize}ms | Enc: {trace.latency_ms.encode}ms | MLP: {trace.latency_ms.mlp}ms
          </span>
        </div>

        <div className="telemetry-item">
          <span className="telemetry-lbl">PyTorch Parameters</span>
          <span className="telemetry-val mono">
            {trace.model_info.mlp_params.toLocaleString()}
          </span>
          <span className="telemetry-sub">
            {(trace.model_info.mlp_bytes / 1024 / 1024).toFixed(2)} MB in RAM (Float32)
          </span>
        </div>
      </div>

      <div className="telemetry-truth-note">
        <span className="truth-icon">🛡️</span>
        <p>
          <strong>Truthful Replay:</strong> Animation is a slowed 30s educational replay. Real inference took only{" "}
          <strong>{trace.latency_ms.total} ms</strong>.
        </p>
      </div>
    </div>
  );
};
