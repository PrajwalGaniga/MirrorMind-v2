"use client";

import React from "react";
import { useLabStore, LabMode, PlaybackSpeed } from "@/lib/lab/store";
import { PHASES, TOTAL_DURATION } from "@/lib/lab/phases";
import { PRESET_LIST } from "@/lib/lab/presets";

interface ControlBarProps {
  onSeek: (timeSeconds: number) => void;
  onTogglePlay: () => void;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onRestart: () => void;
  onSkipToEnd: () => void;
  onSelectPreset: (id: string) => void;
  onOpenCustom: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onSeek,
  onTogglePlay,
  onSetSpeed,
  onRestart,
  onSkipToEnd,
  onSelectPreset,
  onOpenCustom,
}) => {
  const {
    currentTime,
    isPlaying,
    speed,
    mode,
    setMode,
    presetId,
    activePhase,
  } = useLabStore();

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  return (
    <div className="lab-control-bar">
      {/* 1. Breadcrumb Phase Navigator Strip */}
      <div className="breadcrumb-strip">
        <span className="strip-title">PIPELINE FLOW:</span>
        <div className="strip-steps">
          {PHASES.map((p, idx) => {
            const isActive = activePhase.id === p.id;
            const isPassed = currentTime >= p.start + p.dur;

            return (
              <React.Fragment key={p.id}>
                <button
                  onClick={() => onSeek(p.start)}
                  className={`breadcrumb-step-btn ${isActive ? "active" : isPassed ? "passed" : ""}`}
                >
                  <span className="step-num">{p.number}</span>
                  <span className="step-txt">{p.shortTitle}</span>
                </button>
                {idx < PHASES.length - 1 && <span className="step-separator">&rarr;</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 2. Preset Archetypes & Custom Selector */}
      <div className="presets-bar">
        <span className="presets-label">STUDENT DOSSIERS:</span>
        <div className="presets-scroll">
          {PRESET_LIST.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              className={`preset-pill-btn ${presetId === p.id ? "active" : ""}`}
              title={p.tagline}
            >
              <span className="preset-name">{p.name}</span>
              <span className="preset-split">{p.expectedTop}</span>
            </button>
          ))}
          <button onClick={onOpenCustom} className="preset-pill-btn custom-btn">
            <span>+ Custom Sandbox</span>
          </button>
        </div>
      </div>

      {/* 3. Player Transport & Scrubber Bar */}
      <div className="transport-bar">
        {/* Play/Pause & Replay Buttons */}
        <div className="transport-buttons">
          <button
            onClick={onTogglePlay}
            className={`play-btn ${isPlaying ? "playing" : "paused"}`}
            title={isPlaying ? "Pause Timeline (Space)" : "Play Timeline (Space)"}
          >
            {isPlaying ? "⏸ Pause" : "▶ Play Lab"}
          </button>

          <button onClick={onRestart} className="icon-btn" title="Restart from 0s">
            ↺ Replay
          </button>

          <button onClick={onSkipToEnd} className="icon-btn" title="Skip to Final Results">
            ⏩ Instant
          </button>
        </div>

        {/* Range Scrubber */}
        <div className="scrubber-wrap">
          <input
            type="range"
            min={0}
            max={TOTAL_DURATION}
            step={0.1}
            value={currentTime}
            onChange={handleScrubberChange}
            className="timeline-scrubber"
          />
          <div className="time-display mono">
            <span className="cur-time">{currentTime.toFixed(1)}s</span>
            <span className="tot-time">/ {TOTAL_DURATION}.0s</span>
          </div>
        </div>

        {/* Playback Speed Controls */}
        <div className="speed-toggles">
          <span className="speed-lbl">Speed:</span>
          {([0.5, 1, 2] as const).map((s) => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`speed-btn ${speed === s ? "active" : ""}`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Mode Selector Toggle: Story Mode (Default) vs Lab Mode */}
        <div className="mode-toggle-group">
          <button
            onClick={() => setMode("story")}
            className={`mode-btn ${mode === "story" ? "active" : ""}`}
            title="Non-IT Story Mode with Plain-Language Explanations"
          >
            📖 Story Mode
          </button>
          <button
            onClick={() => setMode("lab")}
            className={`mode-btn ${mode === "lab" ? "active" : ""}`}
            title="Technical Lab Mode with Math & Tensor Dimensions"
          >
            🔬 Lab Mode
          </button>
        </div>
      </div>
    </div>
  );
};
