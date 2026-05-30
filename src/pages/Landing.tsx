import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getReferral, setReferral } from "@/lib/referral-utils";
import logo from "@/assets/logo.png";
import {
  Mic, BookOpen, TrendingUp, Zap, Shield, BarChart2,
  Menu, X, Check, ArrowRight, Clock, Smartphone, ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const DEMO_DESKTOP_VIDEO_ID = "AsiAb6l3ZTw";
const DEMO_MOBILE_VIDEO_ID = "1gLe1stVITA";

const FEATURES = [
  {
    icon: Mic,
    title: "Voice-First Logging",
    desc: "Speak your trade naturally — 'Long ETH at 3200, Ethereum chain, feeling confident' — and TradePulse fills in every field automatically.",
  },
  {
    icon: BookOpen,
    title: "Smart Trade Journal",
    desc: "Every trade is automatically organized with token, entry price, chain, mood, and timestamp. Your journal writes itself.",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    desc: "Track your win rate, P&L, and trading patterns over time. Identify what's working and what's costing you money.",
  },
  {
    icon: Zap,
    title: "Zero Friction",
    desc: "Log a trade in under 5 seconds. No forms, no dropdowns, no typing. Built for the heat of the moment.",
  },
  {
    icon: Shield,
    title: "Multi-Chain Support",
    desc: "Works across Ethereum, Solana, Base, Arbitrum, Polygon, and more. One journal for all your chains.",
  },
  {
    icon: BarChart2,
    title: "Mood Tracking",
    desc: "Log your emotional state with each trade and discover how your psychology affects your performance.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Open TradePulse",
    desc: "Launch the app on any device — mobile or desktop. No account setup required to start your first 20 free trades.",
  },
  {
    n: "02",
    title: "Tap & Speak",
    desc: "Hit the microphone button and speak your trade naturally. Say the token, entry price, chain, and your mood.",
  },
  {
    n: "03",
    title: "AI Fills It In",
    desc: "TradePulse's AI parses your voice input and automatically populates every field in your trade log. Review and confirm.",
  },
  {
    n: "04",
    title: "Track & Improve",
    desc: "Your journal builds patterns, tracks win rates, and helps you understand your trading psychology.",
  },
];

const STATS = [
  { value: "12,400+", label: "Trades Logged" },
  { value: "100%", label: "Your Data, Your Device" },
  { value: "< 5s", label: "To Log a Trade" },
  { value: "6", label: "Chains Supported" },
];

const ANALYTICS_BULLETS = [
  { icon: TrendingUp, text: "Win rate tracking by token and chain" },
  { icon: Clock, text: "Best and worst trading hours analysis" },
  { icon: BarChart2, text: "P&L breakdown with mood correlation" },
  { icon: Smartphone, text: "Use on mobile and desktop. Install as a PWA on any device." },
];

const FREE_FEATURES = [
  "20 trades included",
  "Voice logging",
  "Trade journal",
  "Basic analytics",
  "Mobile PWA",
];

const PRO_FEATURES = [
  "Unlimited trades",
  "Everything in Free",
  "Full analytics dashboard",
  "Priority voice parsing",
  "Multi-chain tracking",
  "One-time payment — no subscription",
];

const FAQS = [
  {
    q: "Is TradePulse free to use?",
    a: "Yes. You get 20 free trades with no credit card required. Upgrade to Pro for unlimited trades with a one-time payment.",
  },
  {
    q: "How does voice logging work?",
    a: "Tap the microphone, speak your trade naturally (token, entry, chain, mood), then stop. Our AI parses your speech and fills every form field automatically in seconds.",
  },
  {
    q: "What chains are supported?",
    a: "TradePulse supports Solana, Ethereum, Base, Arbitrum, BNB/BSC, and Polygon — with more coming soon.",
  },
  {
    q: "Is my trade data stored securely?",
    a: "Your trades are stored locally on your device. We use Supabase for Pro account management with industry-standard encryption.",
  },
  {
    q: "What's included in the Pro plan?",
    a: "Pro gives you unlimited trades, full analytics, priority AI voice parsing, and access to all future features — for a one-time $99 payment. No subscription, ever.",
  },
];

function WaveformIllustration() {
  return (
    <div className="w-full overflow-hidden rounded-2xl bg-card border border-border p-6">
      <svg viewBox="0 0 400 160" className="w-full" fill="none">
        <circle cx="48" cy="80" r="32" fill="hsl(110 100% 54% / 0.12)" stroke="hsl(110 100% 54% / 0.4)" strokeWidth="1.5" />
        <circle cx="48" cy="80" r="18" fill="hsl(110 100% 54% / 0.2)" />
        <rect x="42" y="68" width="12" height="18" rx="6" fill="hsl(110 100% 54%)" />
        <path d="M39 86 Q48 94 57 86" stroke="hsl(110 100% 54%)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <line x1="48" y1="94" x2="48" y2="98" stroke="hsl(110 100% 54%)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="43" y1="98" x2="53" y2="98" stroke="hsl(110 100% 54%)" strokeWidth="1.5" strokeLinecap="round" />
        {[90, 105, 118, 128, 115, 95, 135, 120, 108, 122, 110, 100].map((h, i) => {
          const x = 98 + i * 14;
          const barH = h - 60;
          return (
            <rect key={i} x={x} y={80 - barH / 2} width="6" height={barH} rx="3"
              fill="hsl(110 100% 54%)" opacity={0.6 + (i % 3) * 0.13} />
          );
        })}
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill="hsl(110 100% 54% / 0.5)" />
          </marker>
        </defs>
        <path d="M272 80 L288 80" stroke="hsl(110 100% 54% / 0.5)" strokeWidth="1.5" markerEnd="url(#arr)" />
        <rect x="294" y="30" width="90" height="55" rx="6" fill="hsl(0 0% 8%)" stroke="hsl(110 100% 54% / 0.3)" strokeWidth="1" />
        <polyline points="300,75 312,65 324,68 336,55 348,50 360,42 372,38" stroke="hsl(110 100% 54%)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="294" y="94" width="90" height="38" rx="6" fill="hsl(0 0% 8%)" stroke="hsl(193 100% 50% / 0.3)" strokeWidth="1" />
        <text x="300" y="108" fill="hsl(193 100% 50%)" fontSize="8" fontFamily="monospace">SOL</text>
        <text x="300" y="122" fill="hsl(0 0% 94%)" fontSize="10" fontFamily="monospace" fontWeight="600">+247%</text>
      </svg>
    </div>
  );
}

function PerformanceChart() {
  return (
    <div className="relative rounded-2xl bg-card border border-border p-4">
      <div className="absolute right-3 top-3 z-10 rounded-full border border-[hsl(var(--red-action)/0.3)] bg-[hsl(var(--red-action)/0.1)] px-2 py-0.5">
        <span className="font-mono-label text-[9px] font-medium text-[hsl(var(--red-action))]">SAMPLE DATA — illustration only</span>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-body text-xs text-muted-foreground">Performance</p>
          <p className="font-display text-lg font-bold text-primary">Your data</p>
          <p className="font-body text-[10px] text-muted-foreground">appears here</p>
        </div>
        <div className="rounded-lg bg-secondary border border-border px-2 py-1">
          <p className="font-body text-[10px] text-muted-foreground">All Time</p>
        </div>
      </div>
      <svg viewBox="0 0 300 100" className="w-full" fill="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(110 100% 54%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(110 100% 54%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 90 C20 88 40 85 60 80 C80 75 90 72 110 65 C130 58 140 55 160 48 C180 40 190 36 210 30 C230 24 250 18 270 12 C285 8 295 5 300 3"
          stroke="hsl(110 100% 54%)" strokeWidth="2" fill="none" strokeLinecap="round"
        />
        <path
          d="M0 90 C20 88 40 85 60 80 C80 75 90 72 110 65 C130 58 140 55 160 48 C180 40 190 36 210 30 C230 24 250 18 270 12 C285 8 295 5 300 3 L300 100 L0 100 Z"
          fill="url(#chartGrad)"
        />
        <circle cx="300" cy="3" r="4" fill="hsl(110 100% 54%)" />
        <circle cx="300" cy="3" r="8" fill="hsl(110 100% 54% / 0.3)" />
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Total Trades", value: "Your trades", sub: "logged here" },
          { label: "Win Rate", value: "Your win rate", sub: "calculated here" },
          { label: "Best Streak", value: "Your streak", sub: "tracked here" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-secondary border border-border p-2">
            <p className="font-body text-[9px] text-muted-foreground">{s.label}</p>
            <p className="font-display text-sm font-bold text-foreground">{s.value}</p>
            <p className="font-body text-[9px] text-primary">{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showBanner, setShowBanner] = useState(true);
  const [referral, setReferralState] = useState<string | null>(null);
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) { setReferral(ref); setReferralState(ref.toLowerCase()); }
    else { setReferralState(getReferral()); }
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {showBanner && (
        <div className="relative flex items-center justify-center gap-4 border-b border-border bg-card px-4 py-2 text-center">
          <p className="font-body text-sm text-muted-foreground">
            🔥 <span className="font-medium text-primary">Founding Price: $99 Lifetime</span> — Raises to $149 after the first 10 customers.
          </p>
          <a href="#pricing" className="hidden whitespace-nowrap text-xs font-medium text-primary hover:underline sm:inline-block">Upgrade Now →</a>
          <button onClick={() => setShowBanner(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Dismiss banner">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="TradePulse" className="h-8 w-8 rounded-xl" />
            <span className="font-display text-base font-bold">
              <span className="text-foreground">Trade</span>
              <span className="text-primary">Pulse</span>
            </span>
          </div>

          {/* Desktop nav (≥1024px) */}
          <nav className="hidden lg:flex items-center gap-5">
            {[
              ["Features", "#features"],
              ["How It Works", "#how-it-works"],
              ["Pricing", "#pricing"],
              ["FAQ", "#faq"],
              ["Giving", "/giving"],
              ["About", "/about"],
            ].map(([label, href]) =>
              href.startsWith("#") ? (
                <a key={href} href={href} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</a>
              ) : (
                <a key={href} href={href} className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</a>
              )
            )}
            <a href="/upgrade" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </a>
            <button
              onClick={() => navigate("/app")}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 font-display text-sm font-bold text-primary-foreground active:scale-[0.97] transition-transform"
            >
              Start Free
            </button>
          </nav>

          {/* Mobile hamburger (<1024px) */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="lg:hidden border-t border-border bg-background px-5 pb-5 pt-4">
            <nav className="mb-4">
              {[
                ["Features", "#features"],
                ["How It Works", "#how-it-works"],
                ["Pricing", "#pricing"],
                ["FAQ", "#faq"],
                ["Giving", "/giving"],
                ["About", "/about"],
                ["Sign In", "/upgrade"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between border-b border-border py-3 font-body text-sm text-foreground hover:text-primary transition-colors"
                >
                  {label}
                </a>
              ))}
            </nav>
            <button
              onClick={() => { setMenuOpen(false); navigate("/app"); }}
              className="h-12 w-full rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground active:scale-[0.97] transition-transform"
            >
              Start Free
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="px-5 pb-16 pt-12">
          <div className="mx-auto max-w-lg">
            {referral && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
                <span className="text-[10px] font-medium text-amber-400">👋 Welcome from {referral.charAt(0).toUpperCase() + referral.slice(1)} community!</span>
              </div>
            )}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--green-primary)/0.3)] bg-[hsl(var(--green-primary)/0.1)] px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-mono-label text-[10px] font-medium uppercase tracking-widest text-primary">
                Now in Open Beta
              </span>
            </div>
            <h1 className="mb-4 font-display text-[2.5rem] font-bold leading-[1.1] text-foreground">
              Never Lose a Trade to{" "}
              <span className="text-primary">Bad Timing</span>
            </h1>
            <p className="mb-8 font-body text-base leading-relaxed text-muted-foreground">
              TradePulse is the voice-powered trade journal built for active crypto traders. Speak
              your trade — token, entry, chain, mood — and it logs instantly. No typing, no
              friction, no missed entries.
            </p>
            <div className="mb-8 flex flex-col gap-3">
              <button
                onClick={() => navigate("/app")}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground shadow-[0_0_24px_hsl(var(--green-primary)/0.35)] active:scale-[0.97] transition-all"
              >
                <Mic className="h-4 w-4" />
                Start Logging Free
              </button>
              <a
                href="#how-it-works"
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-primary font-display text-sm font-bold text-primary hover:bg-[hsl(var(--green-primary)/0.08)] active:scale-[0.97] transition-all"
              >
                See How It Works <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {["20 Free trades", "No CC Required", "Multi-chain Support"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-2 text-center font-body text-xs text-amber-400">⚡ Founding price of $99 ends after 10 customers — 10 spots available</p>
            <p className="mt-4 text-center font-body text-xs text-muted-foreground">
              Want a 30-second demo first?{" "}
              <button onClick={() => setDemoOpen(true)} className="text-primary hover:underline font-body text-xs">Watch →</button>
            </p>
          </div>
        </section>

        {/* Trusted by chains */}
        <section className="border-y border-border px-5 py-6">
          <div className="mx-auto max-w-lg">
            <p className="section-label mb-4 text-center">WORKS ACROSS</p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {["Solana", "Ethereum", "Base", "Arbitrum", "BNB/BSC", "Polygon"].map((c) => (
                <span key={c} className="font-body text-sm font-medium text-muted-foreground">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="section-label mb-3 text-primary">Features</p>
            <h2 className="mb-3 font-display text-2xl font-bold text-foreground">
              Everything a serious trader needs
            </h2>
            <p className="mb-10 font-body text-sm leading-relaxed text-muted-foreground">
              Built from the ground up for active traders who move fast and need their journal to
              keep up.
            </p>
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl bg-card border border-border p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--green-primary)/0.12)]">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1.5 font-display text-base font-bold text-foreground">{title}</h3>
                  <p className="font-body text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="border-t border-border bg-card/40 px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="section-label mb-3">How It Works</p>
            <h2 className="mb-3 font-display text-2xl font-bold text-foreground">
              From trade to journal in{" "}
              <span className="text-primary">5 seconds</span>
            </h2>
            <p className="mb-10 font-body text-sm leading-relaxed text-muted-foreground">
              The fastest way to build a complete trading journal. No excuses, no missed entries.
            </p>
            <div className="mb-10 space-y-6">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--green-primary)/0.2)] bg-[hsl(var(--green-primary)/0.12)]">
                    <span className="font-mono-label text-sm font-medium text-primary">{n}</span>
                  </div>
                  <div>
                    <h3 className="mb-1 font-display text-base font-bold text-foreground">{title}</h3>
                    <p className="font-body text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <WaveformIllustration />
            <div className="mt-12 text-center">
              <h3 className="mb-1 font-display text-base font-bold text-foreground">See it on mobile →</h3>
              <p className="mb-6 font-body text-sm text-muted-foreground">
                TradePulse works natively on your phone — record trades anywhere
              </p>
              <div className="mx-auto" style={{ maxWidth: 320 }}>
                <div style={{ position: "relative", paddingBottom: "177.78%", height: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${DEMO_MOBILE_VIDEO_ID}`}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: 12 }}
                    frameBorder="0"
                    allow="fullscreen"
                    allowFullScreen
                    title="TradePulse Mobile Demo"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-lg">
            <div className="mb-8 grid grid-cols-2 gap-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="rounded-2xl bg-card border border-border p-5">
                  <p className="font-display text-3xl font-bold text-primary">{value}</p>
                  <p className="mt-1 font-body text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
            <PerformanceChart />
          </div>
        </section>

        {/* Analytics */}
        <section className="border-t border-border bg-card/40 px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="section-label mb-3 text-primary">Analytics</p>
            <h2 className="mb-3 font-display text-2xl font-bold text-foreground">
              See exactly where you{" "}
              <span className="text-primary">win and lose</span>
            </h2>
            <p className="mb-8 font-body text-sm leading-relaxed text-muted-foreground">
              TradePulse turns your journal into actionable insights. Track performance by chain,
              token, time of day, and emotional state. Stop guessing — start knowing.
            </p>
            <div className="space-y-3">
              {ANALYTICS_BULLETS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--green-primary)/0.12)]">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-body text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="section-label mb-3 text-center text-primary">Pricing</p>
            <h2 className="mb-2 text-center font-display text-2xl font-bold text-foreground">
              Simple, honest pricing
            </h2>
            <p className="mb-10 text-center font-body text-sm text-muted-foreground">
              Start free. Upgrade when you're ready to go unlimited.
            </p>
            <div className="space-y-4">
              <div className="rounded-2xl bg-card border border-border p-6">
                <h3 className="mb-1 font-display text-lg font-bold text-foreground">Free</h3>
                <p className="mb-4 font-body text-xs text-muted-foreground">
                  Perfect for getting started and testing the waters.
                </p>
                <p className="mb-6 font-display text-3xl font-bold text-foreground">$0</p>
                <ul className="mb-6 space-y-2">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 font-body text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/app")}
                  className="h-11 w-full rounded-xl border border-border font-display text-sm font-bold text-foreground hover:border-primary hover:text-primary transition-colors active:scale-[0.97]"
                >
                  Start Free
                </button>
              </div>

              <div className="rounded-2xl border border-[hsl(var(--green-primary)/0.4)] bg-[hsl(var(--green-primary)/0.06)] p-6">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-foreground">Pro</h3>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 font-mono-label text-[10px] font-medium text-primary-foreground">
                    BEST VALUE
                  </span>
                </div>
                <p className="mb-4 font-body text-xs text-muted-foreground">
                  For serious traders who never want to miss a trade.
                </p>
                <div className="mb-6">
                  <span className="font-display text-3xl font-bold text-foreground">$99</span>
                  <span className="ml-2 font-body text-xs text-muted-foreground">
                    one-time · no subscription
                  </span>
                </div>
                <ul className="mb-6 space-y-2">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 font-body text-sm text-foreground">
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/upgrade")}
                  className="h-11 w-full rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--green-primary)/0.3)] active:scale-[0.97] transition-all"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border bg-card/40 px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="section-label mb-3 text-center">FAQ</p>
            <h2 className="mb-10 text-center font-display text-2xl font-bold text-foreground">
              Common questions
            </h2>
            <div className="space-y-2">
              {FAQS.map(({ q, a }) => (
                <Collapsible key={q}>
                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-xl bg-card border border-border px-4 py-4 text-left transition-colors hover:border-[hsl(var(--border-default))]">
                    <span className="font-body text-sm font-medium text-foreground">{q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="-mt-1 rounded-b-xl border-x border-b border-border bg-card px-4 pb-4 pt-1">
                      <p className="font-body text-sm leading-relaxed text-muted-foreground">{a}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </section>

        {/* Giving Back */}
        <section className="border-t border-border bg-card/40 px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="section-label mb-3 text-center text-primary">Giving Back</p>
            <h2 className="mb-2 text-center font-display text-2xl font-bold text-foreground">
              Built by a small-town trader in Connecticut.
            </h2>
            <p className="mb-8 text-center font-body text-sm text-muted-foreground">
              Funded by traders. For the community that raised him.
            </p>
            <p className="mb-5 font-body text-sm leading-relaxed text-muted-foreground">
              50% of every Pro upgrade is donated to three organizations close to home:
            </p>
            <div className="mb-8 space-y-3">
              {[
                { name: "St. Anthony's Church", loc: "Prospect, CT", note: "Handicapped elevator fund & renovations" },
                { name: "Knights of Columbus Council 13459", loc: "Prospect, CT", note: "" },
                { name: "St. Vincent DePaul Mission Soup Kitchen", loc: "Waterbury, CT", note: "" },
              ].map(({ name, loc, note }) => (
                <div key={name} className="rounded-2xl bg-card border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-display text-sm font-bold text-foreground">{name}</p>
                      <p className="font-mono-label text-[10px] text-primary">{loc}</p>
                      {note && <p className="mt-0.5 font-body text-xs text-muted-foreground">{note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/giving")}
              className="mx-auto flex items-center justify-center gap-2 rounded-xl border border-primary px-6 h-11 font-display text-sm font-bold text-primary hover:bg-[hsl(var(--green-primary)/0.08)] active:scale-[0.97] transition-all"
            >
              See every dollar tracked on our Giving page →
            </button>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-border px-5 py-16">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="mb-3 font-display text-2xl font-bold text-foreground">
              Ready to trade smarter?
            </h2>
            <p className="mb-8 font-body text-sm text-muted-foreground">
              Join traders who never miss an entry. Start free — no credit card needed.
            </p>
            <button
              onClick={() => navigate("/app")}
              className="mx-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-8 h-12 font-display text-sm font-bold text-primary-foreground shadow-[0_0_24px_hsl(var(--green-primary)/0.3)] active:scale-[0.97] transition-all"
            >
              <Mic className="h-4 w-4" />
              Start Logging Free
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border px-5 py-10 pb-safe-bottom">
          <div className="mx-auto max-w-lg">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mb-8">
              {/* Col 1 — Brand */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <img src={logo} alt="TradePulse" className="h-6 w-6 rounded-lg" />
                  <span className="font-display text-sm font-bold">
                    <span className="text-foreground">Trade</span>
                    <span className="text-primary">Pulse</span>
                  </span>
                </div>
                <p className="font-body text-xs text-muted-foreground">Voice-powered trade journal.</p>
                <p className="font-body text-xs text-muted-foreground">© 2025–2026 TradePulse</p>
              </div>

              {/* Col 2 — Product */}
              <div>
                <p className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">Product</p>
                <nav className="space-y-2">
                  {[
                    ["Features", "#features"],
                    ["How It Works", "#how-it-works"],
                    ["Pricing", "#pricing"],
                    ["FAQ", "#faq"],
                  ].map(([label, href]) => (
                    <a key={href} href={href} className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors">{label}</a>
                  ))}
                </nav>
              </div>

              {/* Col 3 — Company */}
              <div>
                <p className="mb-3 font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">Company</p>
                <nav className="space-y-2">
                  <a href="/about" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
                  <a href="/giving" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Giving</a>
                  <a href="/privacy" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
                  <a href="/terms" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Terms</a>
                  <a href="mailto:support@tradepulseapp.io" className="block font-body text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
                </nav>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="border-t border-border pt-6">
              <p className="font-body text-[11px] leading-relaxed text-muted-foreground">
                TradePulse is a journaling tool, not financial advice. Stats shown are illustrative. Trading crypto carries substantial risk of loss. Do your own research.
              </p>
            </div>
          </div>
        </footer>
      </main>

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-w-[840px] w-full p-0 bg-black border-border">
          <DialogTitle className="sr-only">Desktop Demo Video</DialogTitle>
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${DEMO_DESKTOP_VIDEO_ID}?autoplay=1`}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              title="TradePulse Desktop Demo"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
