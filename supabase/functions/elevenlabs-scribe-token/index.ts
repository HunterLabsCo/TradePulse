import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

// This endpoint mints a paid ElevenLabs single-use token on every call, so it is
// rate-limited per IP to prevent quota-drain abuse.
const ENDPOINT = "elevenlabs-scribe-token";
const RATE_LIMIT = 10;        // max requests
const RATE_WINDOW_S = 3600;   // per this many seconds

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

serve(async (req) => {
  const hdrs = corsHeaders(req);

  if (hdrs === null) {
    return new Response(null, { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: hdrs });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    const allowed = await checkRateLimit(db, clientIp(req));
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...hdrs, "Content-Type": "application/json", "Retry-After": String(RATE_WINDOW_S) },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    const response = await fetch(
      "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
      {
        method: "POST",
        headers: { "xi-api-key": ELEVENLABS_API_KEY },
      }
    );

    if (!response.ok) {
      // Log the full error internally but never send API response details to the client
      const text = await response.text();
      console.error(`ElevenLabs token error [${response.status}]: ${text}`);
      throw new Error("Failed to obtain scribe token");
    }

    const { token } = await response.json();

    return new Response(JSON.stringify({ token }), {
      headers: { ...hdrs, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scribe-token error:", e instanceof Error ? e.message : e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  }
});
