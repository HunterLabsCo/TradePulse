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
    <div className="rounded-xl bg-card p-4 space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
      <div className="flex items-center gap-3">
        <span
          className={`text-lg font-bold tabular-nums ${
            totalPnl >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {totalPnl > 0 ? "+" : ""}{totalPnl.toFixed(1)}%
        </span>
        {!fullyAccounted && (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
            <AlertTriangle className="h-3 w-3" />
            Position not fully accounted for
          </span>
        )}
      </div>
      <div className="flex gap-4 text-[11px] text-muted-foreground">
        <span>{exitEvents.length} exit{exitEvents.length !== 1 ? "s" : ""}</span>
        {duration && <span>{duration}</span>}
      </div>
    </div>
  );
}
