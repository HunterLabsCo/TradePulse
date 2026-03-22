

# Crypto Payments Integration for TradePulse

## Overview
Add wallet-based crypto payments (SOL and USDC) with Solana wallet adapters, a Supabase `subscribers` table, an `/upgrade` page, transaction verification via a backend function, and Pro status management throughout the app.

## Architecture

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  /upgrade   │────▶│ Wallet Adapter   │────▶│ On-chain Transfer   │
│  page       │     │ (Phantom/Solflare│     │ (SOL or USDC)       │
│             │     │  /Backpack)      │     │ to RECEIVING_WALLET │
└─────┬───────┘     └──────────────────┘     └──────────┬──────────┘
      │                                                  │ tx signature
      │                                                  ▼
      │                                      ┌─────────────────────┐
      │                                      │ Edge Function:      │
      │                                      │ verify-payment      │
      │                                      │ (Helius RPC check)  │
      │                                      │ → insert subscriber │
      └──────────────────────────────────────▶└─────────────────────┘
```

---

## Step 1: Database — `subscribers` table

Create via migration:

```sql
CREATE TABLE public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  wallet_type text,
  plan text DEFAULT 'lifetime',
  payment_currency text,
  amount_paid numeric,
  transaction_signature text UNIQUE,
  created_at timestamptz DEFAULT now(),
  verified boolean DEFAULT false
);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own subscription by wallet address
CREATE POLICY "Public read by wallet"
  ON public.subscribers FOR SELECT
  USING (true);

-- Only backend (service role) inserts via edge function
CREATE POLICY "Service role insert"
  ON public.subscribers FOR INSERT
  WITH CHECK (false);
```

The SELECT policy is open so the frontend can check subscription status by wallet address. Inserts are blocked for anon — only the edge function (using service role key) can insert.

## Step 2: Environment variable

Store `VITE_RECEIVING_WALLET` in the codebase (it's a public address, not a secret). Placeholder value until user provides actual address.

Store Helius API key as a Supabase secret for the edge function. Will need to ask user for a Helius API key (free tier available).

## Step 3: Install dependencies

- `@solana/web3.js` — Solana connection and transactions
- `@solana/spl-token` — USDC SPL token transfers
- `@solana/wallet-adapter-react`, `@solana/wallet-adapter-react-ui`, `@solana/wallet-adapter-base` — wallet adapter framework
- `@solana/wallet-adapter-phantom`, `@solana/wallet-adapter-solflare`, `@solana/wallet-adapter-backpack` — wallet adapters
- `ethers` — MetaMask connection only (no payment flow yet)
- `canvas-confetti` — success screen confetti

## Step 4: Wallet + Pro state management

**New file: `src/lib/subscription-store.ts`** (Zustand store)
- `connectedWallet: string | null`
- `walletType: string | null`
- `isPro: boolean`
- `setWallet(address, type)` / `disconnect()`
- `setIsPro(value)`
- Persisted to localStorage

**New file: `src/lib/subscription-utils.ts`**
- `checkProStatus(walletAddress)` — queries Supabase `subscribers` table
- `fetchSolPrice()` — calls CoinGecko API
- Re-verify on app load

## Step 5: Wallet Provider wrapper

**New file: `src/components/WalletProvider.tsx`**
- Wraps the app with `ConnectionProvider` + `WalletProvider` from Solana wallet adapter
- Configures Phantom, Solflare, Backpack adapters
- Uses mainnet-beta endpoint

Update `src/App.tsx` to wrap routes with this provider.

## Step 6: Upgrade page — `/upgrade`

**New file: `src/pages/Upgrade.tsx`**

Layout:
- Header: "Upgrade to TradePulse Pro"
- Subheader: "One payment. Lifetime access. No renewals."
- Two payment cards: SOL (dynamic price from CoinGecko, refreshed every 60s) and USDC (fixed 99)
- Four wallet connect buttons: Phantom, Solflare, Backpack, MetaMask
- MetaMask shows "ETH payments coming soon" after connecting
- Connected state shows truncated address with green dot
- Pay button activates when wallet connected + method selected
- Handles SOL transfer (SystemProgram) and USDC transfer (SPL token transfer to receiving wallet)
- On success: calls verify-payment edge function, then navigates to success screen

**New file: `src/pages/UpgradeSuccess.tsx`**
- "You're Pro" heading in lime green with confetti
- Transaction signature (truncated, links to Solscan)
- "Start Trading" button → Home

## Step 7: Edge function — `verify-payment`

**New file: `supabase/functions/verify-payment/index.ts`**

Accepts: `{ txSignature, walletAddress, walletType, paymentCurrency, expectedAmount }`

1. Calls Helius RPC `getTransaction` to confirm the signature
2. Verifies receiving address matches `RECEIVING_WALLET` secret
3. Verifies amount (exact for USDC, 0.5% tolerance for SOL)
4. If valid: inserts into `subscribers` with `verified = true`
5. If amount doesn't match but tx is real: inserts with `verified = false` for manual review
6. Returns `{ success, verified }` to frontend

Needs secrets: `HELIUS_API_KEY`, `RECEIVING_WALLET` (runtime secret for edge function).

## Step 8: Free tier gating updates

**Modify `src/pages/NewTrade.tsx`**:
- Import `useSubscriptionStore`
- If `getNonDemoTradeCount() >= 20 && !isPro` → navigate to `/upgrade` instead of `/paywall`

**Modify `src/pages/Index.tsx`**:
- New Trade button: if at limit and not Pro, go to `/upgrade`

## Step 9: Settings page updates

**Modify `src/pages/SettingsPage.tsx`**:
- If Pro: show green "Pro — Lifetime" badge with tx signature link to Solscan
- If free: show "X / 20 free trades used" counter + "Upgrade to Pro" button

## Step 10: Pro status check on app load

**Modify `src/App.tsx`**:
- On mount, if wallet is connected in store, call `checkProStatus()` to re-verify against Supabase

## Step 11: Update routing

**Modify `src/App.tsx`**:
- Add `/upgrade` and `/upgrade/success` routes
- Remove or redirect `/paywall` to `/upgrade`

---

## Secrets needed from user
1. **Helius API key** — free at helius.dev, needed for tx verification
2. **Receiving wallet address** — their Solana wallet to receive payments

## What stays unchanged
- All trade logging, journal, voice recording, and data functionality
- Existing styling and color scheme
- Bottom nav, trade detail pages, all existing routes

