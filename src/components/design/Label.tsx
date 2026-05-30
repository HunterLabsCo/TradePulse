import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Label({ children, className = '', style }: LabelProps) {
  return (
    <span
      className={`font-mono text-[10px] font-medium tracking-[0.14em] uppercase text-[#7a8a75] ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
