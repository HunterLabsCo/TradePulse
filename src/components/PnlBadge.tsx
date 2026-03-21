import React from "react";
import { cn } from "@/lib/utils";

export const PnlBadge = React.forwardRef<
  HTMLSpanElement,
  { pnl: number; className?: string }
>(({ pnl, className }, ref) => {
  const isPositive = pnl > 0;
  const isZero = pnl === 0;

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums tracking-tight",
        isZero
          ? "bg-muted text-muted-foreground"
          : isPositive
            ? "bg-primary/15 text-primary"
            : "bg-[hsl(0,100%,60%)]/15 text-[hsl(0,100%,60%)]",
        className
      )}
    >
      {isPositive ? "+" : ""}
      {pnl.toFixed(2)} SOL
    </span>
  );
});
PnlBadge.displayName = "PnlBadge";
