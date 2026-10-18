import gsap from "gsap";
import { PHASES, TOTAL_DURATION } from "./phases";
import { useLabStore } from "./store";

export interface MasterTimelineInstance {
  tl: gsap.core.Timeline;
  destroy: () => void;
}

export function createMasterTimeline(onUpdateProgress?: (t: number) => void): gsap.core.Timeline {
  const tl = gsap.timeline({
    paused: true,
    defaults: { ease: "none" },
    onUpdate: () => {
      const time = tl.time();
      if (onUpdateProgress) {
        onUpdateProgress(time);
      }
    },
    onComplete: () => {
      useLabStore.getState().setIsPlaying(false);
    },
  });

  // Add phase labels at exact second markers (0s, 5s, 11s, 19s, 24s)
  for (const phase of PHASES) {
    tl.addLabel(phase.id, phase.start);
  }

  // Linear master cursor tween spanning exactly 30.0 seconds
  const dummy = { t: 0 };
  tl.to(dummy, {
    t: TOTAL_DURATION,
    duration: TOTAL_DURATION,
    ease: "none",
  }, 0);

  return tl;
}
