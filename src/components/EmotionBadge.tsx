import { cn } from "@/lib/utils";
import type { EmotionalState } from "@/lib/sample-data";

const EMOTION_COLORS: Record<string, string> = {
  // Positive
  confident: "bg-emerald-500/20 text-emerald-400",
  calm: "bg-teal-500/20 text-teal-400",
  focused: "bg-sky-500/20 text-sky-400",
  patient: "bg-cyan-500/20 text-cyan-400",
  "in-the-zone": "bg-emerald-500/20 text-emerald-300",
  // Negative
  anxious: "bg-amber-500/20 text-amber-400",
  nervous: "bg-orange-500/20 text-orange-400",
  rushed: "bg-red-500/20 text-red-400",
  frustrated: "bg-red-600/20 text-red-400",
  "revenge-mindset": "bg-rose-600/20 text-rose-400",
  greedy: "bg-yellow-500/20 text-yellow-400",
  fearful: "bg-violet-500/20 text-violet-400",
  overconfident: "bg-amber-600/20 text-amber-400",
  // Situational
  fomo: "bg-orange-600/20 text-orange-300",
  distracted: "bg-zinc-500/20 text-zinc-400",
  interrupted: "bg-zinc-600/20 text-zinc-400",
  uncertain: "bg-slate-500/20 text-slate-400",
  conflicted: "bg-purple-500/20 text-purple-400",
  // Extended
  disciplined: "bg-emerald-600/20 text-emerald-300",
  hesitant: "bg-slate-400/20 text-slate-400",
  impulsive: "bg-rose-500/20 text-rose-400",
  euphoric: "bg-pink-500/20 text-pink-400",
  detached: "bg-zinc-400/20 text-zinc-400",
  sharp: "bg-sky-600/20 text-sky-300",
  tired: "bg-stone-500/20 text-stone-400",
};

const LABELS: Record<string, string> = {
  "in-the-zone": "In the Zone",
  "revenge-mindset": "Revenge",
  fomo: "FOMO",
  detached: "Detached / Numb",
  sharp: "Sharp / Clear",
  tired: "Tired / Fatigued",
};

import React from "react";

export const EmotionBadge = React.forwardRef<
  HTMLSpanElement,
  { emotion: EmotionalState; className?: string }
>(({ emotion, className }, ref) => {
  const color = EMOTION_COLORS[emotion] ?? "bg-muted text-muted-foreground";
  const label = LABELS[emotion] ?? emotion.charAt(0).toUpperCase() + emotion.slice(1);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        color,
        className
      )}
    >
      {label}
    </span>
  );
});
EmotionBadge.displayName = "EmotionBadge";
