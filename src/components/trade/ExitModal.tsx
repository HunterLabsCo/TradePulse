import { useState, useRef, useEffect } from "react";
import { Mic, PenLine, MicOff } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, uid } from "@/lib/utils";
import { Label } from "@/components/design/Label";
import { Pill } from "@/components/design/Pill";
import { emotionColor, emotionLabel } from "@/lib/emotion-utils";
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

  // Full exit phrases
  if (/\b(full exit|fully exit|fully exited|exited (the|this|my) position|all of it|everything|100%\s*exit|selling 100|closing 100|sold everything|all out|out completely|completely out)\b/.test(lower)) {
    return Math.min(100, max);
  }

  // "closing/selling/exiting/close/exit/sold/took/taking X" + optional percent
  const actionMatch = lower.match(/(?:clos(?:e|ing)|sell(?:ing)?|exit(?:ing)?|took|taking|sold|scalin[g]?\s+out)\s+(\d+)\s*(?:percent|%)?/);
  if (actionMatch) return Math.min(parseInt(actionMatch[1]), max);

  // "X percent out/exit/position/closed/remaining"
  const pctContextMatch = lower.match(/(\d+)\s*(?:percent|%)\s*(?:out|exit(?:ed)?|position|closed|of\s+(?:my\s+)?position|remaining|of\s+it)/);
  if (pctContextMatch) return Math.min(parseInt(pctContextMatch[1]), max);

  // "X percent" standalone — only if between 1–100 and no PnL context words nearby
  const standaloneMatch = lower.match(/\b(\d{1,3})\s*(?:percent|%)/);
  if (standaloneMatch) {
    const hasPnlContext = /(?:profit|loss|gain|pnl|up|down|made|lost|minus|plus|green|red)\s*\d|\d\s*(?:profit|loss|gain|pnl|green|red|x\b)/.test(lower);
    if (!hasPnlContext) {
      const val = parseInt(standaloneMatch[1]);
      if (val >= 1 && val <= 100) return Math.min(val, max);
    }
  }

  if (/\bhalf\b/.test(lower)) return Math.min(50, max);
  if (/\bquarter\b/.test(lower)) return Math.min(25, max);
  return null;
}

function parsePnlPercent(text: string): number | null {
  const lower = text.toLowerCase();

  // "X% profit/gain/up/green" or "at X% profit"
  const profitMatch = lower.match(/(?:at\s+)?(\d+)\s*(?:percent|%)\s*(?:profit|gain|up|green)/);
  if (profitMatch) return parseInt(profitMatch[1]);

  // "X% loss/down/red/negative"
  const lossMatch = lower.match(/(?:at\s+)?(\d+)\s*(?:percent|%)\s*(?:loss|down|red|negative)/);
  if (lossMatch) return -parseInt(lossMatch[1]);

  // "up/gained/made/profited X"
  const upMatch = lower.match(/(?:up|plus|gained|made|profit(?:ed)?|green)\s+(\d+)\s*(?:percent|%)?/);
  if (upMatch) return parseInt(upMatch[1]);

  // "down/minus/lost/rugged/rekt/stopped/dumped X"
  const downMatch = lower.match(/(?:down|minus|lost|negative|stopped|rugged|dumped|rekt|red)\s+(\d+)\s*(?:percent|%)?/);
  if (downMatch) return -parseInt(downMatch[1]);

  // "took/hit a X% loss"
  const tookLoss = lower.match(/(?:took|hit|taking)\s+a\s+(\d+)\s*(?:percent|%)?\s*loss/);
  if (tookLoss) return -parseInt(tookLoss[1]);

  // "Nx" multiplier (e.g. 3x = +200%)
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
        if (parsedPos !== null) {
          setPercentClosed(parsedPos);
          if ([25, 50, 75, 100].includes(parsedPos)) {
            setShowCustomPercent(false);
            setCustomPercent("");
          } else {
            setShowCustomPercent(true);
            setCustomPercent(String(parsedPos));
          }
        }
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
      id: uid(),
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
      <DrawerContent className="max-h-[85vh] bg-[#0e1311] border-t border-[#222a25]">
        <DrawerHeader>
          <DrawerTitle className="font-sans font-medium text-[#d8e0d2]">Log Exit</DrawerTitle>
          <DrawerDescription className="font-mono text-[11px] text-[#7a8a75]">Record an exit for this trade</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-5">
          {/* Voice Pre-Fill */}
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              onClick={isPreFilling ? stopPreFill : startPreFill}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-[14px] transition-all active:scale-[0.95]",
                isPreFilling ? "bg-[#e89a8a]" : "bg-[#8ec2dd]"
              )}
              aria-label={isPreFilling ? "Stop voice" : "Describe exit by voice"}
            >
              {isPreFilling ? (
                <MicOff className="h-7 w-7 text-[#0e1311]" />
              ) : (
                <Mic className="h-7 w-7 text-[#0e1311]" />
              )}
            </button>
            <p className="font-mono text-[11px] text-[#7a8a75]">
              {isPreFilling ? "Listening — tap to stop" : "Tap to describe your exit by voice"}
            </p>
          </div>

          {/* Exit Type */}
          <div>
            <Label className="mb-2 block">Exit Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {EXIT_TYPES.map((t) => {
                const selected = exitType === t.value;
                const color = t.value === "stop-loss" ? "#e89a8a" : "#8ec2dd";
                return (
                  <button
                    key={t.value}
                    onClick={() => setExitType(t.value)}
                    className="transition-opacity active:opacity-70 min-h-[36px]"
                  >
                    <Pill color={selected ? color : "#7a8a75"} bg={selected ? `${color}14` : undefined}>
                      {t.label}
                    </Pill>
                  </button>
                );
              })}
            </div>
          </div>

          {/* % Position Closed */}
          <div>
            <Label className="mb-1 block">% Position Closed</Label>
            <p className="font-mono text-[11px] text-[#7a8a75] mb-2">Remaining position: {remainingPercent}%</p>
            <div className="flex flex-wrap gap-1.5">
              {percentPresets.map((v) => {
                const selected = percentClosed === v && !showCustomPercent;
                return (
                  <button
                    key={v}
                    onClick={() => { setPercentClosed(v); setShowCustomPercent(false); setCustomPercent(""); setPercentError(""); }}
                    className="transition-opacity active:opacity-70 min-h-[36px]"
                  >
                    <Pill color={selected ? "#8ec2dd" : "#7a8a75"} bg={selected ? "rgba(142,194,221,0.08)" : undefined}>{v}%</Pill>
                  </button>
                );
              })}
              <button
                onClick={() => { setShowCustomPercent(true); setPercentClosed(null); }}
                className="transition-opacity active:opacity-70 min-h-[36px]"
              >
                <Pill color={showCustomPercent ? "#8ec2dd" : "#7a8a75"} bg={showCustomPercent ? "rgba(142,194,221,0.08)" : undefined}>Custom</Pill>
              </button>
            </div>
            {showCustomPercent && (
              <div className="mt-2">
                <Input
                  type="number"
                  placeholder={`Max ${remainingPercent}%`}
                  value={customPercent}
                  onChange={(e) => handleCustomPercentChange(e.target.value)}
                  className="h-9 font-mono text-sm bg-[#161c19] border-[#222a25] text-[#d8e0d2] focus-visible:ring-0 focus-visible:border-[#8ec2dd]"
                  max={remainingPercent}
                  min={1}
                />
                {percentError && (
                  <p className="font-mono text-[11px] text-[#e89a8a] mt-1">{percentError}</p>
                )}
              </div>
            )}
          </div>

          {/* P&L */}
          <div>
            <Label className="mb-2 block">P&L at This Exit</Label>
            <div className="flex flex-wrap gap-1.5">
              {pnlPresets.map((v) => {
                const selected = pnlPercent === v && !showCustomPnl;
                const color = v < 0 ? "#e89a8a" : "#a8d4ad";
                return (
                  <button
                    key={v}
                    onClick={() => { setPnlPercent(v); setShowCustomPnl(false); setCustomPnl(""); }}
                    className="transition-opacity active:opacity-70 min-h-[36px]"
                  >
                    <Pill color={selected ? color : "#7a8a75"} bg={selected ? `${color}14` : undefined}>
                      {v > 0 ? `+${v}%` : `${v}%`}
                    </Pill>
                  </button>
                );
              })}
              <button
                onClick={() => { setShowCustomPnl(true); setPnlPercent(null); }}
                className="transition-opacity active:opacity-70 min-h-[36px]"
              >
                <Pill color={showCustomPnl ? "#8ec2dd" : "#7a8a75"} bg={showCustomPnl ? "rgba(142,194,221,0.08)" : undefined}>Custom</Pill>
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
                  className="h-9 font-mono text-sm bg-[#161c19] border-[#222a25] text-[#d8e0d2] focus-visible:ring-0 focus-visible:border-[#8ec2dd]"
                />
              </div>
            )}
          </div>

          {/* Emotions */}
          <div>
            <Label className="mb-2 block">Emotional State</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((e) => {
                const selected = emotions.includes(e);
                const ec = emotionColor(e);
                return (
                  <button
                    key={e}
                    onClick={() => toggleEmotion(e)}
                    className="transition-opacity active:opacity-70 min-h-[36px]"
                  >
                    <Pill color={selected ? ec.color : "#7a8a75"} bg={selected ? ec.bg : undefined}>
                      {emotionLabel(e)}
                    </Pill>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Note */}
          <div>
            <Label className="mb-2 block">Quick Note</Label>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={isRecording ? stopVoice : startVoice}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-[10px] transition-all active:scale-[0.95]",
                  isRecording ? "bg-[#e89a8a]" : "bg-[#8ec2dd]"
                )}
                aria-label={isRecording ? "Stop recording" : "Add voice note"}
              >
                {isRecording ? <MicOff className="h-5 w-5 text-[#0e1311]" /> : <Mic className="h-5 w-5 text-[#0e1311]" />}
              </button>
              <button
                onClick={() => setShowTextInput(!showTextInput)}
                className="flex items-center gap-1.5 h-11 px-3 rounded-[4px] font-mono text-[12px] text-[#d8e0d2] bg-[#161c19] border border-[#222a25] hover:border-[#8ec2dd] transition-colors"
              >
                <PenLine className="h-4 w-4" /> Text
              </button>
            </div>
            <p className="font-mono text-[10px] text-[#7a8a75] mb-2">
              {isRecording ? "Recording — tap to stop" : "Tap mic to add voice note"}
            </p>
            {(showTextInput || noteText) && (
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Exit thoughts..."
                className="min-h-[60px] font-mono text-sm bg-[#161c19] border-[#222a25] text-[#d8e0d2] focus-visible:ring-0 focus-visible:border-[#8ec2dd]"
              />
            )}
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full flex items-center justify-center bg-[#8ec2dd] text-[#0e1311] py-3.5 px-5 rounded-[4px] font-sans font-medium text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Exit
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
