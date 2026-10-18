"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { useLabStore, PlaybackSpeed } from "@/lib/lab/store";
import { PHASES, TOTAL_DURATION } from "@/lib/lab/phases";
import { fetchPresetBundle, PRESET_LIST } from "@/lib/lab/presets";
import { TraceResponse } from "@/types/trace";
import { ControlBar } from "./ControlBar";
import { Telemetry } from "./Telemetry";
import { Caption } from "./Caption";
import { OutputDock } from "./OutputDock";
import { CustomSandboxModal } from "./CustomSandboxModal";
import { Phase1Tokens } from "./phases/Phase1Tokens";
import { Phase2Embedding } from "./phases/Phase2Embedding";
import { Phase3Network } from "./phases/Phase3Network";
import { Phase4Softmax } from "./phases/Phase4Softmax";
import { Phase5Results } from "./phases/Phase5Results";

export const LabShell: React.FC = () => {
  const {
    trace,
    setTrace,
    presetId,
    setPresetId,
    speed,
    setSpeed,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    activePhase,
    isCustomModalOpen,
    setIsCustomModalOpen,
    isOffline,
    setIsOffline,
  } = useLabStore();

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [loadingPreset, setLoadingPreset] = useState<boolean>(true);

  // Initialize master GSAP timeline
  const initMasterTimeline = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: "none" },
      onUpdate: () => {
        const t = tl.time();
        setCurrentTime(t);
      },
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    for (const p of PHASES) {
      tl.addLabel(p.id, p.start);
    }

    const dummy = { val: 0 };
    tl.to(dummy, {
      val: TOTAL_DURATION,
      duration: TOTAL_DURATION,
      ease: "none",
    }, 0);

    tl.timeScale(speed);
    timelineRef.current = tl;
  }, [setCurrentTime, setIsPlaying, speed]);

  // Load preset data
  const loadPreset = useCallback(
    async (id: string) => {
      setLoadingPreset(true);
      try {
        const bundle = await fetchPresetBundle(id);
        setTrace(bundle.trace);
        setPresetId(id);
        setIsOffline(false);

        // Reset timeline to beginning and auto-play
        if (timelineRef.current) {
          timelineRef.current.pause(0);
          timelineRef.current.play(0);
          setIsPlaying(true);
        }
      } catch (err) {
        console.warn("Local preset fetch fallback triggered:", err);
        setIsOffline(true);
      } finally {
        setLoadingPreset(false);
      }
    },
    [setPresetId, setTrace, setIsOffline, setIsPlaying]
  );

  // Initial load
  useEffect(() => {
    initMasterTimeline();
    loadPreset(presetId);

    return () => {
      timelineRef.current?.kill();
    };
  }, [initMasterTimeline, loadPreset, presetId]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (!timelineRef.current) return;
    if (isPlaying) {
      timelineRef.current.pause();
      setIsPlaying(false);
    } else {
      if (timelineRef.current.time() >= TOTAL_DURATION) {
        timelineRef.current.restart();
      } else {
        timelineRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  // Handle Timeline Seek
  const handleSeek = (timeSeconds: number) => {
    if (!timelineRef.current) return;
    const clamped = Math.max(0, Math.min(timeSeconds, TOTAL_DURATION));
    timelineRef.current.seek(clamped);
    setCurrentTime(clamped);
  };

  // Handle Speed Change
  const handleSetSpeed = (newSpeed: PlaybackSpeed) => {
    setSpeed(newSpeed);
    if (timelineRef.current) {
      timelineRef.current.timeScale(newSpeed);
    }
  };

  // Handle Restart
  const handleRestart = () => {
    if (!timelineRef.current) return;
    timelineRef.current.restart();
    setIsPlaying(true);
  };

  // Handle Skip to End (Instant)
  const handleSkipToEnd = () => {
    if (!timelineRef.current) return;
    timelineRef.current.progress(1);
    setCurrentTime(TOTAL_DURATION);
    setIsPlaying(false);
  };

  // Handle Custom Trace from Modal
  const handleCustomTraceLoaded = (customTrace: TraceResponse) => {
    setTrace(customTrace);
    setPresetId("custom");
    if (timelineRef.current) {
      timelineRef.current.restart();
      setIsPlaying(true);
    }
  };

  // Keyboard controls (Space = Play/Pause, Left/Right = Seek, R = Restart)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleSeek(Math.max(0, currentTime - 2));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleSeek(Math.min(TOTAL_DURATION, currentTime + 2));
      } else if (e.code === "KeyR") {
        e.preventDefault();
        handleRestart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="lab-shell-root">
      {/* 1. Top Control Bar */}
      <ControlBar
        onSeek={handleSeek}
        onTogglePlay={handleTogglePlay}
        onSetSpeed={handleSetSpeed}
        onRestart={handleRestart}
        onSkipToEnd={handleSkipToEnd}
        onSelectPreset={loadPreset}
        onOpenCustom={() => setIsCustomModalOpen(true)}
      />

      {/* 2. Main Studio Stage & Telemetry Split Grid */}
      <div className="lab-main-grid">
        <div className="lab-stage-canvas">
          {loadingPreset ? (
            <div className="lab-loading-screen">
              <div className="spinner"></div>
              <p>Initializing Real-Time PyTorch Model Trace...</p>
            </div>
          ) : (
            <>
              {activePhase.id === "tokens" && <Phase1Tokens />}
              {activePhase.id === "vectors" && <Phase2Embedding />}
              {activePhase.id === "network" && <Phase3Network />}
              {activePhase.id === "softmax" && <Phase4Softmax />}
              {activePhase.id === "results" && <Phase5Results />}
            </>
          )}

          {/* Subtitle / Story Caption Dock */}
          <Caption />
        </div>

        {/* Right Sidebar: Real Model Telemetry */}
        <div className="lab-sidebar-telemetry">
          <Telemetry />
        </div>
      </div>

      {/* 3. Bottom Output Summary Dock */}
      <OutputDock />

      {/* 4. Custom Sandbox Modal */}
      {isCustomModalOpen && (
        <CustomSandboxModal
          onCustomTraceLoaded={handleCustomTraceLoaded}
          onClose={() => setIsCustomModalOpen(false)}
        />
      )}
    </div>
  );
};
