

# Fix: Preview Not Loading + PWA + Upgrade Access

## Root Cause
The Solana wallet adapter packages (`@solana/web3.js`, `@solana/wallet-adapter-*`) depend on Node.js globals (`Buffer`, `process`) that don't exist in the browser. Vite doesn't polyfill these by default, causing the build to crash silently.

## Changes

### 1. Add Node.js polyfills for Vite
Install `vite-plugin-node-polyfills` and configure it in `vite.config.ts`. This provides `Buffer`, `process`, and `crypto` globals needed by Solana libraries.

**File: `vite.config.ts`**
- Add `import { nodePolyfills } from 'vite-plugin-node-polyfills'`
- Add `nodePolyfills()` to the plugins array

### 2. Confirm PWA is already configured
The project already has `vite-plugin-pwa` configured in `vite.config.ts` with a full manifest, service worker, and mobile meta tags in `index.html`. The PWA setup is complete — once the build compiles, the app will be installable on mobile.

### 3. Confirm Upgrade flow is already wired
The upgrade path is already implemented:
- `/upgrade` route exists with SOL/USDC payment cards and wallet connect buttons
- Settings page has "Upgrade to Pro" button (visible when not Pro)
- Home page's "New Trade" button redirects to `/upgrade` when the 20-trade limit is hit
- `/upgrade/success` route with confetti exists

No new routes or pages needed — the polyfill fix should unblock everything.

## Summary
Single fix: add `vite-plugin-node-polyfills` to resolve the build crash. Everything else (PWA, upgrade flow, payment UI) is already in place.

