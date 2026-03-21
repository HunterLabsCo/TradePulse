import { useState, useCallback, useRef } from "react";
import { ArrowLeft, Mic, Square, Loader2, Check, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useScribe } from "@elevenlabs/react";
import { useTradeStore } from "@/lib/trade-store";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [sttMethod, setSttMethod] = useState<"elevenlabs" | "webspeech" | null>(null);

  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef("");
  const livePartialRef = useRef("");

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

  // ElevenLabs Scribe hook
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
    onPartialTranscript: (data) => {
      console.log("[Scribe] Partial:", data.text);
      setLivePartial(data.text);
      livePartialRef.current = data.text;
    },
    onCommittedTranscript: (data) => {
      console.log("[Scribe] Committed:", data.text);
      setFullTranscript((prev) => {
        const next = prev ? `${prev} ${data.text}` : data.text;
        fullTranscriptRef.current = next;
        return next;
      });
      setLivePartial("");
      livePartialRef.current = "";
    },
  });

  const startRecording = useCallback(async () => {
    setVoiceError(null);

    // Try ElevenLabs first
    try {
      console.log("[Voice] Fetching ElevenLabs scribe token…");
      const { data, error } = await supabase.functions.invoke("elevenlabs-scribe-token");

      if (error) {
        console.error("[Voice] Supabase invoke error:", error);
        throw new Error(`Token fetch failed: ${error.message || JSON.stringify(error)}`);
      }
      if (data?.error) {
        console.error("[Voice] Edge function returned error:", data.error);
        throw new Error(`ElevenLabs: ${data.error}`);
      }
      if (!data?.token) {
        console.error("[Voice] No token in response:", data);
        throw new Error("No token returned from edge function");
      }

      console.log("[Voice] Token obtained, connecting ElevenLabs Scribe…");
      fullTranscriptRef.current = "";
      livePartialRef.current = "";
      setFullTranscript("");
      setLivePartial("");
      setIsRecording(true);
      setSttMethod("elevenlabs");

      await scribe.connect({
        token: data.token,
        microphone: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (elevenLabsErr: any) {
      console.warn("[Voice] ElevenLabs unavailable:", elevenLabsErr.message);

      // Fall back to Web Speech API
      if (!SpeechRecognition) {
        setVoiceError(`ElevenLabs failed: ${elevenLabsErr.message}. Browser Speech API also unavailable.`);
        toast.error("Voice recording unavailable");
        return;
      }

      console.log("[Voice] Falling back to Web Speech API…");
      setSttMethod("webspeech");
      startWebSpeech();
    }
  }, [scribe]);

  const startWebSpeech = useCallback(() => {
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
        }
        setLivePartial(interim);
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
    if (sttMethod === "elevenlabs") {
      scribe.disconnect();
    } else if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsRecording(false);

    const finalTranscript = [fullTranscript, livePartial].filter(Boolean).join(" ").trim();
    setLivePartial("");

    if (!finalTranscript) {
      toast.error("No speech detected");
      return;
    }

    setTranscript(finalTranscript);
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
      if (p.entryPrice) setEntryPrice(p.entryPrice);
      if (p.positionSize) setPositionSize(p.positionSize);
      if (p.setupType) setSetupType(p.setupType);
      if (p.narrativeType) setNarrativeType(p.narrativeType);
      if (p.volumeConfirmed != null) setVolumeConfirmed(p.volumeConfirmed);
      if (p.walletConfirmed != null) setWalletConfirmed(p.walletConfirmed);
      if (p.interruptionStatus) setInterruptionStatus(p.interruptionStatus);
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
  }, [scribe, sttMethod, fullTranscript, livePartial]);

  const toggleEmotion = (e: EmotionalState) =>
    setEmotions((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);

  const toggleTag = (t: string) =>
    setQuickTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSave = () => {
    if (!tokenName.trim()) return;
    if (getNonDemoTradeCount() >= FREE_LIMIT) { navigate("/paywall"); return; }

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

          {isRecording && sttMethod === "webspeech" && (
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
        {(tokenName || transcript) && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Review & correct</p>
        )}

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

        <div className="flex flex-wrap gap-2">
          {[
            { label: "Volume ✓", active: volumeConfirmed, toggle: () => setVolumeConfirmed(!volumeConfirmed) },
            { label: "Wallets ✓", active: walletConfirmed, toggle: () => setWalletConfirmed(!walletConfirmed) },
          ].map((item) => (
            <button key={item.label} onClick={item.toggle} className={cn("flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors active:scale-[0.96]", item.active ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground")}>
              {item.active && <Check className="h-3 w-3" />}{item.label}
            </button>
          ))}
          <Select value={interruptionStatus} onValueChange={(v) => setInterruptionStatus(v as "interrupted" | "clean")}>
            <SelectTrigger className="h-9 w-auto gap-1.5 rounded-lg bg-card border-border text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="clean">Clean session</SelectItem>
              <SelectItem value="interrupted">Interrupted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sessionType} onValueChange={(v) => setSessionType(v as "work-trade" | "full-session")}>
            <SelectTrigger className="h-9 w-auto gap-1.5 rounded-lg bg-card border-border text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="full-session">Full session</SelectItem>
              <SelectItem value="work-trade">Work trade</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Emotional State</label>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS.map((em) => (
              <button key={em.value} onClick={() => toggleEmotion(em.value)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.96]", emotions.includes(em.value) ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground")}>{em.label}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Quick Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => (
              <button key={tag} onClick={() => toggleTag(tag)} className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors active:scale-[0.96]", quickTags.includes(tag) ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground")}>{tag}</button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Entry Notes / Transcript</label>
          <Textarea placeholder="Your voice transcript appears here, or type notes…" value={transcript} onChange={(e) => setTranscript(e.target.value)} className="min-h-[80px] bg-card border-border" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/80 px-5 pb-safe-bottom pt-3 backdrop-blur-md">
        <Button onClick={handleSave} disabled={!tokenName.trim() || isParsing} className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground active:scale-[0.97]">
          Save Entry
        </Button>
      </div>
    </div>
  );
}
