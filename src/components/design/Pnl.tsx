import React from 'react';

type PnlSize = 'sm' | 'md' | 'lg' | 'xl';

interface PnlProps {
  pnl: number | null;
  size?: PnlSize;
}

const sizes: Record<PnlSize, { main: number; sub: number }> = {
  sm: { main: 12, sub: 9 },
  md: { main: 16, sub: 11 },
  lg: { main: 28, sub: 16 },
  xl: { main: 56, sub: 24 },
};

export function Pnl({ pnl, size = 'md' }: PnlProps) {
  const { main, sub } = sizes[size];

  if (pnl === null) {
    return (
      <span className="font-mono font-medium text-[#8ec2dd]" style={{ fontSize: main }}>
        OPEN
      </span>
    );
  }

  const isWin = pnl > 0;
  const color = isWin ? '#a8d4ad' : '#e89a8a';
  const prefix = isWin ? '+' : '';

  return (
    <span
      className="font-sans font-medium tabular-nums tracking-[-0.02em] leading-none"
      style={{ color, fontSize: main }}
    >
      {prefix}{pnl.toFixed(2)}
      <span className="ml-0.5 text-[#7a8a75]" style={{ fontSize: sub }}>R</span>
    </span>
  );
}
