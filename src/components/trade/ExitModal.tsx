import { useState, useRef } from "react";
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
import { EmotionBadge } from "@/components/EmotionBadge";
import { cn } from "@/lib/utils";
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

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface ExitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingPercent: number;
  onSave: (event: ExitEvent) => void;
}

// Voice parsing helpers
function parseExitTypeFromText(text: string): ExitType | null {
  const lower = text.toLowerCase();
  if (lower.includes("take profit") || lower.includes("taking profit")) return "take-profit";
  if (lower.includes("stop loss") || lower.includes("stopped out") || lower.includes("hit my stop")) return "stop-loss";
  if (lower.includes("full exit") || lower.includes("closing everything") || lower.includes("all out")) return "full-exit";
  if (lower.includes("moon bag") || lower.includes("moonbag")) return "moon-bag";
  if (lower.includes("partial") || lower.includes("scaling out") || lower.includes("taking some")) return "partial-exit";
  return null;
}

function parsePercentFromText(text: string, max: number): number | null {
  const lower = text.toLowerCase();
  if (lower.includes("all of it") || lower.includes("full position") || lower.includes("everything") || lower.includes("100%") || lower.includes("100 percent")) {
    return Math.min(100, max);
  }
  if (lower.includes("half") || lower.includes("50%") || lower.includes("50 percent")) return Math.min(50, max);
  if (lower.includes("quarter") || lower.includes("25%") || lower.includes("25 percent")) return Math.min(25, max);
  if (lower.includes("75%") || lower.includes("75 percent") || lower.includes("three quarter")) return Math.min(75, max);
  // Try to extract a number followed by "percent" or "%"
  const match = lower.match(/(\d+)\s*(?:percent|%)/);
  if (match) {
    const val = parseInt(match[1]);
    if (val > 0 && val <= max) return val;
  }
  return null;
}

function parsePnlFromText(text: string): number | null {
  const lower = text.toLowerCase();
  // "up 50", "plus 25 percent", "down 30"
  const upMatch = lower.match(/(?:up|plus|gained|made)\s*(\d+)/);
  if (upMatch) return parseInt(upMatch[1]);
  const downMatch = lower.match(/(?:down|minus|lost|negative)\s*(\d+)/);
  if (downMatch) return -parseInt(downMatch[1]);
  // "+50%", "-30%"
  const pctMatch = lower.match(/([+-]?\d+)\s*(?:percent|%)/);
  if (pctMatch) return parseInt(pctMatch[1]);
  // "2x", "3x"
  const xMatch = lower.match(/(\d+)\s*x/);
  if (xMatch) return (parseInt(xMatch[1]) - 1) * 100;
  return null;
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
  const recognitionRef = useRef<any>(null);

  // Voice pre-fill state
  const [isPreFilling, setIsPreFilling] = useState(false);
  const preFillRef = useRef<any>(null);

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

  // Voice pre-fill — parses speech and fills fields
  const startPreFill = () => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + " ";
      }
      text = text.trim();
      if (!text) return;

      // Parse and pre-fill fields
      const parsedType = parseExitTypeFromText(text);
      if (parsedType) setExitType(parsedType);

      const parsedPercent = parsePercentFromText(text, remainingPercent);
      if (parsedPercent !== null) {
        setPercentClosed(parsedPercent);
        setShowCustomPercent(false);
      }

      const parsedPnl = parsePnlFromText(text);
      if (parsedPnl !== null) {
        setPnlPercent(parsedPnl);
        setShowCustomPnl(false);
      }

      // Also append to note text
      setNoteText((prev) => (prev + " " + text).trim());
      setShowTextInput(true);
    };
    rec.start();
    preFillRef.current = rec;
    setIsPreFilling(true);
  };

  const stopPreFill = () => {
    preFillRef.current?.stop();
    preFillRef.current = null;
    setIsPreFilling(false);
  };

  // Note-only voice
  const startVoice = () => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript + " ";
      }
      setNoteText((prev) => (prev + " " + text).trim());
    };
    rec.start();
    recognitionRef.current = rec;
    setIsRecording(true);
    setShowTextInput(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
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
    // Reset
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
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Log Exit</DrawerTitle>
          <DrawerDescription>Record an exit for this trade</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-5">
          {/* Voice Pre-Fill */}
          <div className="flex flex-col items-center gap-2 py-2 rounded-xl bg-card">
            <button
              onClick={isPreFilling ? stopPreFill : startPreFill}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all active:scale-[0.95]",
                isPreFilling
                  ? "bg-destructive shadow-destructive/30 animate-pulse"
                  : "bg-primary shadow-primary/30"
              )}
            >
              {isPreFilling ? (
                <MicOff className="h-7 w-7 text-destructive-foreground" />
              ) : (
                <Mic className="h-7 w-7 text-primary-foreground" />
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              {isPreFilling ? "Listening — tap to stop" : "Tap to describe your exit by voice"}
            </p>
          </div>

          {/* Exit Type */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Exit Type</p>
            <div className="flex flex-wrap gap-1.5">
              {EXIT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setExitType(t.value)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium transition-colors active:scale-[0.97]",
                    exitType === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* % Position Closed */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">% Position Closed</p>
            <p className="text-[11px] text-muted-foreground mb-2">Remaining position: {remainingPercent}%</p>
            <div className="flex flex-wrap gap-1.5">
              {percentPresets.map((v) => (
                <button
                  key={v}
                  onClick={() => { setPercentClosed(v); setShowCustomPercent(false); setCustomPercent(""); setPercentError(""); }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium transition-colors active:scale-[0.97]",
                    percentClosed === v && !showCustomPercent
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}%
                </button>
              ))}
              <button
                onClick={() => { setShowCustomPercent(true); setPercentClosed(null); }}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors active:scale-[0.97]",
                  showCustomPercent
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
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
                  className="h-9 text-sm"
                  max={remainingPercent}
                  min={1}
                />
                {percentError && (
                  <p className="text-[11px] text-destructive mt-1">{percentError}</p>
                )}
              </div>
            )}
          </div>

          {/* P&L */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">P&L at This Exit</p>
            <div className="flex flex-wrap gap-1.5">
              {pnlPresets.map((v) => (
                <button
                  key={v}
                  onClick={() => { setPnlPercent(v); setShowCustomPnl(false); setCustomPnl(""); }}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium transition-colors active:scale-[0.97]",
                    pnlPercent === v && !showCustomPnl
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v > 0 ? `+${v}%` : `${v}%`}
                </button>
              ))}
              <button
                onClick={() => { setShowCustomPnl(true); setPnlPercent(null); }}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors active:scale-[0.97]",
                  showCustomPnl
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:text-foreground"
                )}
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
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>

          {/* Emotions */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Emotional State</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((e) => (
                <button key={e} onClick={() => toggleEmotion(e)} className="active:scale-[0.96]">
                  <EmotionBadge
                    emotion={e}
                    className={cn(
                      "cursor-pointer transition-opacity",
                      emotions.includes(e) ? "ring-1 ring-foreground/30" : "opacity-50"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Note */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quick Note</p>
            <div className="flex gap-2 mb-2">
              <button
                onClick={isRecording ? stopVoice : startVoice}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-[0.95]",
                  isRecording ? "bg-destructive shadow-destructive/30" : "bg-primary shadow-primary/30"
                )}
              >
                {isRecording ? <MicOff className="h-5 w-5 text-destructive-foreground" /> : <Mic className="h-5 w-5 text-primary-foreground" />}
              </button>
              <Button
                variant={showTextInput ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowTextInput(!showTextInput)}
                className="gap-1.5 h-11"
              >
                <PenLine className="h-4 w-4" /> Text
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              {isRecording ? "Recording — tap to stop" : "Tap mic to add voice note"}
            </p>
            {(showTextInput || noteText) && (
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Exit thoughts..."
                className="min-h-[60px] text-sm"
              />
            )}
          </div>

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full"
          >
            Save Exit
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
