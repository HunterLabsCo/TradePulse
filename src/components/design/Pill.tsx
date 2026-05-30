import React from 'react';
interface PillProps { children: React.ReactNode; color?: string; bg?: string; border?: boolean; className?: string; }
export function Pill({ children, color = '#7a8a75', bg, border = true }: PillProps) {
  return <span className="font-mono text-[10px] font-medium tracking-[0.06em] rounded-[3px] whitespace-nowrap leading-[1.4] inline-block" style={{ color, background: bg ?? 'transparent', border: `1px solid ${border ? `${color}55` : 'transparent'}`, padding: '3px 8px' }}>{children}</span>;
}
