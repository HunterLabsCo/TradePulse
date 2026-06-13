import type { EmotionalState } from "@/lib/sample-data";
import { emotionColor, emotionLabel } from "@/lib/emotion-utils";
import React from "react";

export const EmotionBadge = React.forwardRef<
  HTMLSpanElement,
  { emotion: EmotionalState; className?: string }
>(({ emotion, className }, ref) => {
  const { color, bg } = emotionColor(emotion);

  return (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-[3px] px-[8px] py-[3px] font-mono text-[10px] font-medium tracking-[0.06em] ${className ?? ""}`}
      style={{ color, background: bg, border: `1px solid ${color}55` }}
    >
      {emotionLabel(emotion)}
    </span>
  );
});
EmotionBadge.displayName = "EmotionBadge";
