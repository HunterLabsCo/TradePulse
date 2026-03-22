

# Set Receiving Wallet & Confirm Silent Free Tier

## What's already correct
The `ProStatusChecker` in `App.tsx` (line 26) already checks `if (connectedWallet)` before querying — so when no wallet is connected, no Pro check runs and the user silently defaults to free tier. No change needed there.

## Changes

### 1. Set receiving wallet in `subscription-utils.ts`
Update the `RECEIVING_WALLET` constant fallback from `"PLACEHOLDER_WALLET_ADDRESS"` to `"B2HXTm8qwrZ5n13oemVCQ4jGJ3TeRF98XxrC6oo2bnuk"`.

### 2. Add `RECEIVING_WALLET` as edge function secret
The `verify-payment` edge function needs the receiving wallet address as a runtime secret to verify transactions server-side. Will add it via the secrets tool with value `B2HXTm8qwrZ5n13oemVCQ4jGJ3TeRF98XxrC6oo2bnuk`.

### 3. Add `VITE_RECEIVING_WALLET` to the `.env`-equivalent
Store `VITE_RECEIVING_WALLET=B2HXTm8qwrZ5n13oemVCQ4jGJ3TeRF98XxrC6oo2bnuk` so it's available at build time for the frontend.

No other files need modification — the silent free-tier behavior is already implemented.

