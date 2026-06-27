import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import bs58 from "https://esm.sh/bs58@5.0.0";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

const FREE_TRADE_LIMIT = 20;

// Per-IP rate limiting to prevent unauthenticated write-spam, reusing the same
// ai_endpoint_rate_limit table + pattern as the AI endpoints. Generous limit so
// it never affects a real user manually logging trades.
const ENDPOINT = "create-trade";
const RATE_LIMIT = 30;        // max requests
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

// Anti-replay freshness window for the signed sync message.
const SIGNATURE_FRESHNESS_MS = 5 * 60 * 1000;

// Prove the caller controls `walletAddress` before any wallet-keyed DB access.
// The client signs `TradePulse sync\nwallet:<pubkey>\nts:<unixMillis>` with the
// wallet's ed25519 key; we require a fresh ts, an exact message binding, and a
// valid signature. Any failure means we must not trust the wallet address.
function verifyWalletSignature(
  walletAddress: string,
  message: unknown,
  signature: unknown,
  ts: unknown,
): boolean {
  if (typeof message !== "string" || typeof signature !== "string") return false;
  if (typeof ts !== "number" || !Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() - ts) > SIGNATURE_FRESHNESS_MS) return false;

  const expected = `TradePulse sync\nwallet:${walletAddress}\nts:${ts}`;
  if (message !== expected) return false;

  try {
    const pubkeyBytes = bs58.decode(walletAddress);
    const sigBytes = bs58.decode(signature);
    if (pubkeyBytes.length !== 32 || sigBytes.length !== 64) return false;
    const msgBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msgBytes, sigBytes, pubkeyBytes);
  } catch {
    return false;
  }
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
    const { ownerId, walletAddress, tradeData, message, signature, ts } = body;

    // Owner is whoever sent the request: a wallet address for wallet users,
    // or an anonymous device id for everyone else. Fall back to walletAddress
    // so older clients that only send walletAddress keep working.
    const owner: string | null =
      (typeof ownerId === "string" && ownerId.trim()) ? ownerId.trim()
      : (typeof walletAddress === "string" && walletAddress.trim()) ? walletAddress.trim()
      : null;

    // A wallet address is optional now, but if present it must be a string.
    const wallet: string | null =
      (typeof walletAddress === "string" && walletAddress.trim()) ? walletAddress.trim() : null;

    if (!owner) {
      return new Response(
        JSON.stringify({ error: "MISSING_OWNER", message: "ownerId (or walletAddress) is required" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    // A wallet address is public, so writing under it requires proof of
    // ownership. The anonymous owner_id path needs no signature and is unchanged.
    if (wallet && !verifyWalletSignature(wallet, message, signature, ts)) {
      return new Response(
        JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid or missing wallet signature" }),
        { status: 401, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    if (!tradeData || typeof tradeData !== "object") {
      return new Response(
        JSON.stringify({ error: "MISSING_TRADE_DATA", message: "tradeData is required" }),
        { status: 400, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    const clientId: string | null =
      (typeof tradeData.id === "string" && tradeData.id.trim()) ? tradeData.id.trim() : null;

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "MISSING_TRADE_ID", message: "tradeData.id is required" }),
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

    // Is this an edit to an existing trade, or a brand-new one?
    const { data: existingRow } = await db
      .from("trades")
      .select("id")
      .eq("owner_id", owner)
      .eq("client_id", clientId)
      .maybeSingle();
    const isUpdate = !!existingRow;

    // The free-trade limit applies to every owner creating a NEW trade (counted
    // by owner_id). Edits are never limited. Only wallet users can be Pro and
    // thus exempt; anonymous owners are always subject to the limit.
    if (!isUpdate) {
      // Only wallet users can be Pro; anonymous owners are never Pro and are always subject to the limit.
      let isPro = false;
      if (wallet) {
        const { data: subscriber } = await db
          .from("subscribers")
          .select("verified, banned")
          .eq("wallet_address", wallet)
          .maybeSingle();
        isPro = subscriber?.verified === true && subscriber?.banned !== true;
      }

      if (!isPro) {
        const { count, error: countError } = await db
          .from("trades")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", owner);

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
    }

    // Upsert by (owner_id, client_id) so later edits (exits, notes, lessons)
    // update the same row instead of creating duplicates.
    const { error: upsertError } = await db
      .from("trades")
      .upsert(
        { owner_id: owner, wallet_address: wallet, client_id: clientId, trade_data: tradeData },
        { onConflict: "owner_id,client_id" }
      );

    if (upsertError) {
      console.error("create-trade upsert error:", upsertError.message);
      return new Response(
        JSON.stringify({ error: "SERVER_ERROR", message: "Failed to save trade" }),
        { status: 500, headers: { ...hdrs, "Content-Type": "application/json" } }
      );
    }

    // Return the client id (stable) so the frontend never reassigns trade.id.
    return new Response(
      JSON.stringify({ id: clientId, ok: true }),
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
