

# Rebuild Exit Logging + Live Trade Notes

## Summary

Six parts: fix broken buttons, Quick Exit Modal with remaining-position tracking, floating exit FAB, exit history, live notes feed, and closed-trade summary with unaccounted-position warning.

## File Changes

### 1. `src/lib/sample-data.ts` — New Types

Add:
```typescript
export type ExitType = "take-profit" | "stop-loss" | "partial-exit" | "full-exit" | "moon-bag";

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
}
```

Add to `Trade`: `exitEvents?: ExitEvent[]`, `tradeNotes?: TradeNote[]`, `closedAt?: string`.

### 2. `src/components/EmotionBadge.tsx` — Missing Colors

Add mappings for `disciplined`, `hesitant`, `impulsive`, `euphoric`, `detached`, `sharp`, `tired`.

### 3. `src/pages/TradeDetail.tsx` — Full Rebuild

**Part 1 — Fix Buttons**: Add `onClick` handlers. Update opens inline edit mode (toggle state). Log Exit opens exit drawer.

**Part 2 — Quick Exit Modal** (Drawer):
- Exit Type: tap buttons (Take Profit, Stop Loss, Partial Exit, Full Exit, Moon Bag)
- % Position Closed:
  - Compute `remainingPercent = 100 - Σ(exitEvents.percentClosed)`
  - Display **"Remaining position: X%"** label
  - Only show preset chips (25/50/75/100) where value ≤ remainingPercent
  - Custom input enforces max = remainingPercent with error if exceeded
- P&L %: preset chips (-30/+25/+50/+100/+200) + Custom
- Emotional State: multi-select chips
- Quick Note: mic button (Web Speech) + text toggle
- Save: push ExitEvent to `trade.exitEvents[]`. If type is `full-exit` or `moon-bag`, set `status: "closed"` and `closedAt`.

**Part 3 — Floating Exit FAB**: Fixed bottom-24 right-5, LogOut icon, open trades only. Opens exit drawer.

**Part 4 — Exit History Section**: Collapsible section after Entry. Cards show type, %, P&L, timestamp, note, emotion tags. Empty state: "No exits logged yet."

**Part 5 — Live Notes Feed**: Section after Exit History. Voice Note (mic/Web Speech) + Text Note (textarea). Each card: text, timestamp, "During session" / "Post-session" label. Stored in `trade.tradeNotes[]`.

**Part 6 — Summary Row** (closed trades only): Card above Entry showing:
- Total realized P&L: `Σ(pnlPercent × percentClosed / 100)`
- **Warning**: If `Σ(percentClosed) ≠ 100`, display "⚠️ Position not fully accounted for"
- Number of exits
- Duration: entryTime → closedAt

### Files Modified
- `src/lib/sample-data.ts`
- `src/components/EmotionBadge.tsx`
- `src/pages/TradeDetail.tsx`

