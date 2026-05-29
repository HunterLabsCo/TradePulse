import type { CSSProperties, ReactNode } from "react";

interface LabelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function Label({ children, className = "", style }: LabelProps) {
  return (
    <div
      className={`font-mono text-[10px] font-medium tracking-[0.14em] uppercase text-mist-text-dim ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
