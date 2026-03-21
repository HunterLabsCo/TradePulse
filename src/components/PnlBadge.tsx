import { cn } from "@/lib/utils";

export function PnlBadge({ pnl, className }: { pnl: number; className?: string }) {
  const isPositive = pnl > 0;
  const isZero = pnl === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums tracking-tight",
        isZero
          ? "bg-muted text-muted-foreground"
          : isPositive
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-red-500/15 text-red-400",
        className
      )}
    >
      {isPositive ? "+" : ""}
      {pnl.toFixed(2)} SOL
    </span>
  );
}
