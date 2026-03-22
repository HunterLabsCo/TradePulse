import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { truncateAddress } from "@/lib/subscription-utils";
import { toast } from "sonner";
import {
  Shield,
  LogOut,
  RefreshCw,
  Search,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_PASSWORD = "tp-admin-2024";
const SESSION_KEY = "tradepulse-admin-auth";

type Subscriber = {
  id: string;
  wallet_address: string;
  wallet_type: string | null;
  verified: boolean | null;
  plan: string | null;
  amount_paid: number | null;
  payment_currency: string | null;
  transaction_signature: string | null;
  created_at: string | null;
};

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "green" | "blue" | "yellow";
}) {
  const accentClass =
    accent === "green"
      ? "text-primary"
      : accent === "blue"
      ? "text-accent"
      : accent === "yellow"
      ? "text-yellow-400"
      : "text-foreground";

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <p className="section-label mb-1">{label}</p>
      <p className={cn("font-display text-2xl font-bold", accentClass)}>{value}</p>
      {sub && <p className="mt-0.5 font-body text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [pwInput, setPwInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Failed to load subscribers");
      return;
    }
    setSubscribers((data as Subscriber[]) ?? []);
  }, []);

  useEffect(() => {
    if (authed) fetchSubscribers();
  }, [authed, fetchSubscribers]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pwInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setSubscribers([]);
  }

  async function toggleVerified(sub: Subscriber) {
    setToggling(sub.id);
    const newValue = !sub.verified;
    const { error } = await supabase
      .from("subscribers")
      .update({ verified: newValue })
      .eq("id", sub.id);
    setToggling(null);
    if (error) {
      toast.error("Update failed");
      return;
    }
    setSubscribers((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, verified: newValue } : s))
    );
    toast.success(newValue ? "Marked as Pro" : "Revoked Pro status");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  const filtered = subscribers.filter(
    (s) =>
      s.wallet_address.toLowerCase().includes(search.toLowerCase()) ||
      (s.wallet_type ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.plan ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const proCount = subscribers.filter((s) => s.verified).length;
  const totalRevenue = subscribers
    .filter((s) => s.verified && s.amount_paid)
    .reduce((sum, s) => sum + (s.amount_paid ?? 0), 0);
  const currencies = [...new Set(subscribers.filter((s) => s.payment_currency).map((s) => s.payment_currency))];

  // --- Login Screen ---
  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card border border-border">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="font-body text-sm text-muted-foreground">TradePulse internal dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwInput}
                onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
                placeholder="Admin password"
                className={cn(
                  "w-full rounded-xl bg-secondary border px-4 py-3 pr-12 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-colors",
                  pwError ? "border-destructive focus:ring-destructive" : "border-border"
                )}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwError && (
              <p className="font-body text-xs text-destructive">Incorrect password.</p>
            )}
            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground active:scale-[0.97] transition-transform"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Dashboard ---
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/90 px-5 py-4 pt-safe-top backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="font-display text-base font-bold text-foreground">Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSubscribers}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground active:scale-[0.95] transition-all"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl bg-card border border-border px-3 py-2 font-body text-xs text-muted-foreground hover:text-foreground active:scale-[0.95] transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </header>

      <div className="space-y-6 px-5 pt-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total Users"
            value={subscribers.length}
            sub="all time signups"
            accent="blue"
          />
          <StatCard
            label="Pro Users"
            value={proCount}
            sub={`${subscribers.length ? Math.round((proCount / subscribers.length) * 100) : 0}% conversion`}
            accent="green"
          />
          <StatCard
            label="Est. Revenue"
            value={
              totalRevenue > 0
                ? currencies.length === 1
                  ? `${totalRevenue.toFixed(2)} ${currencies[0]}`
                  : `${proCount} × $99`
                : `$${proCount * 99}`
            }
            sub="verified purchases"
            accent="yellow"
          />
          <StatCard
            label="Free Tier"
            value={subscribers.length - proCount}
            sub="not yet upgraded"
          />
        </div>

        {/* Wallet types breakdown */}
        {subscribers.length > 0 && (
          <div className="rounded-xl bg-card border border-border p-4">
            <p className="section-label mb-3">Wallet Types</p>
            <div className="flex flex-wrap gap-2">
              {(["phantom", "solflare", "backpack", "metamask"] as const).map((wt) => {
                const count = subscribers.filter((s) => s.wallet_type === wt).length;
                if (!count) return null;
                return (
                  <div
                    key={wt}
                    className="flex items-center gap-1.5 rounded-full bg-secondary border border-border px-3 py-1"
                  >
                    <span className="font-body text-xs font-medium capitalize text-foreground">{wt}</span>
                    <span className="font-mono-label text-[10px] text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subscribers table */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="section-label">Subscribers ({filtered.length})</p>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search wallet, type, plan…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-secondary border border-border py-2.5 pl-9 pr-4 font-body text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="font-body text-sm text-muted-foreground">
                {search ? "No results" : "No subscribers yet"}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((sub) => (
              <div
                key={sub.id}
                className="rounded-xl bg-card border border-border p-4"
              >
                {/* Top row: wallet + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => copyToClipboard(sub.wallet_address)}
                      className="flex items-center gap-1.5 text-left hover:text-foreground transition-colors"
                    >
                      <span className="font-mono-label text-sm text-foreground">
                        {truncateAddress(sub.wallet_address)}
                      </span>
                      <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sub.verified ? (
                      <span className="flex items-center gap-1 rounded-full bg-[hsl(var(--green-primary)/0.15)] border border-[hsl(var(--green-primary)/0.3)] px-2.5 py-0.5 font-body text-[11px] font-medium text-primary">
                        <CheckCircle className="h-3 w-3" /> Pro
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-secondary border border-border px-2.5 py-0.5 font-body text-[11px] text-muted-foreground">
                        <XCircle className="h-3 w-3" /> Free
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {sub.wallet_type && (
                    <span className="font-body text-[11px] text-muted-foreground capitalize">
                      {sub.wallet_type}
                    </span>
                  )}
                  {sub.amount_paid && sub.payment_currency && (
                    <span className="font-body text-[11px] text-muted-foreground">
                      {sub.amount_paid} {sub.payment_currency}
                    </span>
                  )}
                  {sub.plan && (
                    <span className="font-body text-[11px] text-muted-foreground capitalize">
                      {sub.plan}
                    </span>
                  )}
                  {sub.created_at && (
                    <span className="font-body text-[11px] text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                {/* Actions row */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => toggleVerified(sub)}
                    disabled={toggling === sub.id}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-body text-xs font-medium transition-all active:scale-[0.96]",
                      sub.verified
                        ? "bg-[hsl(var(--red-destroy)/0.1)] border border-[hsl(var(--red-destroy)/0.3)] text-red-400 hover:bg-[hsl(var(--red-destroy)/0.15)]"
                        : "bg-[hsl(var(--green-primary)/0.1)] border border-[hsl(var(--green-primary)/0.3)] text-primary hover:bg-[hsl(var(--green-primary)/0.15)]"
                    )}
                  >
                    {toggling === sub.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : sub.verified ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {sub.verified ? "Revoke Pro" : "Grant Pro"}
                  </button>

                  {sub.transaction_signature && (
                    <a
                      href={`https://solscan.io/tx/${sub.transaction_signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3 py-1.5 font-body text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-[0.96]"
                    >
                      <ExternalLink className="h-3 w-3" /> Tx
                    </a>
                  )}

                  <button
                    onClick={() => copyToClipboard(sub.wallet_address)}
                    className="flex items-center gap-1.5 rounded-lg bg-secondary border border-border px-3 py-1.5 font-body text-xs text-muted-foreground hover:text-foreground transition-colors active:scale-[0.96]"
                  >
                    <Copy className="h-3 w-3" /> Copy wallet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
