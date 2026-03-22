import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (!txSignature || !walletAddress) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing parameters" }),
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

    // Verify transaction via Helius RPC
    const rpcRes = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [txSignature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
      }),
    });

    const rpcData = await rpcRes.json();
    const txResult = rpcData?.result;

    if (!txResult) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if transaction was successful
    if (txResult.meta?.err) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction failed on-chain" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the payment went to our wallet
    let verified = false;
    const instructions = txResult.transaction?.message?.instructions || [];

    if (paymentCurrency === "SOL") {
      // Check SystemProgram transfer
      for (const ix of instructions) {
        if (ix.parsed?.type === "transfer" && ix.program === "system") {
          const dest = ix.parsed.info?.destination;
          const lamports = ix.parsed.info?.lamports;
          if (dest === receivingWallet && lamports) {
            const solTransferred = lamports / 1e9;
            const tolerance = expectedAmount * 0.005; // 0.5%
            if (Math.abs(solTransferred - expectedAmount) <= tolerance) {
              verified = true;
            }
          }
        }
      }
    } else if (paymentCurrency === "USDC") {
      // Check SPL token transfer
      for (const ix of instructions) {
        if (
          ix.parsed?.type === "transfer" || ix.parsed?.type === "transferChecked"
        ) {
          const amount = ix.parsed.info?.amount || ix.parsed.info?.tokenAmount?.amount;
          if (amount) {
            const usdcAmount = Number(amount) / 1e6;
            if (usdcAmount >= 99) {
              verified = true;
            }
          }
        }
      }
    }

    // Insert into subscribers
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabaseAdmin
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

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
