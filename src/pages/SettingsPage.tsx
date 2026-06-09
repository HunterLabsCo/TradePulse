import { Download, Trash2, Check, MessageSquare, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { truncateAddress, FREE_TRADE_LIMIT } from "@/lib/subscription-utils";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/design/Label";
import { Pill } from "@/components/design/Pill";
import { ToggleRow } from "@/components/design/ToggleRow";
import { SettingsGroup } from "@/components/design/SettingsGroup";
import { AppSidebar } from "@/components/design/AppSidebar";

function shortenWallet(addr: string): string {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const trades = useTradeStore((s) => s.trades);
  const deleteAllTrades = useTradeStore((s) => s.deleteAllTrades);
  const getNonDemoTradeCount = useTradeStore((s) => s.getNonDemoTradeCount);
  const { isPro, txSignature, connectedWallet } = useSubscriptionStore();

  // Settings toggles — backed by localStorage
  const [autoParse, setAutoParse] = useState(() => localStorage.getItem("tp_auto_parse") !== "false");
  const [continuousListen, setContinuousListen] = useState(() => localStorage.getItem("tp_continuous_listen") !== "false");
  const [haptic, setHaptic] = useState(() => localStorage.getItem("tp_haptic") !== "false");
  const [streakAlerts, setStreakAlerts] = useState(() => localStorage.getItem("tp_streak_alerts") !== "false");
  const [shutdownRitual, setShutdownRitual] = useState(() => localStorage.getItem("tp_shutdown_ritual") !== "false");
  const [interruptionTracking, setInterruptionTracking] = useState(() => localStorage.getItem("tp_interruption_tracking") !== "false");

  function saveToggle(key: string, val: boolean) {
    localStorage.setItem(key, String(val));
  }

  const [defaultChain, setDefaultChain] = useState("SOL");
  const [shareCopied, setShareCopied] = useState(false);

  const nonDemoCount = getNonDemoTradeCount();
  const initials = connectedWallet
    ? connectedWallet.slice(0, 2).toUpperCase()
    : "DG";

  function exportCSV() {
    const headers = "Token,Chain,Status,PnL,Entry Time,Exit Time\n";
    const rows = trades.map((t) =>
      `${t.tokenName},${t.chain},${t.status},${t.finalPnl ?? ""},${t.entryTime},${t.exitTime ?? ""}`
    ).join("\n");
    downloadFile(headers + rows, "tradepulse-export.csv", "text/csv");
  }
  function exportJSON() {
    downloadFile(JSON.stringify(trades, null, 2), "tradepulse-export.json", "application/json");
  }
  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
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
  async function shareApp() {
    const url = "https://tradepulseapp.io";
    const text = "Never lose a trade to bad timing. Log entries, exits & PnL with your voice.";
    if (navigator.share) {
      await navigator.share({ title: "TradePulse", text, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }
  // ── Row helpers ──────────────────────────────────────────────────
  function ActionRow({ label, sublabel, actionLabel, onClick }: {
    label: string; sublabel?: string; actionLabel: string; onClick: () => void;
  }) {
    return (
      <div className="flex items-center py-[14px] border-b border-[#222a25]">
        <div className="flex-1">
          <p className="font-sans text-[14.5px] text-[#d8e0d2] tracking-[-0.005em]">{label}</p>
          {sublabel && <p className="font-mono text-[10px] text-[#7a8a75] mt-0.5">{sublabel}</p>}
        </div>
        <button
          onClick={onClick}
          className="font-mono text-[11px] text-[#8ec2dd] hover:text-[#d8e0d2] transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0e1311]">
      <AppSidebar activePage="settings" />

      {/* Mobile tab bar */}
      <nav className="md:hidden fixed left-0 right-0 bottom-0 bg-[#161c19] border-t border-[#222a25] py-3 px-5 pb-[26px] flex justify-around z-50">
        {[
          { label: "home", path: "/app" },
          { label: "journal", path: "/journal" },
          { label: "settings", path: "/settings" },
        ].map(({ label, path }) => {
          const active = label === "settings";
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 font-mono min-w-[44px] min-h-[44px] justify-center ${
                active ? "text-[#8ec2dd]" : "text-[#7a8a75]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span className={`w-[5px] h-[5px] rounded-[3px] ${active ? "bg-[#8ec2dd]" : "bg-transparent border border-[#7a8a75]"}`} />
              <span className="text-[11px] font-medium tracking-[0.04em]">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col flex-1 pb-[100px]">
        <div className="md:max-w-[640px] md:mx-auto w-full">

          {/* Header */}
          <header className="pt-3.5 px-[22px]">
            <Label>Configuration</Label>
            <h1 className="font-sans text-[30px] font-medium text-[#d8e0d2] tracking-[-0.025em] leading-none mt-1.5">
              Settings
            </h1>
          </header>

          {/* Profile Row */}
          <div className="pt-[22px] px-[22px] flex items-center gap-3.5">
            <div className="w-12 h-12 flex-shrink-0 rounded-[4px] flex items-center justify-center text-[#8ec2dd] font-mono text-[16px] font-medium border-[1.5px] border-[#8ec2dd]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[16px] font-medium text-[#d8e0d2] tracking-[-0.01em] truncate">
                {connectedWallet ? shortenWallet(connectedWallet) : "Anon Trader"}
              </p>
              <p className="font-mono text-[10.5px] text-[#7a8a75] mt-0.5">
                {connectedWallet ? `SOL · ${shortenWallet(connectedWallet)}` : "no wallet connected"}
              </p>
            </div>
            {isPro ? (
              <Pill color="#a8d4ad">PRO</Pill>
            ) : (
              <Pill color="#7a8a75">FREE</Pill>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#222a25] my-6 mx-[22px]" />

          {/* Voice settings */}
          <SettingsGroup title="Voice">
            <ToggleRow
              label="Auto-parse from voice"
              on={autoParse}
              onChange={() => { const v = !autoParse; setAutoParse(v); saveToggle("tp_auto_parse", v); }}
            />
            <ToggleRow
              label="Continuous listening"
              on={continuousListen}
              onChange={() => { const v = !continuousListen; setContinuousListen(v); saveToggle("tp_continuous_listen", v); }}
            />
            <ToggleRow
              label="Haptic on save"
              on={haptic}
              onChange={() => { const v = !haptic; setHaptic(v); saveToggle("tp_haptic", v); }}
              last
            />
          </SettingsGroup>

          {/* Session settings */}
          <SettingsGroup title="Session">
            <ToggleRow
              label="Streak alerts"
              on={streakAlerts}
              onChange={() => { const v = !streakAlerts; setStreakAlerts(v); saveToggle("tp_streak_alerts", v); }}
            />
            <ToggleRow
              label="Shutdown ritual"
              on={shutdownRitual}
              onChange={() => { const v = !shutdownRitual; setShutdownRitual(v); saveToggle("tp_shutdown_ritual", v); }}
            />
            <ToggleRow
              label="Interruption tracking"
              on={interruptionTracking}
              onChange={() => { const v = !interruptionTracking; setInterruptionTracking(v); saveToggle("tp_interruption_tracking", v); }}
              last
            />
          </SettingsGroup>

          {/* Plan */}
          <SettingsGroup title="Plan">
            <div className="flex items-center py-[14px]">
              <div className="flex-1">
                <p className="font-sans text-[14.5px] font-medium text-[#d8e0d2]">
                  {isPro ? "Pro · unlimited" : "Free"}
                </p>
                <p className="font-mono text-[10px] text-[#7a8a75] mt-0.5">
                  {isPro
                    ? `lifetime · $99${txSignature ? ` · tx: ${truncateAddress(txSignature)}` : ""}`
                    : `${nonDemoCount} / ${FREE_TRADE_LIMIT} free trades used`}
                </p>
              </div>
              <button
                onClick={() => navigate("/upgrade")}
                className="font-mono text-[11px] text-[#8ec2dd] hover:text-[#d8e0d2] transition-colors"
              >
                {isPro ? "manage →" : "upgrade →"}
              </button>
            </div>
          </SettingsGroup>

          {/* Account */}
          <SettingsGroup title="Account">
            {/* Default chain */}
            <div className="py-[14px] border-b border-[#222a25]">
              <p className="font-sans text-[14.5px] text-[#d8e0d2] mb-2">Default chain</p>
              <div className="flex gap-2 flex-wrap">
                {["SOL", "ETH", "BASE", "BNB"].map((chain) => (
                  <button
                    key={chain}
                    onClick={() => setDefaultChain(chain)}
                    className="min-h-[36px]"
                  >
                    <Pill
                      color={defaultChain === chain ? "#8ec2dd" : "#7a8a75"}
                      bg={defaultChain === chain ? "rgba(142,194,221,0.09)" : undefined}
                    >
                      {chain === "BNB" ? "BNB / BSC" : chain}
                    </Pill>
                  </button>
                ))}
              </div>
            </div>

            {/* Export */}
            <div className="py-[14px] border-b border-[#222a25]">
              <p className="font-sans text-[14.5px] text-[#d8e0d2] mb-2">Export data</p>
              <div className="flex gap-2">
                <button
                  onClick={exportCSV}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2 bg-[#161c19] border border-[#222a25] rounded-[4px] font-mono text-[11px] text-[#d8e0d2] hover:border-[#8ec2dd] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> CSV
                </button>
                <button
                  onClick={exportJSON}
                  className="flex flex-1 items-center justify-center gap-1.5 py-2 bg-[#161c19] border border-[#222a25] rounded-[4px] font-mono text-[11px] text-[#d8e0d2] hover:border-[#8ec2dd] transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> JSON
                </button>
              </div>
            </div>

            {/* Feedback */}
            {import.meta.env.VITE_TALLY_FORM_ID && (
              <ActionRow label="Send feedback" actionLabel="open →" onClick={openFeedback} />
            )}

            {/* Share */}
            <ActionRow
              label="Share TradePulse"
              sublabel="tradepulseapp.io"
              actionLabel={shareCopied ? "copied!" : "share →"}
              onClick={shareApp}
            />

            {/* Delete all */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center justify-center gap-1.5 py-[14px] font-mono text-[11px] text-[#e89a8a] hover:text-[#d8e0d2] transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> Delete all data
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#161c19] border-[#222a25] max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-sans font-medium text-[#d8e0d2]">Delete everything?</AlertDialogTitle>
                  <AlertDialogDescription className="font-mono text-[11px] text-[#7a8a75]">
                    This permanently deletes all your trades and data. Cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-transparent border-[#222a25] text-[#7a8a75] hover:bg-[#222a25] hover:text-[#d8e0d2] font-mono text-[12px]">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteAllTrades}
                    className="bg-[#e89a8a] text-[#0e1311] hover:bg-[#e89a8a]/80 font-mono text-[12px]"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SettingsGroup>

          {/* About */}
          <div className="px-[22px] pb-8 text-center">
            <p className="font-mono text-[10px] text-[#7a8a75]">tradepulse · v1.0.0 · by TheVeinGhost</p>
          </div>

        </div>
      </div>
    </div>
  );
}
