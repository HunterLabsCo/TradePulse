import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  const computed = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, "0")).join("");
  return computed === storedHashHex;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        return json({ success: false, error: "Missing username or password" }, 400);
      }

      const { data: user, error } = await db
        .from("promo_users")
        .select("id, username, password_hash")
        .eq("username", username.trim().toLowerCase())
        .single();

      if (error || !user) {
        return json({ success: false, error: "Invalid username or password" }, 401);
      }

      const valid = await verifyPassword(password, user.password_hash);
      if (!valid) {
        return json({ success: false, error: "Invalid username or password" }, 401);
      }

      const token = crypto.randomUUID();
      await db.from("promo_users").update({ session_token: token }).eq("id", user.id);

      return json({ success: true, token, username: user.username });
    }

    // ── Verify session ───────────────────────────────────────────────────────
    if (action === "verify") {
      const { token } = body;
      if (!token) return json({ success: false, valid: false }, 400);

      const { data: user, error } = await db
        .from("promo_users")
        .select("username")
        .eq("session_token", token)
        .single();

      if (error || !user) {
        return json({ success: true, valid: false });
      }

      return json({ success: true, valid: true, username: user.username });
    }

    // ── Change password ──────────────────────────────────────────────────────
    if (action === "change_password") {
      const { token, oldPassword, newPassword } = body;
      if (!token || !oldPassword || !newPassword) {
        return json({ success: false, error: "Missing required fields" }, 400);
      }

      const { data: user, error } = await db
        .from("promo_users")
        .select("id, password_hash")
        .eq("session_token", token)
        .single();

      if (error || !user) {
        return json({ success: false, error: "Invalid session" }, 401);
      }

      const valid = await verifyPassword(oldPassword, user.password_hash);
      if (!valid) {
        return json({ success: false, error: "Current password is incorrect" }, 401);
      }

      if (newPassword.length < 6) {
        return json({ success: false, error: "New password must be at least 6 characters" }, 400);
      }

      const newHash = await hashPassword(newPassword);
      const newToken = crypto.randomUUID();
      await db.from("promo_users").update({ password_hash: newHash, session_token: newToken }).eq("id", user.id);

      return json({ success: true, token: newToken });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (err) {
    console.error("promo-auth error:", err);
    return json({ success: false, error: "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
