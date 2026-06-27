import { supabase } from "@/integrations/supabase/client";
import { getOwnerId } from "./owner-id";
import { useSubscriptionStore } from "./subscription-store";
import { useTradeStore } from "./trade-store";
import { buildWalletAuth } from "./wallet-signer";
import { Trade } from "./sample-data";

// Best-effort read path: pull any trades stored server-side for this device id
// (and connected wallet) and merge them additively into the local store. Never
// throws and never blocks the UI — local localStorage stays the source of truth.
export async function hydrateTradesFromCloud(): Promise<void> {
  try {
    const ownerId = getOwnerId();
    const walletAddress = useSubscriptionStore.getState().connectedWallet ?? undefined;

    // Reading the wallet's trades requires proving ownership of it. If signing
    // fails or is unavailable, fall back to the anonymous owner_id read only.
    let body: Record<string, unknown> = { ownerId };
    if (walletAddress) {
      const auth = await buildWalletAuth(walletAddress);
      if (auth) body = { ownerId, walletAddress, ...auth };
    }

    const { data, error } = await supabase.functions.invoke("get-trades", {
      body,
    });

    if (error) {
      console.warn("[sync] hydrateTradesFromCloud failed:", error.message);
      return;
    }

    const serverTrades: Trade[] = data?.trades ?? [];
    useTradeStore.getState().mergeServerTrades(serverTrades);
  } catch (err) {
    console.warn("[sync] hydrateTradesFromCloud failed:", err instanceof Error ? err.message : err);
  }
}
