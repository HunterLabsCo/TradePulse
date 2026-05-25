import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

const RATE_LIMIT = 30;      // max requests
const RATE_WINDOW_S = 60;   // per this many seconds

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

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function checkRateLimit(db: SupabaseClient, ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_S * 1000).toISOString();

  const { count } = await db
    .from("pro_status_rate_limit")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("requested_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT) return false;

  await db.from("pro_status_rate_limit").insert({ ip_address: ip });
  return true;
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

    const allowed = await checkRateLimit(db, clientIp(req));
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        {
          status: 429,
          headers: { ...hdrs, "Content-Type": "application/json", "Retry-After": String(RATE_WINDOW_S) },
        }
      );
    }

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
