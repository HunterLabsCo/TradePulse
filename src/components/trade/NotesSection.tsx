import { useState, useRef } from "react";
import { Mic, PenLine, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { TradeNote } from "@/lib/sample-data";

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

interface NotesSectionProps {
  notes: TradeNote[];
  isOpen: boolean;
  onAddNote: (note: TradeNote) => void;
}

export function NotesSection({ notes, isOpen, onAddNote }: NotesSectionProps) {
  const [noteText, setNoteText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    if (!noteText.trim()) return;
    onAddNote({
      id: crypto.randomUUID(),
      text: noteText.trim(),
      timestamp: new Date().toISOString(),
      duringSession: isOpen,
      noteType: "note",
    });
    setNoteText("");
    setShowTextInput(false);
  };

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <button
          onClick={isRecording ? stopVoice : startVoice}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-[0.95]",
            isRecording ? "bg-red-500 shadow-red-500/30" : "bg-primary shadow-primary/30"
          )}
        >
          {isRecording ? <MicOff className="h-5 w-5 text-white" /> : <Mic className="h-5 w-5 text-primary-foreground" />}
        </button>
        <Button
          variant={showTextInput ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowTextInput(!showTextInput)}
          className="gap-1.5 h-11"
        >
          <PenLine className="h-4 w-4" /> Text Note
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {isRecording ? "Recording — tap to stop" : "Tap mic to add voice note"}
      </p>

      {showTextInput && (
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What's happening with this trade..."
            className="min-h-[60px] text-sm"
          />
          <Button size="sm" onClick={handleSave} disabled={!noteText.trim()}>
            Save Note
          </Button>
        </div>
      )}

      {/* Notes Feed */}
      {notes.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {[...notes].reverse().map((n) => (
            <div key={n.id} className="rounded-lg bg-background p-3 border border-border/50">
              <p className="text-xs leading-relaxed">{n.text}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {new Date(n.timestamp).toLocaleString()}
                </span>
                <span
                  className={`text-[9px] rounded px-1.5 py-0.5 font-medium ${
                    n.duringSession
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {n.duringSession ? "During session" : "Post-session"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
