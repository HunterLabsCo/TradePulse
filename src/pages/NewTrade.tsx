import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Mic, Square, Loader2, Check, AlertTriangle, ChevronDown, Plus, X, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { supabase } from "@/integrations/supabase/client";
import type { EmotionalState, SessionType, Trade } from "@/lib/sample-data";
import { createVoiceRecorder } from "@/lib/voice-utils";
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
  { value: "bored", label: "Bored" },
  { value: "pressured", label: "Pressured" },
];

const QUICK_TAGS = [
  "Interrupted",
  "Full session",
  "Pre-set orders",
  "Above MC ceiling",
  "Non-compliant",
  "Chased / FOMO",
  "Best setup",
  "Clean execution",
  "Re-Entry",
  "Sized Up",
  "Sized Down",
  "Early Entry",
  "Late Entry",
  "Revenge Trade",
  "Low Conviction",
  "High Conviction",
  "Deviated From Plan",
];

const SETUP_TYPES = [
  "Migrated Confirmation",
  "Pre-Migration PVP",
  "Re-Entry",
  "Wallet Signal",
  "Narrative Play",
  "Breakout",
  "Dip Buy / Pullback",
  "Volume Spike",
  "Momentum Chase",
  "Custom",
];

const CONFIRMATION_SIGNALS = [
  "Volume",
  "Wallets",
  "Social / Twitter",
  "Chart Pattern",
  "Gut / Intuition",
  "EMA Cross",
  "RSI Holding",
  "Migration Confirmed",
  "Dev History",
  "Trending / Listed",
  "Low Supply",
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

function getCustomTags(): string[] {
  try {
    return JSON.parse(localStorage.getItem("tradesnap-custom-tags") || "[]");
  } catch { return []; }
}
function saveCustomTag(tag: string) {
  const tags = getCustomTags();
  if (!tags.includes(tag)) {
    tags.push(tag);
    localStorage.setItem("tradesnap-custom-tags", JSON.stringify(tags));
  }
}

/* Chip style helpers */
const chipBase = "rounded-full font-body text-[11px] font-300 transition-colors active:scale-[0.96]";
const chipDefault = "bg-transparent border border-[hsl(var(--border-default))] text-muted-foreground";
const chipSelected = "bg-primary text-primary-foreground border border-primary font-400";
const chipBlue = "bg-accent text-accent-foreground border border-accent font-400";

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
  const [customSignals, setCustomSignals] = useState<string[]>([]);
  const [newCustomSignal, setNewCustomSignal] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("full-session");
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [emotionFreeText, setEmotionFreeText] = useState("");
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [customTags] = useState<string[]>(getCustomTags());
  const [newCustomTag, setNewCustomTag] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isRecordingEmotion, setIsRecordingEmotion] = useState(false);
  const emotionRecRef = useRef<any>(null);
  const [isRecordingNotes, setIsRecordingNotes] = useState(false);
  const notesRecRef = useRef<any>(null);

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
        if (event.error === "no-speech") return;
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

  const startSecondaryVoice = (
    setRecording: (v: boolean) => void,
    recRef: React.MutableRefObject<any>,
    setText: (fn: (prev: string) => string) => void,
  ) => {
    const recorder = createVoiceRecorder({
      onText: (text: string) => {
        setText((prev: string) => (prev + " " + text).trim());
      },
      onStop: () => setRecording(false),
    });
    recRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopSecondaryVoice = (
    setRecording: (v: boolean) => void,
    recRef: React.MutableRefObject<any>,
  ) => {
    recRef.current?.stop();
    recRef.current = null;
  };

  const toggleEmotion = (e: EmotionalState) =>
    setEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  const toggleTag = (t: string) =>
    setQuickTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const toggleSignal = (s: string) =>
    setConfirmationSignals((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const addCustomSignal = () => {
    const val = newCustomSignal.trim();
    if (!val) return;
    setCustomSignals((prev) => [...prev, val]);
    setConfirmationSignals((prev) => [...prev, val]);
    setNewCustomSignal("");
  };

  const removeCustomSignal = (sig: string) => {
    setCustomSignals((prev) => prev.filter((s) => s !== sig));
    setConfirmationSignals((prev) => prev.filter((s) => s !== sig));
  };

  const addCustomTag = () => {
    const val = newCustomTag.trim();
    if (!val) return;
    saveCustomTag(val);
    setQuickTags((prev) => [...prev, val]);
    setNewCustomTag("");
  };

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

  const allQuickTags = [...QUICK_TAGS, ...customTags.filter((t) => !QUICK_TAGS.includes(t))];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-28">
      <header className="flex items-center gap-3 px-5 py-4 pt-safe-top">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors active:scale-[0.96] hover:bg-card text-accent">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-base font-600">New Trade — Entry</h1>
      </header>

      <div className="flex flex-col gap-6 px-5">
        {/* Voice section */}
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-card border border-border p-6">
          {voiceError && (
            <Alert variant="destructive" className="w-full">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-body text-xs font-300">{voiceError}</AlertDescription>
            </Alert>
          )}

          {isRecording && (
            <p className="font-body text-[10px] font-300 text-muted-foreground">Using browser speech recognition</p>
          )}

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isParsing}
            className={cn(
              "group relative flex h-28 w-28 items-center justify-center rounded-full transition-all active:scale-[0.93]",
              isRecording ? "bg-[hsl(var(--red-action)/0.15)]" : isParsing ? "bg-muted" : "bg-[hsl(var(--green-primary)/0.1)]"
            )}
          >
            <div className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full transition-colors",
              isRecording ? "bg-destructive animate-pulse-red-glow" : isParsing ? "bg-muted-foreground/30" : "bg-primary animate-pulse-glow"
            )}>
              {isParsing ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                : isRecording ? <Square className="h-7 w-7 text-foreground" fill="currentColor" />
                : <Mic className="h-8 w-8 text-primary-foreground" />}
            </div>
          </button>

          <p className="font-body text-xs font-300 text-muted-foreground">
            {isParsing ? "Parsing your trade…" : isRecording ? "Listening — tap to stop" : "Tap to record your trade entry"}
          </p>

          {(isRecording || displayTranscript) && (
            <div className="w-full rounded-xl bg-secondary border border-border p-4">
              <p className="font-body text-sm font-300 leading-relaxed text-foreground">
                {displayTranscript || <span className="text-[hsl(var(--text-muted))] italic">Waiting for speech…</span>}
              </p>
            </div>
          )}
        </div>

        {/* Form fields */}
        {(tokenName || rawTranscript) && (
          <p className="section-label">Review & correct</p>
        )}

        {/* Token + Chain */}
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <div className="space-y-1.5">
            <label className="section-label">Token *</label>
            <Input placeholder="e.g. BONK" value={tokenName} onChange={(e) => setTokenName(e.target.value)} className="bg-secondary border-border font-body font-300 focus-visible:ring-primary focus-visible:border-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Chain</label>
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger className="bg-secondary border-border font-body font-300"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SOL">SOL</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
                <SelectItem value="BASE">BASE</SelectItem>
                <SelectItem value="BNB">BNB / BSC</SelectItem>
                <SelectItem value="ARB">ARB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Entry MC + Size */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="section-label">Entry MC</label>
            <Input placeholder="80.7K" value={entryMarketCap} onChange={(e) => setEntryMarketCap(e.target.value)} className="bg-secondary border-border font-body font-300 focus-visible:ring-primary" />
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Size</label>
            <Input placeholder="1.4 SOL" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} className="bg-secondary border-border font-body font-300 focus-visible:ring-primary" />
          </div>
        </div>

        {/* Setup Type dropdown + Narrative */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="section-label">Setup Type</label>
            <Select value={setupType} onValueChange={setSetupType}>
              <SelectTrigger className="bg-secondary border-border font-body font-300"><SelectValue placeholder="Select setup" /></SelectTrigger>
              <SelectContent>
                {SETUP_TYPES.map((st) => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {setupType === "Custom" && (
              <Input placeholder="Describe setup…" value={customSetupType} onChange={(e) => setCustomSetupType(e.target.value)} className="mt-1.5 bg-secondary border-border font-body font-300 focus-visible:ring-primary" />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Narrative</label>
            <Input placeholder="AI" value={narrativeType} onChange={(e) => setNarrativeType(e.target.value)} className="bg-secondary border-border font-body font-300 focus-visible:ring-primary" />
          </div>
        </div>

        {/* Collapsible Indicators */}
        <Collapsible open={showIndicators} onOpenChange={setShowIndicators}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-1.5 font-body text-xs font-300 text-muted-foreground hover:text-foreground transition-colors">
              <Plus className={cn("h-3.5 w-3.5 transition-transform", showIndicators && "rotate-45")} />
              Add indicators
              <span className="font-body text-[10px] font-300 text-[hsl(var(--text-muted))]">— optional</span>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <Input
              placeholder="e.g. RSI, MACD, VWAP…"
              value={indicatorsUsed}
              onChange={(e) => setIndicatorsUsed(e.target.value)}
              className="bg-secondary border-border font-body font-300 focus-visible:ring-primary"
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Confirmation Signals */}
        <div className="space-y-2">
          <label className="section-label">Confirmation Signals</label>
          <div className="flex flex-wrap gap-1.5">
            {CONFIRMATION_SIGNALS.map((sig) => (
              <button
                key={sig}
                onClick={() => toggleSignal(sig)}
                className={cn(
                  chipBase, "px-2.5 py-1",
                  confirmationSignals.includes(sig) ? chipSelected : chipDefault
                )}
              >
                {confirmationSignals.includes(sig) && <Check className="mr-1 inline h-3 w-3" />}
                {sig}
              </button>
            ))}
            {customSignals.map((sig) => (
              <span
                key={sig}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[hsl(var(--green-primary)/0.4)] bg-[hsl(var(--green-primary)/0.1)] px-2.5 py-1 font-body text-[11px] font-300 text-primary"
              >
                {sig}
                <button onClick={() => removeCustomSignal(sig)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          {confirmationSignals.includes("Other") && (
            <Input
              placeholder="Describe signal…"
              value={confirmationSignalOther}
              onChange={(e) => setConfirmationSignalOther(e.target.value)}
              className="mt-1.5 bg-secondary border-border font-body font-300 focus-visible:ring-primary"
            />
          )}
          <div className="flex items-center gap-2 mt-1">
            <Input
              placeholder="+ Add your own"
              value={newCustomSignal}
              onChange={(e) => setNewCustomSignal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomSignal()}
              className="h-8 bg-secondary border-border font-body text-xs font-300 flex-1 focus-visible:ring-primary"
            />
            <Button variant="ghost" size="sm" onClick={addCustomSignal} disabled={!newCustomSignal.trim()} className="h-8 px-2 font-body text-xs font-400">
              Add
            </Button>
          </div>
        </div>

        {/* Session Status */}
        <div className="space-y-1.5">
          <label className="section-label">Session Status</label>
          <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
            <SelectTrigger className="bg-secondary border-border font-body font-300"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SESSION_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  <span className="font-body font-400">{s.label}</span>
                  <span className="ml-1.5 font-body text-[10px] font-300 text-muted-foreground">— {s.desc}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Emotional State */}
        <div className="space-y-2">
          <label className="section-label">Emotional State</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS.map((em) => (
              <button key={em.value} onClick={() => toggleEmotion(em.value)} className={cn(chipBase, "px-2.5 py-1", emotions.includes(em.value) ? chipSelected : chipDefault)}>{em.label}</button>
            ))}
          </div>
          <button
            onClick={() =>
              isRecordingEmotion
                ? stopSecondaryVoice(setIsRecordingEmotion, emotionRecRef)
                : startSecondaryVoice(setIsRecordingEmotion, emotionRecRef, setEmotionFreeText)
            }
            className={cn(
              "mt-2 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-[0.95]",
              isRecordingEmotion ? "bg-destructive animate-pulse-red-glow" : "bg-primary animate-pulse-glow"
            )}
          >
            {isRecordingEmotion ? <MicOff className="h-5 w-5 text-foreground" /> : <Mic className="h-5 w-5 text-primary-foreground" />}
          </button>
          <p className="font-body text-[10px] font-300 text-muted-foreground">
            {isRecordingEmotion ? "Recording — tap to stop" : "Tap to describe by voice"}
          </p>
          <Textarea
            placeholder="Describe your emotional state in your own words (optional)"
            value={emotionFreeText}
            onChange={(e) => setEmotionFreeText(e.target.value)}
            className="min-h-[60px] bg-secondary border-border font-body text-xs font-300 focus-visible:ring-primary"
          />
        </div>

        {/* Quick Tags */}
        <div className="space-y-2">
          <label className="section-label">Quick Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {allQuickTags.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)} className={cn(chipBase, "px-2.5 py-1", quickTags.includes(tag) ? chipBlue : chipDefault)}>{tag}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Input
              placeholder="+ Add custom tag"
              value={newCustomTag}
              onChange={(e) => setNewCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              className="h-8 bg-secondary border-border font-body text-xs font-300 flex-1 focus-visible:ring-primary"
            />
            <Button variant="ghost" size="sm" onClick={addCustomTag} disabled={!newCustomTag.trim()} className="h-8 px-2 font-body text-xs font-400">
              Add
            </Button>
          </div>
        </div>

        {/* Raw Transcript */}
        {rawTranscript && (
          <div className="space-y-1.5">
            <label className="section-label">Raw Transcript</label>
            <p className="rounded-none rounded-r-lg bg-[hsl(var(--blue-accent)/0.04)] border-l-2 border-l-[hsl(var(--blue-accent)/0.3)] py-3 px-4 font-body text-[13px] font-300 italic leading-relaxed text-accent">{rawTranscript}</p>
          </div>
        )}

        {/* Additional Notes */}
        <div className="space-y-1.5">
          <label className="section-label">Additional Notes — your thoughts, context, or anything the voice missed</label>
          <button
            onClick={() =>
              isRecordingNotes
                ? stopSecondaryVoice(setIsRecordingNotes, notesRecRef)
                : startSecondaryVoice(setIsRecordingNotes, notesRecRef, setAdditionalNotes)
            }
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-[0.95]",
              isRecordingNotes ? "bg-destructive animate-pulse-red-glow" : "bg-primary animate-pulse-glow"
            )}
          >
            {isRecordingNotes ? <MicOff className="h-5 w-5 text-foreground" /> : <Mic className="h-5 w-5 text-primary-foreground" />}
          </button>
          <p className="font-body text-[10px] font-300 text-muted-foreground">
            {isRecordingNotes ? "Recording — tap to stop" : "Tap to add notes by voice"}
          </p>
          <Textarea
            placeholder="Add any extra context…"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="min-h-[80px] bg-secondary border-border font-body font-300 focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/80 px-5 pb-safe-bottom pt-3 backdrop-blur-md">
        <Button onClick={handleSave} disabled={!tokenName.trim() || isParsing} className="h-12 w-full rounded-[14px] bg-primary font-display text-sm font-700 text-primary-foreground shadow-[0_0_20px_hsl(var(--green-primary)/0.3)] active:scale-[0.97]">
          Save Entry
        </Button>
      </div>
    </div>
  );
}
