import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

// Returns CORS headers for allowed origins, null if origin is present but not allowed.
// Requests without an Origin header (direct/server calls) are passed through.
function corsHeaders(req: Request): Record<string, string> | null {
  const origin = req.headers.get("Origin");
  if (!origin) return {};
  if (!ALLOWED_ORIGINS.includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

function json(hdrs: Record<string, string>, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...hdrs, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const hdrs = corsHeaders(req);

  if (hdrs === null) {
    return new Response(null, { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: hdrs });
  }

  try {
    const { txSignature, walletAddress, walletType, paymentCurrency, expectedAmount } =
      await req.json();

    if (!txSignature || !walletAddress || !paymentCurrency || !expectedAmount) {
      return json(hdrs, { success: false, error: "Missing required parameters" }, 400);
    }

    if (!isValidSolanaAddress(walletAddress)) {
      return json(hdrs, { success: false, error: "Invalid wallet address" }, 400);
    }

    if (!["SOL", "USDC"].includes(paymentCurrency)) {
      return json(hdrs, { success: false, error: "Invalid payment currency" }, 400);
    }

    if (typeof expectedAmount !== "number" || expectedAmount <= 0) {
      return json(hdrs, { success: false, error: "Invalid expected amount" }, 400);
    }

    const heliusApiKey = Deno.env.get("HELIUS_API_KEY");
    const receivingWallet = Deno.env.get("RECEIVING_WALLET");

    if (!heliusApiKey || !receivingWallet) {
      console.error("Missing HELIUS_API_KEY or RECEIVING_WALLET secret");
      return json(hdrs, { success: false, error: "Server misconfiguration" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency: if this tx signature was already recorded, return the stored result
    // rather than re-verifying. Prevents race conditions and replay attacks.
    const { data: existing } = await supabaseAdmin
      .from("subscribers")
      .select("verified, wallet_address")
      .eq("transaction_signature", txSignature)
      .maybeSingle();

    if (existing) {
      if (existing.wallet_address !== walletAddress) {
        return json(hdrs, { success: false, error: "Transaction already used by a different wallet" }, 409);
      }
      return json(hdrs, { success: true, verified: existing.verified });
    }

    const heliusRes = await fetch(
      `https://api.helius.xyz/v0/transactions?api-key=${heliusApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: [txSignature] }),
      }
    );

    if (!heliusRes.ok) {
      console.error("Helius API error:", heliusRes.status);
      return json(hdrs, { success: false, error: "Failed to fetch transaction data" }, 502);
    }

    const txList = await heliusRes.json();
    const tx = Array.isArray(txList) ? txList[0] : null;

    if (!tx) {
      return json(hdrs, { success: false, error: "Transaction not found" }, 400);
    }

    if (tx.transactionError !== null && tx.transactionError !== undefined) {
      return json(hdrs, { success: false, error: "Transaction failed on-chain" }, 400);
    }

    // feePayer must match the claimed wallet — prevents replaying another user's tx
    if (!tx.feePayer || tx.feePayer !== walletAddress) {
      return json(hdrs, { success: false, error: "Transaction signer does not match wallet" }, 400);
    }

    let verified = false;

    if (paymentCurrency === "SOL") {
      const nativeTransfers: any[] = tx.nativeTransfers ?? [];
      for (const transfer of nativeTransfers) {
        if (transfer.toUserAccount !== receivingWallet) continue;
        const solReceived = transfer.amount / 1e9;
        const tolerance = expectedAmount * 0.001;
        if (Math.abs(solReceived - expectedAmount) <= tolerance) {
          verified = true;
          break;
        }
      }
      if (!verified) console.warn("SOL payment verification failed");
    } else if (paymentCurrency === "USDC") {
      const tokenTransfers: any[] = tx.tokenTransfers ?? [];
      for (const transfer of tokenTransfers) {
        if (transfer.mint !== USDC_MINT) continue;
        if (transfer.toUserAccount !== receivingWallet) continue;
        const usdcReceived = Number(transfer.tokenAmount);
        // Same tolerance approach as SOL — validates against the server-received
        // expectedAmount rather than a hardcoded floor
        const tolerance = expectedAmount * 0.001;
        if (Math.abs(usdcReceived - expectedAmount) <= tolerance) {
          verified = true;
          break;
        }
      }
      if (!verified) console.warn("USDC payment verification failed");
    }

    const { error: dbError } = await supabaseAdmin
      .from("subscribers")
      .upsert(
        {
          wallet_address: walletAddress,
          wallet_type: walletType,
          plan: "lifetime",
          payment_currency: paymentCurrency,
          amount_paid: expectedAmount,
          transaction_signature: txSignature,
          verified,
        },
        { onConflict: "wallet_address" }
      );

    if (dbError) {
      console.error("DB upsert error:", dbError.message);
      return json(hdrs, { success: false, error: "Database error" }, 500);
    }

    return json(hdrs, { success: true, verified });
  } catch (err) {
    console.error("verify-payment error:", err instanceof Error ? err.message : err);
    return json(hdrs, { success: false, error: "Internal error" }, 500);
  }
});
