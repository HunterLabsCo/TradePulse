import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

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
