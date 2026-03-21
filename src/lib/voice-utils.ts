import type { EmotionalState } from "./sample-data";

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const DEFAULT_SILENCE_TIMEOUT_MS = 2500;

/**
 * Creates a speech recognition instance with configurable silence auto-stop.
 * Pass silenceTimeoutMs: null to disable auto-stop (manual only).
 * Always appends to existing text (never clears).
 * Returns control functions.
 */
export function createVoiceRecorder(options: {
  onText: (append: string) => void;
  onStop: () => void;
  onError?: (error: string) => void;
  silenceTimeoutMs?: number | null;
}): { start: () => void; stop: () => void; isSupported: boolean } {
  let recognition: any = null;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const clearSilenceTimer = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  };

  const silenceTimeout = options.silenceTimeoutMs;
  const autoStopEnabled = silenceTimeout !== null && silenceTimeout !== undefined;

  const resetSilenceTimer = () => {
    clearSilenceTimer();
    if (!autoStopEnabled) return;
    silenceTimer = setTimeout(() => {
      stop();
    }, silenceTimeout);
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearSilenceTimer();
    if (recognition) {
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      try { recognition.stop(); } catch {}
      recognition = null;
    }
    options.onStop();
  };

  const start = () => {
    if (!SpeechRecognition) {
      options.onError?.("Speech recognition not supported. Use Chrome.");
      return;
    }
    stopped = false;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (e: any) => {
        let text = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) {
            text += e.results[i][0].transcript + " ";
          }
        }
        if (text.trim()) {
          options.onText(text.trim());
          resetSilenceTimer();
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error === "no-speech") {
          // silence — let the timer handle it
          return;
        }
        options.onError?.(e.error === "not-allowed"
          ? "Microphone permission denied."
          : `Speech error: ${e.error}`);
        stop();
      };

      recognition.onend = () => {
        // Restart if not manually stopped (browser may auto-stop)
        if (!stopped && recognition) {
          try { recognition.start(); } catch { stop(); }
        }
      };

      recognition.start();
      resetSilenceTimer();
    } catch (err: any) {
      options.onError?.(`Failed to start: ${err.message}`);
    }
  };

  return { start, stop, isSupported: !!SpeechRecognition };
}

/**
 * Emotion keyword detection — scans text and returns matched emotions.
 */
const EMOTION_KEYWORDS: { keywords: string[]; emotion: EmotionalState }[] = [
  { keywords: ["calm"], emotion: "calm" },
  { keywords: ["confident"], emotion: "confident" },
  { keywords: ["focused", "focus"], emotion: "focused" },
  { keywords: ["anxious", "anxiety"], emotion: "anxious" },
  { keywords: ["fomo"], emotion: "fomo" },
  { keywords: ["hesitant", "hesitating"], emotion: "hesitant" },
  { keywords: ["disciplined"], emotion: "disciplined" },
  { keywords: ["impulsive"], emotion: "impulsive" },
  { keywords: ["frustrated", "frustration"], emotion: "frustrated" },
  { keywords: ["rushed", "rushing"], emotion: "rushed" },
  { keywords: ["greedy", "greed"], emotion: "greedy" },
  { keywords: ["fearful", "afraid", "scared"], emotion: "fearful" },
  { keywords: ["euphoric", "euphoria"], emotion: "euphoric" },
  { keywords: ["bored", "boring"], emotion: "bored" },
  { keywords: ["pressured", "pressure"], emotion: "pressured" },
  { keywords: ["sharp", "clear-headed", "clear headed"], emotion: "sharp" },
  { keywords: ["detached", "numb"], emotion: "detached" },
  { keywords: ["tired", "fatigued", "fatigue"], emotion: "tired" },
];

export function detectEmotionsFromText(text: string): EmotionalState[] {
  const lower = text.toLowerCase();
  const detected: EmotionalState[] = [];
  for (const { keywords, emotion } of EMOTION_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detected.push(emotion);
    }
  }
  return detected;
}
