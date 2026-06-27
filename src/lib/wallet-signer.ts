import bs58 from "bs58";

// The wallet adapter's signMessage is only reachable from React (useWallet()),
// but the request builders that talk to create-trade / get-trades run outside
// React (sync.ts) or read the wallet from the store (NewTrade.tsx). We register
// the current signer here so any caller can produce a wallet-bound signature.
type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;

let currentSignMessage: SignMessage | null = null;

// In-memory only (never localStorage): a signed auth stays valid for the
// server's 5-min freshness window, so we reuse the last successful signature
// for ~4 min instead of prompting the wallet on every create-trade/get-trades.
const CACHE_TTL_MS = 4 * 60 * 1000;
const authCache = new Map<string, { ts: number; promise: Promise<WalletAuth | null> }>();

export function registerWalletSigner(fn: SignMessage | null): void {
  currentSignMessage = fn;
  // Any disconnect or wallet change must drop a stale cached signature.
  authCache.clear();
}

export function buildSyncMessage(walletAddress: string, ts: number): string {
  return `TradePulse sync\nwallet:${walletAddress}\nts:${ts}`;
}

export interface WalletAuth {
  message: string;
  signature: string;
  ts: number;
}

// Build a fresh signed proof that the caller controls `walletAddress`. Returns
// null when no signer is registered or the user rejects/errors the signature —
// callers then fall back to the anonymous owner_id path.
export async function buildWalletAuth(walletAddress: string): Promise<WalletAuth | null> {
  if (!currentSignMessage) return null;

  const cached = authCache.get(walletAddress);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.promise;
  }

  const ts = Date.now();
  const message = buildSyncMessage(walletAddress, ts);
  const signer = currentSignMessage;
  // Cache the in-flight promise (not just the result) so a concurrent burst —
  // e.g. get-trades on load racing a trade save — shares one signMessage call.
  // The promise resolves to null on failure rather than rejecting, so awaiters
  // get the anonymous-owner_id fallback and a failed sign is never cached.
  const promise = (async (): Promise<WalletAuth | null> => {
    try {
      const signature = await signer(new TextEncoder().encode(message));
      return { message, signature: bs58.encode(signature), ts };
    } catch {
      authCache.delete(walletAddress);
      return null;
    }
  })();
  authCache.set(walletAddress, { ts, promise });
  return promise;
}
