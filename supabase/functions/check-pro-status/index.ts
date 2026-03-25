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
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return new Response(
        JSON.stringify({ isPro: false, txSignature: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    const { data } = await db
      .from("subscribers")
      .select("verified, transaction_signature, banned")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    const isPro = data?.verified === true && data?.banned !== true;

    return new Response(
      JSON.stringify({ isPro, txSignature: data?.transaction_signature ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-pro-status error:", err);
    return new Response(
      JSON.stringify({ isPro: false, txSignature: null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
