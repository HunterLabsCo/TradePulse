import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

// Each call hits the paid Anthropic API, so it is rate-limited per IP to prevent
// quota-drain / cost-DoS abuse once publicly advertised.
const ENDPOINT = "parse-trade-transcript";
const RATE_LIMIT = 20;        // max requests
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

async function validateJWT(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const jwtSecret = Deno.env.get("SUPABASE_JWT_SECRET");
  if (!jwtSecret) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sig = Uint8Array.from(
      atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC", key, sig,
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!valid) return false;
    // Validate expiration and issuer from the decoded payload
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) return false;
    if (payload.iss && payload.iss !== "supabase") return false;
    return true;
  } catch {
    return false;
  }
}

const SYSTEM_PROMPT = `You are a trade journal parser for crypto/memecoin traders. Given a raw voice transcript from a trader logging a trade entry, extract structured data using the parse_trade_entry tool.

Rules:
- **Token name**: Extract ONLY the token ticker or short name (1-4 words max). It is typically the first proper noun spoken after words like "entering", "entered", "bought", "buying", "getting into", "aping". Examples: "BONK", "PEPE", "WIF", "MULERUN", "PEPEKING". Do NOT include surrounding phrases like "platform pump fund" — only the ticker itself.
- Chain defaults to "SOL" unless the trader mentions Ethereum/ETH/Base/Arbitrum.
- Market cap may be stated as "68K MC" or "eighty point seven K market cap" — normalize to a string like "68K" or "80.7K".
- Position size is usually stated in SOL or ETH (e.g., "1.4 SOL").
- Setup type — choose EXACTLY one of these values (use the label verbatim):
  - "Migrated Confirmation" → token just migrated/graduated, entry after migration confirmation
  - "Pre-Migration PVP" → entry before migration, playing the pump before it migrates
  - "Wallet Signal" → smart wallet / tracked wallet triggered the entry
  - "Narrative Play" → story/theme/meta driven entry (AI narrative, meme cycle, sector play)
  - "Breakout" → price breaking out of resistance or a range
  - "Dip Buy / Pullback" → buying a dip, pullback, or retracement (including EMA pullback)
  - "Volume Spike" → sudden volume surge triggered entry
  - "Momentum Chase" → pure momentum entry, trending strongly upward, no other specific trigger
  - "Custom" → use ONLY if none of the above fit, then describe in narrativeType
  Note: if trader mentions EMA support or EMA holding → use "Dip Buy / Pullback". If trending upward with RSI/momentum language → use "Momentum Chase".
- Confirmation signals — CRITICAL: detect ALL mentioned signals. Return as an array from: "Volume", "Wallets", "Social / Twitter", "Chart Pattern", "Gut / Intuition", "EMA Cross", "RSI", "Migration Confirmed", "Dev History", "Trending / Listed", "Other".
  - "RSI" → ANY mention of RSI, RSI levels, RSI holding, RSI trending — ALWAYS include if RSI appears anywhere
  - "EMA Cross" → EMAs crossed, golden cross, EMA 9/21, EMAs trending
  - "Volume" → volume holding, volume spike, volume confirming
  - "Wallets" → tracked wallets, smart wallets, wallet activity, major wallet
  - "Social / Twitter" → community, Twitter/X, posts, tweets, social sentiment
  - "Chart Pattern" → chart patterns, candlestick patterns, support/resistance, trendlines
  - "Gut / Intuition" → gut feeling, intuition, felt right
  - "Migration Confirmed" → token migrated, graduated
  - "Dev History" → dev background, team history
  - "Trending / Listed" → trending, listed on CMC/CG
- Indicators used — CRITICAL: if the trader mentions ANY technical indicator, put it in indicatorsUsed. Includes: RSI, MACD, VWAP, EMA with a number (e.g. "EMA 21"), Bollinger Bands. Return comma-separated (e.g. "RSI, EMA 9, EMA 21"). If RSI is mentioned, it MUST appear in both indicatorsUsed AND confirmationSignals.
- Session type: "full-session", "partially-interrupted", "intermittently-interrupted", "work-trade", "mobile-only", "forced-exit-risk".
- Emotional states from: confident, calm, focused, patient, in-the-zone, anxious, nervous, rushed, frustrated, revenge-mindset, greedy, fearful, overconfident, fomo, distracted, interrupted, uncertain, conflicted, disciplined, hesitant, impulsive, euphoric, detached, sharp, tired.
- Detect emotional language even if implicit.
- Quick tags: Interrupted, Work trade, Full session, Pre-set orders, Above MC ceiling, Non-compliant, Chased / FOMO, Best setup, Clean execution.
- If a field is not mentioned, omit it.`;

const TOOL = {
  name: "parse_trade_entry",
  description: "Extract structured trade entry data from a voice transcript",
  input_schema: {
    type: "object",
    properties: {
      tokenName: { type: "string", description: "Token ticker/name only (1-4 words max)" },
      chain: { type: "string", enum: ["SOL", "ETH", "BASE", "ARB"] },
      entryMarketCap: { type: "string", description: "Market cap at entry, e.g. 80.7K" },
      positionSize: { type: "string", description: "Position size, e.g. 1.4 SOL" },
      setupType: {
        type: "string",
        enum: ["Migrated Confirmation", "Pre-Migration PVP", "Wallet Signal", "Narrative Play", "Breakout", "Dip Buy / Pullback", "Volume Spike", "Momentum Chase", "Custom"],
      },
      narrativeType: { type: "string", description: "Narrative category if mentioned" },
      confirmationSignals: {
        type: "array",
        items: {
          type: "string",
          enum: ["Volume", "Wallets", "Social / Twitter", "Chart Pattern", "Gut / Intuition", "EMA Cross", "RSI", "Migration Confirmed", "Dev History", "Trending / Listed", "Other"],
        },
      },
      indicatorsUsed: {
        type: "string",
        description: "Technical indicators mentioned, comma-separated. Omit if none.",
      },
      sessionType: {
        type: "string",
        enum: ["full-session", "partially-interrupted", "intermittently-interrupted", "work-trade", "mobile-only", "forced-exit-risk"],
      },
      emotionalStates: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "confident", "calm", "focused", "patient", "in-the-zone",
            "anxious", "nervous", "rushed", "frustrated", "revenge-mindset",
            "greedy", "fearful", "overconfident",
            "fomo", "distracted", "interrupted", "uncertain", "conflicted",
            "disciplined", "hesitant", "impulsive", "euphoric", "detached", "sharp", "tired",
          ],
        },
      },
      quickTags: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["tokenName"],
  },
};

serve(async (req) => {
  const hdrs = corsHeaders(req);

  if (hdrs === null) {
    return new Response(null, { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: hdrs });
  }

  if (!await validateJWT(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...hdrs, "Content-Type": "application/json" },
    });
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

    const { transcript } = await req.json();
    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "transcript is required" }), {
        status: 400,
        headers: { ...hdrs, "Content-Type": "application/json" },
      });
    }
    if (transcript.length > 2000) {
      return new Response(JSON.stringify({ error: "Transcript too long (max 2000 characters)" }), {
        status: 400,
        headers: { ...hdrs, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: [TOOL],
          tool_choice: { type: "tool", name: "parse_trade_entry" },
          messages: [
            { role: "user", content: `Parse this trade entry transcript:\n\n"${transcript}"` },
          ],
        }),
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "Parsing timed out — please try again." }),
          { status: 504, headers: { ...hdrs, "Content-Type": "application/json" } }
        );
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...hdrs, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Anthropic API error [${response.status}]`);
    }

    const data = await response.json();
    const toolUse = data.content?.find((b: any) => b.type === "tool_use");

    if (!toolUse?.input) {
      throw new Error("No structured output from AI");
    }

    return new Response(JSON.stringify({ parsed: toolUse.input }), {
      headers: { ...hdrs, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-trade error:", e instanceof Error ? e.message : e);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
    );
  }
});
