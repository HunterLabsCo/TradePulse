import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const hdrs = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: hdrs });
  }

  try {
    const { txSignature, walletAddress, walletType, paymentCurrency, expectedAmount } =
      await req.json();

    if (!txSignature || !walletAddress || !paymentCurrency || !expectedAmount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    const heliusApiKey = Deno.env.get("HELIUS_API_KEY");
    const receivingWallet = Deno.env.get("RECEIVING_WALLET");

    if (!heliusApiKey || !receivingWallet) {
      console.error("Missing HELIUS_API_KEY or RECEIVING_WALLET secret");
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfiguration" }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
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
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch transaction data" }),
        { status: 502, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    const txList = await heliusRes.json();
    const tx = Array.isArray(txList) ? txList[0] : null;

    if (!tx) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    if (tx.transactionError !== null && tx.transactionError !== undefined) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction failed on-chain" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    // The feePayer is the account that signed and submitted the tx — must match the
    // wallet address the client claims to be paying from. Without this check, anyone
    // could submit a valid tx signature from another user's wallet and steal Pro access.
    if (tx.feePayer !== walletAddress) {
      console.warn(`feePayer mismatch: expected ${walletAddress}, got ${tx.feePayer}`);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction signer does not match wallet" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    let verified = false;

    if (paymentCurrency === "SOL") {
      const nativeTransfers: any[] = tx.nativeTransfers ?? [];
      for (const transfer of nativeTransfers) {
        if (transfer.toUserAccount !== receivingWallet) continue;
        const solReceived = transfer.amount / 1e9;
        // 0.1% tolerance — tight enough to prevent underpayment exploits while
        // still absorbing minor rounding from lamport conversion
        const tolerance = expectedAmount * 0.001;
        if (Math.abs(solReceived - expectedAmount) <= tolerance) {
          verified = true;
          break;
        } else {
          console.warn(`SOL amount mismatch: expected ${expectedAmount}, got ${solReceived}`);
        }
      }
    } else if (paymentCurrency === "USDC") {
      const tokenTransfers: any[] = tx.tokenTransfers ?? [];
      for (const transfer of tokenTransfers) {
        if (transfer.mint !== USDC_MINT) continue;
        if (transfer.toUserAccount !== receivingWallet) continue;
        const usdcReceived = Number(transfer.tokenAmount);
        if (usdcReceived >= 99) {
          verified = true;
          break;
        } else {
          console.warn(`USDC amount insufficient: ${usdcReceived}`);
        }
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, verified }),
      { headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-payment error:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  }
});
