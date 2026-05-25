import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

const FREE_TRADE_LIMIT = 20;

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

Deno.serve(async (req) => {
  const hdrs = corsHeaders(req);

  if (hdrs === null) {
    return new Response(null, { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: hdrs });
  }

  try {
    const body = await req.json();
    const { walletAddress, tradeData } = body;

    if (!walletAddress || typeof walletAddress !== "string") {
      return new Response(
        JSON.stringify({ error: "MISSING_WALLET", message: "walletAddress is required" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    if (!tradeData || typeof tradeData !== "object") {
      return new Response(
        JSON.stringify({ error: "MISSING_TRADE_DATA", message: "tradeData is required" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Check Pro status independently — never trust the client's isPro flag.
    const { data: subscriber } = await db
      .from("subscribers")
      .select("verified, banned")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    const isPro = subscriber?.verified === true && subscriber?.banned !== true;

    if (!isPro) {
      // Count existing trades for this wallet.
      const { count, error: countError } = await db
        .from("trades")
        .select("id", { count: "exact", head: true })
        .eq("wallet_address", walletAddress);

      if (countError) {
        console.error("create-trade count error:", countError.message);
        return new Response(
          JSON.stringify({ error: "SERVER_ERROR", message: "Failed to verify trade count" }),
          { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
        );
      }

      if ((count ?? 0) >= FREE_TRADE_LIMIT) {
        return new Response(
          JSON.stringify({
            error: "TRADE_LIMIT_REACHED",
            message: "You've reached your 20 free trade limit. Upgrade to Pro for unlimited trades.",
          }),
          { status: 403, headers: { ...hdrs, "Content-Type": "application/json" } }
        );
      }
    }

    // Insert the trade record.
    const { data: inserted, error: insertError } = await db
      .from("trades")
      .insert({ wallet_address: walletAddress, trade_data: tradeData })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("create-trade insert error:", insertError?.message);
      return new Response(
        JSON.stringify({ error: "SERVER_ERROR", message: "Failed to save trade" }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ id: inserted.id }),
      { status: 200, headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-trade error:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: "SERVER_ERROR", message: "Unexpected error" }),
      { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  }
});
