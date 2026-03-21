

# Fix: New Trade Page — Save Trades to Store

## Problem
The New Trade page is a UI stub with no functionality. The mic button does nothing — no recording, no transcription, no saving. Trades entered here never reach the Zustand store, so nothing appears on the Home dashboard.

## Solution
Build a functional New Trade flow that saves trades to the store. Since ElevenLabs and AI parsing (Phases 3-4) aren't connected yet, we'll build a **manual entry form** alongside the mic button placeholder, so trades can actually be created and appear on the dashboard.

## Changes

### 1. Rebuild `src/pages/NewTrade.tsx`
- Add a full entry form with all trade fields: token name, chain, entry market cap, entry price, position size, setup type, narrative type, volume/wallet confirmed toggles, session type, interruption status
- Add emotional state selector (multi-select from the emotion taxonomy)
- Add quick tag toggle chips (Interrupted, Work trade, Full session, Pre-set orders, Above MC ceiling, Non-compliant, Chased/FOMO, Best setup, Clean execution)
- Add a transcript textarea for manual paste (placeholder for future voice input)
- On save: create a `Trade` object, call `addTrade()` from the Zustand store, navigate to the new trade's detail page
- Keep the mic button visible but show a "Coming soon" indicator until voice is wired up

### 2. Add paywall guard
- Before allowing save, check `getNonDemoTradeCount() >= 20` — if so, redirect to `/paywall`

### 3. Fix console warnings
- Add `React.forwardRef` to `EmotionBadge` and `PnlBadge` components to resolve the ref warnings

## Technical Details
- Generate trade ID with `crypto.randomUUID()`
- Set `userId: "local"`, `status: "open"`, `isDemo: false`
- Entry time auto-filled to `new Date().toISOString()`
- Form uses controlled inputs with React state
- Chain defaults to "SOL" with dropdown for ETH/BASE/ARB

