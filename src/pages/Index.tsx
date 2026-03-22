import { useNavigate } from "react-router-dom";
import { Mic, ChevronRight } from "lucide-react";
import { useTradeStore } from "@/lib/trade-store";
import { PnlBadge } from "@/components/PnlBadge";
import { EmotionBadge } from "@/components/EmotionBadge";
import { cn } from "@/lib/utils";

const FREE_LIMIT = 20;

export default function Index() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const nonDemoCount = useTradeStore((s) => s.getNonDemoTradeCount());

  const closedTrades = trades.filter((t) => t.status === "closed" && t.finalPnl !== undefined);
  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter((t) => (t.finalPnl ?? 0) > 0).length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const avgPnl =
    totalTrades > 0
      ? closedTrades.reduce((sum, t) => sum + (t.finalPnl ?? 0), 0) / totalTrades
      : 0;

  const recentTrades = trades.slice(0, 10);

  return (
    <div className="flex min-h-screen flex-col pb-24">
      {/* Header */}
      <header className="px-5 pt-safe-top">
        <div className="relative flex items-center justify-center py-4">
          <div className="text-center">
            <h1 className="font-display text-[32px] font-[800] tracking-[-0.01em]">
              <span className="text-primary">Trade</span><span className="text-[hsl(var(--blue-accent))]">Pulse</span>
            </h1>
            <p className="mx-auto max-w-[300px] font-body text-[13px] font-normal leading-[1.5] text-[hsl(var(--text-secondary))]">
              Built for active traders. Log your trades on the go — no typing, no friction.
            </p>
          </div>
          {nonDemoCount < FREE_LIMIT && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded-xl bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border-default))] px-3 py-1.5 text-right">
              <p className="section-label">Free trades</p>
              <p className="font-display text-[18px] font-semibold tabular-nums tracking-data text-foreground">
                {nonDemoCount} <span className="font-body font-light text-muted-foreground">/ {FREE_LIMIT}</span>
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3 px-5 pb-4">
        {[
          { label: "Trades", value: totalTrades.toString(), highlight: false },
          { label: "Win Rate", value: `${winRate}%`, highlight: winRate > 0 },
          { label: "Avg PnL", value: `${avgPnl >= 0 ? "+" : ""}${avgPnl.toFixed(2)}`, highlight: avgPnl > 0 },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="section-label">{label}</p>
            <p className={cn(
              "mt-0.5 font-display text-[28px] font-bold tabular-nums leading-none tracking-data",
              highlight ? "text-primary" : "text-foreground"
            )}>{value}</p>
          </div>
        ))}
      </section>

      {/* Recent Trades */}
      <section className="flex-1 px-5">
        <h2 className="section-label mb-3">Recent Trades</h2>
        <div className="space-y-2">
          {recentTrades.map((trade) => (
            <button
              key={trade.id}
              onClick={() => navigate(`/trade/${trade.id}`)}
              className="flex w-full items-center gap-3 rounded-xl bg-card border border-border p-4 text-left transition-colors hover:border-[hsl(var(--border-default))] active:scale-[0.98]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[15px] font-semibold truncate text-foreground">{trade.tokenName}</span>
                  <span className="rounded-full border border-[hsl(0_0%_20%)] px-[7px] py-[2px] font-body text-[10px] font-medium tracking-[0.05em] text-[hsl(var(--text-secondary))]">{trade.chain}</span>
                  {trade.isDemo && (
                    <span className="rounded-full border border-[hsl(0_0%_20%)] px-[7px] py-[2px] font-body text-[10px] font-medium tracking-[0.05em] text-[hsl(var(--text-secondary))]">DEMO</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {trade.emotionalStateAtEntry.slice(0, 2).map((e) => (
                    <EmotionBadge key={e} emotion={e} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {trade.status === "closed" && trade.finalPnl !== undefined ? (
                  <PnlBadge pnl={trade.finalPnl} />
                ) : (
                  <span className="rounded-full border border-[hsl(var(--green-primary)/0.3)] bg-[hsl(var(--green-primary)/0.1)] px-[7px] py-[2px] font-body text-[10px] font-semibold tracking-[0.06em] text-primary">OPEN</span>
                )}
                <ChevronRight className="h-4 w-4 text-[hsl(var(--text-muted))]" />
              </div>
            </button>
          ))}
          {recentTrades.length === 0 && (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <p className="font-body text-sm font-light text-muted-foreground">No trades yet. Tap below to log your first trade.</p>
            </div>
          )}
        </div>
      </section>

      {/* New Trade FAB */}
      <div className="fixed bottom-20 left-0 right-0 px-5">
        <button
          onClick={() => navigate("/new-trade")}
          className="flex w-full items-center justify-center gap-2 rounded-[16px] bg-primary py-4 font-display text-[16px] font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--green-primary)/0.3)] transition-all active:scale-[0.97]"
        >
          <Mic className="h-5 w-5" />
          New Trade
        </button>
      </div>
    </div>
  );
}
