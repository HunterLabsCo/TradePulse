import type { Trade } from "@/lib/sample-data";
import { Pnl } from "./Pnl";

interface TradeRowFullProps {
  trade: Trade;
  idx: number;
  last?: boolean;
}

function dotColor(pnl: number | null): string {
  if (pnl == null) return "var(--mist-primary)";
  return pnl >= 0 ? "var(--mist-win)" : "var(--mist-loss)";
}

function formatWhen(entryTime: string): string {
  const d = new Date(entryTime);
  if (isNaN(d.getTime())) return entryTime;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function TradeRowFull({ trade, idx, last = false }: TradeRowFullProps) {
  const pnl = trade.status === "open" ? null : trade.finalPnl ?? null;
  const interrupted = trade.interruptionStatus === "interrupted";
  const setup = trade.setupType ?? "—";
  const mc = trade.entryMarketCap ?? "—";
  const when = formatWhen(trade.entryTime);

  return (
    <div
      className={`flex items-center gap-[14px] py-[16px] ${last ? "" : "border-b border-mist-border"}`}
    >
      <div className="w-[22px] text-right font-mono text-[10px] text-mist-text-dim shrink-0">
        {(idx + 1).toString().padStart(2, "0")}
      </div>
      <div
        className="w-[6px] h-[6px] rounded-[3px] shrink-0"
        style={{ background: dotColor(pnl) }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[16px] font-medium text-mist-text tracking-[-0.01em]">
            {trade.tokenName}
          </span>
          <span className="font-mono text-[10px] text-mist-text-dim">· {trade.chain}</span>
          {interrupted && (
            <span className="font-mono text-[9px] text-mist-loss tracking-[0.1em]">INT</span>
          )}
        </div>
        <div className="font-mono text-[10.5px] text-mist-text-dim mt-0.5">
          {setup} · {mc} · {when}
        </div>
      </div>
      <Pnl pnl={pnl} size="md" />
    </div>
  );
}
