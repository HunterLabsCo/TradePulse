import bs58 from "bs58";

// The wallet adapter's signMessage is only reachable from React (useWallet()),
// but the request builders that talk to create-trade / get-trades run outside
// React (sync.ts) or read the wallet from the store (NewTrade.tsx). We register
// the current signer here so any caller can produce a wallet-bound signature.
type SignMessage = (message: Uint8Array) => Promise<Uint8Array>;

let currentSignMessage: SignMessage | null = null;

export function registerWalletSigner(fn: SignMessage | null): void {
  currentSignMessage = fn;
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
  const ts = Date.now();
  const message = buildSyncMessage(walletAddress, ts);
  try {
    const signature = await currentSignMessage(new TextEncoder().encode(message));
    return { message, signature: bs58.encode(signature), ts };
  } catch {
    return null;
  }
}
