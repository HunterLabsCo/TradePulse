import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { Label } from "@/components/design/Label";
import { Logo } from "@/components/design/Logo";
import { Waveform } from "@/components/design/Waveform";
import { Kbd } from "@/components/design/Kbd";
import { Pnl } from "@/components/design/Pnl";
import { Sparkline } from "@/components/design/Sparkline";
import { Candles } from "@/components/design/Candles";
import { TradeRow } from "@/components/design/TradeRow";
import { TradeRowFull } from "@/components/design/TradeRowFull";

const FREE_LIMIT = 20;

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function shortenWallet(addr: string): string {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function getInitials(wallet: string | null): string {
  if (wallet) return wallet.slice(0, 2).toUpperCase();
  return "DG";
}

function minutesUntilEnd(): number {
  const now = new Date();
  const end = new Date();
  end.setHours(23, 0, 0, 0);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 60000));
}

function MicIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="#0e1311" />
      <path d="M5 11a7 7 0 0 0 14 0 M12 18v3" stroke="#0e1311" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const nonDemoCount = useTradeStore((s) => s.getNonDemoTradeCount());
  const isPro = useSubscriptionStore((s) => s.isPro);
  const connectedWallet = useSubscriptionStore((s) => s.connectedWallet);

  // ── Derived state ────────────────────────────────────────────────
  const openTrade = trades.find((t) => t.status === "open" && !t.isDemo) ?? null;
  const openCount = trades.filter((t) => t.status === "open" && !t.isDemo).length;

  const realClosedTrades = trades.filter(
    (t) => t.status === "closed" && t.finalPnl !== undefined && !t.isDemo
  );
  const totalTrades = realClosedTrades.length;
  const wins = realClosedTrades.filter((t) => (t.finalPnl ?? 0) > 0).length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  const netR = realClosedTrades.reduce((sum, t) => sum + (t.finalPnl ?? 0), 0);
  const netRStr = netR >= 0 ? `+${netR.toFixed(2)}` : netR.toFixed(2);

  // Today's closed trades
  const today = new Date().toDateString();
  const todayTrades = realClosedTrades.filter(
    (t) => new Date(t.closedAt ?? t.entryTime).toDateString() === today
  );

  // Day streak: consecutive days with at least one trade
  const streak = (() => {
    if (realClosedTrades.length === 0) return 0;
    const tradeDays = new Set(
      realClosedTrades.map((t) =>
        new Date(t.closedAt ?? t.entryTime).toDateString()
      )
    );
    let count = 0;
    const d = new Date();
    while (tradeDays.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const handleCTA = () => {
    if (nonDemoCount >= FREE_LIMIT && !isPro) navigate("/upgrade");
    else navigate("/new-trade");
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const minsLeft = minutesUntilEnd();
  const initials = getInitials(connectedWallet);

  // ── Sub-components ───────────────────────────────────────────────
  function Sidebar() {
    return (
      <aside className="hidden md:flex w-[220px] flex-shrink-0 flex-col gap-6 h-screen sticky top-0 bg-[#0a0e0c] border-r border-[#222a25] p-6">
        <Logo size={17} />

        {/* Speak a trade CTA */}
        <button
          onClick={handleCTA}
          className="flex items-center justify-center gap-2 w-full bg-[#8ec2dd] text-[#0e1311] py-[11px] px-[14px] rounded-[4px] font-sans font-medium text-[14px]"
          aria-label="Speak a trade"
        >
          <MicIcon size={14} />
          Speak a trade
        </button>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5">
          {[
            { label: "Home", path: "/app", active: true },
            { label: "Journal", path: "/journal", active: false },
            { label: "Lessons", path: "/journal", active: false }, // TODO: dedicated route
            { label: "Setups", path: "/journal", active: false },  // TODO: dedicated route
            { label: "Settings", path: "/settings", active: false },
          ].map(({ label, path, active }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex items-center gap-2.5 py-[9px] px-3 rounded-[4px] font-sans text-[14px] tracking-[-0.005em] w-full text-left transition-colors ${
                active
                  ? "bg-[#161c19] text-[#8ec2dd] font-medium"
                  : "bg-transparent text-[#7a8a75] font-normal hover:text-[#d8e0d2]"
              }`}
            >
              <span
                className={`inline-block w-[5px] h-[5px] rounded-[3px] flex-shrink-0 ${
                  active ? "bg-[#8ec2dd]" : "bg-transparent"
                }`}
              />
              {label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto flex items-center gap-2.5">
          <div className="w-8 h-8 flex-shrink-0 rounded-[4px] flex items-center justify-center text-[#8ec2dd] font-mono text-[11px] font-medium border border-[#8ec2dd]">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-sans text-[13px] font-medium text-[#d8e0d2] truncate">
              {connectedWallet ? shortenWallet(connectedWallet) : "Trader"}
            </span>
            {isPro ? (
              <span className="font-mono text-[9.5px] text-[#a8d4ad]">
                ● PRO · day {streak}
              </span>
            ) : (
              <span className="font-mono text-[9.5px] text-[#7a8a75]">FREE</span>
            )}
          </div>
        </div>
      </aside>
    );
  }

  function TabBar() {
    return (
      <nav className="md:hidden fixed left-0 right-0 bottom-0 bg-[#161c19] border-t border-[#222a25] py-3 px-5 pb-[26px] flex justify-around z-50">
        {[
          { label: "home", path: "/app" },
          { label: "journal", path: "/journal" },
          { label: "settings", path: "/settings" },
        ].map(({ label, path }) => {
          const active = label === "home";
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 font-mono min-w-[44px] min-h-[44px] justify-center ${
                active ? "text-[#8ec2dd]" : "text-[#7a8a75]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`w-[5px] h-[5px] rounded-[3px] ${
                  active ? "bg-[#8ec2dd]" : "bg-transparent border border-[#7a8a75]"
                }`}
              />
              <span className="text-[11px] font-medium tracking-[0.04em]">{label}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0e1311]">
      <Sidebar />

      {/* ── MOBILE LAYOUT ─────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col w-full">

        {/* Status Header */}
        <header className="flex items-center justify-between px-[22px] pt-[6px] py-3">
          <Logo size={16} />
          <div className="flex items-center gap-[10px] font-mono text-[10px] text-[#7a8a75]">
            <span className="text-[#a8d4ad]">● {openCount} open</span>
            <span>·</span>
            <span>{netRStr}R</span>
          </div>
        </header>

        {/* Voice Hero */}
        <section className="px-[22px] pt-7 pb-6 relative">
          {/* Background glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 280,
              height: 180,
              left: "50%",
              top: "52%",
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(ellipse, rgba(142,194,221,0.12) 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
          <div className="relative flex flex-col items-center gap-[18px]">
            {/* Ready row */}
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-[#8ec2dd]"
                style={{ animation: "termpulse 2s ease-in-out infinite" }}
              />
              <Label className="text-[#8ec2dd]">Ready · listening for your voice</Label>
            </div>

            <Waveform bars={36} color="#8ec2dd" height={64} width={3} gap={4} rounded={false} />

            {/* CTA */}
            <button
              onClick={handleCTA}
              className="w-full flex items-center justify-center gap-3 bg-[#8ec2dd] text-[#0e1311] py-5 px-5 font-sans font-medium text-[19px] tracking-[-0.015em] rounded-[6px]"
              style={{
                boxShadow:
                  "0 8px 32px -8px rgba(142,194,221,0.33), 0 1px 0 #8ec2dd",
              }}
              aria-label="Speak a trade"
            >
              <MicIcon size={22} />
              Speak a trade
            </button>

            {/* Hint */}
            <div className="flex items-center gap-2 font-mono text-[10.5px] text-[#7a8a75]">
              or hold <Kbd>space</Kbd> anywhere
            </div>
          </div>
        </section>

        {/* Open Position Card */}
        {openTrade && (
          <section className="px-[22px]">
            <button
              onClick={() => navigate(`/trade/${openTrade.id}`)}
              className="w-full flex items-center gap-[14px] bg-[#161c19] border border-[#222a25] rounded-[6px] py-[14px] px-4 text-left"
            >
              <span
                className="flex-shrink-0 inline-block w-1.5 h-1.5 rounded-[3px] bg-[#8ec2dd]"
                style={{ animation: "termpulse 2s ease-in-out infinite" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-sans text-[16px] font-medium text-[#d8e0d2] tracking-[-0.01em] truncate">
                    {openTrade.tokenName}
                  </span>
                  <span className="font-mono text-[10px] text-[#7a8a75] whitespace-nowrap flex-shrink-0">
                    open · {formatRelativeTime(openTrade.entryTime)}
                  </span>
                </div>
                <p className="font-mono text-[10.5px] text-[#7a8a75] mt-0.5 truncate">
                  {[openTrade.chain, openTrade.entryMarketCap, openTrade.positionSize]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <Pnl pnl={null} size="md" />
            </button>
          </section>
        )}

        {/* Divider */}
        <div className="h-px bg-[#222a25] my-[22px] mx-[22px]" />

        {/* Recent Today */}
        <section className="px-[22px] pb-[100px]">
          <div className="flex items-center justify-between mb-3">
            <Label>Today · {todayTrades.length} closed</Label>
            <button
              onClick={() => navigate("/journal")}
              className="flex items-center gap-1 font-mono text-[10px] text-[#7a8a75]"
            >
              view all <Kbd>↓</Kbd>
            </button>
          </div>

          {todayTrades.length === 0 ? (
            <p className="font-mono text-[10.5px] text-[#7a8a75]">
              No trades closed today · speak your first
            </p>
          ) : (
            todayTrades.map((t, i) => (
              <button
                key={t.id}
                onClick={() => navigate(`/trade/${t.id}`)}
                className="w-full text-left"
              >
                <TradeRow trade={t} last={i === todayTrades.length - 1} />
              </button>
            ))
          )}
        </section>

        <TabBar />
      </div>

      {/* ── DESKTOP LAYOUT ────────────────────────────────────────── */}
      <main className="hidden md:flex flex-col flex-1 py-8 px-12 overflow-auto min-h-screen">

        {/* Topbar */}
        <div className="flex items-center justify-between mb-7">
          <Label>{formattedDate} · 30-day view</Label>
          <div className="flex items-center gap-4 font-mono text-[11px] text-[#7a8a75]">
            <span>
              Net{" "}
              <span className="text-[#a8d4ad]">{netRStr}R</span>
            </span>
            <span>{winRate}% rate</span>
            <span className="text-[#8ec2dd]">{streak}-day streak</span>
          </div>
        </div>

        {/* Desktop Voice Hero Card */}
        <div className="relative py-[38px] px-10 bg-[#161c19] border border-[#222a25] rounded-[8px] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(142,194,221,0.11) 0%, transparent 60%)",
            }}
          />
          <div className="relative grid grid-cols-[1fr_auto] gap-10 items-center">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2 mb-3.5">
                <span
                  className="inline-block w-[7px] h-[7px] rounded-[4px] bg-[#8ec2dd]"
                  style={{ animation: "termpulse 2s ease-in-out infinite" }}
                />
                <Label className="text-[#8ec2dd]">Ready · listening</Label>
              </div>
              <h2 className="font-sans text-[36px] font-medium tracking-[-0.025em] leading-[1.15] text-[#d8e0d2] mb-5">
                Speak your trade.
                <br />
                <span className="text-[#7a8a75]">I'll capture the rest.</span>
              </h2>
              <div className="-ml-0.5">
                <Waveform bars={48} color="#8ec2dd" height={56} width={3} gap={4} rounded={false} />
              </div>
            </div>

            {/* Right — circular mic */}
            <div className="flex flex-col items-center gap-3.5">
              <button
                onClick={handleCTA}
                className="w-[132px] h-[132px] rounded-full bg-[#8ec2dd] text-[#0e1311] flex items-center justify-center"
                style={{
                  boxShadow:
                    "0 16px 48px -12px rgba(142,194,221,0.4), 0 0 0 8px rgba(142,194,221,0.08)",
                }}
                aria-label="Speak a trade"
              >
                <MicIcon size={44} />
              </button>
              <div className="flex items-center gap-1 font-mono text-[11px] text-[#7a8a75]">
                hold <Kbd>space</Kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Two-col grid */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-10 mt-12">

          {/* ── Left col ── */}
          <div>
            {/* Open Position */}
            {openTrade && (
              <div className="mb-8">
                <Label className="mb-3.5 block">Open position</Label>
                <div className="flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-[28px] font-medium text-[#d8e0d2] tracking-[-0.02em] leading-none truncate">
                        {openTrade.tokenName}
                      </span>
                    </div>
                    <p className="font-mono text-[12px] text-[#7a8a75] mt-1">
                      {[
                        openTrade.chain,
                        openTrade.entryMarketCap,
                        openTrade.positionSize,
                        formatRelativeTime(openTrade.entryTime),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Pnl pnl={null} size="lg" />
                </div>
                <div className="mt-3.5">
                  <Candles width={580} height={48} color="#a8d4ad" red="#e89a8a" />
                </div>
              </div>
            )}

            {/* Recent */}
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <Label>Recent · {realClosedTrades.length}</Label>
              </div>
              {realClosedTrades.length === 0 ? (
                <p className="font-mono text-[10.5px] text-[#7a8a75]">
                  No trades yet · speak your first
                </p>
              ) : (
                realClosedTrades.slice(0, 10).map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/trade/${t.id}`)}
                    className="w-full text-left"
                  >
                    <TradeRowFull
                      trade={t}
                      idx={i}
                      last={i === Math.min(realClosedTrades.length, 10) - 1}
                    />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Right col ── */}
          <div className="flex flex-col gap-7">

            {/* 30-day sparkline */}
            <div>
              <Label className="mb-3 block">30-day net · R</Label>
              {/* TODO: wire to real 30-day R series from trade-store */}
              <Sparkline
                width={420}
                height={110}
                stroke="#8ec2dd"
                strokeWidth={1.6}
                fill="rgba(142,194,221,0.09)"
                dots
              />
              <div className="flex justify-between font-mono text-[10px] text-[#7a8a75] mt-2">
                <span>Apr 30</span>
                <span>May 15</span>
                <span>May 30</span>
              </div>
            </div>

            <div className="h-px bg-[#222a25]" />

            {/* Shutdown ritual */}
            <div>
              <Label className="mb-2.5 block">This evening</Label>
              <h3 className="font-sans text-[26px] font-medium leading-[1.2] tracking-[-0.02em] text-[#d8e0d2]">
                Shutdown ritual
                <br />
                <span className="text-[#8ec2dd]">in {minsLeft} minutes</span>.
              </h3>
              <p className="font-mono text-[11px] text-[#7a8a75] mt-2.5 leading-[1.55]">
                {openCount > 0
                  ? `${openCount} open ${openCount === 1 ? "position" : "positions"} to review. Voice it out, then close the day.`
                  : "No open positions. Review your day and close it out."}
              </p>
              {/* TODO: open shutdown ritual modal */}
              <button className="mt-4 bg-transparent text-[#8ec2dd] border border-[#8ec2dd] py-[9px] px-4 font-sans text-[13px] font-medium rounded-[4px]">
                Begin ritual →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
