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

  const silenceTimeout = options.silenceTimeoutMs === undefined ? DEFAULT_SILENCE_TIMEOUT_MS : options.silenceTimeoutMs;
  const autoStopEnabled = silenceTimeout !== null;

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

const SIGNAL_KEYWORDS: { keywords: string[]; signal: string }[] = [
  { keywords: ["volume"], signal: "Volume" },
  { keywords: ["wallet", "wallets"], signal: "Wallets" },
  { keywords: ["twitter", "social", "tweet", "community"], signal: "Social / Twitter" },
  { keywords: ["chart pattern", "candlestick", "support", "resistance", "trendline"], signal: "Chart Pattern" },
  { keywords: ["gut", "intuition", "felt right", "feel right"], signal: "Gut / Intuition" },
  { keywords: ["ema cross", "emas crossed", "golden cross", "9/21", "9 21", "21 ema", "ema's are", "emas are", "ema cross"], signal: "EMA Cross" },
  { keywords: ["rsi"], signal: "RSI" },
  { keywords: ["migrat", "graduated"], signal: "Migration Confirmed" },
  { keywords: ["dev history", "dev background", "team history"], signal: "Dev History" },
  { keywords: ["trending", "listed", "cmc listed", "cg listed"], signal: "Trending / Listed" },
];

export function detectSignalsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];
  for (const { keywords, signal } of SIGNAL_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detected.push(signal);
    }
  }
  return detected;
}

export function detectIndicatorsFromText(text: string): string {
  const lower = text.toLowerCase();
  const found: string[] = [];
  if (lower.includes("rsi")) found.push("RSI");
  const emaMatches = lower.match(/ema\s*(\d+)/g);
  if (emaMatches) {
    for (const m of emaMatches) {
      const normalized = m.replace(/\s+/, " ").toUpperCase().replace("EMA", "EMA ");
      if (!found.includes(normalized.trim())) found.push(normalized.trim());
    }
  } else if (/ema['s]*\s*(are|cross|trend|hold|trending|holding)/.test(lower) || lower.includes("9/21") || lower.includes("ema cross")) {
    found.push("EMA");
  }
  if (lower.includes("macd")) found.push("MACD");
  if (lower.includes("vwap")) found.push("VWAP");
  if (lower.includes("bollinger") || lower.includes("bb band")) found.push("Bollinger Bands");
  if (lower.includes("stochastic") || lower.includes("stoch rsi")) found.push("Stochastic");
  if (lower.includes("supertrend")) found.push("Supertrend");
  return found.join(", ");
}

export function detectSessionTypeFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (lower.includes("intermittently") || lower.includes("fully interrupted") || lower.includes("constant interrupt")) return "intermittently-interrupted";
  if (lower.includes("partially interrupted") || lower.includes("partial session") || lower.includes("briefly interrupted")) return "partially-interrupted";
  if (lower.includes("full session") || lower.includes("uninterrupted") || lower.includes("clean session")) return "full-session";
  if (lower.includes("at work") || lower.includes("work trade") || lower.includes("trading at work")) return "work-trade";
  if (lower.includes("mobile only") || lower.includes("phone only") || lower.includes("on my phone")) return "mobile-only";
  if (lower.includes("forced exit") || lower.includes("have to leave") || lower.includes("known interrupt")) return "forced-exit-risk";
  return null;
}
