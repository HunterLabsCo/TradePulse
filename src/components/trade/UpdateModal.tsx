import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmotionBadge } from "@/components/EmotionBadge";
import { cn } from "@/lib/utils";
import { createVoiceRecorder, detectEmotionsFromText } from "@/lib/voice-utils";
import type { EmotionalState, TradeNote } from "@/lib/sample-data";

const EMOTIONS: EmotionalState[] = [
  "calm", "confident", "focused", "anxious", "fomo",
  "hesitant", "disciplined", "impulsive", "frustrated",
  "rushed", "greedy", "fearful", "euphoric", "bored", "pressured",
  "sharp", "detached", "tired",
];

const chipBase = "rounded-full px-2.5 py-1 font-body text-[11px] font-300 transition-colors active:scale-[0.96]";
const chipOff = "bg-transparent border border-[hsl(var(--border-default))] text-muted-foreground";
const chipOn = "bg-primary border border-primary text-primary-foreground font-400";

interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: TradeNote, emotions: EmotionalState[]) => void;
}

export function UpdateModal({ open, onOpenChange, onSave }: UpdateModalProps) {
  const [noteText, setNoteText] = useState("");
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<ReturnType<typeof createVoiceRecorder> | null>(null);

  const toggleEmotion = (e: EmotionalState) => {
    setEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const noteTextRef = useRef(noteText);
  useEffect(() => { noteTextRef.current = noteText; }, [noteText]);

  const startVoice = () => {
    const recorder = createVoiceRecorder({
      onText: (text) => {
        const updated = (noteTextRef.current + " " + text).trim();
        setNoteText(updated);
        const detected = detectEmotionsFromText(text);
        if (detected.length > 0) {
          setEmotions((prev) => {
            const merged = [...prev];
            for (const e of detected) { if (!merged.includes(e)) merged.push(e); }
            return merged;
          });
        }
      },
      onStop: () => setIsRecording(false),
      silenceTimeoutMs: null,
    });
    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopVoice = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const handleSave = () => {
    if (!noteText.trim()) return;
    const note: TradeNote = {
      id: crypto.randomUUID(),
      text: noteText.trim(),
      timestamp: new Date().toISOString(),
      duringSession: true,
      noteType: "update",
      emotions: emotions.length > 0 ? [...emotions] : undefined,
    };
    onSave(note, emotions);
    setNoteText("");
    setEmotions([]);
    setIsRecording(false);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-popover border-t border-border">
        <DrawerHeader>
          <DrawerTitle className="font-display font-600">Trade Update</DrawerTitle>
          <DrawerDescription className="font-body font-300">Record a mid-trade journal entry</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-5">
          {/* Voice Input */}
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              onClick={isRecording ? stopVoice : startVoice}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full transition-all active:scale-[0.95]",
                isRecording
                  ? "bg-destructive animate-pulse-red-glow"
                  : "bg-primary animate-pulse-glow"
              )}
            >
              {isRecording ? (
                <MicOff className="h-7 w-7 text-foreground" />
              ) : (
                <Mic className="h-7 w-7 text-primary-foreground" />
              )}
            </button>
            <p className="font-body text-xs font-300 text-muted-foreground">
              {isRecording ? "Recording — tap to stop" : "Tap to record your update"}
            </p>
          </div>

          {/* Text Area */}
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What's happening with this trade right now..."
            className="min-h-[80px] font-body text-sm font-300 bg-secondary border-border focus-visible:ring-primary"
          />

          {/* Emotional State */}
          <div>
            <p className="section-label mb-2">Emotional State</p>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => toggleEmotion(e)}
                  className={cn(chipBase, emotions.includes(e) ? chipOn : chipOff)}
                >
                  {EMOTIONS.find(em => em === e) ? e.charAt(0).toUpperCase() + e.slice(1).replace(/-/g, " ") : e}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <Button onClick={handleSave} disabled={!noteText.trim()} className="w-full font-display font-600">
            Save Update
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
