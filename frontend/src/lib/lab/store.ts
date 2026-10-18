import { create } from "zustand";
import { TraceResponse } from "@/types/trace";
import { getPhaseByTime, PhaseConfig, PHASES } from "./phases";
import { PRESET_LIST } from "./presets";

export type LabMode = "story" | "lab";
export type PlaybackSpeed = 0.5 | 1 | 2;

interface LabState {
  trace: TraceResponse | null;
  presetId: string;
  mode: LabMode;
  speed: PlaybackSpeed;
  currentTime: number;
  isPlaying: boolean;
  activePhase: PhaseConfig;
  isCustomModalOpen: boolean;
  isOffline: boolean;

  // Actions
  setTrace: (trace: TraceResponse) => void;
  setPresetId: (id: string) => void;
  setMode: (mode: LabMode) => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsCustomModalOpen: (open: boolean) => void;
  setIsOffline: (offline: boolean) => void;
}

export const useLabStore = create<LabState>((set, get) => ({
  trace: null,
  presetId: PRESET_LIST[0].id,
  mode: "story", // Default to Story Mode for non-IT accessibility
  speed: 1,
  currentTime: 0,
  isPlaying: false,
  activePhase: PHASES[0],
  isCustomModalOpen: false,
  isOffline: false,

  setTrace: (trace) => set({ trace }),
  setPresetId: (presetId) => set({ presetId }),
  setMode: (mode) => set({ mode }),
  setSpeed: (speed) => set({ speed }),
  setCurrentTime: (currentTime) => {
    const phase = getPhaseByTime(currentTime);
    set({ currentTime, activePhase: phase });
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsCustomModalOpen: (isCustomModalOpen) => set({ isCustomModalOpen }),
  setIsOffline: (isOffline) => set({ isOffline }),
}));
