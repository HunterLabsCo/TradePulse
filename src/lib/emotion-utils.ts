import type { EmotionalState } from "@/lib/sample-data";

export const POSITIVE_EMOTIONS = new Set<string>([
  "confident", "calm", "focused", "patient", "in-the-zone", "disciplined", "sharp",
]);
export const NEGATIVE_EMOTIONS = new Set<string>([
  "anxious", "nervous", "rushed", "frustrated", "revenge-mindset", "greedy",
  "fearful", "overconfident", "fomo", "impulsive", "euphoric",
]);

export function emotionColor(e: EmotionalState): { color: string; bg: string } {
  if (POSITIVE_EMOTIONS.has(e)) return { color: "#a8d4ad", bg: "rgba(168,212,173,0.08)" };
  if (NEGATIVE_EMOTIONS.has(e)) return { color: "#e89a8a", bg: "rgba(232,154,138,0.08)" };
  return { color: "#8ec2dd", bg: "rgba(142,194,221,0.08)" };
}

const EMOTION_LABELS: Record<string, string> = {
  "in-the-zone": "In the Zone",
  "revenge-mindset": "Revenge",
  fomo: "FOMO",
};

export function emotionLabel(e: EmotionalState): string {
  return EMOTION_LABELS[e] ?? e.charAt(0).toUpperCase() + e.slice(1).replace(/-/g, " ");
}
