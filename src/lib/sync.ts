import { supabase } from "@/integrations/supabase/client";
import { getOwnerId } from "./owner-id";
import { useSubscriptionStore } from "./subscription-store";
import { useTradeStore } from "./trade-store";
import { Trade } from "./sample-data";

// Best-effort read path: pull any trades stored server-side for this device id
// (and connected wallet) and merge them additively into the local store. Never
// throws and never blocks the UI — local localStorage stays the source of truth.
export async function hydrateTradesFromCloud(): Promise<void> {
  try {
    const ownerId = getOwnerId();
    const walletAddress = useSubscriptionStore.getState().connectedWallet ?? undefined;

    const { data, error } = await supabase.functions.invoke("get-trades", {
      body: { ownerId, walletAddress },
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
