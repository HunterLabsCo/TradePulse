import type { ReactNode } from "react";

interface KbdProps {
  children: ReactNode;
}

export function Kbd({ children }: KbdProps) {
  return (
    <span className="inline-block py-px px-[5px] bg-mist-bg-sunk border border-mist-border text-mist-text-dim font-mono text-[9.5px] font-medium tracking-[0.04em] leading-[1.4] rounded-[2px]">
      {children}
    </span>
  );
}
