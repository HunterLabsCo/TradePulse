import { supabase } from "@/integrations/supabase/client";

export async function checkProStatus(walletAddress: string): Promise<{
  isPro: boolean;
  txSignature: string | null;
}> {
  const { data, error } = await supabase
    .from("subscribers")
    .select("verified, transaction_signature")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error || !data) {
    return { isPro: false, txSignature: null };
  }

  return {
    isPro: data.verified === true,
    txSignature: data.transaction_signature,
  };
}

export async function fetchSolPrice(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
    );
    const data = await res.json();
    return data.solana.usd as number;
  } catch {
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
export const RECEIVING_WALLET = import.meta.env.VITE_RECEIVING_WALLET || "PLACEHOLDER_WALLET_ADDRESS";
