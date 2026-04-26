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
    return <p className="font-body text-xs font-300 text-muted-foreground italic">No exits logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div key={ev.id} className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-body text-xs font-400 text-foreground">{EXIT_TYPE_LABELS[ev.exitType] ?? ev.exitType}</span>
            <span
              className={`font-body text-xs font-300 tabular-nums tracking-data ${
                ev.pnlPercent >= 0 ? "text-primary" : "text-red-action"
              }`}
            >
              {ev.pnlPercent > 0 ? "+" : ""}{ev.pnlPercent}%
            </span>
          </div>
          <div className="flex items-center gap-3 font-body text-[10px] font-300 text-muted-foreground">
            <span>{ev.percentClosed}% closed</span>
            <span className="tabular-nums tracking-data text-accent">{new Date(ev.timestamp).toLocaleString()}</span>
          </div>
          {ev.note && (
            <p className="mt-2 font-body text-xs font-300 leading-relaxed text-muted-foreground italic">"{ev.note}"</p>
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
