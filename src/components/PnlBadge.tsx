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
        "inline-flex items-center rounded-md px-2 py-0.5 font-body text-[14px] font-semibold tracking-data tabular-nums",
        isZero
          ? "bg-muted text-muted-foreground"
          : isPositive
            ? "text-primary"
            : "text-[hsl(0_100%_67%)]",
        className
      )}
    >
      {isPositive ? "+" : ""}
      {pnl.toFixed(2)} SOL
    </span>
  );
});
PnlBadge.displayName = "PnlBadge";
