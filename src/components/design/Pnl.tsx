interface PnlProps {
  pnl: number | null;
  size?: "sm" | "md" | "lg" | "xl";
}

const FONT_SIZE = { sm: 12, md: 16, lg: 28, xl: 56 } as const;
const SUB_SIZE = { sm: 9, md: 11, lg: 16, xl: 24 } as const;

export function Pnl({ pnl, size = "md" }: PnlProps) {
  if (pnl == null) {
    return (
      <span
        className="font-mono font-medium text-mist-primary"
        style={{ fontSize: FONT_SIZE[size] }}
      >
        OPEN
      </span>
    );
  }

  const isWin = pnl > 0;
  const color = isWin ? "var(--mist-win)" : "var(--mist-loss)";
  const prefix = isWin ? "+" : "";

  return (
    <span
      className="font-sans font-medium tabular-nums tracking-[-0.02em] leading-none"
      style={{ fontSize: FONT_SIZE[size], color }}
    >
      {prefix}
      {pnl.toFixed(2)}
      <span
        className="text-mist-text-dim ml-0.5"
        style={{ fontSize: SUB_SIZE[size] }}
      >
        R
      </span>
    </span>
  );
}
