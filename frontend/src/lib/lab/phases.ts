export interface PhaseConfig {
  id: "tokens" | "vectors" | "network" | "softmax" | "results";
  number: string;
  label: string;
  shortTitle: string;
  dur: number;
  start: number;
  storyCaption: string;
  labCaption: string;
}

export const PHASES: readonly PhaseConfig[] = [
  {
    id: "tokens",
    number: "01",
    label: "01 Tokens",
    shortTitle: "Tokenization",
    dur: 5,
    start: 0,
    storyCaption:
      "The computer can't read a profile directly. First we turn it into one canonical sentence, then cut it into small pieces called tokens.",
    labCaption:
      "Deterministic text canonicalization followed by WordPiece subword tokenization with [CLS] and [SEP] positional delimiters.",
  },
  {
    id: "vectors",
    number: "02",
    label: "02 Vectors",
    shortTitle: "Embedding",
    dur: 6,
    start: 5,
    storyCaption:
      "Each piece looks at the others to understand context. Everything is then squeezed into 384 numbers: a mathematical fingerprint of this student.",
    labCaption:
      "all-MiniLM-L6-v2 multi-head attention contextual encoding, sequence mean-pooling, and Euclidean L2-normalization onto S³⁸³.",
  },
  {
    id: "network",
    number: "03",
    label: "03 Network",
    shortTitle: "CareerMLP",
    dur: 8,
    start: 11,
    storyCaption:
      "The fingerprint passes through three neural filters that learned, from thousands of past engineering dossiers, which patterns point to which careers.",
    labCaption:
      "PyTorch CareerMLP forward propagation in eval mode: Linear(384→512) → Linear(512→256) → Linear(256→128) with BatchNorm1d & GELU activations.",
  },
  {
    id: "softmax",
    number: "04",
    label: "04 Softmax",
    shortTitle: "Softmax",
    dur: 5,
    start: 19,
    storyCaption:
      "The model gives a raw score to each career. We turn those scores into percentages that add up to exactly 100%.",
    labCaption:
      "Linear projection to 10 class logits z_i followed by Softmax normalisation: P(y_i) = exp(z_i) / Σ exp(z_j).",
  },
  {
    id: "results",
    number: "05",
    label: "05 Results",
    shortTitle: "Multi-Role Mix",
    dur: 6,
    start: 24,
    storyCaption:
      "Most students fit more than one career. Here is the realistic multi-role breakdown for this profile.",
    labCaption:
      "Rank-ordered probability distribution and multi-dimensional 5-pillar skill radar synthesis.",
  },
] as const;

export const TOTAL_DURATION = PHASES.reduce((acc, p) => acc + p.dur, 0); // Exactly 30 seconds

export function getPhaseByTime(seconds: number): PhaseConfig {
  const clamped = Math.max(0, Math.min(seconds, TOTAL_DURATION));
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (clamped >= PHASES[i].start) {
      return PHASES[i];
    }
  }
  return PHASES[0];
}
