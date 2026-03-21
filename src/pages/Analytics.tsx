import { ArrowLeft, TrendingUp, TrendingDown, Target, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { EmotionBadge } from "@/components/EmotionBadge";
import type { EmotionalState } from "@/lib/sample-data";

export default function Analytics() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const closed = trades.filter((t) => t.status === "closed" && t.finalPnl !== undefined);

  const totalTrades = closed.length;
  const wins = closed.filter((t) => (t.finalPnl ?? 0) > 0);
  const losses = closed.filter((t) => (t.finalPnl ?? 0) < 0);
  const winRate = totalTrades > 0 ? Math.round((wins.length / totalTrades) * 100) : 0;
  const avgPnl = totalTrades > 0 ? closed.reduce((s, t) => s + (t.finalPnl ?? 0), 0) / totalTrades : 0;
  const biggestWin = closed.length > 0 ? Math.max(...closed.map((t) => t.finalPnl ?? 0)) : 0;
  const biggestLoss = closed.length > 0 ? Math.min(...closed.map((t) => t.finalPnl ?? 0)) : 0;

  // Interruption analysis
  const interrupted = closed.filter((t) => t.interruptionStatus === "interrupted");
  const clean = closed.filter((t) => t.interruptionStatus === "clean");
  const intAvg = interrupted.length > 0 ? interrupted.reduce((s, t) => s + (t.finalPnl ?? 0), 0) / interrupted.length : 0;
  const cleanAvg = clean.length > 0 ? clean.reduce((s, t) => s + (t.finalPnl ?? 0), 0) / clean.length : 0;

  // Emotion analysis
  const winEmotions: EmotionalState[] = [];
  const lossEmotions: EmotionalState[] = [];
  wins.forEach((t) => winEmotions.push(...t.emotionalStateAtEntry));
  losses.forEach((t) => lossEmotions.push(...t.emotionalStateAtEntry));

  function topEmotion(arr: EmotionalState[]): EmotionalState | null {
    if (arr.length === 0) return null;
    const counts: Record<string, number> = {};
    arr.forEach((e) => (counts[e] = (counts[e] ?? 0) + 1));
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0] as EmotionalState;
  }

  const topWinEmotion = topEmotion(winEmotions);
  const topLossEmotion = topEmotion(lossEmotions);

  if (totalTrades === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 pb-20">
        <Target className="h-12 w-12 text-muted-foreground" />
        <p className="text-center text-sm text-muted-foreground leading-relaxed">
          No closed trades yet. Close a trade to see your analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl active:scale-[0.96] hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">Analytics</h1>
      </header>

      <div className="space-y-4 px-5">
        {/* Performance */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Trades", value: totalTrades },
            { label: "Win Rate", value: `${winRate}%` },
            { label: "Avg PnL", value: `${avgPnl >= 0 ? "+" : ""}${avgPnl.toFixed(2)}` },
            { label: "Biggest Win", value: `+${biggestWin.toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-card p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>

        {/* Interruption Analysis */}
        {(interrupted.length > 0 || clean.length > 0) && (
          <div className="rounded-xl bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Interruption Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Clean trades</p>
                <p className="text-sm font-bold tabular-nums">{clean.length} trades</p>
                <p className="text-xs tabular-nums text-emerald-400">Avg: {cleanAvg >= 0 ? "+" : ""}{cleanAvg.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Interrupted</p>
                <p className="text-sm font-bold tabular-nums">{interrupted.length} trades</p>
                <p className="text-xs tabular-nums text-red-400">Avg: {intAvg >= 0 ? "+" : ""}{intAvg.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Emotional Intelligence */}
        {(topWinEmotion || topLossEmotion) && (
          <div className="rounded-xl bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Zap className="inline h-3 w-3 mr-1" />
              Emotional Intelligence
            </h3>
            <div className="space-y-3">
              {topWinEmotion && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Top emotion in wins</span>
                  <EmotionBadge emotion={topWinEmotion} />
                </div>
              )}
              {topLossEmotion && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Your edge killer</span>
                  <EmotionBadge emotion={topLossEmotion} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
