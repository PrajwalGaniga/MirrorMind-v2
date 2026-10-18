"use client";

import React from "react";
import { useLabStore } from "@/lib/lab/store";
import { ROLE_THEME_COLORS } from "@/lib/lab/colors";

export const OutputDock: React.FC = () => {
  const { trace, currentTime } = useLabStore();

  if (!trace) return null;

  const topRoles = trace.predictions.slice(0, 5);

  return (
    <div className="output-dock-container">
      <div className="dock-header">
        <h4>🏁 Pipeline Output Summary Dock</h4>
        <span className="dock-sub">Computed via PyTorch Softmax Distribution</span>
      </div>

      <div className="dock-grid">
        {topRoles.map((role) => {
          const pct = (role.confidence * 100).toFixed(1);
          const color = ROLE_THEME_COLORS[role.role] || "#0284C7";

          return (
            <div key={role.role} className="dock-card">
              <div className="dock-card-top">
                <span className="dock-rank">#{role.rank}</span>
                <span className="dock-name">{role.label}</span>
                <span className="dock-pct mono">{pct}%</span>
              </div>
              <div className="dock-bar-track">
                <div
                  className="dock-bar-fill"
                  style={{
                    width: `${Math.min(role.confidence * 100, 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
