import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

// Per-IP rate limiting, reusing the same ai_endpoint_rate_limit table + pattern
// as the AI endpoints. Generous limit so it never affects a real user.
const ENDPOINT = "get-trades";
const RATE_LIMIT = 60;        // max requests
const RATE_WINDOW_S = 60;     // per this many seconds

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function checkRateLimit(db: SupabaseClient, ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_S * 1000).toISOString();
  const { count } = await db
    .from("ai_endpoint_rate_limit")
    .select("*", { count: "exact", head: true })
    .eq("endpoint", ENDPOINT)
    .eq("ip_address", ip)
    .gte("requested_at", windowStart);
  if ((count ?? 0) >= RATE_LIMIT) return false;
  await db.from("ai_endpoint_rate_limit").insert({ endpoint: ENDPOINT, ip_address: ip });
  return true;
}

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
    const { ownerId, walletAddress } = body;

    const owner: string | null =
      (typeof ownerId === "string" && ownerId.trim()) ? ownerId.trim() : null;

    const wallet: string | null =
      (typeof walletAddress === "string" && walletAddress.trim()) ? walletAddress.trim() : null;

    if (!owner && !wallet) {
      return new Response(
        JSON.stringify({ error: "MISSING_OWNER", message: "ownerId or walletAddress is required" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit per IP before doing any work.
    const allowed = await checkRateLimit(db, clientIp(req));
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: "RATE_LIMITED", message: "Too many requests" }),
        { status: 429, headers: { ...hdrs, "Content-Type": "application/json", "Retry-After": String(RATE_WINDOW_S) } }
      );
    }

    // Match rows owned by the anonymous device id OR (if connected) the wallet.
    // A single row can match on both, so dedupe by client_id below.
    const filters = [owner ? `owner_id.eq.${owner}` : null, wallet ? `wallet_address.eq.${wallet}` : null]
      .filter((f): f is string => f !== null)
      .join(",");

    const { data: rows, error: selectError } = await db
      .from("trades")
      .select("client_id, trade_data, created_at")
      .or(filters)
      .order("created_at", { ascending: true });

    if (selectError) {
      console.error("get-trades select error:", selectError.message);
      return new Response(
        JSON.stringify({ error: "SERVER_ERROR", message: "Failed to load trades" }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    const seen = new Set<string>();
    const trades: unknown[] = [];
    for (const row of rows ?? []) {
      const id = typeof row.client_id === "string" ? row.client_id : null;
      if (id && seen.has(id)) continue;
      if (id) seen.add(id);
      trades.push(row.trade_data);
    }

    return new Response(
      JSON.stringify({ trades }),
      { status: 200, headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-trades error:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: "SERVER_ERROR", message: "Unexpected error" }),
      { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  }
});
