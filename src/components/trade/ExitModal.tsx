import { useState, useRef, useEffect } from "react";
import { Mic, PenLine, MicOff } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createVoiceRecorder, detectEmotionsFromText } from "@/lib/voice-utils";
import type { ExitType, ExitEvent, EmotionalState } from "@/lib/sample-data";

const EXIT_TYPES: { value: ExitType; label: string }[] = [
  { value: "take-profit", label: "Take Profit" },
  { value: "stop-loss", label: "Stop Loss" },
  { value: "partial-exit", label: "Partial Exit" },
  { value: "full-exit", label: "Full Exit" },
  { value: "moon-bag", label: "Moon Bag" },
];

const EMOTIONS: EmotionalState[] = [
  "calm", "confident", "focused", "anxious", "fomo",
  "hesitant", "disciplined", "impulsive", "frustrated",
  "rushed", "greedy", "fearful", "euphoric", "bored", "pressured",
];

const chipBase = "rounded-full px-3 py-2 font-body text-xs font-300 transition-colors active:scale-[0.97]";
const chipOff = "bg-transparent border border-[hsl(var(--border-default))] text-muted-foreground";
const chipOn = "bg-primary border border-primary text-primary-foreground font-400";
const chipStopLoss = "bg-red-action border border-red-action text-foreground font-400";

const EMOTION_CHIP_COLORS: Record<string, string> = {
  confident: "bg-emerald-500/25 text-emerald-300 border-emerald-500/60",
  calm: "bg-teal-500/25 text-teal-300 border-teal-500/60",
  focused: "bg-sky-500/25 text-sky-300 border-sky-500/60",
  "in-the-zone": "bg-emerald-400/25 text-emerald-200 border-emerald-400/60",
  disciplined: "bg-emerald-600/25 text-emerald-300 border-emerald-600/60",
  sharp: "bg-sky-600/25 text-sky-200 border-sky-600/60",
  anxious: "bg-amber-500/25 text-amber-300 border-amber-500/60",
  nervous: "bg-orange-500/25 text-orange-300 border-orange-500/60",
  rushed: "bg-red-500/25 text-red-300 border-red-500/60",
  frustrated: "bg-red-600/25 text-red-300 border-red-600/60",
  "revenge-mindset": "bg-rose-600/25 text-rose-300 border-rose-600/60",
  greedy: "bg-yellow-500/25 text-yellow-300 border-yellow-500/60",
  fearful: "bg-violet-500/25 text-violet-300 border-violet-500/60",
  overconfident: "bg-amber-600/25 text-amber-300 border-amber-600/60",
  hesitant: "bg-slate-400/25 text-slate-300 border-slate-400/60",
  impulsive: "bg-rose-500/25 text-rose-300 border-rose-500/60",
  euphoric: "bg-pink-500/25 text-pink-300 border-pink-500/60",
  fomo: "bg-orange-600/25 text-orange-200 border-orange-600/60",
  distracted: "bg-indigo-500/25 text-indigo-300 border-indigo-500/60",
  interrupted: "bg-indigo-500/25 text-indigo-300 border-indigo-500/60",
  uncertain: "bg-indigo-400/25 text-indigo-300 border-indigo-400/60",
  patient: "bg-cyan-500/25 text-cyan-300 border-cyan-500/60",
  bored: "bg-indigo-400/25 text-indigo-200 border-indigo-400/60",
  pressured: "bg-amber-500/25 text-amber-200 border-amber-500/60",
};

function parseExitTypeFromText(text: string): ExitType | null {
  const lower = text.toLowerCase();
  if (lower.includes("take profit") || lower.includes("taking profit")) return "take-profit";
  if (lower.includes("stop loss") || lower.includes("stopped out") || lower.includes("hit my stop")) return "stop-loss";
  if (lower.includes("full exit") || lower.includes("fully exit") || lower.includes("fully exited") || lower.includes("exited the position") || lower.includes("exited this position") || lower.includes("exited my position") || lower.includes("closing everything") || lower.includes("all out") || lower.includes("sold everything") || lower.includes("out of it") || lower.includes("out of the")) return "full-exit";
  if (lower.includes("moon bag") || lower.includes("moonbag")) return "moon-bag";
  if (lower.includes("partial exit") || lower.includes("partially exited") || lower.includes("scaling out") || lower.includes("taking some") || lower.includes("took some") || lower.includes("sold some") || lower.includes("selling some")) return "partial-exit";
  return null;
}

function parsePositionPercent(text: string, max: number): number | null {
  const lower = text.toLowerCase();
  if (/\b(full exit|fully exit|fully exited|exited (the|this|my) position|all of it|everything|100%\s*exit|selling 100|closing 100|sold everything)\b/.test(lower)) {
    return Math.min(100, max);
  }
  const posMatch = lower.match(/(?:selling|closing|exiting)\s+(\d+)\s*(?:percent|%)/);
  if (posMatch) return Math.min(parseInt(posMatch[1]), max);
  if (/\bhalf\b/.test(lower)) return Math.min(50, max);
  if (/\bquarter\b/.test(lower)) return Math.min(25, max);
  const exitPctMatch = lower.match(/(\d+)\s*(?:percent|%)\s*exit/);
  if (exitPctMatch) return Math.min(parseInt(exitPctMatch[1]), max);
  return null;
}

function parsePnlPercent(text: string): number | null {
  const lower = text.toLowerCase();
  const profitMatch = lower.match(/(?:at\s+)?(\d+)\s*(?:percent|%)\s*(?:profit|gain)/);
  if (profitMatch) return parseInt(profitMatch[1]);
  const lossMatch = lower.match(/(?:at\s+)?(\d+)\s*(?:percent|%)\s*(?:loss|down)/);
  if (lossMatch) return -parseInt(lossMatch[1]);
  const upMatch = lower.match(/(?:up|plus|gained|made)\s+(\d+)\s*(?:percent|%)?/);
  if (upMatch) return parseInt(upMatch[1]);
  const downMatch = lower.match(/(?:down|minus|lost|negative)\s+(\d+)\s*(?:percent|%)?/);
  if (downMatch) return -parseInt(downMatch[1]);
  const xMatch = lower.match(/(\d+)\s*x\b/);
  if (xMatch) return (parseInt(xMatch[1]) - 1) * 100;
  return null;
}

interface ExitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingPercent: number;
  onSave: (event: ExitEvent) => void;
}

export function ExitModal({ open, onOpenChange, remainingPercent, onSave }: ExitModalProps) {
  const [exitType, setExitType] = useState<ExitType | null>(null);
  const [percentClosed, setPercentClosed] = useState<number | null>(null);
  const [customPercent, setCustomPercent] = useState("");
  const [showCustomPercent, setShowCustomPercent] = useState(false);
  const [percentError, setPercentError] = useState("");

  const [pnlPercent, setPnlPercent] = useState<number | null>(null);
  const [customPnl, setCustomPnl] = useState("");
  const [showCustomPnl, setShowCustomPnl] = useState(false);

  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [noteText, setNoteText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const noteRecorderRef = useRef<ReturnType<typeof createVoiceRecorder> | null>(null);

  const [isPreFilling, setIsPreFilling] = useState(false);
  const preFillRecorderRef = useRef<ReturnType<typeof createVoiceRecorder> | null>(null);

  const noteTextRef = useRef(noteText);
  useEffect(() => { noteTextRef.current = noteText; }, [noteText]);

  const percentPresets = [25, 50, 75, 100].filter((v) => v <= remainingPercent);
  const pnlPresets = [-30, 25, 50, 100, 200];

  const toggleEmotion = (e: EmotionalState) => {
    setEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const handleCustomPercentChange = (val: string) => {
    setCustomPercent(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > remainingPercent) {
      setPercentError(`Max ${remainingPercent}%`);
    } else {
      setPercentError("");
    }
    if (!isNaN(num) && num > 0 && num <= remainingPercent) {
      setPercentClosed(num);
    }
  };

  const startPreFill = () => {
    const recorder = createVoiceRecorder({
      onText: (text) => {
        const parsedType = parseExitTypeFromText(text);
        if (parsedType) setExitType(parsedType);
        const parsedPos = parsePositionPercent(text, remainingPercent);
        if (parsedPos !== null) { setPercentClosed(parsedPos); setShowCustomPercent(false); }
        const parsedPnl = parsePnlPercent(text);
        if (parsedPnl !== null) {
          setPnlPercent(parsedPnl);
          if (pnlPresets.includes(parsedPnl)) {
            setShowCustomPnl(false);
          } else {
            setShowCustomPnl(true);
            setCustomPnl(String(parsedPnl));
          }
        }
        const detected = detectEmotionsFromText(text);
        if (detected.length > 0) {
          setEmotions((prev) => {
            const merged = [...prev];
            for (const e of detected) { if (!merged.includes(e)) merged.push(e); }
            return merged;
          });
        }
        setNoteText((prev) => (prev + " " + text).trim());
        setShowTextInput(true);
      },
      onStop: () => setIsPreFilling(false),
      silenceTimeoutMs: null,
    });
    preFillRecorderRef.current = recorder;
    recorder.start();
    setIsPreFilling(true);
  };

  const stopPreFill = () => {
    preFillRecorderRef.current?.stop();
    preFillRecorderRef.current = null;
  };

  const startVoice = () => {
    const recorder = createVoiceRecorder({
      onText: (text) => { setNoteText((prev) => (prev + " " + text).trim()); },
      onStop: () => setIsRecording(false),
      silenceTimeoutMs: null,
    });
    noteRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setShowTextInput(true);
  };

  const stopVoice = () => {
    noteRecorderRef.current?.stop();
    noteRecorderRef.current = null;
  };

  const handleSave = () => {
    if (!exitType || percentClosed === null || pnlPercent === null) return;
    const event: ExitEvent = {
      id: crypto.randomUUID(),
      exitType,
      percentClosed,
      pnlPercent,
      emotionalState: emotions,
      note: noteText || undefined,
      timestamp: new Date().toISOString(),
    };
    onSave(event);
    setExitType(null);
    setPercentClosed(null);
    setCustomPercent("");
    setShowCustomPercent(false);
    setPnlPercent(null);
    setCustomPnl("");
    setShowCustomPnl(false);
    setEmotions([]);
    setNoteText("");
    setShowTextInput(false);
    setPercentError("");
    onOpenChange(false);
  };

  const isValid = exitType && percentClosed !== null && pnlPercent !== null && !percentError;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-popover border-t border-border">
        <DrawerHeader>
          <DrawerTitle className="font-display font-600">Log Exit</DrawerTitle>
          <DrawerDescription className="font-body font-300">Record an exit for this trade</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-5">
          {/* Voice Pre-Fill */}
          <div className="flex flex-col items-center gap-2 py-2 rounded-xl">
            <button
              onClick={isPreFilling ? stopPreFill : startPreFill}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-[0.95]",
                isPreFilling
                  ? "bg-destructive animate-pulse-red-glow"
                  : "bg-primary animate-pulse-glow"
              )}
            >
              {isPreFilling ? (
                <MicOff className="h-7 w-7 text-foreground" />
              ) : (
                <Mic className="h-7 w-7 text-primary-foreground" />
              )}
            </button>
            <p className="font-body text-xs font-300 text-muted-foreground">
              {isPreFilling ? "Listening — tap to stop" : "Tap to describe your exit by voice"}
            </p>
          </div>

          {/* Exit Type */}
          <div>
            <p className="section-label mb-2">Exit Type</p>
            <div className="flex flex-wrap gap-1.5">
              {EXIT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setExitType(t.value)}
                  className={cn(
                    chipBase,
                    exitType === t.value
                      ? (t.value === "stop-loss" ? chipStopLoss : chipOn)
                      : chipOff
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* % Position Closed */}
          <div>
            <p className="section-label mb-1">% Position Closed</p>
            <p className="font-body text-[11px] font-300 text-muted-foreground mb-2">Remaining position: {remainingPercent}%</p>
            <div className="flex flex-wrap gap-1.5">
              {percentPresets.map((v) => (
                <button
                  key={v}
                  onClick={() => { setPercentClosed(v); setShowCustomPercent(false); setCustomPercent(""); setPercentError(""); }}
                  className={cn(chipBase, percentClosed === v && !showCustomPercent ? chipOn : chipOff)}
                >
                  {v}%
                </button>
              ))}
              <button
                onClick={() => { setShowCustomPercent(true); setPercentClosed(null); }}
                className={cn(chipBase, showCustomPercent ? chipOn : chipOff)}
              >
                Custom
              </button>
            </div>
            {showCustomPercent && (
              <div className="mt-2">
                <Input
                  type="number"
                  placeholder={`Max ${remainingPercent}%`}
                  value={customPercent}
                  onChange={(e) => handleCustomPercentChange(e.target.value)}
                  className="h-9 font-body text-sm font-300 bg-secondary border-border focus-visible:ring-primary"
                  max={remainingPercent}
                  min={1}
                />
                {percentError && (
                  <p className="font-body text-[11px] font-300 text-destructive mt-1">{percentError}</p>
                )}
              </div>
            )}
          </div>

          {/* P&L */}
          <div>
            <p className="section-label mb-2">P&L at This Exit</p>
            <div className="flex flex-wrap gap-1.5">
              {pnlPresets.map((v) => (
                <button
                  key={v}
                  onClick={() => { setPnlPercent(v); setShowCustomPnl(false); setCustomPnl(""); }}
                  className={cn(chipBase, pnlPercent === v && !showCustomPnl ? chipOn : chipOff)}
                >
                  {v > 0 ? `+${v}%` : `${v}%`}
                </button>
              ))}
              <button
                onClick={() => { setShowCustomPnl(true); setPnlPercent(null); }}
                className={cn(chipBase, showCustomPnl ? chipOn : chipOff)}
              >
                Custom
              </button>
            </div>
            {showCustomPnl && (
              <div className="mt-2">
                <Input
                  type="number"
                  placeholder="e.g. -15 or 300"
                  value={customPnl}
                  onChange={(e) => {
                    setCustomPnl(e.target.value);
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num)) setPnlPercent(num);
                  }}
                  className="h-9 font-body text-sm font-300 bg-secondary border-border focus-visible:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Emotions */}
          <div>
            <p className="section-label mb-2">Emotional State</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEmotion(e)}
                  className={cn(
                    chipBase, "border",
                    emotions.includes(e)
                      ? (EMOTION_CHIP_COLORS[e] ?? chipOn)
                      : chipOff
                  )}
                >
                  {e.charAt(0).toUpperCase() + e.slice(1).replace(/-/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Note */}
          <div>
            <p className="section-label mb-2">Quick Note</p>
            <div className="flex gap-2 mb-2">
              <button
                onClick={isRecording ? stopVoice : startVoice}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-[0.95]",
                  isRecording ? "bg-destructive animate-pulse-red-glow" : "bg-primary animate-pulse-glow"
                )}
              >
                {isRecording ? <MicOff className="h-5 w-5 text-foreground" /> : <Mic className="h-5 w-5 text-primary-foreground" />}
              </button>
              <Button
                variant={showTextInput ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowTextInput(!showTextInput)}
                className="gap-1.5 h-11 font-body font-400"
              >
                <PenLine className="h-4 w-4" /> Text
              </Button>
            </div>
            <p className="font-body text-[10px] font-300 text-muted-foreground mb-2">
              {isRecording ? "Recording — tap to stop" : "Tap mic to add voice note"}
            </p>
            {(showTextInput || noteText) && (
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Exit thoughts..."
                className="min-h-[60px] font-body text-sm font-300 bg-secondary border-border focus-visible:ring-primary"
              />
            )}
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full font-display font-600"
          >
            Save Exit
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
