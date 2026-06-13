import { useState, useRef, useEffect } from "react";
import { Mic, PenLine, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn, uid } from "@/lib/utils";
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
      id: uid(),
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
          <PenLine className="h-4 w-4" /> Text Note
        </button>
      </div>
      <p className="font-mono text-[10px] text-[#7a8a75]">
        {isRecording ? "Recording — tap to stop" : "Tap mic to add voice note"}
      </p>

      {showTextInput && (
        <div className="space-y-2">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What's happening with this trade..."
            className="min-h-[60px] font-mono text-sm bg-[#161c19] border-[#222a25] text-[#d8e0d2] focus-visible:ring-0 focus-visible:border-[#8ec2dd]"
          />
          <button
            onClick={handleSave}
            disabled={!noteText.trim()}
            className="inline-flex items-center justify-center bg-[#8ec2dd] text-[#0e1311] py-2 px-4 rounded-[4px] font-sans font-medium text-[13px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Note
          </button>
        </div>
      )}

      {/* Notes Feed */}
      {directNotes.length === 0 ? (
        <p className="font-mono text-[11px] text-[#7a8a75] italic">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {[...directNotes].reverse().map((n) => (
            <div key={n.id} className="rounded-[4px] bg-[#161c19] border border-[#222a25] p-3">
              <div className="mb-1">
                <span className="font-mono text-[10px] text-[#7a8a75]">📝 Note</span>
              </div>
              <p className="font-sans text-xs leading-relaxed whitespace-pre-line text-[#d8e0d2]">{n.text}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#8ec2dd] tabular-nums tracking-[0.04em]">
                  {new Date(n.timestamp).toLocaleString()}
                </span>
                <span
                  className={cn(
                    "font-mono text-[9px] rounded-[3px] px-1.5 py-0.5 border",
                    n.duringSession
                      ? "bg-[rgba(142,194,221,0.08)] text-[#8ec2dd] border-[rgba(142,194,221,0.25)]"
                      : "bg-transparent text-[#7a8a75] border-[#222a25]"
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
