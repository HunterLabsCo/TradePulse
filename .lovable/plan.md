

# TradeSnap — Build Plan

## Overview

A mobile-first PWA voice journal for crypto traders. Dark-only UI with electric green (#00ff88) accent. Voice capture via ElevenLabs real-time STT, AI-powered transcript parsing via Lovable AI, local-first storage initially with Lovable Cloud backend for persistence.

## Architecture

```text
┌─────────────────────────────────────────┐
│  React SPA (PWA, dark theme, mobile)    │
│  Pages: Home, NewTrade, TradeDetail,    │
│         Analytics, Settings, Paywall    │
│  Voice: @elevenlabs/react useScribe     │
└──────────┬──────────┬───────────────────┘
           │          │
     ┌─────▼──┐  ┌────▼──────────┐
     │Supabase│  │Edge Functions │
     │  DB    │  │- parse-trade  │
     │  Auth  │  │- scribe-token │
     └────────┘  └───────────────┘
                       │
              ┌────────▼────────┐
              │ Lovable AI GW   │
              │ (Gemini Flash)  │
              └─────────────────┘
```

## Phase 1 — Foundation & UI Shell

**Design system**: Update `index.css` to dark-only theme. Background `#0d0d0d`, card `#1a1a1a`, accent `#00ff88`, muted greens. Clean sans-serif type.

**PWA setup**: Install `vite-plugin-pwa`, configure manifest with TradeSnap branding, add mobile meta tags to `index.html`, create PWA icons.

**Routing**: Add all 6 routes in `App.tsx` — `/`, `/new-trade`, `/trade/:id`, `/analytics`, `/settings`, `/paywall`.

**Navigation**: Bottom nav bar with Home, Analytics, Settings icons. Persistent across pages. Large 48px+ tap targets.

**Sample data**: Create 3 demo trades in a context/store showing winning, losing, and mixed outcomes with emotional tags.

## Phase 2 — Data Layer (Lovable Cloud + Supabase)

**Enable Lovable Cloud** to get Supabase backend.

**Database tables** (via migrations):
- `trades` — all trade fields (token, chain, entry/exit prices, PnL, status, quick_tags jsonb, emotional states, raw transcripts, timestamps)
- `trade_updates` — mid-trade updates with note, emotion, timestamp, linked to trade_id
- `trade_reflections` — post-trade reflections with note, lesson, emotion
- `users` — wallet_address, chain, subscription_status, renewal_date, trade_count, payment_tx_hash

**RLS policies**: Users can only read/write their own data (by wallet address / auth user id).

**Client hooks**: Custom React Query hooks for CRUD on trades, updates, reflections. `useTrades`, `useTradeDetail`, `useCreateTrade`, `useUpdateTrade`.

## Phase 3 — Voice Recording & Transcription

**ElevenLabs connector**: Connect via `standard_connectors--connect` for `elevenlabs`.

**Edge function `elevenlabs-scribe-token`**: Generates single-use token for real-time STT.

**Voice UI component** (`VoiceRecorder`):
- Large pulsing mic button (dominant, centered)
- Tap to start, tap to stop
- Live transcript display using `useScribe` hook with VAD commit strategy
- Returns final transcript text on completion

**Integration**: Used on New Trade page (entry), Trade Detail (update, exit, reflection).

## Phase 4 — AI Transcript Parsing

**Edge function `parse-trade-transcript`**: Receives raw transcript + phase (entry/update/exit/reflection). Calls Lovable AI with structured output (tool calling) to extract:
- For entry: token name, chain, market cap, price, position size, setup type, narrative type, volume/wallet confirmed, session type, emotional state
- For update: note, emotional state, TP/stop adjustments
- For exit: exit price, PnL, exit method, emotional state, reflection note
- For reflection: note, lesson, emotional state

**Emotional state detection**: System prompt includes the full emotion taxonomy (confident, anxious, FOMO, etc.) and instructs the model to tag all detected emotions from the transcript.

**Client flow**: After voice recording stops → send transcript to edge function → receive parsed fields → show editable form pre-filled with parsed data → user confirms/edits → save.

## Phase 5 — Core Pages

### Home Page
- Large "New Trade" button pinned to bottom (full-width, green accent)
- Quick stats bar: total trades, win rate, avg PnL
- Free trades counter (if on free tier): "X of 20 free trades used"
- Recent trades list (last 10) — token name, PnL badge (green/red), emotion tag
- Deep black background, minimal layout

### New Trade Page
- Phase 1 (Entry): Mic button → live transcript → parsed form → quick tag toggles → save
- Quick tags as toggle chips: Interrupted, Work trade, Full session, Pre-set orders, Above MC ceiling, Non-compliant, Chased/FOMO, Best setup, Clean execution
- After save, redirect to Trade Detail (trade is now "open")

### Trade Detail Page
- Header: token, chain, status badge, PnL
- Collapsible sections: Entry, Updates, Exit, Reflection
- Emotion tags displayed as colored badges with timestamps
- Action buttons: Add Update, Log Exit, Add Reflection (contextual based on trade status)
- Each action opens voice recorder → parse → confirm → save

### Analytics Page
- Gated behind 5+ trades
- Performance cards: total trades, win rate, avg PnL, biggest win/loss
- Charts using recharts: PnL over time, win rate by tag, by narrative
- Interruption analysis: interrupted vs clean PnL comparison
- Emotional Intelligence section: most common emotions for wins vs losses, "Your edge killer" highlight
- Time analysis: best/worst trading times

### Settings Page
- Display name field
- Default chain selector
- Connected wallet display
- Subscription status
- Export CSV / JSON buttons
- Delete all data with confirmation dialog

### Paywall Page
- Triggered when trade count >= 20 and user is on free tier
- Message: "You've used your 20 free trades"
- Price display with SOL/ETH placeholders
- Three wallet connect buttons: Phantom, Solflare, MetaMask
- Wallet connection logic (client-side using wallet adapter libraries)
- Transaction confirmation → update subscription status in DB

## Phase 6 — Wallet & Payments

**Dependencies**: `@solana/wallet-adapter-react`, `@solana/web3.js`, `ethers` (for MetaMask).

**Paywall flow**:
1. Check trade count on new trade attempt
2. If >= 20 and not subscribed → redirect to `/paywall`
3. User connects wallet → app constructs payment transaction
4. User approves in wallet → tx confirmed on-chain
5. Store wallet address, tx hash, subscription dates in DB
6. Unlock unlimited trades

**Subscription check**: On app load, verify subscription status. If expired, re-trigger paywall.

## Technical Details

- **State management**: React Query for server state, React context for local UI state (active recording, current phase)
- **PWA**: `vite-plugin-pwa` with `navigateFallbackDenylist: [/^\/~oauth/]`, offline caching of app shell
- **Responsive**: Mobile-first, max-width container for larger screens, all tap targets 48px+
- **No light mode**: Single dark theme, no toggle
- **Fonts**: System font stack or Inter for clean modern feel

## Implementation Order

1. Foundation (theme, PWA, routing, nav, sample data)
2. Lovable Cloud + database schema
3. ElevenLabs connector + voice recording component
4. AI parsing edge function
5. Home page + New Trade flow (entry phase)
6. Trade Detail page + mid-trade/exit/reflection phases
7. Analytics page
8. Settings page
9. Paywall + wallet integration

