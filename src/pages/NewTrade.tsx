import { useState, useCallback, useRef, type MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useTradeStore } from "@/lib/trade-store";
import { useSubscriptionStore } from "@/lib/subscription-store";
import { supabase } from "@/integrations/supabase/client";
import type { EmotionalState, SessionType, Trade } from "@/lib/sample-data";
import {
  createVoiceRecorder,
  detectEmotionsFromText,
  detectSignalsFromText,
  detectIndicatorsFromText,
  detectSessionTypeFromText,
} from "@/lib/voice-utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { uid } from "@/lib/utils";
import { Label } from "@/components/design/Label";
import { Pill } from "@/components/design/Pill";
import { emotionColor } from "@/lib/emotion-utils";
import { Kbd } from "@/components/design/Kbd";
import { Waveform } from "@/components/design/Waveform";
import { AppSidebar } from "@/components/design/AppSidebar";

// ── Constants ────────────────────────────────────────────────────────
const FREE_LIMIT = 20;

const EMOTIONS: { value: EmotionalState; label: string }[] = [
  { value: "confident", label: "Confident" },
  { value: "calm", label: "Calm" },
  { value: "focused", label: "Focused" },
  { value: "patient", label: "Patient" },
  { value: "in-the-zone", label: "In the Zone" },
  { value: "disciplined", label: "Disciplined" },
  { value: "sharp", label: "Sharp" },
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
  { value: "detached", label: "Detached" },
  { value: "tired", label: "Tired" },
  { value: "bored", label: "Bored" },
  { value: "pressured", label: "Pressured" },
];

const QUICK_TAGS = [
  "Interrupted", "Full session", "Pre-set orders", "Above MC ceiling", "Non-compliant",
  "Chased / FOMO", "Best setup", "Clean execution", "Re-Entry", "Sized Up",
  "Sized Down", "Early Entry", "Late Entry", "Revenge Trade", "Low Conviction",
  "High Conviction", "Deviated From Plan",
];

const SETUP_TYPES = [
  "Migrated Confirmation", "Pre-Migration PVP", "Wallet Signal", "Narrative Play",
  "Breakout", "Dip Buy / Pullback", "Volume Spike", "Momentum Chase", "Custom",
];

const CONFIRMATION_SIGNALS = [
  "Volume", "Wallets", "Social / Twitter", "Chart Pattern", "Gut / Intuition",
  "EMA Cross", "RSI", "Migration Confirmed", "Dev History", "Trending / Listed", "Other",
];

const SESSION_STATUSES: { value: SessionType; label: string; desc: string }[] = [
  { value: "full-session", label: "Full session", desc: "Full attention" },
  { value: "partially-interrupted", label: "Partially interrupted", desc: "Brief interruptions" },
  { value: "intermittently-interrupted", label: "Intermittently interrupted", desc: "Frequent interruptions" },
  { value: "work-trade", label: "Work trade", desc: "Trading during work" },
  { value: "mobile-only", label: "Mobile only", desc: "Phone trading" },
  { value: "forced-exit-risk", label: "Forced exit risk", desc: "Interruption coming" },
];

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

function getCustomTags(): string[] {
  try { return JSON.parse(localStorage.getItem("tradesnap-custom-tags") || "[]"); }
  catch { return []; }
}
function saveCustomTag(tag: string) {
  const tags = getCustomTags();
  if (!tags.includes(tag)) {
    tags.push(tag);
    localStorage.setItem("tradesnap-custom-tags", JSON.stringify(tags));
  }
}

// ── Component ─────────────────────────────────────────────────────────
export default function NewTrade() {
  const navigate = useNavigate();
  const { addTrade, getNonDemoTradeCount } = useTradeStore();

  // ── Voice state ──
  const [isRecording, setIsRecording] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullTranscript, setFullTranscript] = useState("");
  const [livePartial, setLivePartial] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);

  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef("");
  const livePartialRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Form state ──
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

  // Secondary voice refs
  const [isRecordingEmotion, setIsRecordingEmotion] = useState(false);
  const emotionRecRef = useRef<any>(null);
  const [isRecordingNotes, setIsRecordingNotes] = useState(false);
  const notesRecRef = useRef<any>(null);

  // ── Recording ──────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    setVoiceError(null);
    if (!SpeechRecognition) {
      setVoiceError("Speech recognition not supported. Use Chrome.");
      toast.error("Voice recording unavailable");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;
      let committed = fullTranscriptRef.current;
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
          // Real-time auto-fill
          const detectedSignals = detectSignalsFromText(committed);
          if (detectedSignals.length > 0) {
            setConfirmationSignals((prev) => {
              const merged = [...prev];
              for (const s of detectedSignals) { if (!merged.includes(s)) merged.push(s); }
              return merged;
            });
          }
          const detectedEmotions = detectEmotionsFromText(committed);
          if (detectedEmotions.length > 0) {
            setEmotions((prev) => {
              const merged = [...prev];
              for (const e of detectedEmotions) { if (!merged.includes(e)) merged.push(e); }
              return merged;
            });
          }
          const detectedIndicators = detectIndicatorsFromText(committed);
          if (detectedIndicators) { setIndicatorsUsed(detectedIndicators); setShowIndicators(true); }
          const detectedSession = detectSessionTypeFromText(committed);
          if (detectedSession) setSessionType(detectedSession as any);
        }
        setLivePartial(interim);
        livePartialRef.current = interim;
      };

      recognition.onerror = (event: any) => {
        if (event.error === "no-speech") return;
        setVoiceError(event.error === "not-allowed"
          ? "Microphone permission denied."
          : `Speech error: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (recognitionRef.current) { try { recognition.start(); } catch {} }
      };

      recognition.start();
      setLivePartial("");
      setIsRecording(true);
      setElapsedSecs(0);
      timerRef.current = setInterval(() => setElapsedSecs((s) => s + 1), 1000);
    } catch (err: any) {
      setVoiceError(`Failed to start: ${err.message}`);
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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    setIsRecording(false);
    setLivePartial("");
    livePartialRef.current = "";

    if (!finalTranscript) { toast.error("No speech detected"); return; }

    setRawTranscript(finalTranscript);
    setIsParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke("parse-trade-transcript", {
        body: { transcript: finalTranscript },
      });

      if (error || !data?.parsed) {
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
        if (SETUP_TYPES.includes(p.setupType)) setSetupType(p.setupType);
        else { setSetupType("Custom"); setCustomSetupType(p.setupType); }
      }
      if (p.narrativeType) setNarrativeType(p.narrativeType);
      if (p.confirmationSignals?.length) setConfirmationSignals(p.confirmationSignals);
      if (p.indicatorsUsed) { setIndicatorsUsed(p.indicatorsUsed); setShowIndicators(true); }
      else {
        const clientIndicators = detectIndicatorsFromText(finalTranscript);
        if (clientIndicators) { setIndicatorsUsed(clientIndicators); setShowIndicators(true); }
      }
      if (p.sessionType) setSessionType(p.sessionType);
      if (p.emotionalStates?.length) setEmotions(p.emotionalStates);
      if (p.quickTags?.length) setQuickTags(p.quickTags);

      toast.success("Trade parsed — review & save");
    } catch (err: any) {
      toast.error("AI parsing failed");
    } finally {
      setIsParsing(false);
    }
  }, []);

  // ── Secondary voice ────────────────────────────────────────────────
  const startSecondaryVoice = (
    setRec: (v: boolean) => void,
    recRef: MutableRefObject<any>,
    setText: (fn: (prev: string) => string) => void,
  ) => {
    const recorder = createVoiceRecorder({
      onText: (text: string) => setText((prev) => (prev + " " + text).trim()),
      onStop: () => setRec(false),
    });
    recRef.current = recorder;
    recorder.start();
    setRec(true);
  };

  const stopSecondaryVoice = (
    setRec: (v: boolean) => void,
    recRef: MutableRefObject<any>,
  ) => {
    recRef.current?.stop();
    recRef.current = null;
  };

  // ── Toggles ────────────────────────────────────────────────────────
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

  // ── Save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!tokenName.trim()) { toast.error("Add a token name before saving."); return; }
    const { isPro, connectedWallet } = useSubscriptionStore.getState();
    if (getNonDemoTradeCount() >= FREE_LIMIT && !isPro) { navigate("/upgrade"); return; }

    const finalSetup = setupType === "Custom" ? (customSetupType || "Custom") : setupType;

    const trade: Trade = {
      id: uid(),
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

    if (connectedWallet) {
      setIsSaving(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-trade", {
          body: { walletAddress: connectedWallet, tradeData: trade },
        });
        if (data?.error === "TRADE_LIMIT_REACHED") { navigate("/upgrade"); return; }
        if (!error && data?.id) trade.id = data.id;
      } catch {
        // Network/edge failure — keep the entry locally (local-first) so nothing is lost.
        toast.error("Saved locally — couldn't sync to the cloud.");
      } finally {
        setIsSaving(false);
      }
    }

    addTrade(trade);
    navigate(`/trade/${trade.id}`);
  };

  // ── Derived ────────────────────────────────────────────────────────
  const displayTranscript = [fullTranscript, livePartial].filter(Boolean).join(" ");

  // Highlight parsed entities in transcript (heuristic: tokenName, chain, entryMC)
  const highlightTranscript = (text: string) => {
    if (!text) return null;
    const highlights = [tokenName, chain, entryMarketCap].filter(Boolean).map((s) => s.toLowerCase());
    const words = text.split(/\s+/);
    return words.map((word, i) => {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
      const isHighlighted = highlights.some((h) => clean.includes(h.replace(/[^a-z0-9]/g, "")));
      return isHighlighted ? (
        <span key={i} className="text-[#8ec2dd] font-medium">{word} </span>
      ) : (
        <span key={i} className="text-[#d8e0d2]">{word} </span>
      );
    });
  };

  const parsedFieldCount = [tokenName, chain, entryMarketCap, positionSize, setupType, narrativeType]
    .filter(Boolean).length;

  const allQuickTags = [...QUICK_TAGS, ...customTags.filter((t) => !QUICK_TAGS.includes(t))];

  const timerStr = `${String(Math.floor(elapsedSecs / 60)).padStart(2, "0")}:${String(elapsedSecs % 60).padStart(2, "0")}`;

  const MicIcon = ({ size = 22 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="#0e1311" />
      <path d="M5 11a7 7 0 0 0 14 0 M12 18v3" stroke="#0e1311" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );

  const MicOffIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 9v4a3 3 0 0 0 5.12 2.12M15 9.34V6a3 3 0 0 0-5.94-.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v3M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#0e1311]">
      <AppSidebar activePage="new-trade" />

      <div className="flex flex-col flex-1 pb-28">
        <div className="md:max-w-[640px] md:mx-auto w-full">

          {/* Back Row */}
          <div className="flex items-center gap-3 px-[22px] pt-1.5 py-4">
            <button
              onClick={() => navigate(-1)}
              className="bg-transparent text-[#8ec2dd] border border-[#222a25] py-[5px] px-2.5 font-mono text-[11px] rounded-[3px] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              ← esc
            </button>
            <Label>New trade</Label>
          </div>

          {/* Recording Hero */}
          <section className="px-[22px] pt-7 relative">
            {/* Glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: 300, height: 110,
                left: "50%", top: 78,
                transform: "translateX(-50%)",
                background: "radial-gradient(ellipse, rgba(142,194,221,0.14) 0%, transparent 70%)",
                filter: "blur(6px)",
              }}
            />

            {/* Status row */}
            <div className="relative flex items-center gap-2 mb-[18px]">
              {isRecording ? (
                <>
                  <span
                    className="inline-block w-2 h-2 rounded-[4px] bg-[#e89a8a]"
                    style={{ animation: "termblink 1s infinite" }}
                  />
                  <span className="font-mono text-[11px] text-[#e89a8a] font-medium tracking-[0.12em]">RECORDING</span>
                </>
              ) : (
                <>
                  <span
                    className="inline-block w-2 h-2 rounded-[4px] bg-[#8ec2dd]"
                    style={{ animation: "termpulse 2s ease-in-out infinite" }}
                  />
                  <span className="font-mono text-[11px] text-[#8ec2dd] font-medium tracking-[0.12em]">
                    {isParsing ? "PARSING" : "READY"}
                  </span>
                </>
              )}
              {isRecording && (
                <span className="ml-auto font-mono text-[11px] text-[#7a8a75] tabular-nums">{timerStr}</span>
              )}
            </div>

            {/* Waveform */}
            <div className="relative py-2">
              <Waveform bars={36} color="#8ec2dd" height={72} width={3} gap={4} rounded={false} active={isRecording} />
            </div>

            {/* Live transcript */}
            {(isRecording || displayTranscript) && (
              <div className="relative mt-6">
                <p className="font-sans text-[16px] text-[#d8e0d2] leading-[1.55] tracking-[-0.005em]">
                  {highlightTranscript(displayTranscript)}
                  {livePartial && (
                    <span className="text-[#7a8a75]">{livePartial.length > 0 ? "" : ""}</span>
                  )}
                  {isRecording && (
                    <span
                      className="text-[#8ec2dd] ml-0.5"
                      style={{ animation: "termblink 1s infinite" }}
                    >
                      ▮
                    </span>
                  )}
                </p>
              </div>
            )}

            {voiceError && (
              <p className="mt-3 font-mono text-[10.5px] text-[#e89a8a]">{voiceError}</p>
            )}
          </section>

          {/* Record / Stop button (center, below waveform area) */}
          <div className="px-[22px] mt-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isParsing}
              className={`w-full flex items-center justify-center gap-3 py-4 font-sans font-medium text-[16px] rounded-[6px] transition-opacity ${
                isParsing ? "opacity-50 cursor-not-allowed bg-[#7a8a75] text-[#0e1311]" :
                isRecording
                  ? "bg-[#e89a8a] text-[#0e1311]"
                  : "bg-[#8ec2dd] text-[#0e1311]"
              }`}
              style={!isRecording && !isParsing ? { boxShadow: "0 8px 32px -8px rgba(142,194,221,0.33)" } : {}}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isParsing ? (
                <span className="font-mono text-[12px]">Parsing…</span>
              ) : isRecording ? (
                <>
                  <span className="inline-block w-4 h-4 bg-[#0e1311] rounded-[2px]" />
                  Stop recording
                </>
              ) : (
                <>
                  <MicIcon size={20} />
                  Start recording
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#222a25] my-7 mx-[22px]" />

          {/* Parsed Fields */}
          <section className="px-[22px]">
            <div className="flex items-center justify-between mb-3.5">
              <Label>Parsed</Label>
              <Pill color="#a8d4ad">✓ {parsedFieldCount} fields</Pill>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
              {/* Token — editable, highlighted */}
              <div>
                <p className="font-mono text-[9.5px] text-[#7a8a75] tracking-[0.1em] uppercase">Token</p>
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="—"
                  className="mt-1 font-sans text-[22px] font-medium text-[#8ec2dd] tracking-[-0.01em] leading-[1.1] bg-transparent border-none outline-none w-full"
                  style={{ caretColor: "#8ec2dd" }}
                />
              </div>
              <div>
                <p className="font-mono text-[9.5px] text-[#7a8a75] tracking-[0.1em] uppercase">Chain</p>
                <Select value={chain} onValueChange={setChain}>
                  <SelectTrigger className="mt-1 bg-transparent border-none outline-none p-0 h-auto font-sans text-[16px] font-medium text-[#d8e0d2] [&>svg]:text-[#7a8a75]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161c19] border-[#222a25]">
                    {["SOL", "ETH", "BASE", "BNB", "ARB"].map((c) => (
                      <SelectItem key={c} value={c} className="text-[#d8e0d2] focus:bg-[#222a25] focus:text-[#8ec2dd] font-mono text-[13px]">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="font-mono text-[9.5px] text-[#7a8a75] tracking-[0.1em] uppercase">Entry MC</p>
                <input
                  value={entryMarketCap}
                  onChange={(e) => setEntryMarketCap(e.target.value)}
                  placeholder="—"
                  className="mt-1 font-sans text-[16px] font-medium text-[#d8e0d2] tracking-[-0.01em] leading-[1.1] bg-transparent border-none outline-none w-full"
                  style={{ caretColor: "#8ec2dd" }}
                />
              </div>
              <div>
                <p className="font-mono text-[9.5px] text-[#7a8a75] tracking-[0.1em] uppercase">Size</p>
                <input
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value)}
                  placeholder="—"
                  className="mt-1 font-sans text-[16px] font-medium text-[#d8e0d2] tracking-[-0.01em] leading-[1.1] bg-transparent border-none outline-none w-full"
                  style={{ caretColor: "#8ec2dd" }}
                />
              </div>
              {/* Setup — wide */}
              <div className="col-span-2">
                <p className="font-mono text-[9.5px] text-[#7a8a75] tracking-[0.1em] uppercase">Setup</p>
                <Select value={setupType} onValueChange={setSetupType}>
                  <SelectTrigger className="mt-1 bg-transparent border-none outline-none p-0 h-auto font-sans text-[16px] font-medium text-[#d8e0d2] [&>svg]:text-[#7a8a75]">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161c19] border-[#222a25]">
                    {SETUP_TYPES.map((st) => (
                      <SelectItem key={st} value={st} className="text-[#d8e0d2] focus:bg-[#222a25] focus:text-[#8ec2dd] font-mono text-[13px]">{st}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {setupType === "Custom" && (
                  <input
                    value={customSetupType}
                    onChange={(e) => setCustomSetupType(e.target.value)}
                    placeholder="Describe setup…"
                    className="mt-1 font-sans text-[14px] text-[#d8e0d2] bg-transparent border-none outline-none w-full"
                    style={{ caretColor: "#8ec2dd" }}
                  />
                )}
              </div>
              {/* Narrative — wide */}
              <div className="col-span-2">
                <p className="font-mono text-[9.5px] text-[#7a8a75] tracking-[0.1em] uppercase">Narrative</p>
                <input
                  value={narrativeType}
                  onChange={(e) => setNarrativeType(e.target.value)}
                  placeholder="—"
                  className="mt-1 font-sans text-[16px] font-medium text-[#d8e0d2] tracking-[-0.01em] leading-[1.1] bg-transparent border-none outline-none w-full"
                  style={{ caretColor: "#8ec2dd" }}
                />
              </div>
            </div>
          </section>

          {/* Indicators (collapsible) */}
          <div className="px-[22px] mt-4">
            <Collapsible open={showIndicators} onOpenChange={setShowIndicators}>
              <CollapsibleTrigger className="flex items-center gap-1.5 font-mono text-[10px] text-[#7a8a75] hover:text-[#d8e0d2] transition-colors">
                <span className={`transition-transform ${showIndicators ? "rotate-45" : ""}`}>+</span>
                {showIndicators ? "Hide" : "Add"} indicators
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <input
                  placeholder="e.g. RSI, MACD, VWAP…"
                  value={indicatorsUsed}
                  onChange={(e) => setIndicatorsUsed(e.target.value)}
                  className="w-full font-mono text-[12px] text-[#d8e0d2] bg-[#161c19] border border-[#222a25] rounded-[4px] px-3 py-2 outline-none focus:border-[#8ec2dd]"
                  style={{ caretColor: "#8ec2dd" }}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#222a25] my-6 mx-[22px]" />

          {/* Emotional State */}
          <section className="px-[22px]">
            <Label className="mb-2.5 block">State</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((em) => {
                const selected = emotions.includes(em.value);
                const ec = emotionColor(em.value);
                return (
                  <button
                    key={em.value}
                    onClick={() => toggleEmotion(em.value)}
                    className="transition-opacity active:opacity-70 min-h-[36px]"
                  >
                    <Pill
                      color={selected ? ec.color : "#7a8a75"}
                      bg={selected ? ec.bg : undefined}
                    >
                      {em.label}
                    </Pill>
                  </button>
                );
              })}
              {/* Voice emotion */}
              <button
                onClick={() =>
                  isRecordingEmotion
                    ? stopSecondaryVoice(setIsRecordingEmotion, emotionRecRef)
                    : startSecondaryVoice(setIsRecordingEmotion, emotionRecRef, setEmotionFreeText)
                }
                className="min-h-[36px]"
                aria-label={isRecordingEmotion ? "Stop emotion voice" : "Add emotion by voice"}
              >
                <Pill color={isRecordingEmotion ? "#e89a8a" : "#7a8a75"}>
                  {isRecordingEmotion ? "● stop" : "+ add voice"}
                </Pill>
              </button>
            </div>
            {emotionFreeText && (
              <p className="mt-2 font-mono text-[10.5px] text-[#7a8a75] leading-[1.5]">"{emotionFreeText}"</p>
            )}
          </section>

          {/* Session Status */}
          <div className="px-[22px] mt-6">
            <Label className="mb-2 block">Session</Label>
            <Select value={sessionType} onValueChange={(v) => setSessionType(v as SessionType)}>
              <SelectTrigger className="bg-[#161c19] border-[#222a25] text-[#d8e0d2] font-mono text-[12px] rounded-[4px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161c19] border-[#222a25]">
                {SESSION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-[#d8e0d2] focus:bg-[#222a25] focus:text-[#8ec2dd] font-mono text-[12px]">
                    {s.label} — {s.desc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confirmation Signals */}
          <div className="px-[22px] mt-6">
            <Label className="mb-2 block">Signals</Label>
            <div className="flex flex-wrap gap-1.5">
              {CONFIRMATION_SIGNALS.map((sig) => {
                const on = confirmationSignals.includes(sig);
                return (
                  <button key={sig} onClick={() => toggleSignal(sig)} className="min-h-[36px]">
                    <Pill color={on ? "#8ec2dd" : "#7a8a75"} bg={on ? "rgba(142,194,221,0.08)" : undefined}>
                      {on ? "✓ " : ""}{sig}
                    </Pill>
                  </button>
                );
              })}
              {customSignals.map((sig) => (
                <button key={sig} onClick={() => removeCustomSignal(sig)} className="min-h-[36px]">
                  <Pill color="#a8d4ad">✓ {sig} ×</Pill>
                </button>
              ))}
            </div>
            {confirmationSignals.includes("Other") && (
              <input
                placeholder="Describe signal…"
                value={confirmationSignalOther}
                onChange={(e) => setConfirmationSignalOther(e.target.value)}
                className="mt-2 w-full font-mono text-[12px] text-[#d8e0d2] bg-[#161c19] border border-[#222a25] rounded-[4px] px-3 py-2 outline-none focus:border-[#8ec2dd]"
              />
            )}
            <div className="flex items-center gap-2 mt-2">
              <input
                placeholder="+ Custom signal"
                value={newCustomSignal}
                onChange={(e) => setNewCustomSignal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomSignal()}
                className="flex-1 font-mono text-[11px] text-[#d8e0d2] bg-[#161c19] border border-[#222a25] rounded-[4px] px-3 py-1.5 outline-none focus:border-[#8ec2dd]"
              />
              <button onClick={addCustomSignal} className="font-mono text-[11px] text-[#8ec2dd] px-3 py-1.5 border border-[#8ec2dd] rounded-[4px]">Add</button>
            </div>
          </div>

          {/* Quick Tags */}
          <div className="px-[22px] mt-6">
            <Label className="mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {allQuickTags.map((tag) => {
                const on = quickTags.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleTag(tag)} className="min-h-[36px]">
                    <Pill color={on ? "#8ec2dd" : "#7a8a75"} bg={on ? "rgba(142,194,221,0.08)" : undefined}>
                      {on ? "✓ " : ""}{tag}
                    </Pill>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                placeholder="+ Custom tag"
                value={newCustomTag}
                onChange={(e) => setNewCustomTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
                className="flex-1 font-mono text-[11px] text-[#d8e0d2] bg-[#161c19] border border-[#222a25] rounded-[4px] px-3 py-1.5 outline-none focus:border-[#8ec2dd]"
              />
              <button onClick={addCustomTag} className="font-mono text-[11px] text-[#8ec2dd] px-3 py-1.5 border border-[#8ec2dd] rounded-[4px]">Add</button>
            </div>
          </div>

          {/* Raw Transcript */}
          {rawTranscript && (
            <div className="px-[22px] mt-6">
              <Label className="mb-2 block">Transcript</Label>
              <p className="font-mono text-[11px] text-[#7a8a75] leading-[1.6] italic border-l-2 border-[#8ec2dd] pl-3">
                "{rawTranscript}"
              </p>
            </div>
          )}

          {/* Additional Notes */}
          <div className="px-[22px] mt-6 mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Notes</Label>
              <button
                onClick={() =>
                  isRecordingNotes
                    ? stopSecondaryVoice(setIsRecordingNotes, notesRecRef)
                    : startSecondaryVoice(setIsRecordingNotes, notesRecRef, setAdditionalNotes)
                }
                className="min-h-[36px]"
                aria-label={isRecordingNotes ? "Stop notes voice" : "Add notes by voice"}
              >
                <Pill color={isRecordingNotes ? "#e89a8a" : "#7a8a75"}>
                  {isRecordingNotes ? "● stop" : "🎤 voice note"}
                </Pill>
              </button>
            </div>
            <textarea
              placeholder="Add any extra context…"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
              className="w-full font-mono text-[12px] text-[#d8e0d2] bg-[#161c19] border border-[#222a25] rounded-[4px] px-3 py-2 outline-none focus:border-[#8ec2dd] resize-none leading-[1.6]"
              style={{ caretColor: "#8ec2dd" }}
            />
          </div>

        </div>
      </div>

      {/* Save Button — fixed bottom */}
      <div className="fixed left-[22px] right-[22px] bottom-[22px] md:left-[calc(220px+22px)]">
        <button
          onClick={handleSave}
          disabled={!tokenName.trim() || isParsing || isSaving}
          className="w-full flex items-center justify-center gap-2.5 bg-[#8ec2dd] text-[#0e1311] py-3.5 px-5 rounded-[4px] font-sans font-medium text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
          style={tokenName.trim() ? { boxShadow: "0 8px 32px -8px rgba(142,194,221,0.33)" } : {}}
        >
          {isSaving ? "Saving…" : "Save entry"}
          {!isSaving && <Kbd>⏎</Kbd>}
        </button>
      </div>
    </div>
  );
}
