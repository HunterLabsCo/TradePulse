import { useState } from "react";
import { ArrowLeft, Mic, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import type { EmotionalState, Trade } from "@/lib/sample-data";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const FREE_LIMIT = 20;

const EMOTIONS: { value: EmotionalState; label: string }[] = [
  { value: "confident", label: "Confident" },
  { value: "calm", label: "Calm" },
  { value: "focused", label: "Focused" },
  { value: "patient", label: "Patient" },
  { value: "in-the-zone", label: "In the Zone" },
  { value: "anxious", label: "Anxious" },
  { value: "nervous", label: "Nervous" },
  { value: "rushed", label: "Rushed" },
  { value: "frustrated", label: "Frustrated" },
  { value: "revenge-mindset", label: "Revenge" },
  { value: "greedy", label: "Greedy" },
  { value: "fearful", label: "Fearful" },
  { value: "overconfident", label: "Overconfident" },
  { value: "fomo", label: "FOMO" },
  { value: "distracted", label: "Distracted" },
  { value: "interrupted", label: "Interrupted" },
  { value: "uncertain", label: "Uncertain" },
  { value: "conflicted", label: "Conflicted" },
];

const QUICK_TAGS = [
  "Interrupted",
  "Work trade",
  "Full session",
  "Pre-set orders",
  "Above MC ceiling",
  "Non-compliant",
  "Chased / FOMO",
  "Best setup",
  "Clean execution",
];

export default function NewTrade() {
  const navigate = useNavigate();
  const { addTrade, getNonDemoTradeCount } = useTradeStore();

  const [tokenName, setTokenName] = useState("");
  const [chain, setChain] = useState("SOL");
  const [entryMarketCap, setEntryMarketCap] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [setupType, setSetupType] = useState("");
  const [narrativeType, setNarrativeType] = useState("");
  const [volumeConfirmed, setVolumeConfirmed] = useState(false);
  const [walletConfirmed, setWalletConfirmed] = useState(false);
  const [interruptionStatus, setInterruptionStatus] = useState<"interrupted" | "clean">("clean");
  const [sessionType, setSessionType] = useState<"work-trade" | "full-session">("full-session");
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [transcript, setTranscript] = useState("");

  const toggleEmotion = (e: EmotionalState) =>
    setEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );

  const toggleTag = (t: string) =>
    setQuickTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const handleSave = () => {
    if (!tokenName.trim()) return;

    if (getNonDemoTradeCount() >= FREE_LIMIT) {
      navigate("/paywall");
      return;
    }

    const trade: Trade = {
      id: crypto.randomUUID(),
      userId: "local",
      tokenName: tokenName.trim(),
      chain,
      entryMarketCap: entryMarketCap || undefined,
      entryPrice: entryPrice || undefined,
      positionSize: positionSize || undefined,
      setupType: setupType || undefined,
      narrativeType: narrativeType || undefined,
      volumeConfirmed,
      walletConfirmed,
      interruptionStatus,
      sessionType,
      entryTime: new Date().toISOString(),
      emotionalStateAtEntry: emotions,
      entryTranscript: transcript || undefined,
      quickTags,
      updates: [],
      status: "open",
      isDemo: false,
    };

    addTrade(trade);
    navigate(`/trade/${trade.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-28">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-[0.96] hover:bg-card"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">New Trade — Entry</h1>
      </header>

      <div className="flex flex-col gap-6 px-5">
        {/* Voice placeholder */}
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-card p-5">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/30">
              <Mic className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Voice entry coming soon — use form below</p>
        </div>

        {/* Token + Chain */}
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Token *</label>
            <Input
              placeholder="e.g. BONK"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              className="bg-card border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Chain</label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SOL">SOL</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="BASE">BASE</SelectItem>
                <SelectItem value="ARB">ARB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Market cap + Price + Size */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Entry MC</label>
            <Input placeholder="80.7K" value={entryMarketCap} onChange={(e) => setEntryMarketCap(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Entry Price</label>
            <Input placeholder="0.0012" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Size</label>
            <Input placeholder="1.4 SOL" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} className="bg-card border-border" />
          </div>
        </div>

        {/* Setup + Narrative */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Setup Type</label>
            <Input placeholder="Breakout" value={setupType} onChange={(e) => setSetupType(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Narrative</label>
            <Input placeholder="AI" value={narrativeType} onChange={(e) => setNarrativeType(e.target.value)} className="bg-card border-border" />
          </div>
        </div>

        {/* Toggles row */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Volume ✓", active: volumeConfirmed, toggle: () => setVolumeConfirmed(!volumeConfirmed) },
            { label: "Wallets ✓", active: walletConfirmed, toggle: () => setWalletConfirmed(!walletConfirmed) },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.toggle}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors active:scale-[0.96]",
                item.active
                  ? "bg-primary/20 text-primary"
                  : "bg-card text-muted-foreground"
              )}
            >
              {item.active && <Check className="h-3 w-3" />}
              {item.label}
            </button>
          ))}

          <Select value={interruptionStatus} onValueChange={(v) => setInterruptionStatus(v as "interrupted" | "clean")}>
            <SelectTrigger className="h-9 w-auto gap-1.5 rounded-lg bg-card border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clean">Clean session</SelectItem>
              <SelectItem value="interrupted">Interrupted</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sessionType} onValueChange={(v) => setSessionType(v as "work-trade" | "full-session")}>
            <SelectTrigger className="h-9 w-auto gap-1.5 rounded-lg bg-card border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-session">Full session</SelectItem>
              <SelectItem value="work-trade">Work trade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Emotional state */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Emotional State</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS.map((em) => (
              <button
                key={em.value}
                onClick={() => toggleEmotion(em.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.96]",
                  emotions.includes(em.value)
                    ? "bg-primary/20 text-primary"
                    : "bg-card text-muted-foreground"
                )}
              >
                {em.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick tags */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Quick Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.96]",
                  quickTags.includes(tag)
                    ? "bg-primary/20 text-primary"
                    : "bg-card text-muted-foreground"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Transcript */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Entry Notes / Transcript</label>
          <Textarea
            placeholder="Paste your voice transcript or type notes…"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="min-h-[80px] bg-card border-border"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/80 px-5 pb-safe-bottom pt-3 backdrop-blur-md">
        <Button
          onClick={handleSave}
          disabled={!tokenName.trim()}
          className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground active:scale-[0.97]"
        >
          Save Entry
        </Button>
      </div>
    </div>
  );
}
