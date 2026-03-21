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

const chipDefault = "bg-[hsl(0,0%,10%)] border border-[hsl(0,0%,27%)] text-[hsl(0,0%,67%)]";
const chipSelected = "bg-primary text-primary-foreground border border-primary";

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
          <h1 className="text-lg font-bold tracking-tight text-foreground">Journal</h1>
          <p className="text-xs text-muted-foreground">Full trade history</p>
        </div>
      </header>

      {/* Search */}
      <div className="px-5 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by token name..."
            className="h-10 pl-9 text-sm"
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-5 pb-4 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors active:scale-[0.97]",
              filter === f.value
                ? chipSelected
                : chipDefault
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Trade list */}
      <section className="flex-1 px-5">
        <div className="space-y-2">
          {filtered.map((trade) => (
            <button
              key={trade.id}
              onClick={() => navigate(`/trade/${trade.id}`)}
              className="flex w-full items-center gap-3 rounded-xl bg-card p-4 text-left transition-colors active:scale-[0.98] active:bg-card/80"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{trade.tokenName}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{trade.chain}</span>
                  {trade.isDemo && (
                    <span className="text-[9px] rounded bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">DEMO</span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  {trade.entryMarketCap && <span>MC: {trade.entryMarketCap}</span>}
                  {trade.setupType && <span>• {trade.setupType}</span>}
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-accent tabular-nums">
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
                {trade.status === "closed" && trade.finalPnl !== undefined ? (
                  <PnlBadge pnl={trade.finalPnl} />
                ) : (
                  <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">OPEN</span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-xl bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {trades.length === 0
                  ? "No trades logged yet. Tap New Trade to get started."
                  : "No trades match your filters."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
