import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { useTradeStore } from "@/lib/trade-store";
import { PnlBadge } from "@/components/PnlBadge";
import { EmotionBadge } from "@/components/EmotionBadge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Filter = "all" | "open" | "closed" | "wins" | "losses";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "wins", label: "Wins" },
  { value: "losses", label: "Losses" },
];

const chipBase = "rounded-full px-3 py-1.5 font-body text-xs font-light transition-colors active:scale-[0.97]";
const chipOff = "bg-transparent border border-[hsl(var(--border-default))] text-muted-foreground";
const chipOn = "bg-primary border border-primary text-primary-foreground font-normal";

export default function Journal() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = trades.filter((t) => {
    if (search && !t.tokenName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "open") return t.status === "open";
    if (filter === "closed") return t.status === "closed";
    if (filter === "wins") return t.status === "closed" && (t.finalPnl ?? 0) > 0;
    if (filter === "losses") return t.status === "closed" && (t.finalPnl ?? 0) <= 0;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <header className="px-5 pt-safe-top">
        <div className="py-4">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.01em] text-foreground">Journal</h1>
          <p className="font-body text-[12px] font-normal text-muted-foreground">Full trade history</p>
        </div>
      </header>

      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token name..."
            className="h-10 pl-9 font-body text-sm font-light bg-secondary border-border focus-visible:ring-primary focus-visible:border-primary"
          />
        </div>
      </div>

      <div className="flex gap-1.5 px-5 pb-4 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(chipBase, filter === f.value ? chipOn : chipOff)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <section className="flex-1 px-5">
        <div className="space-y-2">
          {filtered.map((trade) => (
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
                <div className="mt-1 flex items-center gap-2 font-body text-[12px] font-light text-muted-foreground">
                  {trade.entryMarketCap && <span>MC: {trade.entryMarketCap}</span>}
                  {trade.setupType && <span>• {trade.setupType}</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 font-body text-[11px] font-light text-[hsl(220_80%_70%)] tabular-nums tracking-data">
                  <span>{new Date(trade.entryTime).toLocaleDateString()}</span>
                </div>
                {trade.emotionalStateAtEntry.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {trade.emotionalStateAtEntry.slice(0, 3).map((e) => (
                      <EmotionBadge key={e} emotion={e} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {trade.status === "closed" ? (
                  trade.finalPnl !== undefined
                    ? <PnlBadge pnl={trade.finalPnl} />
                    : <span className="rounded-full border border-red-500/30 bg-red-500/10 px-[7px] py-[2px] font-body text-[10px] font-semibold tracking-[0.06em] text-red-400">CLOSED</span>
                ) : (
                  <span className="rounded-full border border-[hsl(var(--green-primary)/0.3)] bg-[hsl(var(--green-primary)/0.1)] px-[7px] py-[2px] font-body text-[10px] font-semibold tracking-[0.06em] text-primary">OPEN</span>
                )}
                <ChevronRight className="h-4 w-4 text-[hsl(var(--text-muted))]" />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <p className="font-body text-sm font-light text-muted-foreground">
                {trades.length === 0 ? "No trades logged yet. Tap New Trade to get started." : "No trades match your filters."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
