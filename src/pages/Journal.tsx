import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { Label } from "@/components/design/Label";
import { Pill } from "@/components/design/Pill";
import { Kbd } from "@/components/design/Kbd";
import { TradeRowFull } from "@/components/design/TradeRowFull";
import { AppSidebar } from "@/components/design/AppSidebar";
import { MobileTabBar } from "@/components/design/MobileTabBar";

type Filter = "all" | "open" | "wins" | "losses";

export default function Journal() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filtered = trades.filter((t) => {
    if (search && !t.tokenName.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "open") return t.status === "open";
    if (filter === "wins") return t.status === "closed" && (t.finalPnl ?? 0) > 0;
    if (filter === "losses") return t.status === "closed" && (t.finalPnl ?? 0) <= 0;
    return true;
  });

  const realTrades = trades.filter((t) => !t.isDemo);
  const openCount = realTrades.filter((t) => t.status === "open").length;
  const winsCount = realTrades.filter((t) => t.status === "closed" && (t.finalPnl ?? 0) > 0).length;
  const lossesCount = realTrades.filter((t) => t.status === "closed" && (t.finalPnl ?? 0) <= 0 && t.finalPnl !== undefined).length;

  const filterDefs: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: realTrades.length },
    { value: "open", label: "Open", count: openCount },
    { value: "wins", label: "Wins", count: winsCount },
    { value: "losses", label: "Losses", count: lossesCount },
  ];

  return (
    <div className="flex min-h-screen bg-[#0e1311]">
      <AppSidebar activePage="journal" />

      <MobileTabBar active="journal" />

      <div className="flex flex-col flex-1 pb-[100px]">
        <div className="md:max-w-[680px] md:mx-auto w-full">

          {/* Header */}
          <header className="pt-3.5 px-[22px]">
            <Label>Vol. 1 · {realTrades.length} entries</Label>
            <h1 className="font-sans text-[30px] font-medium text-[#d8e0d2] tracking-[-0.025em] leading-none mt-1.5">
              Journal
            </h1>
          </header>

          {/* Search */}
          <div className="pt-[22px] px-[22px]">
            <div className="flex items-center gap-2 py-2.5 border-b border-[#222a25]">
              <span className="font-mono text-[14px] text-[#7a8a75]">⌕</span>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by token…"
                className="flex-1 font-sans text-[14px] text-[#d8e0d2] bg-transparent border-none outline-none placeholder:text-[#7a8a75]"
                style={{ caretColor: "#8ec2dd" }}
              />
              <Kbd>/</Kbd>
            </div>
          </div>

          {/* Filter pills */}
          <div className="pt-[18px] px-[22px] flex gap-2 flex-wrap">
            {filterDefs.map(({ value, label, count }) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className="min-h-[36px]"
                >
                  <Pill
                    color={active ? "#8ec2dd" : "#7a8a75"}
                    bg={active ? "rgba(142,194,221,0.09)" : undefined}
                  >
                    {label} · {count}
                  </Pill>
                </button>
              );
            })}
          </div>

          {/* List */}
          <section className="pt-5 px-[22px]">
            {filtered.length === 0 ? (
              <p className="font-mono text-[10.5px] text-[#7a8a75] text-center py-12">
                {trades.length === 0
                  ? "No trades logged yet · speak your first"
                  : "No matches · adjust filter"}
              </p>
            ) : (
              filtered.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/trade/${t.id}`)}
                  className="w-full text-left"
                >
                  <TradeRowFull
                    trade={t}
                    idx={i}
                    last={i === filtered.length - 1}
                  />
                </button>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
