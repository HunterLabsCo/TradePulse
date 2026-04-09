import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate admin secret
  const adminSecret = Deno.env.get("ADMIN_SECRET");
  if (!adminSecret) {
    return new Response(
      JSON.stringify({ success: false, error: "Admin not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const providedSecret = req.headers.get("x-admin-secret");
  if (providedSecret !== adminSecret) {
    return new Response(
      JSON.stringify({ success: false, error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { action } = body;

    // ── Subscribers ──────────────────────────────────────────────────────────

    if (action === "list_subscribers") {
      const { data, error } = await db
        .from("subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ success: true, data });
    }

    if (action === "add_subscriber") {
      const { wallet_address, wallet_type } = body;
      if (!wallet_address) return json({ success: false, error: "Missing wallet_address" }, 400);
      const { error } = await db
        .from("subscribers")
        .upsert({
          wallet_address,
          wallet_type: wallet_type ?? "manual",
          plan: "lifetime",
          verified: true,
          banned: false,
          payment_currency: "MANUAL",
          amount_paid: 0,
          created_at: new Date().toISOString(),
        }, { onConflict: "wallet_address" });
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete_subscriber") {
      const { wallet_address } = body;
      if (!wallet_address) return json({ success: false, error: "Missing wallet_address" }, 400);
      const { error } = await db
        .from("subscribers")
        .delete()
        .eq("wallet_address", wallet_address);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "update_subscriber") {
      const { wallet_address, updates } = body;
      if (!wallet_address || !updates) {
        return json({ success: false, error: "Missing wallet_address or updates" }, 400);
      }
      const allowed = ["verified", "banned", "plan"];
      const filtered = Object.fromEntries(
        Object.entries(updates).filter(([k]) => allowed.includes(k))
      );
      const { error } = await db
        .from("subscribers")
        .update(filtered)
        .eq("wallet_address", wallet_address);
      if (error) throw error;
      return json({ success: true });
    }

    // ── Feature Flags ────────────────────────────────────────────────────────

    if (action === "list_flags") {
      const { data, error } = await db
        .from("feature_flags")
        .select("*")
        .order("key");
      if (error) throw error;
      return json({ success: true, data });
    }

    if (action === "update_flag") {
      const { key, enabled } = body;
      if (key === undefined || enabled === undefined) {
        return json({ success: false, error: "Missing key or enabled" }, 400);
      }
      const { error } = await db
        .from("feature_flags")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("key", key);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "upsert_flag") {
      const { key, enabled, description } = body;
      if (!key) return json({ success: false, error: "Missing key" }, 400);
      const { error } = await db
        .from("feature_flags")
        .upsert({ key, enabled: enabled ?? true, description: description ?? "", updated_at: new Date().toISOString() });
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete_flag") {
      const { key } = body;
      if (!key) return json({ success: false, error: "Missing key" }, 400);
      const { error } = await db.from("feature_flags").delete().eq("key", key);
      if (error) throw error;
      return json({ success: true });
    }

    // ── Promo Users ──────────────────────────────────────────────────────────

    if (action === "create_promo_user") {
      const { username, password } = body;
      if (!username || !password) {
        return json({ success: false, error: "Missing username or password" }, 400);
      }
      if (password.length < 6) {
        return json({ success: false, error: "Password must be at least 6 characters" }, 400);
      }
      const hash = await hashPassword(password);
      const { error } = await db
        .from("promo_users")
        .insert({ username: username.trim().toLowerCase(), password_hash: hash });
      if (error) {
        if (error.code === "23505") return json({ success: false, error: "Username already exists" }, 409);
        throw error;
      }
      return json({ success: true });
    }

    if (action === "list_promo_users") {
      const { data, error } = await db
        .from("promo_users")
        .select("id, username, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ success: true, data });
    }

    if (action === "delete_promo_user") {
      const { username } = body;
      if (!username) return json({ success: false, error: "Missing username" }, 400);
      const { error } = await db.from("promo_users").delete().eq("username", username);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === "reset_promo_password") {
      const { username, newPassword } = body;
      if (!username || !newPassword) return json({ success: false, error: "Missing fields" }, 400);
      if (newPassword.length < 6) return json({ success: false, error: "Password must be at least 6 characters" }, 400);
      const hash = await hashPassword(newPassword);
      const { error } = await db
        .from("promo_users")
        .update({ password_hash: hash, session_token: null })
        .eq("username", username);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ success: false, error: "Unknown action" }, 400);
  } catch (err) {
    console.error("admin-action error:", err);
    return json({ success: false, error: "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
