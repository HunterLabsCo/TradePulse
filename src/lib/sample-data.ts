export type EmotionalState =
  | "confident" | "calm" | "focused" | "patient" | "in-the-zone"
  | "anxious" | "nervous" | "rushed" | "frustrated" | "revenge-mindset"
  | "greedy" | "fearful" | "overconfident"
  | "fomo" | "distracted" | "interrupted" | "uncertain" | "conflicted"
  | "disciplined" | "hesitant" | "impulsive" | "euphoric" | "detached" | "sharp" | "tired"
  | "bored" | "pressured";

export type TradeStatus = "open" | "closed";

export type ExitMethod = "ladder" | "single-exit" | "stopped-out" | "forced";

export type ExitType = "take-profit" | "stop-loss" | "partial-exit" | "full-exit" | "moon-bag";

export type SessionType =
  | "full-session"
  | "partially-interrupted"
  | "intermittently-interrupted"
  | "work-trade"
  | "mobile-only"
  | "forced-exit-risk";

export interface TradeUpdate {
  id: string;
  note: string;
  emotionalState: EmotionalState[];
  tpStopNote?: string;
  timestamp: string;
}

export interface ExitEvent {
  id: string;
  exitType: ExitType;
  percentClosed: number;
  pnlPercent: number;
  emotionalState: EmotionalState[];
  note?: string;
  timestamp: string;
}

export interface TradeNote {
  id: string;
  text: string;
  timestamp: string;
  duringSession: boolean;
  noteType?: "update" | "note";
  emotions?: EmotionalState[];
  sizeAdded?: string;
}

export interface Trade {
  id: string;
  userId: string;
  tokenName: string;
  chain: string;
  entryMarketCap?: string;
  entryPrice?: string;
  positionSize?: string;
  setupType?: string;
  narrativeType?: string;
  confirmationSignals?: string[];
  confirmationSignalOther?: string;
  indicatorsUsed?: string;
  sessionType?: SessionType;
  entryTime: string;
  emotionalStateAtEntry: EmotionalState[];
  emotionFreeText?: string;
  entryTranscript?: string;
  additionalNotes?: string;
  quickTags: string[];
  updates: TradeUpdate[];
  exitTime?: string;
  exitPrice?: string;
  finalPnl?: number;
  exitMethod?: ExitMethod;
  emotionalStateAtExit?: EmotionalState[];
  exitTranscript?: string;
  exitEvents?: ExitEvent[];
  tradeNotes?: TradeNote[];
  closedAt?: string;
  reflectionNote?: string;
  reflectionLesson?: string;
  emotionalStateAtReflection?: EmotionalState[];
  reflectionTimestamp?: string;
  status: TradeStatus;
  isDemo?: boolean;
  // legacy fields kept for backward compat
  volumeConfirmed?: boolean;
  walletConfirmed?: boolean;
  interruptionStatus?: "interrupted" | "clean";
}

