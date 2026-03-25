import { supabase } from "@/integrations/supabase/client";

export async function checkProStatus(walletAddress: string): Promise<{
  isPro: boolean;
  txSignature: string | null;
}> {
  // Routed through an edge function so the subscribers table is never
  // directly readable by the anon key (anyone on the internet).
  const { data, error } = await supabase.functions.invoke("check-pro-status", {
    body: { walletAddress },
  });

  if (error || !data) {
    return { isPro: false, txSignature: null };
  }

  return {
    isPro: data.isPro === true,
    txSignature: data.txSignature ?? null,
  };
}

export async function fetchSolPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const price = data?.solana?.usd;
    if (typeof price !== "number" || price <= 0) throw new Error("Invalid price data");
    return price;
  } catch (err) {
    console.error("[fetchSolPrice]", err);
    return 0;
  }
}

export function truncateAddress(addr: string): string {
  if (!addr || addr.length < 8) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const LIFETIME_PRICE_USD = 99;
export const FREE_TRADE_LIMIT = 20;
export const RECEIVING_WALLET = import.meta.env.VITE_RECEIVING_WALLET || "B2HXTm8qwrZ5n13oemVCQ4jGJ3TeRF98XxrC6oo2bnuk";
