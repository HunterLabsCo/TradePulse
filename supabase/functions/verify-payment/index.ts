import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { txSignature, walletAddress, walletType, paymentCurrency, expectedAmount } =
      await req.json();

    if (!txSignature || !walletAddress || !paymentCurrency || !expectedAmount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const heliusApiKey = Deno.env.get("HELIUS_API_KEY");
    const receivingWallet = Deno.env.get("RECEIVING_WALLET");

    if (!heliusApiKey || !receivingWallet) {
      console.error("Missing HELIUS_API_KEY or RECEIVING_WALLET secret");
      return new Response(
        JSON.stringify({ success: false, error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Helius enhanced transactions API for reliable parsed transfer data
    const heliusRes = await fetch(
      `https://api.helius.xyz/v0/transactions?api-key=${heliusApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: [txSignature] }),
      }
    );

    if (!heliusRes.ok) {
      console.error("Helius API error:", heliusRes.status, await heliusRes.text());
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch transaction data" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const txList = await heliusRes.json();
    const tx = Array.isArray(txList) ? txList[0] : null;

    if (!tx) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Reject failed transactions immediately
    if (tx.transactionError !== null && tx.transactionError !== undefined) {
      console.error("Transaction failed on-chain:", tx.transactionError);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction failed on-chain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let verified = false;

    if (paymentCurrency === "SOL") {
      // Verify a native SOL transfer to our receiving wallet
      const nativeTransfers: any[] = tx.nativeTransfers ?? [];
      for (const transfer of nativeTransfers) {
        if (transfer.toUserAccount !== receivingWallet) continue;
        const solReceived = transfer.amount / 1e9;
        const tolerance = expectedAmount * 0.005; // 0.5% slippage tolerance
        if (Math.abs(solReceived - expectedAmount) <= tolerance) {
          verified = true;
          break;
        } else {
          console.warn(
            `SOL amount mismatch: expected ${expectedAmount}, got ${solReceived}`
          );
        }
      }
    } else if (paymentCurrency === "USDC") {
      // Verify a USDC SPL token transfer to our receiving wallet
      // Checks: correct mint (real USDC), correct destination wallet, sufficient amount
      const tokenTransfers: any[] = tx.tokenTransfers ?? [];
      for (const transfer of tokenTransfers) {
        if (transfer.mint !== USDC_MINT) {
          console.warn(`Wrong mint: ${transfer.mint}`);
          continue;
        }
        if (transfer.toUserAccount !== receivingWallet) {
          console.warn(`Wrong recipient: ${transfer.toUserAccount}`);
          continue;
        }
        const usdcReceived = Number(transfer.tokenAmount);
        if (usdcReceived >= 99) {
          verified = true;
          break;
        } else {
          console.warn(`USDC amount insufficient: ${usdcReceived}`);
        }
      }
    }

    // Persist the result regardless of verification outcome so admins can review
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
      console.error("DB upsert error:", dbError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!verified) {
      console.warn(
        `Payment not verified for wallet ${walletAddress}, tx ${txSignature}, currency ${paymentCurrency}`
      );
    }

    return new Response(
      JSON.stringify({ success: true, verified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-payment error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
