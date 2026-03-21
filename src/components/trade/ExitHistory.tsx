import { EmotionBadge } from "@/components/EmotionBadge";
import type { ExitEvent } from "@/lib/sample-data";

const EXIT_TYPE_LABELS: Record<string, string> = {
  "take-profit": "Take Profit",
  "stop-loss": "Stop Loss",
  "partial-exit": "Partial Exit",
  "full-exit": "Full Exit",
  "moon-bag": "Moon Bag",
};

export function ExitHistory({ events }: { events: ExitEvent[] }) {
  if (events.length === 0) {
    return <p className="text-xs text-muted-foreground italic">No exits logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div key={ev.id} className="rounded-lg bg-background p-3 border border-border/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">{EXIT_TYPE_LABELS[ev.exitType] ?? ev.exitType}</span>
            <span
              className={`text-xs font-bold tabular-nums ${
                ev.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {ev.pnlPercent > 0 ? "+" : ""}{ev.pnlPercent}%
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>{ev.percentClosed}% closed</span>
            <span className="tabular-nums">{new Date(ev.timestamp).toLocaleString()}</span>
          </div>
          {ev.note && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground italic">"{ev.note}"</p>
          )}
          {ev.emotionalState.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {ev.emotionalState.map((e) => (
                <EmotionBadge key={e} emotion={e} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
