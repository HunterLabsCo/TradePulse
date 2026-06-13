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
    return <p className="font-mono text-[11px] text-[#7a8a75] italic">No exits logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div key={ev.id} className="rounded-[4px] bg-[#161c19] border border-[#222a25] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-sans text-xs font-medium text-[#d8e0d2]">{EXIT_TYPE_LABELS[ev.exitType] ?? ev.exitType}</span>
            <span
              className={`font-mono text-xs tabular-nums tracking-[0.04em] ${
                ev.pnlPercent >= 0 ? "text-[#a8d4ad]" : "text-[#e89a8a]"
              }`}
            >
              {ev.pnlPercent > 0 ? "+" : ""}{ev.pnlPercent}%
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-[#7a8a75]">
            <span>{ev.percentClosed}% closed</span>
            <span className="tabular-nums tracking-[0.04em] text-[#8ec2dd]">{new Date(ev.timestamp).toLocaleString()}</span>
          </div>
          {ev.note && (
            <p className="mt-2 font-sans text-xs leading-relaxed text-[#7a8a75] italic">"{ev.note}"</p>
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
