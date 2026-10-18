"use client";

import React, { useMemo } from "react";
import { useLabStore } from "@/lib/lab/store";

export const Phase1Tokens: React.FC = () => {
  const { trace, currentTime } = useLabStore();

  if (!trace) return null;

  // Calculate typewriter visible text
  // Text should finish typing by t = 2.5s
  const narrative = trace.narrative;
  const charsCount = narrative.length;
  const progressRatio = Math.min(currentTime / 2.5, 1);
  const visibleChars = Math.floor(progressRatio * charsCount);
  const displayedText = narrative.slice(0, visibleChars);

  // Tokens stagger in from t = 2.0s to t = 4.8s
  const tokens = trace.tokens.slice(0, 32);
  const tokensVisibleRatio = Math.max(0, Math.min((currentTime - 1.8) / 2.8, 1));
  const visibleTokensCount = Math.floor(tokensVisibleRatio * tokens.length);

  return (
    <div className="phase-view phase1-container">
      <div className="phase-banner">
        <span className="phase-pill">PHASE 01 : 0s – 5s</span>
        <h3>Deterministic Canonical String &amp; Subword Tokenizer</h3>
        <p className="phase-sub">
          The raw technical profile is serialized into a canonical narrative, then segmented into WordPiece tokens.
        </p>
      </div>

      {/* Serialized String Typewriter Display */}
      <div className="narrative-box">
        <div className="narrative-header">
          <span className="narrative-tag">Input Narrative (Deterministic Contract)</span>
          <span className="token-count-pill">{trace.token_count} Total Tokens</span>
        </div>
        <div className="narrative-content">
          <span className="narrative-typed">
            &ldquo;{displayedText}&rdquo;
          </span>
          {currentTime < 2.5 && <span className="typewriter-cursor">|</span>}
        </div>
      </div>

      {/* WordPiece Tokens Grid */}
      <div className="tokens-section">
        <div className="tokens-header">
          <span>Active WordPiece Tokens (uncased representation):</span>
          <span className="tokens-note">Showing first 32 of {trace.token_count} tokens</span>
        </div>

        <div className="tokens-grid">
          {tokens.map((tok, idx) => {
            const isVisible = idx <= visibleTokensCount;
            const isSpecial = tok === "[CLS]" || tok === "[SEP]";
            const isSubword = tok.startsWith("##");

            return (
              <span
                key={`${tok}-${idx}`}
                className={`token-chip ${isVisible ? "visible" : "hidden"} ${
                  isSpecial ? "special" : isSubword ? "subword" : ""
                }`}
                style={{
                  transitionDelay: `${idx * 0.03}s`,
                }}
              >
                {tok}
                {isSubword && <span className="subword-dot" title="Rare word split into piece">•</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Flow arrow to Phase 2 */}
      <div className="phase-flow-connector">
        <div className="pulse-track">
          <div
            className="pulse-ball"
            style={{
              left: `${Math.min(Math.max((currentTime - 3.5) / 1.5, 0), 1) * 100}%`,
            }}
          ></div>
        </div>
        <span className="flow-label">Entering MiniLM-L6 Self-Attention Transformer &rarr;</span>
      </div>
    </div>
  );
};
