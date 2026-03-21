import { useState, useCallback, useRef } from "react";
import { ArrowLeft, Mic, Square, Loader2, Check, AlertTriangle, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { supabase } from "@/integrations/supabase/client";
import type { EmotionalState, SessionType, Trade } from "@/lib/sample-data";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FREE_LIMIT = 20;

const EMOTIONS: { value: EmotionalState; label: string }[] = [
  { value: "confident", label: "Confident" },
  { value: "calm", label: "Calm" },
  { value: "focused", label: "Focused" },
  { value: "patient", label: "Patient" },
  { value: "in-the-zone", label: "In the Zone" },
  { value: "disciplined", label: "Disciplined" },
  { value: "sharp", label: "Sharp / Clear-headed" },
  { value: "anxious", label: "Anxious" },
  { value: "nervous", label: "Nervous" },
  { value: "rushed", label: "Rushed" },
  { value: "frustrated", label: "Frustrated" },
  { value: "revenge-mindset", label: "Revenge" },
  { value: "greedy", label: "Greedy" },
  { value: "fearful", label: "Fearful" },
  { value: "overconfident", label: "Overconfident" },
  { value: "hesitant", label: "Hesitant" },
  { value: "impulsive", label: "Impulsive" },
  { value: "euphoric", label: "Euphoric" },
  { value: "fomo", label: "FOMO" },
  { value: "distracted", label: "Distracted" },
  { value: "interrupted", label: "Interrupted" },
  { value: "uncertain", label: "Uncertain" },
  { value: "conflicted", label: "Conflicted" },
  { value: "detached", label: "Detached / Numb" },
  { value: "tired", label: "Tired / Fatigued" },
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

const SETUP_TYPES = [
  "EMA Pullback",
  "Breakout",
  "Volume Spike Entry",
  "Wallet Signal",
  "Narrative Play",
  "Dip Buy",
  "Momentum",
  "Custom",
];

const CONFIRMATION_SIGNALS = [
  "Volume",
  "Wallets",
  "Social / Twitter",
  "Chart Pattern",
  "Gut / Intuition",
  "Other",
];

const SESSION_STATUSES: { value: SessionType; label: string; desc: string }[] = [
  { value: "full-session", label: "Full session", desc: "Full attention, uninterrupted" },
  { value: "partially-interrupted", label: "Partially interrupted", desc: "Brief interruptions, mostly focused" },
  { value: "intermittently-interrupted", label: "Intermittently interrupted", desc: "Frequent interruptions" },
  { value: "work-trade", label: "Work trade", desc: "Trading during work" },
  { value: "mobile-only", label: "Mobile only", desc: "Phone trading, limited screen" },
  { value: "forced-exit-risk", label: "Forced exit risk", desc: "Known interruption coming" },
];

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export default function NewTrade() {
  const navigate = useNavigate();
  const { addTrade, getNonDemoTradeCount } = useTradeStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fullTranscript, setFullTranscript] = useState("");
  const [livePartial, setLivePartial] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef("");
  const livePartialRef = useRef("");

  // Form state
  const [tokenName, setTokenName] = useState("");
  const [chain, setChain] = useState("SOL");
  const [entryMarketCap, setEntryMarketCap] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [setupType, setSetupType] = useState("");
  const [customSetupType, setCustomSetupType] = useState("");
  const [narrativeType, setNarrativeType] = useState("");
  const [indicatorsUsed, setIndicatorsUsed] = useState("");
  const [showIndicators, setShowIndicators] = useState(false);
  const [confirmationSignals, setConfirmationSignals] = useState<string[]>([]);
  const [confirmationSignalOther, setConfirmationSignalOther] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("full-session");
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [emotionFreeText, setEmotionFreeText] = useState("");
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [rawTranscript, setRawTranscript] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const startRecording = useCallback(() => {
    setVoiceError(null);
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition is not supported in this browser. Please use Chrome.");
      toast.error("Voice recording unavailable");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;
      let committed = "";
      fullTranscriptRef.current = "";
      livePartialRef.current = "";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        if (final) {
          committed = committed ? `${committed} ${final}` : final;
          setFullTranscript(committed);
          fullTranscriptRef.current = committed;
        }
        setLivePartial(interim);
        livePartialRef.current = interim;
      };

      recognition.onerror = (event: any) => {
        console.error("[WebSpeech] Error:", event.error);
        setVoiceError(event.error === "not-allowed"
          ? "Microphone permission denied. Please allow mic access and try again."
          : `Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (recognitionRef.current) {
          try { recognition.start(); } catch {}
        }
      };

      recognition.start();
      setFullTranscript("");
      setLivePartial("");
      setIsRecording(true);
    } catch (err: any) {
      setVoiceError(`Failed to start recording: ${err.message}`);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const capturedFull = fullTranscriptRef.current;
    const capturedPartial = livePartialRef.current;
    const finalTranscript = [capturedFull, capturedPartial].filter(Boolean).join(" ").trim();

    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsRecording(false);
    setLivePartial("");
    livePartialRef.current = "";

    if (!finalTranscript) {
      toast.error("No speech detected");
      return;
    }

    setRawTranscript(finalTranscript);
    setIsParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke("parse-trade-transcript", {
        body: { transcript: finalTranscript },
      });

      if (error || !data?.parsed) {
        console.error("[Parse] Error:", error, data);
        toast.error("AI parsing failed — fill in fields manually");
        setIsParsing(false);
        return;
      }

      const p = data.parsed;
      if (p.tokenName) setTokenName(p.tokenName);
      if (p.chain) setChain(p.chain);
      if (p.entryMarketCap) setEntryMarketCap(p.entryMarketCap);
      if (p.positionSize) setPositionSize(p.positionSize);
      if (p.setupType) {
        if (SETUP_TYPES.includes(p.setupType)) {
          setSetupType(p.setupType);
        } else {
          setSetupType("Custom");
          setCustomSetupType(p.setupType);
        }
      }
      if (p.narrativeType) setNarrativeType(p.narrativeType);
      if (p.confirmationSignals?.length) setConfirmationSignals(p.confirmationSignals);
      if (p.sessionType) setSessionType(p.sessionType);
      if (p.emotionalStates?.length) setEmotions(p.emotionalStates);
      if (p.quickTags?.length) setQuickTags(p.quickTags);

      toast.success("Trade parsed — review & save");
    } catch (err: any) {
      console.error("[Parse] Error:", err);
      toast.error("AI parsing failed");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const toggleEmotion = (e: EmotionalState) =>
    setEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  const toggleTag = (t: string) =>
    setQuickTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const toggleSignal = (s: string) =>
    setConfirmationSignals((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSave = () => {
    if (!tokenName.trim()) return;
    if (getNonDemoTradeCount() >= FREE_LIMIT) { navigate("/paywall"); return; }

    const finalSetup = setupType === "Custom" ? (customSetupType || "Custom") : setupType;

    const trade: Trade = {
      id: crypto.randomUUID(),
      userId: "local",
      tokenName: tokenName.trim(),
      chain,
      entryMarketCap: entryMarketCap || undefined,
      positionSize: positionSize || undefined,
      setupType: finalSetup || undefined,
      narrativeType: narrativeType || undefined,
      confirmationSignals: confirmationSignals.length ? confirmationSignals : undefined,
      confirmationSignalOther: confirmationSignals.includes("Other") ? confirmationSignalOther || undefined : undefined,
      indicatorsUsed: indicatorsUsed || undefined,
      sessionType,
      entryTime: new Date().toISOString(),
      emotionalStateAtEntry: emotions,
      emotionFreeText: emotionFreeText || undefined,
      entryTranscript: rawTranscript || undefined,
      additionalNotes: additionalNotes || undefined,
      quickTags,
      updates: [],
      status: "open",
      isDemo: false,
    };

    addTrade(trade);
    navigate(`/trade/${trade.id}`);
  };

  const displayTranscript = [fullTranscript, livePartial].filter(Boolean).join(" ");

  return (
    <div className="flex min-h-screen flex-col bg-background pb-28">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-[0.96] hover:bg-card">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-bold">New Trade — Entry</h1>
      </header>

      <div className="flex flex-col gap-6 px-5">
        {/* Voice section */}
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-card p-6">
          {voiceError && (
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">{voiceError}</AlertDescription>
            </Alert>
          )}

          {isRecording && (
            <p className="text-[10px] text-muted-foreground">Using browser speech recognition</p>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isParsing}
            className={cn(
              "group relative flex h-28 w-28 items-center justify-center rounded-full transition-all active:scale-[0.93]",
              isRecording ? "bg-red-500/20" : isParsing ? "bg-muted" : "bg-primary/15"
            )}
          >
            {isRecording && <div className="absolute inset-0 animate-ping rounded-full bg-red-500/10" />}
            <div className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-colors",
              isRecording ? "bg-red-500 shadow-red-500/30" : isParsing ? "bg-muted-foreground/30" : "bg-primary shadow-primary/30"
            )}>
              {isParsing ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                : isRecording ? <Square className="h-7 w-7 text-white" fill="white" />
                : <Mic className="h-8 w-8 text-primary-foreground" />}
            </div>
          </button>

          <p className="text-xs text-muted-foreground">
            {isParsing ? "Parsing your trade…" : isRecording ? "Listening — tap to stop" : "Tap to record your trade entry"}
          </p>

          {(isRecording || displayTranscript) && (
            <div className="w-full rounded-xl bg-background/50 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                {displayTranscript || <span className="text-muted-foreground italic">Waiting for speech…</span>}
              </p>
            </div>
          )}
        </div>

        {/* Form fields */}
        {(tokenName || rawTranscript) && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Review & correct</p>
        )}

        {/* Token + Chain */}
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Token *</label>
            <Input placeholder="e.g. BONK" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Chain</label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SOL">SOL</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="BASE">BASE</SelectItem>
                <SelectItem value="ARB">ARB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Entry MC + Size (2 cols) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Entry MC</label>
            <Input placeholder="80.7K" value={entryMarketCap} onChange={(e) => setEntryMarketCap(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Size</label>
            <Input placeholder="1.4 SOL" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} className="bg-card border-border" />
          </div>
        </div>

        {/* Setup Type dropdown + Narrative */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Setup Type</label>
            <Select value={setupType} onValueChange={setSetupType}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Select setup" /></SelectTrigger>
              <SelectContent>
                {SETUP_TYPES.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {setupType === "Custom" && (
              <Input placeholder="Describe setup…" value={customSetupType} onChange={(e) => setCustomSetupType(e.target.value)} className="mt-1.5 bg-card border-border" />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Narrative</label>
            <Input placeholder="AI" value={narrativeType} onChange={(e) => setNarrativeType(e.target.value)} className="bg-card border-border" />
          </div>
        </div>

        {/* Collapsible Indicators */}
        <Collapsible open={showIndicators} onOpenChange={setShowIndicators}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Plus className={cn("h-3.5 w-3.5 transition-transform", showIndicators && "rotate-45")} />
              Add indicators
              <span className="text-[10px] text-muted-foreground/60">— optional</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Input
              placeholder="e.g. RSI, MACD, VWAP…"
              value={indicatorsUsed}
              onChange={(e) => setIndicatorsUsed(e.target.value)}
              className="bg-card border-border"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Confirmation Signals */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Confirmation Signals</label>
          <div className="flex flex-wrap gap-1.5">
            {CONFIRMATION_SIGNALS.map((sig) => (
              <button
                key={sig}
                onClick={() => toggleSignal(sig)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.96]",
                  confirmationSignals.includes(sig)
                    ? "bg-primary/20 text-primary"
                    : "bg-card text-muted-foreground"
                )}
              >
                {confirmationSignals.includes(sig) && <Check className="mr-1 inline h-3 w-3" />}
                {sig}
              </button>
            ))}
          </div>
          {confirmationSignals.includes("Other") && (
            <Input
              placeholder="Describe signal…"
              value={confirmationSignalOther}
              onChange={(e) => setConfirmationSignalOther(e.target.value)}
              className="mt-1.5 bg-card border-border"
            />
          )}
        </div>

        {/* Session Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Session Status</label>
          <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
            <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SESSION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span>{s.label}</span>
                  <span className="ml-1.5 text-[10px] text-muted-foreground">— {s.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Emotional State */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Emotional State</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS.map((em) => (
              <button key={em.value} onClick={() => toggleEmotion(em.value)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.96]", emotions.includes(em.value) ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground")}>{em.label}</button>
            ))}
          </div>
          <Textarea
            placeholder="Describe your emotional state in your own words (optional)"
            value={emotionFreeText}
            onChange={(e) => setEmotionFreeText(e.target.value)}
            className="mt-2 min-h-[60px] bg-card border-border text-xs"
          />
        </div>

        {/* Quick Tags */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Quick Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.96]", quickTags.includes(tag) ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground")}>{tag}</button>
            ))}
          </div>
        </div>

        {/* Raw Transcript */}
        {rawTranscript && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Raw Transcript</label>
            <div className="rounded-xl bg-muted/50 border border-border p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{rawTranscript}</p>
            </div>
          </div>
        )}

        {/* Additional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Additional Notes — your thoughts, context, or anything the voice missed</label>
          <Textarea
            placeholder="Add any extra context…"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="min-h-[80px] bg-card border-border"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/80 px-5 pb-safe-bottom pt-3 backdrop-blur-md">
        <Button onClick={handleSave} disabled={!tokenName.trim() || isParsing} className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground active:scale-[0.97]">
          Save Entry
        </Button>
      </div>
    </div>
  );
}
