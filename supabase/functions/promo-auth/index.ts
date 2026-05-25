import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hash as argon2Hash, verify as argon2Verify } from "https://deno.land/x/argon2@v0.10.3/mod.ts";

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

async function hashPassword(password: string): Promise<string> {
  return await argon2Hash(password, { memoryCost: 65536, timeCost: 3, parallelism: 1 });
}

async function verifyPBKDF2(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHashHex] = stored.split(":");
  if (!saltHex || !storedHashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const computed = new Uint8Array(bits);
  const expected = new Uint8Array(storedHashHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  if (typeof (crypto.subtle as any).timingSafeEqual === "function") {
    return (crypto.subtle as any).timingSafeEqual(computed, expected);
  }
  if (computed.length !== expected.length) return false;
  let result = 0;
  for (let i = 0; i < computed.length; i++) result |= computed[i] ^ expected[i];
  return result === 0;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("$argon2id$")) {
    return await argon2Verify(stored, password);
  }
  return await verifyPBKDF2(password, stored);
}

// Session tokens expire after 7 days
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// DB-backed rate limiting: max 5 login attempts per username per 15-minute window.
// Survives cold starts and scales across concurrent function instances.
async function checkRateLimit(db: ReturnType<typeof createClient>, username: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await db
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("username", username)
    .gte("attempted_at", windowStart)
    .throwOnError()
    .then(r => ({ count: r.count ?? 0 }))
    .catch(() => ({ count: 0 }));
  return (count as number) >= 5;
}

async function recordLoginAttempt(db: ReturnType<typeof createClient>, username: string): Promise<void> {
  await db.from("login_attempts").insert({ username, attempted_at: new Date().toISOString() }).throwOnError().catch(() => {});
}

function json(hdrs: Record<string, string>, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...hdrs, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  const hdrs = corsHeaders(req);

  if (hdrs === null) {
    return new Response(null, { status: 403 });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: hdrs });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body;

    // ── Login ────────────────────────────────────────────────────────────────
    if (action === "login") {
      const { username, password } = body;
      if (!username || !password) {
        return json(hdrs, { success: false, error: "Missing username or password" }, 400);
      }

      const normalizedUsername = username.trim().toLowerCase();

      if (await checkRateLimit(db, normalizedUsername)) {
        return json(hdrs, { success: false, error: "Too many attempts — try again later" }, 429);
      }

      await recordLoginAttempt(db, normalizedUsername);

      const { data: user } = await db
        .from("promo_users")
        .select("id, username, password_hash")
        .eq("username", normalizedUsername)
        .single();

      // Always run the password check even when user not found to prevent
      // user-enumeration via timing differences
      const dummyHash = "$argon2id$v=19$m=65536,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const hashToCheck = user?.password_hash ?? dummyHash;
      const valid = await verifyPassword(password, hashToCheck);

      if (!user || !valid) {
        return json(hdrs, { success: false, error: "Invalid username or password" }, 401);
      }

      // Transparently upgrade PBKDF2 hashes to Argon2id on successful login
      if (!user.password_hash.startsWith("$argon2id$")) {
        const upgraded = await hashPassword(password);
        await db.from("promo_users").update({ password_hash: upgraded }).eq("id", user.id);
      }

      const token = generateToken();
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
      await db.from("promo_users")
        .update({ session_token: token, session_token_expires_at: expiresAt })
        .eq("id", user.id);

      return json(hdrs, { success: true, token, username: user.username });
    }

    // ── Verify session ───────────────────────────────────────────────────────
    if (action === "verify") {
      const { token } = body;
      if (!token) return json(hdrs, { success: false, valid: false }, 400);

      const { data: user } = await db
        .from("promo_users")
        .select("username, session_token_expires_at")
        .eq("session_token", token)
        .single();

      if (!user) {
        return json(hdrs, { success: true, valid: false });
      }

      // Reject expired tokens
      if (user.session_token_expires_at && new Date(user.session_token_expires_at) < new Date()) {
        return json(hdrs, { success: true, valid: false });
      }

      return json(hdrs, { success: true, valid: true, username: user.username });
    }

    // ── Change password ──────────────────────────────────────────────────────
    if (action === "change_password") {
      const { token, oldPassword, newPassword } = body;
      if (!token || !oldPassword || !newPassword) {
        return json(hdrs, { success: false, error: "Missing required fields" }, 400);
      }

      const { data: user } = await db
        .from("promo_users")
        .select("id, password_hash, session_token_expires_at")
        .eq("session_token", token)
        .single();

      if (!user) {
        return json(hdrs, { success: false, error: "Invalid session" }, 401);
      }

      if (user.session_token_expires_at && new Date(user.session_token_expires_at) < new Date()) {
        return json(hdrs, { success: false, error: "Session expired" }, 401);
      }

      const valid = await verifyPassword(oldPassword, user.password_hash);
      if (!valid) {
        return json(hdrs, { success: false, error: "Current password is incorrect" }, 401);
      }

      if (newPassword.length < 12) {
        return json(hdrs, { success: false, error: "New password must be at least 12 characters" }, 400);
      }

      const newHash = await hashPassword(newPassword);
      const newToken = generateToken();
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
      await db.from("promo_users")
        .update({ password_hash: newHash, session_token: newToken, session_token_expires_at: expiresAt })
        .eq("id", user.id);

      return json(hdrs, { success: true, token: newToken });
    }

    return json(hdrs, { success: false, error: "Unknown action" }, 400);
  } catch (err) {
    console.error("promo-auth error:", err instanceof Error ? err.message : err);
    return json(hdrs, { success: false, error: "Internal error" }, 500);
  }
});
