import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Subscriber {
  id: string;
  wallet_address: string;
  wallet_type: string | null;
  plan: string | null;
  payment_currency: string | null;
  amount_paid: number | null;
  transaction_signature: string | null;
  created_at: string | null;
  verified: boolean | null;
  banned: boolean | null;
}

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string | null;
}

// ── Admin API helper ──────────────────────────────────────────────────────────

async function adminCall(secret: string, body: object) {
  const { data, error } = await supabase.functions.invoke("admin-action", {
    body,
    headers: { "x-admin-secret": secret },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error ?? "Unknown error");
  return data;
}

// ── Login screen ──────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (secret: string) => void }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    try {
      // A quick sanity-check call to verify the secret works
      await adminCall(value.trim(), { action: "list_flags" });
      onLogin(value.trim());
    } catch {
      toast.error("Wrong password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">Admin</div>
          <div className="mt-1 text-sm text-muted-foreground">TradePulse control panel</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            placeholder="Admin password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !value.trim()}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Subscribers tab ───────────────────────────────────────────────────────────

function SubscribersTab({ secret }: { secret: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCall(secret, { action: "list_subscribers" });
      setSubscribers(res.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  async function patch(wallet: string, updates: Partial<Subscriber>) {
    setUpdating(wallet);
    try {
      await adminCall(secret, { action: "update_subscriber", wallet_address: wallet, updates });
      setSubscribers((prev) =>
        prev.map((s) => (s.wallet_address === wallet ? { ...s, ...updates } : s))
      );
      toast.success("Updated.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUpdating(null);
    }
  }

  const filtered = subscribers.filter((s) =>
    s.wallet_address.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search wallet…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={load}
          className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Refresh
        </button>
      </div>

      <div className="text-xs text-muted-foreground">{filtered.length} subscriber{filtered.length !== 1 ? "s" : ""}</div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">No results.</div>
        )}
        {filtered.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl border p-4 space-y-3 ${
              s.banned ? "border-red-500/40 bg-red-500/5" : "border-border bg-card"
            }`}
          >
            {/* Wallet + badges */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-foreground break-all">
                    {s.wallet_address}
                  </span>
                  {s.verified && (
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">PRO</span>
                  )}
                  {s.banned && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">BANNED</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {s.wallet_type && <span>{s.wallet_type}</span>}
                  {s.payment_currency && (
                    <span>{s.amount_paid} {s.payment_currency}</span>
                  )}
                  {s.created_at && (
                    <span>{new Date(s.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                disabled={updating === s.wallet_address}
                onClick={() => patch(s.wallet_address, { verified: !s.verified })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  s.verified
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.verified ? "Revoke Pro" : "Grant Pro"}
              </button>

              <button
                disabled={updating === s.wallet_address}
                onClick={() => patch(s.wallet_address, { banned: !s.banned })}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                  s.banned
                    ? "bg-card border border-border text-muted-foreground hover:text-foreground"
                    : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                }`}
              >
                {s.banned ? "Unban" : "Ban"}
              </button>

              {s.transaction_signature && (
                <a
                  href={`https://solscan.io/tx/${s.transaction_signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  View Tx
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature Flags tab ─────────────────────────────────────────────────────────

function FlagsTab({ secret }: { secret: string }) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCall(secret, { action: "list_flags" });
      setFlags(res.data ?? []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => { load(); }, [load]);

  async function toggle(key: string, current: boolean) {
    setToggling(key);
    try {
      await adminCall(secret, { action: "update_flag", key, enabled: !current });
      setFlags((prev) =>
        prev.map((f) => (f.key === key ? { ...f, enabled: !current } : f))
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setToggling(null);
    }
  }

  async function addFlag(e: React.FormEvent) {
    e.preventDefault();
    if (!newKey.trim()) return;
    setAdding(true);
    try {
      await adminCall(secret, {
        action: "upsert_flag",
        key: newKey.trim().toLowerCase().replace(/\s+/g, "_"),
        enabled: true,
        description: newDesc.trim(),
      });
      setNewKey("");
      setNewDesc("");
      await load();
      toast.success("Flag added.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function deleteFlag(key: string) {
    if (!confirm(`Delete flag "${key}"?`)) return;
    try {
      await adminCall(secret, { action: "delete_flag", key });
      setFlags((prev) => prev.filter((f) => f.key !== key));
      toast.success("Deleted.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {flags.map((f) => (
          <div key={f.key} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-foreground">{f.key}</div>
              {f.description && (
                <div className="mt-0.5 text-xs text-muted-foreground">{f.description}</div>
              )}
            </div>
            <button
              disabled={toggling === f.key}
              onClick={() => toggle(f.key, f.enabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                f.enabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  f.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <button
              onClick={() => deleteFlag(f.key)}
              className="ml-1 text-xs text-muted-foreground hover:text-red-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add new flag */}
      <form onSubmit={addFlag} className="rounded-2xl border border-dashed border-border p-4 space-y-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add flag</div>
        <input
          type="text"
          placeholder="flag_key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={adding || !newKey.trim()}
          className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add Flag"}
        </button>
      </form>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

type Tab = "subscribers" | "flags";

export default function AdminPanel() {
  const [secret, setSecret] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("subscribers");

  if (!secret) {
    return <LoginScreen onLogin={setSecret} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="mx-auto max-w-2xl px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-foreground">Admin</div>
            <div className="text-[11px] text-muted-foreground">TradePulse</div>
          </div>
          <button
            onClick={() => setSecret(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-2xl px-5 flex gap-1 pb-3">
          {(["subscribers", "flags"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "subscribers" ? "Subscribers" : "Feature Flags"}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-5 py-6 pb-safe-bottom">
        {tab === "subscribers" && <SubscribersTab secret={secret} />}
        {tab === "flags" && <FlagsTab secret={secret} />}
      </main>
    </div>
  );
}
