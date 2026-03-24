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

const now = Date.now();
const d = (daysAgo: number, hoursOffset = 0) =>
  new Date(now - 86400000 * daysAgo + hoursOffset * 3600000).toISOString();

export const SAMPLE_TRADES: Trade[] = [
  // ── 1. KAIJUPUMP – 5.2x homerun, 14 days ago ──────────────────────────────
  {
    id: "demo-1",
    userId: "demo",
    tokenName: "KAIJUPUMP",
    chain: "SOL",
    entryMarketCap: "38K",
    entryPrice: "0.000038",
    positionSize: "3 SOL",
    setupType: "Migrated Confirmation",
    narrativeType: "Kaiju / monster meta",
    confirmationSignals: ["Volume", "Wallets", "Migration Confirmed"],
    indicatorsUsed: "EMA 9, EMA 21",
    sessionType: "full-session",
    entryTime: d(14),
    emotionalStateAtEntry: ["confident", "focused", "sharp"],
    entryTranscript:
      "Entering KAIJUPUMP right after migration. 38K MC, volume already 4x normal, three fresh wallets loaded in under a minute. EMAs are stacking perfectly. This is a textbook migrated confirmation. 3 SOL in.",
    quickTags: ["Best setup", "Clean execution", "Pre-set orders"],
    updates: [
      {
        id: "demo-1-u1",
        note: "100K MC broken. Volume accelerating. Adding 0.5 SOL.",
        emotionalState: ["confident", "in-the-zone"],
        timestamp: d(14, 1),
      },
      {
        id: "demo-1-u2",
        note: "200K hit. Taking first ladder at 5x. Still holding 60%.",
        emotionalState: ["calm", "patient"],
        timestamp: d(14, 2),
      },
    ],
    exitEvents: [
      {
        id: "demo-1-e1",
        exitType: "partial-exit",
        percentClosed: 40,
        pnlPercent: 5.0,
        emotionalState: ["calm", "disciplined"],
        note: "First ladder at 5x",
        timestamp: d(14, 2),
      },
      {
        id: "demo-1-e2",
        exitType: "partial-exit",
        percentClosed: 35,
        pnlPercent: 5.5,
        emotionalState: ["calm"],
        note: "Second ladder, volume fading slightly",
        timestamp: d(14, 3),
      },
      {
        id: "demo-1-e3",
        exitType: "moon-bag",
        percentClosed: 25,
        pnlPercent: 4.8,
        emotionalState: ["calm", "patient"],
        note: "Moon bag remainder",
        timestamp: d(14, 4),
      },
    ],
    exitTime: d(14, 4),
    exitPrice: "0.000235",
    finalPnl: 5.2,
    exitMethod: "ladder",
    emotionalStateAtExit: ["calm", "euphoric"],
    exitTranscript: "Exited in three clips. 5.2x average across the position. Stuck to the plan.",
    reflectionNote:
      "Perfect execution. Entry right at migration, let it breathe, laddered out with discipline. The EMA stack was the key signal I almost ignored.",
    reflectionLesson: "Migrated confirmation + volume + wallets = highest probability setup. Trust it and size correctly.",
    emotionalStateAtReflection: ["calm", "confident"],
    reflectionTimestamp: d(14, 6),
    status: "closed",
    isDemo: true,
  },

  // ── 2. BONKGOD – loss, FOMO above ceiling, 13 days ago ───────────────────
  {
    id: "demo-2",
    userId: "demo",
    tokenName: "BONKGOD",
    chain: "SOL",
    entryMarketCap: "320K",
    entryPrice: "0.00032",
    positionSize: "2 SOL",
    setupType: "Momentum Chase",
    narrativeType: "BONK derivative",
    confirmationSignals: ["Gut / Intuition"],
    sessionType: "mobile-only",
    entryTime: d(13),
    emotionalStateAtEntry: ["fomo", "overconfident", "impulsive"],
    entryTranscript:
      "Buying BONKGOD at 320K MC. I know it's already pumped but it's still going. Community is going crazy on Twitter. No wallet check, no volume analysis. I'm on my phone, this is fine.",
    quickTags: ["Chased / FOMO", "Above MC ceiling", "Non-compliant"],
    updates: [
      {
        id: "demo-2-u1",
        note: "Already down 30%. Whales dumping into the hype.",
        emotionalState: ["anxious", "fearful"],
        timestamp: d(13, 1),
      },
    ],
    exitTime: d(13, 2),
    exitPrice: "0.000128",
    finalPnl: -0.85,
    exitMethod: "stopped-out",
    emotionalStateAtExit: ["frustrated", "conflicted"],
    exitTranscript: "Cut the loss at -85%. Painful. Chased a pump with zero confirmation.",
    reflectionNote: "Entered 320K on pure FOMO from Twitter noise. Violated every rule in my playbook.",
    reflectionLesson: "MC ceiling is 150K for new entries. Above that, I need wallets + volume or I don't enter.",
    emotionalStateAtReflection: ["frustrated", "calm"],
    reflectionTimestamp: d(13, 4),
    status: "closed",
    isDemo: true,
  },

  // ── 3. WIF2 – 3.2x win, wallet signal, 11 days ago ───────────────────────
  {
    id: "demo-3",
    userId: "demo",
    tokenName: "WIF2",
    chain: "SOL",
    entryMarketCap: "55K",
    entryPrice: "0.000055",
    positionSize: "2.5 SOL",
    setupType: "Wallet Signal",
    narrativeType: "WIF derivative, dog meta",
    confirmationSignals: ["Wallets", "Volume", "Chart Pattern"],
    indicatorsUsed: "RSI, EMA 21",
    sessionType: "full-session",
    entryTime: d(11),
    emotionalStateAtEntry: ["confident", "focused", "calm"],
    entryTranscript:
      "Wallet signal triggered on WIF2. One of my top tracked wallets just loaded 5 SOL at 55K MC. RSI at 42, not overbought. Chart showing clean higher lows. Volume picking up. I'm in for 2.5 SOL.",
    quickTags: ["Clean execution", "Best setup"],
    updates: [
      {
        id: "demo-3-u1",
        note: "Second tracked wallet loaded. Now three major wallets in. This is strong.",
        emotionalState: ["confident", "in-the-zone"],
        timestamp: d(11, 2),
      },
    ],
    exitEvents: [
      {
        id: "demo-3-e1",
        exitType: "partial-exit",
        percentClosed: 50,
        pnlPercent: 3.0,
        emotionalState: ["calm", "disciplined"],
        note: "Half at 3x",
        timestamp: d(11, 5),
      },
      {
        id: "demo-3-e2",
        exitType: "full-exit",
        percentClosed: 50,
        pnlPercent: 3.4,
        emotionalState: ["calm"],
        note: "Rest at 3.4x, volume tapering",
        timestamp: d(11, 7),
      },
    ],
    exitTime: d(11, 7),
    exitPrice: "0.000187",
    finalPnl: 3.2,
    exitMethod: "ladder",
    emotionalStateAtExit: ["calm", "patient"],
    exitTranscript: "Laddered out at 3x and 3.4x. Clean trade start to finish.",
    reflectionNote: "Following my top wallet paid off again. The RSI + EMA combo gave me conviction to hold.",
    reflectionLesson: "When wallets align with technicals, trust it. Don't take partial too early.",
    emotionalStateAtReflection: ["confident", "calm"],
    reflectionTimestamp: d(11, 9),
    status: "closed",
    isDemo: true,
  },

  // ── 4. SOLGOAT – 0.9x win, dip buy, 9 days ago ───────────────────────────
  {
    id: "demo-4",
    userId: "demo",
    tokenName: "SOLGOAT",
    chain: "SOL",
    entryMarketCap: "72K",
    entryPrice: "0.000072",
    positionSize: "1.5 SOL",
    setupType: "Dip Buy / Pullback",
    confirmationSignals: ["Volume", "Chart Pattern", "EMA Cross"],
    indicatorsUsed: "EMA 9, EMA 21, RSI",
    sessionType: "partially-interrupted",
    entryTime: d(9),
    emotionalStateAtEntry: ["calm", "patient", "disciplined"],
    entryTranscript:
      "SOLGOAT pulled back to EMA 21 support after running to 120K. RSI cooling down to 38. Volume dried up on the dip, looks like a shakeout. Entering 1.5 SOL on the bounce confirmation.",
    quickTags: ["Pre-set orders", "Clean execution"],
    updates: [],
    exitTime: d(9, 6),
    exitPrice: "0.000137",
    finalPnl: 0.9,
    exitMethod: "single-exit",
    emotionalStateAtExit: ["calm", "focused"],
    exitTranscript: "Exited at 1.9x, just under prior high resistance. 90% gain on a scalp dip. Clean.",
    reflectionNote: "Solid dip buy. EMA 21 held perfectly. Could have held for more but the plan was to exit near prior high.",
    reflectionLesson: "Dip buys on EMA 21 in uptrending tokens are high probability. Stick to the exit plan.",
    emotionalStateAtReflection: ["calm", "confident"],
    reflectionTimestamp: d(9, 8),
    status: "closed",
    isDemo: true,
  },

  // ── 5. DOGE2X – loss, revenge trade, 7 days ago ──────────────────────────
  {
    id: "demo-5",
    userId: "demo",
    tokenName: "DOGE2X",
    chain: "SOL",
    entryMarketCap: "95K",
    entryPrice: "0.000095",
    positionSize: "3 SOL",
    setupType: "Momentum Chase",
    narrativeType: "DOGE derivative",
    confirmationSignals: ["Gut / Intuition"],
    sessionType: "intermittently-interrupted",
    entryTime: d(7),
    emotionalStateAtEntry: ["revenge-mindset", "rushed", "overconfident"],
    entryTranscript:
      "I just got stopped out of GOATFI and I'm pissed. Throwing 3 SOL into DOGE2X to make it back. It's moving, it's at 95K, community seems active. I know I shouldn't do this right now.",
    quickTags: ["Non-compliant", "Chased / FOMO", "Above MC ceiling"],
    updates: [
      {
        id: "demo-5-u1",
        note: "Down 40%. This is a revenge trade and I knew it. Need to cut it.",
        emotionalState: ["frustrated", "anxious", "uncertain"],
        timestamp: d(7, 1),
      },
    ],
    exitTime: d(7, 2),
    exitPrice: "0.000038",
    finalPnl: -0.65,
    exitMethod: "forced",
    emotionalStateAtExit: ["frustrated", "tired"],
    exitTranscript: "Cut it at -65%. Should have walked away after the GOATFI loss.",
    reflectionNote:
      "Classic revenge trade. I knew going in it was wrong. Oversized into an unconfirmed setup driven by emotion.",
    reflectionLesson: "After a loss, step away for 30 minutes minimum. No more trades when in revenge mindset.",
    emotionalStateAtReflection: ["calm", "focused"],
    reflectionTimestamp: d(7, 5),
    status: "closed",
    isDemo: true,
  },

  // ── 6. MEMECAT – 2.1x win, breakout, 5 days ago ──────────────────────────
  {
    id: "demo-6",
    userId: "demo",
    tokenName: "MEMECAT",
    chain: "SOL",
    entryMarketCap: "88K",
    entryPrice: "0.000088",
    positionSize: "2 SOL",
    setupType: "Breakout",
    narrativeType: "Cat meta, meme supercycle",
    confirmationSignals: ["Volume", "Chart Pattern", "Social / Twitter"],
    indicatorsUsed: "EMA 9, MACD",
    sessionType: "full-session",
    entryTime: d(5),
    emotionalStateAtEntry: ["confident", "sharp", "focused"],
    entryTranscript:
      "MEMECAT breaking out of a 4-hour consolidation at 88K MC. Volume 6x average, MACD just crossed bullish, EMA 9 holding above 21. Twitter starting to pick up. Entering 2 SOL on the breakout confirmation.",
    quickTags: ["Best setup", "Clean execution"],
    updates: [
      {
        id: "demo-6-u1",
        note: "150K broken. Momentum strong. Moving stop to breakeven.",
        emotionalState: ["confident", "in-the-zone"],
        timestamp: d(5, 2),
      },
    ],
    exitTime: d(5, 5),
    exitPrice: "0.000193",
    finalPnl: 2.1,
    exitMethod: "ladder",
    emotionalStateAtExit: ["calm", "disciplined"],
    exitTranscript: "Laddered out between 200K and 250K MC. 2.1x average. Solid breakout trade.",
    reflectionNote: "The breakout entry was clean. Waited for volume confirmation instead of jumping early.",
    reflectionLesson: "Breakouts need volume to sustain. MACD cross + EMA stack = high conviction signal.",
    emotionalStateAtReflection: ["confident", "calm"],
    reflectionTimestamp: d(5, 7),
    status: "closed",
    isDemo: true,
  },

  // ── 7. PEPEKING – 4.5x win, 2 days ago (original trade 1) ────────────────
  {
    id: "demo-7",
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
    entryTime: d(2),
    emotionalStateAtEntry: ["confident", "focused"],
    entryTranscript:
      "Entering PEPEKING at 42K market cap. Volume just spiked 8x, two fresh wallets loaded in. AI narrative is trending. Putting in 2.5 SOL. Feeling really good about this one, clean setup.",
    quickTags: ["Best setup", "Clean execution"],
    updates: [
      {
        id: "demo-7-u1",
        note: "Volume holding strong, wallets adding more. Looks like it's about to break out past 100K MC.",
        emotionalState: ["confident", "in-the-zone"],
        timestamp: d(2, 1),
      },
    ],
    exitTime: d(2, 2),
    exitPrice: "0.000189",
    finalPnl: 4.5,
    exitMethod: "ladder",
    emotionalStateAtExit: ["calm", "patient"],
    exitTranscript: "Exited in three clips as it hit 4.5x. Stuck to the plan perfectly.",
    reflectionNote: "Textbook trade. Clean entry, volume confirmed, patience paid off.",
    reflectionLesson: "Trust the setup when all confirmations align.",
    emotionalStateAtReflection: ["confident", "calm"],
    reflectionTimestamp: d(2, 3),
    status: "closed",
    isDemo: true,
  },

  // ── 8. RUGDAO – loss, work trade, 1 day ago (original trade 2) ───────────
  {
    id: "demo-8",
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
    entryTime: d(1),
    emotionalStateAtEntry: ["rushed", "fomo"],
    entryTranscript:
      "Getting into RUGDAO, it's already at 180K MC. Didn't check wallets, volume looks okay I think. I'm at work so I need to be quick.",
    quickTags: ["Interrupted", "Work trade", "Chased / FOMO", "Non-compliant"],
    updates: [
      {
        id: "demo-8-u1",
        note: "It's dumping. Shouldn't have entered this.",
        emotionalState: ["anxious", "frustrated", "distracted"],
        timestamp: d(1, 0.5),
      },
    ],
    exitTime: d(1, 1),
    exitPrice: "0.000045",
    finalPnl: -1.35,
    exitMethod: "forced",
    emotionalStateAtExit: ["frustrated", "rushed"],
    exitTranscript: "Exiting everything at a big loss. Total disaster.",
    reflectionNote: "Classic mistake. Chased a pump at work with no wallet checks.",
    reflectionLesson: "Never enter without all confirmations. Work trades need pre-set exits.",
    emotionalStateAtReflection: ["frustrated", "calm"],
    reflectionTimestamp: d(1, 2),
    status: "closed",
    isDemo: true,
  },

  // ── 9. AISENSEI – 0.6x win, 12 hours ago (original trade 3) ─────────────
  {
    id: "demo-9",
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
    entryTime: d(0, -12),
    emotionalStateAtEntry: ["confident", "calm"],
    entryTranscript:
      "Entering AISENSEI at 65K MC. AI agent narrative, volume is solid, two wallets confirmed.",
    quickTags: ["Clean execution"],
    updates: [
      {
        id: "demo-9-u1",
        note: "Hit 2x, took some profit. Volume is fading though.",
        emotionalState: ["nervous", "uncertain"],
        timestamp: d(0, -10.5),
      },
      {
        id: "demo-9-u2",
        note: "Dropped back to 1.5x. Should have taken more at 2x.",
        emotionalState: ["greedy", "conflicted"],
        timestamp: d(0, -10),
      },
    ],
    exitTime: d(0, -9.5),
    exitPrice: "0.000104",
    finalPnl: 0.6,
    exitMethod: "ladder",
    emotionalStateAtExit: ["conflicted", "calm"],
    exitTranscript: "Exited the rest at 1.6x. Gave back a chunk from the peak.",
    reflectionNote: "The emotional shift from confident to greedy cost me.",
    reflectionLesson: "When volume fades, exit. Don't wait for a bounce.",
    emotionalStateAtReflection: ["calm", "focused"],
    reflectionTimestamp: d(0, -8),
    status: "closed",
    isDemo: true,
  },

  // ── 10. TOADFI – open position right now ─────────────────────────────────
  {
    id: "demo-10",
    userId: "demo",
    tokenName: "TOADFI",
    chain: "SOL",
    entryMarketCap: "48K",
    entryPrice: "0.000048",
    positionSize: "2 SOL",
    setupType: "Migrated Confirmation",
    narrativeType: "DeFi frog meta",
    confirmationSignals: ["Migration Confirmed", "Volume", "Wallets"],
    indicatorsUsed: "EMA 9, EMA 21",
    sessionType: "full-session",
    entryTime: d(0, -2),
    emotionalStateAtEntry: ["confident", "focused", "calm"],
    entryTranscript:
      "Entering TOADFI fresh migration at 48K MC. Volume triple the normal, three tracked wallets loaded within 60 seconds of migration. EMAs stacking bullish. This looks like another KAIJUPUMP setup. 2 SOL in.",
    quickTags: ["Best setup", "Pre-set orders"],
    updates: [
      {
        id: "demo-10-u1",
        note: "80K MC hit. Holding. Volume still strong, wallets not selling.",
        emotionalState: ["confident", "patient"],
        timestamp: d(0, -1),
      },
    ],
    status: "open",
    isDemo: true,
  },
];
