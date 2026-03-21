import { useState, useRef } from "react";
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
import type { EmotionalState, TradeNote } from "@/lib/sample-data";

const EMOTIONS: EmotionalState[] = [
  "calm", "confident", "focused", "anxious", "fomo",
  "hesitant", "disciplined", "impulsive", "frustrated",
  "rushed", "greedy", "fearful", "euphoric", "bored", "pressured",
  "sharp", "detached", "tired",
];

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: TradeNote, emotions: EmotionalState[]) => void;
}

export function UpdateModal({ open, onOpenChange, onSave }: UpdateModalProps) {
  const [noteText, setNoteText] = useState("");
  const [emotions, setEmotions] = useState<EmotionalState[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleEmotion = (e: EmotionalState) => {
    setEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

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
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  };

  const handleSave = () => {
    if (!noteText.trim()) return;
    const emotionSuffix = emotions.length > 0 ? `\n[Emotions: ${emotions.join(", ")}]` : "";
    const note: TradeNote = {
      id: crypto.randomUUID(),
      text: noteText.trim() + emotionSuffix,
      timestamp: new Date().toISOString(),
      duringSession: true,
      noteType: "update",
    };
    onSave(note, emotions);
    setNoteText("");
    setEmotions([]);
    setIsRecording(false);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Trade Update</DrawerTitle>
          <DrawerDescription>Record a mid-trade journal entry</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-5">
          {/* Voice Input */}
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              onClick={isRecording ? stopVoice : startVoice}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all active:scale-[0.95]",
                isRecording
                  ? "bg-destructive shadow-destructive/30 animate-pulse"
                  : "bg-primary shadow-primary/30"
              )}
            >
              {isRecording ? (
                <MicOff className="h-7 w-7 text-destructive-foreground" />
              ) : (
                <Mic className="h-7 w-7 text-primary-foreground" />
              )}
            </button>
            <p className="text-xs text-muted-foreground">
              {isRecording ? "Recording — tap to stop" : "Tap to record your update"}
            </p>
          </div>

          {/* Text Area */}
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What's happening with this trade right now..."
            className="min-h-[80px] text-sm"
          />

          {/* Emotional State */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Emotional State
            </p>
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

          {/* Save */}
          <Button onClick={handleSave} disabled={!noteText.trim()} className="w-full">
            Save Update
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
