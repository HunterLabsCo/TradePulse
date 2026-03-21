import { useState, useRef, useEffect } from "react";
import { Mic, PenLine, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createVoiceRecorder } from "@/lib/voice-utils";
import type { TradeNote } from "@/lib/sample-data";

interface NotesSectionProps {
  notes: TradeNote[];
  isOpen: boolean;
  onAddNote: (note: TradeNote) => void;
}

export function NotesSection({ notes, isOpen, onAddNote }: NotesSectionProps) {
  const [noteText, setNoteText] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<ReturnType<typeof createVoiceRecorder> | null>(null);
  const noteTextRef = useRef(noteText);
  useEffect(() => { noteTextRef.current = noteText; }, [noteText]);

  const startVoice = () => {
    const recorder = createVoiceRecorder({
      onText: (text) => {
        setNoteText((prev) => (prev + " " + text).trim());
      },
      onStop: () => setIsRecording(false),
      silenceTimeoutMs: null,
    });
    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setShowTextInput(true);
  };

  const stopVoice = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
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

  const directNotes = notes.filter((n) => n.noteType !== "update");

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
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
          <PenLine className="h-4 w-4" /> Text Note
        </Button>
      </div>
      <p className="font-body text-[10px] font-300 text-muted-foreground">
        {isRecording ? "Recording — tap to stop" : "Tap mic to add voice note"}
      </p>

      {showTextInput && (
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What's happening with this trade..."
            className="min-h-[60px] font-body text-sm font-300 bg-secondary border-border focus-visible:ring-primary"
          />
          <Button size="sm" onClick={handleSave} disabled={!noteText.trim()} className="font-body font-400">
            Save Note
          </Button>
        </div>
      )}

      {/* Notes Feed */}
      {directNotes.length === 0 ? (
        <p className="font-body text-xs font-300 text-muted-foreground italic">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {[...directNotes].reverse().map((n) => (
            <div key={n.id} className="rounded-xl bg-card border border-border p-3">
              <div className="mb-1">
                <span className="font-body text-[10px] font-400 text-muted-foreground">📝 Note</span>
              </div>
              <p className="font-body text-xs font-300 leading-relaxed whitespace-pre-line text-foreground">{n.text}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-body text-[10px] font-300 text-accent tabular-nums tracking-data">
                  {new Date(n.timestamp).toLocaleString()}
                </span>
                <span
                  className={cn(
                    "font-body text-[9px] font-400 rounded-full px-1.5 py-0.5",
                    n.duringSession
                      ? "bg-[hsl(var(--blue-accent)/0.1)] text-accent border border-[hsl(var(--blue-accent)/0.25)]"
                      : "bg-muted text-muted-foreground"
                  )}
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
