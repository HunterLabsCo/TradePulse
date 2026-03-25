import { ArrowLeft, Download, Trash2, Check, MessageSquare, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { truncateAddress, FREE_TRADE_LIMIT } from "@/lib/subscription-utils";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const chipBase = "rounded-full px-4 py-2.5 font-body text-xs font-light transition-colors active:scale-[0.96]";
const chipOff = "bg-transparent border border-[hsl(var(--border-default))] text-muted-foreground";
const chipOn = "bg-primary border border-primary text-primary-foreground font-normal";

export default function SettingsPage() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const deleteAllTrades = useTradeStore((s) => s.deleteAllTrades);
  const getNonDemoTradeCount = useTradeStore((s) => s.getNonDemoTradeCount);
  const { isPro, txSignature } = useSubscriptionStore();
  const [displayName, setDisplayName] = useState("");
  const [defaultChain, setDefaultChain] = useState("SOL");

  const nonDemoCount = getNonDemoTradeCount();

  function exportCSV() {
    const headers = "Token,Chain,Status,PnL,Entry Time,Exit Time\n";
    const rows = trades
      .map((t) => `${t.tokenName},${t.chain},${t.status},${t.finalPnl ?? ""},${t.entryTime},${t.exitTime ?? ""}`)
      .join("\n");
    downloadFile(headers + rows, "tradesnap-export.csv", "text/csv");
  }

  function exportJSON() {
    downloadFile(JSON.stringify(trades, null, 2), "tradesnap-export.json", "application/json");
  }

  function openFeedback() {
    const formId = import.meta.env.VITE_TALLY_FORM_ID;
    if (!formId) return;
    if ((window as any).Tally) {
      (window as any).Tally.openPopup(formId, { emoji: { text: "👋", animation: "wave" } });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.onload = () => (window as any).Tally?.openPopup(formId, { emoji: { text: "👋", animation: "wave" } });
    document.head.appendChild(script);
  }

  const [shareCopied, setShareCopied] = useState(false);

  async function shareApp() {
    const url = "https://tradepulse-app.vercel.app";
    const text = "Never lose a trade to bad timing. Log entries, exits & PnL with your voice before the moment's gone.";
    if (navigator.share) {
      await navigator.share({ title: "TradePulse", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-screen flex-col pb-24">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl active:scale-[0.96] hover:bg-card text-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-[18px] font-semibold">Settings</h1>
      </header>

      <div className="space-y-6 px-5">
        {/* Subscription Status */}
        <div className="rounded-xl bg-card border border-border p-4">
          <p className="section-label">Subscription</p>
          {isPro ? (
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-[hsl(var(--green-primary)/0.15)] border border-[hsl(var(--green-primary)/0.3)] px-3 py-1">
                  <Check className="h-3 w-3 text-primary" />
                  <span className="font-display text-[13px] font-semibold text-primary">Pro — Lifetime</span>
                </div>
              </div>
              {txSignature && (
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block font-mono-label text-[11px] text-[hsl(var(--blue-accent))] underline decoration-[hsl(var(--blue-accent)/0.3)] underline-offset-2"
                >
                  Tx: {truncateAddress(txSignature)}
                </a>
              )}
            </div>
          ) : (
            <div className="mt-1">
              <p className="font-display text-[15px] font-semibold text-foreground">Free Tier</p>
              <p className="font-body text-[12px] font-light text-muted-foreground">
                {nonDemoCount} / {FREE_TRADE_LIMIT} free trades used
              </p>
              <button
                onClick={() => navigate("/upgrade")}
                className="mt-3 flex w-full items-center justify-center rounded-xl bg-primary py-2.5 font-display text-[13px] font-bold text-primary-foreground active:scale-[0.97]"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="section-label mb-1.5 block">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Anon Trader"
            className="w-full rounded-xl bg-secondary border border-border px-4 py-3 font-body text-[14px] font-light text-foreground placeholder:text-[hsl(var(--text-muted))] outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Default Chain */}
        <div>
          <label className="section-label mb-1.5 block">Default Chain</label>
          <div className="flex gap-2 flex-wrap">
            {["SOL", "ETH", "BASE", "BNB", "ARB"].map((chain) => (
              <button
                key={chain}
                onClick={() => setDefaultChain(chain)}
                className={`${chipBase} ${defaultChain === chain ? chipOn : chipOff}`}
              >
                {chain === "BNB" ? "BNB / BSC" : chain}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div>
          <p className="section-label mb-2">Export Data</p>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card border border-border py-3 font-body text-xs font-normal text-foreground active:scale-[0.97]"
            >
              <Download className="h-4 w-4" /> CSV
            </button>
            <button
              onClick={exportJSON}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card border border-border py-3 font-body text-xs font-normal text-foreground active:scale-[0.97]"
            >
              <Download className="h-4 w-4" /> JSON
            </button>
          </div>
        </div>

        {/* Feedback */}
        {import.meta.env.VITE_TALLY_FORM_ID && (
          <button
            onClick={openFeedback}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-card border border-border py-3 font-body text-xs font-normal text-foreground active:scale-[0.97]"
          >
            <MessageSquare className="h-4 w-4" /> Send Feedback
          </button>
        )}

        {/* Share */}
        <button
          onClick={shareApp}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-card border border-border py-3 font-body text-xs font-normal text-foreground active:scale-[0.97]"
        >
          <Share2 className="h-4 w-4" />
          {shareCopied ? "Link copied!" : "Share TradePulse"}
        </button>

        {/* Delete All */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[hsl(var(--red-destroy)/0.1)] border border-[hsl(var(--red-destroy)/0.3)] py-3 font-body text-xs font-normal text-red-destroy active:scale-[0.97]">
              <Trash2 className="h-4 w-4" /> Delete All Data
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-popover border-border max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display font-semibold">Delete everything?</AlertDialogTitle>
              <AlertDialogDescription className="font-body font-light">
                This will permanently delete all your trades and data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-secondary text-foreground border-border font-body font-normal">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteAllTrades}
                className="bg-red-destroy text-foreground hover:bg-[hsl(var(--red-destroy)/0.8)] font-body font-normal"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {/* About */}
        <div className="rounded-xl bg-card border border-border p-4 text-center">
          <p className="font-display text-[15px] font-semibold text-foreground">TradePulse</p>
          <p className="mt-1 font-body text-[12px] font-light text-muted-foreground">
            Never lose a trade to bad timing.
          </p>
          <p className="mt-3 font-mono-label text-[11px] text-[hsl(var(--text-muted))]">v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
