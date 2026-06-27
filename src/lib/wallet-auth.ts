import bs58 from "bs58";

// Proof-of-ownership for the wallet sync path. The wallet-keyed create-trade /
// get-trades edge functions run under the service-role key (RLS bypassed), so a
// bare walletAddress proves nothing — anyone could send someone else's public
// address. The client signs a fresh message with the wallet's private key and
// the server verifies the ed25519 signature before touching any wallet-keyed row.

export interface WalletAuth {
  walletAddress: string;
  message: string;
  signature: string;
  ts: number;
}

type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;

// The wallet adapter's signMessage only exists inside React (useWallet), but the
// sync path runs at startup outside any component. WalletAuthBridge registers the
// active signer here so non-React callers can reach it.
let signer: SignMessage | null = null;
let signerPubkey: string | null = null;

// Reuse one signature across a burst of calls so a connected user isn't prompted
// on every startup load and every trade save. Kept comfortably inside the
// server's 5-minute freshness window.
const CACHE_TTL_MS = 4 * 60 * 1000;
let cached: WalletAuth | null = null;

export function setWalletSigner(pubkey: string, signMessage: SignMessage): void {
  signer = signMessage;
  signerPubkey = pubkey;
}

export function clearWalletSigner(): void {
  signer = null;
  signerPubkey = null;
  cached = null;
}

function buildMessage(walletAddress: string, ts: number): string {
  return `TradePulse sync\nwallet:${walletAddress}\nts:${ts}`;
}

// Returns a signed auth payload for `walletAddress`, or null when no signer is
// registered for that wallet or the user rejects / the wallet can't sign. Callers
// fall back to the anonymous owner-only path when this is null.
export async function buildWalletAuth(walletAddress: string): Promise<WalletAuth | null> {
  if (cached && cached.walletAddress === walletAddress && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached;
  }
  if (!signer || signerPubkey !== walletAddress) return null;

  try {
    const ts = Date.now();
    const message = buildMessage(walletAddress, ts);
    const sig = await signer(new TextEncoder().encode(message));
    const auth: WalletAuth = { walletAddress, message, signature: bs58.encode(sig), ts };
    cached = auth;
    return auth;
  } catch {
    return null;
  }
}

// Convenience for sync call sites: the wallet auth fields to spread into a
// request body, or {} when there's no connected wallet / signing failed.
export async function buildSyncWalletFields(
  walletAddress: string | null | undefined,
): Promise<Partial<WalletAuth>> {
  if (!walletAddress) return {};
  const auth = await buildWalletAuth(walletAddress);
  return auth ?? {};
}
