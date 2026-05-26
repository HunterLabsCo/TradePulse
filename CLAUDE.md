# TradePulse — Claude Cowork Instructions

## What This App Is

TradePulse is a **voice-first crypto trade journal** for retail traders. Users record trades by speaking, and the app detects emotions, trading signals, and technical indicators from the transcript in real time. Monetization is via Solana wallet payments (SOL or USDC) for a Pro subscription. There is also a promo-code path for free access.

Core user flows:
1. **New Trade** — speak to record entry, emotion state, signal context, setup type
2. **Trade Detail** — review trade, add updates/notes, record exits (partial or full)
3. **Journal** — browse historical trades
4. **Upgrade** — connect Solana wallet, pay SOL/USDC to unlock Pro

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3 + TypeScript 5.8, Vite 5.4 |
| Styling | Tailwind CSS 3.4 + shadcn/ui components |
| State | Zustand 5 (trades + subscription stores) |
| Backend | Supabase (Postgres + Deno edge functions) |
| Auth | Solana wallet adapters (Phantom, Backpack, Solflare) + promo codes |
| Voice | Web Speech Recognition API + ElevenLabs STT (`@elevenlabs/react`) |
| Payments | Solana Web3.js 1.98, SPL Token, Ethers.js 6 |
| Deployment | Vercel (frontend) + Supabase (backend) |
| Testing | Vitest + @testing-library/react, Playwright (E2E) |

---

## Architecture

```
Browser (React SPA)
  ├── Zustand trade-store     ← local trade CRUD, persisted to localStorage
  ├── Zustand subscription-store ← wallet address, pro status, promo session
  └── Supabase JS client      ← calls edge functions + reads DB

Supabase (remote)
  ├── Postgres tables: subscribers, trades, promo_users
  └── Deno Edge Functions (JWT-validated, CORS-restricted):
        verify-payment          ← validates Solana/USDC tx on-chain
        check-pro-status        ← rate-limited pro subscriber lookup
        parse-trade-transcript  ← AI parsing of voice transcript
        create-trade            ← writes trade record to DB
        elevenlabs-scribe-token ← returns ElevenLabs API token
        promo-auth              ← PBKDF2/Argon2 password verification
        admin-action            ← admin-only operations

Vercel
  └── SPA rewrite + security headers (CSP, HSTS, X-Frame-Options)
```

**Data flow for a new trade:**
1. User speaks → Web Speech Recognition transcribes in real time
2. `voice-utils.ts` detects emotions, signals, and indicators client-side via keyword matching
3. User confirms → trade saved to Zustand store (local) + optionally `create-trade` edge function (DB)
4. Pro status checked via rate-limited `check-pro-status` edge function

---

## Key Files

### Types & Domain Model
- `src/lib/sample-data.ts` — **all TypeScript types**: `Trade`, `ExitEvent`, `TradeNote`, `EmotionalState`, `ExitType`, `SessionType`, `SignalType`, etc. Start here to understand the data model.

### State
- `src/lib/trade-store.ts` — Zustand store: trade CRUD (`addTrade`, `updateTrade`, `deleteTrade`, `getTradeById`, `getTradeCount`)
- `src/lib/subscription-store.ts` — wallet connection state, pro status flag, promo session
- `src/lib/subscription-utils.ts` — calls `check-pro-status` edge function, validates payment

### Voice & Detection
- `src/lib/voice-utils.ts` — speech recognition setup; keyword maps for 18 emotions, 10 signal types, technical indicators (RSI, EMA, MACD, VWAP, Bollinger, Stochastic), session types; `detectEmotions()`, `detectSignals()`, `detectIndicators()`

### Pages (Route Components)
- `src/pages/NewTrade.tsx` (~38KB) — largest file; voice recording UI, emotion picker (20+ states), quick tags (16), setup types (9), confirmation signals (11)
- `src/pages/TradeDetail.tsx` (~18KB) — trade review, exits, updates, notes
- `src/pages/Index.tsx` — dashboard with trade list + summary stats
- `src/pages/Upgrade.tsx` (~19KB) — SOL/USDC payment UI with wallet connection
- `src/pages/Landing.tsx` (~31KB) — marketing homepage
- `src/pages/AdminPanel.tsx` (~24KB) — admin controls

### Trade UI Components
- `src/components/trade/ExitModal.tsx` (~19KB) — complex exit recording modal (exit type, % closed, P&L %, emotions, notes)
- `src/components/trade/UpdateModal.tsx` — add updates/notes mid-trade
- `src/components/trade/NotesSection.tsx` — display historical notes
- `src/components/trade/ExitHistory.tsx` — exit event timeline
- `src/components/trade/TradeSummary.tsx` — trade card summary

### Infrastructure
- `supabase/functions/` — 7 Deno edge functions (see Architecture above)
- `supabase/migrations/` — 8 SQL migrations (ordered by timestamp prefix `20260322`–`20260526`)
- `vercel.json` — CSP allowlist (must be updated if adding new external API domains), SPA rewrites, preview redirects
- `vite.config.ts` — React SWC, PWA plugin, Node polyfills (required for Solana libs), `@` path alias

### Styling
- `tailwind.config.ts` — custom colors (`green-primary`, `blue-accent`, red variants), glowing animations, Syne + DM Sans fonts
- `src/components/ui/` — full shadcn/ui library (Button, Dialog, Select, Tabs, Toast, Drawer, etc.)

---

## Development

```bash
npm run dev        # start Vite dev server
npm run build      # production build
npm test           # Vitest unit tests
npx playwright test  # E2E tests
```

Supabase edge functions can be tested locally with `supabase functions serve <name>`.

---

## Conventions

- **No comments** unless the WHY is non-obvious (hidden constraint, workaround, subtle invariant)
- **No backwards-compat shims** — just change the code
- **No over-engineering** — implement exactly what's asked, no extra abstractions
- shadcn UI components live in `src/components/ui/` — don't hand-roll if shadcn has it
- Route pages live in `src/pages/`, shared components in `src/components/`
- Zustand stores use the `create` pattern with `immer` or direct mutation via setter functions
- Edge functions: always validate JWT, set CORS headers, return `{ error }` on failure
- When adding new external API domains, update the `Content-Security-Policy` in `vercel.json`

---

## Git

- **Active branch**: `claude/stoic-gauss-kNrov`
- **Remote**: `hunterlabsco/tradepulse` on GitHub
- Always push to the active branch: `git push -u origin claude/stoic-gauss-kNrov`
- Never push to `main` without explicit user confirmation

---

## Security Notes

- Edge functions use JWT validation — never bypass it
- RLS policies are active on `subscribers`, `trades`, and `promo_users` tables
- Promo passwords are PBKDF2 + Argon2 hashed in `promo-auth` function
- CSP in `vercel.json` whitelists only: Supabase project URL, Helius RPC, CoinGecko
- Never commit secrets — Supabase keys, ElevenLabs API keys, and Helius keys are environment variables only
