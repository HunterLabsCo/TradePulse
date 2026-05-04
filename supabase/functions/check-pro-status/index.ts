import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

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
    const { walletAddress } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return new Response(
        JSON.stringify({ isPro: false, txSignature: null }),
        { headers: { ...hdrs, "Content-Type": "application/json" } }
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
      { headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-pro-status error:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ isPro: false, txSignature: null }),
      { headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  }
});
