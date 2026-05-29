import type { CSSProperties, ReactNode } from "react";

interface PillProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  border?: boolean;
  className?: string;
}

export function Pill({ children, color, bg, border = true, className = "" }: PillProps) {
  const resolvedColor = color ?? "#7a8a75";
  const style: CSSProperties = {
    color: resolvedColor,
    lineHeight: 1.4,
  };
  if (bg) style.background = bg;
  if (border) style.border = `1px solid ${resolvedColor}55`;

  return (
    <span
      className={`inline-block font-mono text-[10px] font-medium tracking-[0.06em] py-[3px] px-2 rounded-[3px] whitespace-nowrap ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
