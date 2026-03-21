import { AlertTriangle } from "lucide-react";
import type { ExitEvent } from "@/lib/sample-data";

interface TradeSummaryProps {
  exitEvents: ExitEvent[];
  entryTime: string;
  closedAt?: string;
}

export function TradeSummary({ exitEvents, entryTime, closedAt }: TradeSummaryProps) {
  if (exitEvents.length === 0) return null;

  const totalPercentClosed = exitEvents.reduce((s, e) => s + e.percentClosed, 0);
  const totalPnl = exitEvents.reduce(
    (s, e) => s + (e.pnlPercent * e.percentClosed) / 100,
    0
  );
  const fullyAccounted = Math.abs(totalPercentClosed - 100) < 0.01;

  let duration = "";
  if (closedAt) {
    const ms = new Date(closedAt).getTime() - new Date(entryTime).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) duration = `${mins}m`;
    else if (mins < 1440) duration = `${Math.floor(mins / 60)}h ${mins % 60}m`;
    else duration = `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h`;
  }

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-2">
      <p className="section-label">Summary</p>
      <div className="flex items-center gap-3">
        <span
          className={`font-display text-lg font-600 tabular-nums tracking-data ${
            totalPnl >= 0 ? "text-primary" : "text-red-action"
          }`}
        >
          {totalPnl > 0 ? "+" : ""}{totalPnl.toFixed(1)}%
        </span>
        {!fullyAccounted && (
          <span className="flex items-center gap-1 font-body text-[10px] font-400 text-amber-400">
            <AlertTriangle className="h-3 w-3" />
            Position not fully accounted for
          </span>
        )}
      </div>
      <div className="flex gap-4 font-body text-[11px] font-300 text-muted-foreground">
        <span>{exitEvents.length} exit{exitEvents.length !== 1 ? "s" : ""}</span>
        {duration && <span>{duration}</span>}
      </div>
    </div>
  );
}
