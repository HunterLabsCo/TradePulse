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

export const SAMPLE_TRADES: Trade[] = [
  {
    id: "demo-1",
    userId: "demo",
    tokenName: "PEPEKING",
    chain: "SOL",
    entryMarketCap: "42K",
    entryPrice: "0.000042",
    positionSize: "2.5 SOL",
    setupType: "Volume Spike",
    narrativeType: "AI meme",
    confirmationSignals: ["Volume", "Wallets"],
    sessionType: "full-session",
    entryTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    emotionalStateAtEntry: ["confident", "focused"],
    entryTranscript: "Entering PEPEKING at 42K market cap. Volume just spiked 8x, two fresh wallets loaded in. AI narrative is trending. Putting in 2.5 SOL. Feeling really good about this one, clean setup.",
    quickTags: ["Best setup", "Clean execution"],
    updates: [
      {
        id: "demo-1-u1",
        note: "Volume holding strong, wallets adding more. Looks like it's about to break out past 100K MC.",
        emotionalState: ["confident", "in-the-zone"],
        timestamp: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
      },
    ],
    exitTime: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    exitPrice: "0.000189",
    finalPnl: 4.5,
    exitMethod: "ladder",
    emotionalStateAtExit: ["calm", "patient"],
    exitTranscript: "Exited in three clips as it hit 4.5x. Stuck to the plan perfectly.",
    reflectionNote: "Textbook trade. Clean entry, volume confirmed, patience paid off.",
    reflectionLesson: "Trust the setup when all confirmations align.",
    emotionalStateAtReflection: ["confident", "calm"],
    reflectionTimestamp: new Date(Date.now() - 86400000 * 2 + 10800000).toISOString(),
    status: "closed",
    isDemo: true,
  },
  {
    id: "demo-2",
    userId: "demo",
    tokenName: "RUGDAO",
    chain: "SOL",
    entryMarketCap: "180K",
    entryPrice: "0.00018",
    positionSize: "1.8 SOL",
    setupType: "Momentum Chase",
    narrativeType: "DAO meta",
    confirmationSignals: ["Gut / Intuition"],
    sessionType: "work-trade",
    entryTime: new Date(Date.now() - 86400000).toISOString(),
    emotionalStateAtEntry: ["rushed", "fomo"],
    entryTranscript: "Getting into RUGDAO, it's already at 180K MC. Didn't check wallets, volume looks okay I think. I'm at work so I need to be quick.",
    quickTags: ["Interrupted", "Work trade", "Chased / FOMO", "Non-compliant"],
    updates: [
      {
        id: "demo-2-u1",
        note: "It's dumping. Shouldn't have entered this.",
        emotionalState: ["anxious", "frustrated", "distracted"],
        timestamp: new Date(Date.now() - 86400000 + 1800000).toISOString(),
      },
    ],
    exitTime: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    exitPrice: "0.000045",
    finalPnl: -1.35,
    exitMethod: "forced",
    emotionalStateAtExit: ["frustrated", "rushed"],
    exitTranscript: "Exiting everything at 0.25x. Total loss.",
    reflectionNote: "Classic mistake. Chased a pump at work with no wallet checks.",
    reflectionLesson: "Never enter without all confirmations. Work trades need pre-set exits.",
    emotionalStateAtReflection: ["frustrated", "calm"],
    reflectionTimestamp: new Date(Date.now() - 86400000 + 7200000).toISOString(),
    status: "closed",
    isDemo: true,
  },
  {
    id: "demo-3",
    userId: "demo",
    tokenName: "AISENSEI",
    chain: "SOL",
    entryMarketCap: "65K",
    entryPrice: "0.000065",
    positionSize: "2 SOL",
    setupType: "Narrative Play",
    narrativeType: "AI agent",
    confirmationSignals: ["Volume", "Wallets"],
    sessionType: "full-session",
    entryTime: new Date(Date.now() - 43200000).toISOString(),
    emotionalStateAtEntry: ["confident", "calm"],
    entryTranscript: "Entering AISENSEI at 65K MC. AI agent narrative, volume is solid, two wallets confirmed.",
    quickTags: ["Clean execution"],
    updates: [
      {
        id: "demo-3-u1",
        note: "Hit 2x, took some profit. Volume is fading though.",
        emotionalState: ["nervous", "uncertain"],
        timestamp: new Date(Date.now() - 43200000 + 5400000).toISOString(),
      },
      {
        id: "demo-3-u2",
        note: "Dropped back to 1.5x. Should have taken more at 2x.",
        emotionalState: ["greedy", "conflicted"],
        timestamp: new Date(Date.now() - 43200000 + 7200000).toISOString(),
      },
    ],
    exitTime: new Date(Date.now() - 43200000 + 9000000).toISOString(),
    exitPrice: "0.000104",
    finalPnl: 0.6,
    exitMethod: "ladder",
    emotionalStateAtExit: ["conflicted", "calm"],
    exitTranscript: "Exited the rest at 1.6x. Gave back a chunk from the peak.",
    reflectionNote: "The emotional shift from confident to greedy cost me.",
    reflectionLesson: "When volume fades, exit. Don't wait for a bounce.",
    emotionalStateAtReflection: ["calm", "focused"],
    reflectionTimestamp: new Date(Date.now() - 43200000 + 10800000).toISOString(),
    status: "closed",
    isDemo: true,
  },
];
