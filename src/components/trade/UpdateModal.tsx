import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn, uid } from "@/lib/utils";
import { Label } from "@/components/design/Label";
import { Pill } from "@/components/design/Pill";
import { emotionColor, emotionLabel } from "@/lib/emotion-utils";
import { createVoiceRecorder, detectEmotionsFromText } from "@/lib/voice-utils";
import type { EmotionalState, TradeNote } from "@/lib/sample-data";

const EMOTIONS: EmotionalState[] = [
  "calm", "confident", "focused", "anxious", "fomo",
  "hesitant", "disciplined", "impulsive", "frustrated",
  "rushed", "greedy", "fearful", "euphoric", "bored", "pressured",
  "sharp", "detached", "tired",
];

interface UpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: TradeNote, emotions: EmotionalState[], sizeAdded?: string) => void;
  chain?: string;
}

export function UpdateModal({ open, onOpenChange, onSave, chain = "SOL" }: UpdateModalProps) {
  const [noteText, setNoteText] = useState("");
  const [sizeAdded, setSizeAdded] = useState("");
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
    if (!noteText.trim() && !sizeAdded.trim()) return;
    const trimmedSize = sizeAdded.trim();
    const note: TradeNote = {
      id: uid(),
      text: noteText.trim() || (trimmedSize ? `Added ${trimmedSize} ${chain} to position` : ""),
      timestamp: new Date().toISOString(),
      duringSession: true,
      noteType: "update",
      emotions: emotions.length > 0 ? [...emotions] : undefined,
      sizeAdded: trimmedSize || undefined,
    };
    onSave(note, emotions, trimmedSize || undefined);
    setNoteText("");
    setSizeAdded("");
    setEmotions([]);
    setIsRecording(false);
    onOpenChange(false);
  };

  const canSave = noteText.trim().length > 0 || sizeAdded.trim().length > 0;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-[#0e1311] border-t border-[#222a25]">
        <DrawerHeader>
          <DrawerTitle className="font-sans font-medium text-[#d8e0d2]">Trade Update</DrawerTitle>
          <DrawerDescription className="font-mono text-[11px] text-[#7a8a75]">Record a mid-trade journal entry</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6 space-y-5">
          {/* Voice Input */}
          <div className="flex flex-col items-center gap-2 py-2">
            <button
              onClick={isRecording ? stopVoice : startVoice}
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-[14px] transition-all active:scale-[0.95]",
                isRecording ? "bg-[#e89a8a]" : "bg-[#8ec2dd]"
              )}
              aria-label={isRecording ? "Stop recording" : "Record update"}
            >
              {isRecording ? (
                <MicOff className="h-7 w-7 text-[#0e1311]" />
              ) : (
                <Mic className="h-7 w-7 text-[#0e1311]" />
              )}
            </button>
            <p className="font-mono text-[11px] text-[#7a8a75]">
              {isRecording ? "Recording — tap to stop" : "Tap to record your update"}
            </p>
          </div>

          {/* Added to Position */}
          <div className="space-y-1.5">
            <Label className="block">Added to Position — optional</Label>
            <Input
              placeholder={`e.g. 0.5 ${chain}`}
              value={sizeAdded}
              onChange={(e) => setSizeAdded(e.target.value)}
              className="bg-[#161c19] border-[#222a25] text-[#d8e0d2] font-mono focus-visible:ring-0 focus-visible:border-[#8ec2dd]"
            />
          </div>

          {/* Text Area */}
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What's happening with this trade right now..."
            className="min-h-[80px] font-mono text-sm bg-[#161c19] border-[#222a25] text-[#d8e0d2] focus-visible:ring-0 focus-visible:border-[#8ec2dd]"
          />

          {/* Emotional State */}
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

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full flex items-center justify-center bg-[#8ec2dd] text-[#0e1311] py-3.5 px-5 rounded-[4px] font-sans font-medium text-[15px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Update
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
