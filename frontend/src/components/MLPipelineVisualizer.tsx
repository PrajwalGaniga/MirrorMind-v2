"use client";

import React, { useState } from "react";
import { PredictResponse, StudentProfile } from "@/types/student";

interface MLPipelineVisualizerProps {
  prediction: PredictResponse | null;
  student: StudentProfile | null;
}

export const MLPipelineVisualizer: React.FC<MLPipelineVisualizerProps> = ({
  prediction,
  student,
}) => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const [showAllRoles, setShowAllRoles] = useState<boolean>(false);

  if (!prediction) {
    return (
      <div className="empty-ml-state">
        <div className="empty-icon">🧠</div>
        <h3>No ML Predictions Generated Yet</h3>
        <p>Complete your student profile onboarding or click &ldquo;Re-run Career AI&rdquo; to execute the PyTorch pipeline.</p>
      </div>
    );
  }

  // Radar chart data preparation
  const radarData = prediction.skill_radar || {
    "Core Programming": 85,
    "Framework Mastery": 82,
    "System & Cloud": 75,
    "Data & Mathematics": 88,
    "Engineering Practices": 80,
  };

  const radarKeys = Object.keys(radarData);
  const numPoints = radarKeys.length;
  const radius = 100;
  const center = 140;

  // Compute SVG polygon coordinates for 5-pillar radar
  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / numPoints) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  const polygonPoints = radarKeys
    .map((key, i) => {
      const val = radarData[key] || 0;
      const { x, y } = getCoordinates(val, i);
      return `${x},${y}`;
    })
    .join(" ");

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];

  const stages = [
    { id: 0, title: "1. Text Serialization", tag: "INPUT NARRATIVE" },
    { id: 1, title: "2. 384-D Vector", tag: "EMBEDDING SPACE" },
    { id: 2, title: "3. CareerMLP Neural Net", tag: "PYTORCH FORWARD PASS" },
    { id: 3, title: "4. Softmax Distribution", tag: "TOP-5 ROLES" },
    { id: 4, title: "5. Skill Radar", tag: "5-AXIS PROFICIENCY" },
    { id: 5, title: "6. Gemini AI Mentor", tag: "STRATEGIC INSIGHT" },
  ];

  return (
    <div className="ml-visualizer-container">
      {/* Top Banner / Match Highlight */}
      <div className="top-prediction-banner">
        <div className="prediction-badge-glow">
          <span className="trophy-icon">🏆</span>
          <div>
            <div className="prediction-label-sub">TOP PREDICTED CAREER PATHWAY</div>
            <div className="prediction-label-main">{prediction.top_label}</div>
          </div>
        </div>

        <div className="confidence-pill-large">
          <span className="conf-value">{(prediction.confidence * 100).toFixed(1)}%</span>
          <span className="conf-sub">Model Confidence</span>
        </div>
      </div>

      {/* Interactive Pipeline Navigation Tabs */}
      <div className="pipeline-stepper">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setActiveStage(stage.id)}
            className={`pipeline-step-btn ${activeStage === stage.id ? "active" : ""}`}
          >
            <span className="step-tag-pill">{stage.tag}</span>
            <span className="step-btn-title">{stage.title}</span>
          </button>
        ))}
      </div>

      {/* STAGE 1: Profile Serialization (Text Input to Embedder) */}
      {activeStage === 0 && (
        <div className="pipeline-card stage-card">
          <div className="stage-header">
            <div className="stage-num">STAGE 01</div>
            <div>
              <h3>Deterministic Profile Text Serialization</h3>
              <p>
                How raw profile attributes are structured into a canonical text narrative before entering
                the embedding space.
              </p>
            </div>
          </div>

          <div className="feature-breakdown-grid">
            <div className="feature-item">
              <span className="feat-title">Skills Feature Array</span>
              <div className="feat-skills">
                {(student?.skills || []).map((s) => (
                  <span key={s} className="mini-tag">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="feature-item">
              <span className="feat-title">Academic &amp; Project Metrics</span>
              <div className="feat-metric-row">
                <div>
                  <span className="metric-val">{student?.cgpa?.toFixed(1) || "7.5"}</span>
                  <span className="metric-lbl">CGPA</span>
                </div>
                <div>
                  <span className="metric-val">{student?.projects?.length || 0}</span>
                  <span className="metric-lbl">Projects</span>
                </div>
                <div>
                  <span className="metric-val">{student?.internships?.length || 0}</span>
                  <span className="metric-lbl">Internships</span>
                </div>
              </div>
            </div>
          </div>

          {/* Serialized String Display */}
          <div className="serialized-box">
            <div className="serialized-header">
              <span>Deterministic Narrative (Input to SentenceTransformer)</span>
              <span className="leakage-pill">🛡️ No Label Leakage</span>
            </div>
            <code className="serialized-text">
              &quot;{prediction.profile_text}&quot;
            </code>
            <div className="serialized-footer">
              <span>Length: {prediction.profile_text.length} characters</span>
              <span>• Words: {prediction.profile_text.split(" ").length}</span>
              <span>• Target classes excluded to prevent label leakage</span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 2: 384-D Vector Embedding Space */}
      {activeStage === 1 && (
        <div className="pipeline-card stage-card">
          <div className="stage-header">
            <div className="stage-num">STAGE 02</div>
            <div>
              <h3>Dense 384-D Semantic Embedding Space</h3>
              <p>
                The narrative text is encoded via <code>all-MiniLM-L6-v2</code> into an L2-normalized
                hypersphere in &reals;<sup>384</sup>.
              </p>
            </div>
          </div>

          <div className="vector-metrics-bar">
            <div className="vec-stat">
              <span className="vec-num">384</span>
              <span className="vec-lbl">Vector Dimension</span>
            </div>
            <div className="vec-stat">
              <span className="vec-num">1.0000</span>
              <span className="vec-lbl">L2 Norm (&Vert;v&Vert;<sub>2</sub>)</span>
            </div>
            <div className="vec-stat">
              <span className="vec-num">MiniLM-L6</span>
              <span className="vec-lbl">Transformer Backbone</span>
            </div>
          </div>

          {/* Vector Heatmap Ribbon */}
          <div className="vector-heatmap-section">
            <div className="heatmap-header">
              <span>Live Vector Dimension Inspector (Preview of first 16 dimensions):</span>
              <span style={{ fontSize: "0.75rem", color: "#0284C7", fontWeight: 700 }}>
                Deep Blue = Positive Semantic Activation | Purple = Negative
              </span>
            </div>

            <div className="heatmap-grid">
              {(prediction.embedding_preview || []).map((val, idx) => {
                const isPositive = val >= 0;
                const intensity = Math.min(Math.abs(val) * 12, 1);
                return (
                  <div
                    key={idx}
                    className="heatmap-cell"
                    style={{
                      backgroundColor: isPositive
                        ? `rgba(2, 132, 199, ${0.12 + intensity * 0.4})`
                        : `rgba(124, 58, 237, ${0.12 + intensity * 0.4})`,
                      borderColor: isPositive ? "#0284C7" : "#7C3AED",
                      borderWidth: "1.5px",
                    }}
                  >
                    <span className="dim-index">d_{idx + 1}</span>
                    <span className="dim-val">{val.toFixed(4)}</span>
                  </div>
                );
              })}
            </div>

            <p style={{ fontSize: "0.82rem", color: "#4B5563", marginTop: "12px", lineHeight: "1.5" }}>
              These 384 dense coordinates capture latent programming paradigms, cloud/devops exposure,
              and academic strengths without requiring manual keyword matching.
            </p>
          </div>
        </div>
      )}

      {/* STAGE 3: PyTorch Deep Neural Network (CareerMLP) */}
      {activeStage === 2 && (
        <div className="pipeline-card stage-card">
          <div className="stage-header">
            <div className="stage-num">STAGE 03</div>
            <div>
              <h3>PyTorch CareerMLP Deep Neural Network Forward Pass</h3>
              <p>
                Multi-layer perceptron with Batch Normalization, GELU activations, and Dropout
                regularization.
              </p>
            </div>
          </div>

          {/* Interactive Neural Network Architecture */}
          <div className="neural-layers-flow">
            {(prediction.nn_layers || []).map((layer, idx) => (
              <React.Fragment key={layer.id || idx}>
                <div className="neural-layer-node">
                  <div className="layer-badge">LAYER {idx}</div>
                  <div className="layer-title">{layer.name}</div>
                  <div className="layer-shape">
                    Shape: [{layer.input_shape.join(", ")}] &rarr; [{layer.output_shape.join(", ")}]
                  </div>
                  <div className="layer-activation">
                    <strong>Activation:</strong> {layer.activation}
                  </div>
                  {layer.regularization && (
                    <div className="layer-reg">
                      <strong>Regularization:</strong> {layer.regularization}
                    </div>
                  )}
                  <p className="layer-desc">{layer.description}</p>
                </div>

                {idx < (prediction.nn_layers?.length || 0) - 1 && (
                  <div className="layer-connector">
                    <span className="connector-arrow">&darr;</span>
                    <span className="pulse-signal"></span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* STAGE 4: Softmax Classification & Top-5 Roles */}
      {activeStage === 3 && (
        <div className="pipeline-card stage-card">
          <div className="stage-header">
            <div className="stage-num">STAGE 04</div>
            <div>
              <h3>Softmax Career Probability Distribution</h3>
              <p>
                Ranked Top-5 career recommendations with confidence percentages computed via Softmax over 10 role tokens.
              </p>
            </div>
          </div>

          <div className="top5-roles-list">
            {prediction.predictions.map((p) => {
              const pct = (p.confidence * 100).toFixed(1);
              const isTop = p.rank === 1;
              return (
                <div key={p.role} className={`role-card ${isTop ? "top-role" : ""}`}>
                  <div className="role-header-line">
                    <div className="role-title-group">
                      <span className={`rank-badge ${isTop ? "top-rank" : ""}`}>#{p.rank}</span>
                      <strong className="role-name">{p.label}</strong>
                      <span className="role-token">({p.role})</span>
                    </div>
                    <span className="role-pct">{pct}%</span>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${isTop ? "primary-fill" : "secondary-fill"}`}
                      style={{ width: `${Math.max(p.confidence * 100, 2)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toggle View All 10 Roles */}
          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              onClick={() => setShowAllRoles(!showAllRoles)}
              className="secondary-button"
              style={{ fontSize: "0.85rem", padding: "6px 16px" }}
            >
              {showAllRoles ? "▲ Collapse 10-Class Distribution" : "▼ Inspect Full 10-Class Softmax Distribution"}
            </button>
          </div>

          {showAllRoles && prediction.all_probabilities && (
            <div className="all-roles-grid" style={{ marginTop: "16px" }}>
              {Object.entries(prediction.all_probabilities)
                .sort(([, a], [, b]) => b - a)
                .map(([token, prob]) => (
                  <div key={token} className="all-role-item">
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-main)" }}>{token}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0284C7" }}>
                        {(prob * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="mini-progress-track">
                      <div
                        className="mini-progress-fill"
                        style={{ width: `${Math.max(prob * 100, 1)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* STAGE 5: 5-Pillar Skill Radar Chart */}
      {activeStage === 4 && (
        <div className="pipeline-card stage-card">
          <div className="stage-header">
            <div className="stage-num">STAGE 05</div>
            <div>
              <h3>5-Pillar Proficiency Skill Radar</h3>
              <p>
                Multi-dimensional evaluation across Core Programming, Framework Mastery, Systems, Data, and Engineering Practices.
              </p>
            </div>
          </div>

          <div className="radar-layout">
            {/* SVG Radar Visual */}
            <div className="radar-svg-container">
              <svg width="280" height="280" viewBox="0 0 280 280" className="radar-svg">
                <defs>
                  <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.15" />
                  </radialGradient>
                </defs>

                {/* Concentric Grid Polygons */}
                {gridLevels.map((lvl) => {
                  const pts = radarKeys
                    .map((_, i) => {
                      const { x, y } = getCoordinates(lvl, i);
                      return `${x},${y}`;
                    })
                    .join(" ");
                  return (
                    <polygon
                      key={lvl}
                      points={pts}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.12)"
                      strokeWidth="1.2"
                    />
                  );
                })}

                {/* Axis lines */}
                {radarKeys.map((_, i) => {
                  const { x, y } = getCoordinates(100, i);
                  return (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke="rgba(0, 0, 0, 0.15)"
                      strokeWidth="1.2"
                    />
                  );
                })}

                {/* Value Polygon */}
                <polygon
                  points={polygonPoints}
                  fill="url(#radarGlow)"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />

                {/* Data Points */}
                {radarKeys.map((key, i) => {
                  const val = radarData[key] || 0;
                  const { x, y } = getCoordinates(val, i);
                  return (
                    <circle
                      key={key}
                      cx={x}
                      cy={y}
                      r="4.5"
                      fill="#a855f7"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Radar Metric Scores */}
            <div className="radar-scores-list">
              {radarKeys.map((key) => {
                const score = radarData[key] || 0;
                return (
                  <div key={key} className="radar-score-item">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="pillar-name">{key}</span>
                      <span className="pillar-val">{score} / 100</span>
                    </div>
                    <div className="progress-track" style={{ height: "6px" }}>
                      <div
                        className="progress-fill primary-fill"
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STAGE 6: Gemini AI Career Mentor Strategic Insight */}
      {activeStage === 5 && (
        <div className="pipeline-card stage-card">
          <div className="stage-header">
            <div className="stage-num">STAGE 06</div>
            <div>
              <h3>Gemini 3.8 Flash Career Mentor Strategic Roadmap</h3>
              <p>Personalized evaluation analyzing skill alignment, gaps, and tier-1 placement readiness.</p>
            </div>
          </div>

          <div className="mentor-insight-box">
            <div className="mentor-header">
              <span className="mentor-icon">🤖</span>
              <div>
                <strong>AI Career Mentor Evaluation</strong>
                <div style={{ fontSize: "0.78rem", color: "#0284C7", fontWeight: 700 }}>
                  Target Role: {prediction.top_label} • Model: Gemini 3.8 Flash
                </div>
              </div>
            </div>

            <div className="mentor-body">
              {prediction.top_insight ? (
                <div className="mentor-text">
                  {prediction.top_insight.split("\n\n").map((para, idx) => (
                    <p key={idx} style={{ marginBottom: "12px", lineHeight: "1.6" }}>
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)" }}>
                  Generating personalized mentorship recommendations based on your technical dossier...
                </p>
              )}
            </div>

            <div className="mentor-footer">
              <span>💡 Recommendation: Build end-to-end production projects with live deployment.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
