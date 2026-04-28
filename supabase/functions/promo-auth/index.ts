import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tradepulseapp.io",
  "https://www.tradepulseapp.io",
  "http://localhost:8080",
  "http://localhost:5173",
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const hashHex = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
  const saltHex = [...salt].map(b => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, storedHashHex] = stored.split(":");
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
  // Constant-time comparison — prevents timing attacks that could leak the hash
  return crypto.subtle.timingSafeEqual
    ? crypto.subtle.timingSafeEqual(computed, expected)
    : timingSafeEqualFallback(computed, expected);
}

// Fallback for environments where timingSafeEqual isn't available
function timingSafeEqualFallback(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
  return result === 0;
}

// In-memory rate limiter: max 5 login attempts per username per 15-minute window.
// Resets on cold start, but still blocks brute-force within a running instance.
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(username: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(username);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(username, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) return true;
  entry.count++;
  return false;
}

Deno.serve(async (req) => {
  const hdrs = corsHeaders(req);

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

      if (isRateLimited(username.trim().toLowerCase())) {
        return json(hdrs, { success: false, error: "Too many attempts — try again later" }, 429);
      }

      const { data: user, error } = await db
        .from("promo_users")
        .select("id, username, password_hash")
        .eq("username", username.trim().toLowerCase())
        .single();

      // Always run the password check even when user not found to prevent
      // user-enumeration via timing differences
      const dummyHash = "0000000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";
      const hashToCheck = user?.password_hash ?? dummyHash;
      const valid = await verifyPassword(password, hashToCheck);

      if (error || !user || !valid) {
        return json(hdrs, { success: false, error: "Invalid username or password" }, 401);
      }

      const token = crypto.randomUUID();
      await db.from("promo_users").update({ session_token: token }).eq("id", user.id);

      return json(hdrs, { success: true, token, username: user.username });
    }

    // ── Verify session ───────────────────────────────────────────────────────
    if (action === "verify") {
      const { token } = body;
      if (!token) return json(hdrs, { success: false, valid: false }, 400);

      const { data: user, error } = await db
        .from("promo_users")
        .select("username")
        .eq("session_token", token)
        .single();

      if (error || !user) {
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

      const { data: user, error } = await db
        .from("promo_users")
        .select("id, password_hash")
        .eq("session_token", token)
        .single();

      if (error || !user) {
        return json(hdrs, { success: false, error: "Invalid session" }, 401);
      }

      const valid = await verifyPassword(oldPassword, user.password_hash);
      if (!valid) {
        return json(hdrs, { success: false, error: "Current password is incorrect" }, 401);
      }

      if (newPassword.length < 6) {
        return json(hdrs, { success: false, error: "New password must be at least 6 characters" }, 400);
      }

      const newHash = await hashPassword(newPassword);
      const newToken = crypto.randomUUID();
      await db.from("promo_users").update({ password_hash: newHash, session_token: newToken }).eq("id", user.id);

      return json(hdrs, { success: true, token: newToken });
    }

    return json(hdrs, { success: false, error: "Unknown action" }, 400);
  } catch (err) {
    console.error("promo-auth error:", err instanceof Error ? err.message : err);
    return json(hdrs, { success: false, error: "Internal error" }, 500);
  }
});

function json(hdrs: Record<string, string>, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...hdrs, "Content-Type": "application/json" },
  });
}
