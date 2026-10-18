import { scaleDiverging } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

/**
 * Diverging color scale for 384-D vector dimension heatmap.
 * Negative activations: deep purple/violet (#7C3AED -> #4C1D95)
 * Center zero: neutral ivory card tone (#F3F4F6)
 * Positive activations: electric deep sky blue (#0284C7 -> #0C4A6E)
 */
export function getVectorColorScale(maxAbs: number = 0.15) {
  const domainMax = Math.max(0.08, maxAbs);
  return scaleDiverging<string>()
    .domain([-domainMax, 0, domainMax])
    .interpolator((t: number) => {
      if (t < 0.5) {
        // -domainMax to 0: Purple to Neutral
        const subT = t * 2; // 0 to 1
        return interpolateRgb("#581C87", "#F1F2ED")(subT);
      } else {
        // 0 to +domainMax: Neutral to Electric Blue
        const subT = (t - 0.5) * 2; // 0 to 1
        return interpolateRgb("#F1F2ED", "#0369A1")(subT);
      }
    });
}

export const ROLE_THEME_COLORS: Record<string, string> = {
  SWE_BACKEND: "#0284C7",
  SWE_FRONTEND: "#EC4899",
  FULLSTACK_DEV: "#6366F1",
  AIML_ENGINEER: "#8B5CF6",
  DATA_ENGINEER: "#10B981",
  DEVOPS_CLOUD: "#F59E0B",
  DATA_ANALYST: "#14B8A6",
  CYBERSECURITY: "#EF4444",
  PRODUCT_MANAGER: "#F97316",
  EMBEDDED_IOT: "#64748B",
};
