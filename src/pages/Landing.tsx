import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getReferral, setReferral } from "@/lib/referral-utils";
import {
  Mic, BookOpen, TrendingUp, Zap, Shield, BarChart2,
  X, Check, ArrowRight, Clock, Smartphone, ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { C, ctaBtn, outlineBtn } from "@/components/marketing/theme";
import { setPageMeta } from "@/lib/page-meta";
import { ROUTE_META } from "@/prerender/route-meta";

// ── Constants ────────────────────────────────────────────────────────
const DEMO_DESKTOP_VIDEO_ID = "AsiAb6l3ZTw";
const DEMO_MOBILE_VIDEO_ID  = "1gLe1stVITA";

const FEATURES = [
  { icon: Mic,        title: "Voice-First Logging",      desc: "Speak your trade naturally — 'Long ETH at 3200, Ethereum chain, feeling confident' — and TradePulse fills in every field automatically." },
  { icon: BookOpen,   title: "Smart Trade Journal",       desc: "Every trade is automatically organized with token, entry price, chain, mood, and timestamp. Your journal writes itself." },
  { icon: TrendingUp, title: "Performance Analytics",     desc: "Track your win rate, P&L, and trading patterns over time. Identify what's working and what's costing you money." },
  { icon: Zap,        title: "Zero Friction",             desc: "Log a trade in under 5 seconds. No forms, no dropdowns, no typing. Built for the heat of the moment." },
  { icon: Shield,     title: "Multi-Chain Support",       desc: "Works across Ethereum, Solana, Base, Arbitrum, Polygon, and more. One journal for all your chains." },
  { icon: BarChart2,  title: "Mood Tracking",             desc: "Log your emotional state with each trade and discover how your psychology affects your performance." },
];

const STEPS = [
  { n: "01", title: "Open TradePulse",   desc: "Launch the app on any device — mobile or desktop. No account setup required to start your first 20 free trades." },
  { n: "02", title: "Tap & Speak",       desc: "Hit the microphone button and speak your trade naturally. Say the token, entry price, chain, and your mood." },
  { n: "03", title: "AI Fills It In",    desc: "TradePulse's AI parses your voice input and automatically populates every field in your trade log. Review and confirm." },
  { n: "04", title: "Track & Improve",   desc: "Your journal builds patterns, tracks win rates, and helps you understand your trading psychology." },
];

const STATS = [
  { value: "12,400+", label: "Trades Logged" },
  { value: "100%",    label: "Your Data, Your Device" },
  { value: "< 5s",    label: "To Log a Trade" },
  { value: "6",       label: "Chains Supported" },
];

const ANALYTICS_BULLETS = [
  { icon: TrendingUp, text: "Win rate tracking by token and chain" },
  { icon: Clock,      text: "Best and worst trading hours analysis" },
  { icon: BarChart2,  text: "P&L breakdown with mood correlation" },
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
  { q: "Is TradePulse free to use?",       a: "Yes. You get 20 free trades with no credit card required. Upgrade to Pro for unlimited trades with a one-time payment." },
  { q: "How does voice logging work?",      a: "Tap the microphone, speak your trade naturally (token, entry, chain, mood), then stop. Our AI parses your speech and fills every form field automatically in seconds." },
  { q: "What chains are supported?",        a: "TradePulse supports Solana, Ethereum, Base, Arbitrum, BNB/BSC, and Polygon — with more coming soon." },
  { q: "Is my trade data stored securely?", a: "Your trades are stored locally on your device. We use Supabase for Pro account management with industry-standard encryption." },
  { q: "What's included in the Pro plan?",  a: "Pro gives you unlimited trades, full analytics, priority AI voice parsing, and access to all future features — for a one-time $99 payment. No subscription, ever." },
];

// ── Inline SVG illustrations (Mist-themed) ──────────────────────────
function WaveformIllustration() {
  return (
    <div className="w-full overflow-hidden rounded-[8px] border p-6" style={{ background: C.bgRaised, borderColor: C.border }}>
      <svg viewBox="0 0 400 160" className="w-full" fill="none">
        {/* Mic circle */}
        <circle cx="48" cy="80" r="32" fill={C.primary} opacity="0.10" stroke={C.primary} strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx="48" cy="80" r="18" fill={C.primary} opacity="0.15" />
        <rect x="42" y="68" width="12" height="18" rx="6" fill={C.primary} />
        <path d="M39 86 Q48 94 57 86" stroke={C.primary} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <line x1="48" y1="94" x2="48" y2="98" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="43" y1="98" x2="53" y2="98" stroke={C.primary} strokeWidth="1.5" strokeLinecap="round" />
        {/* Waveform bars */}
        {[90, 105, 118, 128, 115, 95, 135, 120, 108, 122, 110, 100].map((h, i) => {
          const x = 98 + i * 14;
          const barH = h - 60;
          return (
            <rect key={i} x={x} y={80 - barH / 2} width="6" height={barH} rx="3"
              fill={C.primary} opacity={0.5 + (i % 3) * 0.15} />
          );
        })}
        {/* Arrow */}
        <defs>
          <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0 0 L6 3 L0 6 Z" fill={C.primaryDim} />
          </marker>
        </defs>
        <path d="M272 80 L288 80" stroke={C.primaryDim} strokeWidth="1.5" markerEnd="url(#arr)" />
        {/* Chart card */}
        <rect x="294" y="30" width="90" height="55" rx="4" fill={C.bgSunk} stroke={C.border} strokeWidth="1" />
        <polyline points="300,75 312,65 324,68 336,55 348,50 360,42 372,38" stroke={C.primary} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Stats card */}
        <rect x="294" y="94" width="90" height="38" rx="4" fill={C.bgSunk} stroke={C.border} strokeWidth="1" />
        <text x="300" y="108" fill={C.primary} fontSize="8" fontFamily="monospace">SOL</text>
        <text x="300" y="122" fill={C.win} fontSize="10" fontFamily="monospace" fontWeight="600">+247%</text>
      </svg>
    </div>
  );
}

function PerformanceChart() {
  return (
    <div className="relative rounded-[8px] border p-4" style={{ background: C.bgRaised, borderColor: C.border }}>
      <div className="absolute right-3 top-3 z-10 rounded-[3px] px-2 py-0.5 border" style={{ background: `rgba(232,154,138,0.08)`, borderColor: `rgba(232,154,138,0.3)` }}>
        <span className="font-mono text-[9px] font-medium" style={{ color: C.loss }}>SAMPLE DATA — illustration only</span>
      </div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px]" style={{ color: C.textDim }}>Performance</p>
          <p className="font-sans text-lg font-medium" style={{ color: C.primary }}>Your data</p>
          <p className="font-mono text-[10px]" style={{ color: C.textDim }}>appears here</p>
        </div>
        <div className="rounded-[4px] px-2 py-1 border" style={{ background: C.bgSunk, borderColor: C.border }}>
          <p className="font-mono text-[10px]" style={{ color: C.textDim }}>All Time</p>
        </div>
      </div>
      <svg viewBox="0 0 300 100" className="w-full" fill="none">
        <defs>
          <linearGradient id="chartGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.25" />
            <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 90 C20 88 40 85 60 80 C80 75 90 72 110 65 C130 58 140 55 160 48 C180 40 190 36 210 30 C230 24 250 18 270 12 C285 8 295 5 300 3"
          stroke={C.primary} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M0 90 C20 88 40 85 60 80 C80 75 90 72 110 65 C130 58 140 55 160 48 C180 40 190 36 210 30 C230 24 250 18 270 12 C285 8 295 5 300 3 L300 100 L0 100 Z"
          fill="url(#chartGrad2)" />
        <circle cx="300" cy="3" r="4" fill={C.primary} />
        <circle cx="300" cy="3" r="8" fill={C.primary} opacity="0.25" />
      </svg>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Total Trades", value: "Your trades",   sub: "logged here" },
          { label: "Win Rate",     value: "Your win rate", sub: "calculated here" },
          { label: "Best Streak",  value: "Your streak",   sub: "tracked here" },
        ].map((s) => (
          <div key={s.label} className="rounded-[4px] border p-2" style={{ background: C.bgSunk, borderColor: C.border }}>
            <p className="font-mono text-[9px]" style={{ color: C.textDim }}>{s.label}</p>
            <p className="font-sans text-sm font-medium" style={{ color: C.text }}>{s.value}</p>
            <p className="font-mono text-[9px]" style={{ color: C.primary }}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [referral, setReferralState] = useState<string | null>(null);

  useEffect(() => {
    setPageMeta({ ...ROUTE_META["/"], path: "/" });
  }, []);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferral(ref);
      setReferralState(ref.toLowerCase());
    } else {
      setReferralState(getReferral());
    }
  }, []);

  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[6px] focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-medium focus:text-[#0e1311]"
        style={{ background: C.primary }}
      >
        Skip to main content
      </a>

      {/* ── Founding banner ─────────────────────────────── */}
      {showBanner && (
        <div className="relative flex items-center justify-center gap-4 border-b px-4 py-2 text-center" style={{ background: C.bgRaised, borderColor: C.border }}>
          <p className="font-sans text-sm" style={{ color: C.textDim }}>
            <span className="font-medium" style={{ color: C.primary }}>Founding Price: $99 Lifetime</span>
            {" "}— Raises to $149 after the first 10 customers. Secure your spot.
          </p>
          <a href="#pricing" className="hidden whitespace-nowrap font-mono text-[11px] font-medium sm:inline-block" style={{ color: C.primary }}>
            Upgrade Now →
          </a>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: C.textDim }}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Navbar ──────────────────────────────────────── */}
      <MarketingHeader />

      <main id="main" tabIndex={-1}>
        {/* ── Hero ────────────────────────────────────── */}
        <section className="px-5 pb-16 pt-12">
          <div className="mx-auto max-w-lg">
            {referral && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-[4px] border px-3 py-1" style={{ borderColor: "rgba(168,212,173,0.3)", background: "rgba(168,212,173,0.08)" }}>
                <span className="font-mono text-[10px] font-medium" style={{ color: C.win }}>
                  👋 Welcome from {referral.charAt(0).toUpperCase() + referral.slice(1)} community!
                </span>
              </div>
            )}

            <div className="mb-6 inline-flex items-center gap-2 rounded-[4px] border px-3 py-1" style={{ borderColor: "rgba(142,194,221,0.3)", background: "rgba(142,194,221,0.08)" }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: C.primary, animation: "termpulse 2s ease-in-out infinite" }} />
              <span className="font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.primary }}>
                Now in Open Beta
              </span>
            </div>

            <h1 className="mb-4 font-sans text-[2.5rem] font-bold leading-[1.1]" style={{ color: C.text, letterSpacing: "-0.03em" }}>
              Never Lose a Trade to{" "}
              <span style={{ color: C.primary }}>Bad Timing</span>
            </h1>

            <p className="mb-8 font-sans text-base leading-relaxed" style={{ color: C.textDim }}>
              TradePulse is the voice-powered trade journal built for active crypto traders. Speak
              your trade — token, entry, chain, mood — and it logs instantly. No typing, no
              friction, no missed entries.
            </p>

            <div className="mb-8 flex flex-col gap-3">
              <button
                onClick={() => navigate("/app")}
                className={`${ctaBtn} h-12 text-sm`}
                style={{ boxShadow: "0 8px 32px -8px rgba(142,194,221,0.33)" }}
              >
                <Mic className="h-4 w-4" />
                Start Logging Free
              </button>
              <a
                href="#how-it-works"
                className={`${outlineBtn} h-12 text-sm`}
              >
                See How It Works <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {["20 Free trades", "No CC Required", "Multi-chain Support"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: C.textDim }}>
                  <Check className="h-3.5 w-3.5" style={{ color: C.primary }} strokeWidth={2.5} />
                  {t}
                </span>
              ))}
            </div>

            <p className="mt-2 text-center font-mono text-[11px]" style={{ color: C.win }}>
              ⚡ Founding price of $99 ends after 10 customers — 10 spots available
            </p>

            <p className="mt-4 text-center font-mono text-[11px]" style={{ color: C.textDim }}>
              Want a 30-second demo first?{" "}
              <button onClick={() => setDemoOpen(true)} className="underline transition-colors" style={{ color: C.primary }}>
                Watch →
              </button>
            </p>
          </div>
        </section>

        {/* ── Chains bar ─────────────────────────────── */}
        <section className="border-y px-5 py-6" style={{ borderColor: C.border }}>
          <div className="mx-auto max-w-lg">
            <p className="mb-4 text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.textDim }}>
              Works Across
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {["Solana", "Ethereum", "Base", "Arbitrum", "BNB/BSC", "Polygon"].map((c) => (
                <span key={c} className="font-mono text-[12px] font-medium" style={{ color: C.textDim }}>{c}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────── */}
        <section id="features" className="px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.primary }}>Features</p>
            <h2 className="mb-3 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              Everything a serious trader needs
            </h2>
            <p className="mb-10 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
              Built from the ground up for active traders who move fast and need their journal to keep up.
            </p>
            <div className="space-y-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-[6px] border p-5" style={{ background: C.bgRaised, borderColor: C.border }}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[4px]" style={{ background: "rgba(142,194,221,0.10)" }}>
                    <Icon className="h-5 w-5" style={{ color: C.primary }} />
                  </div>
                  <h3 className="mb-1.5 font-sans text-base font-medium" style={{ color: C.text }}>{title}</h3>
                  <p className="font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ───────────────────────────── */}
        <section id="how-it-works" className="border-t px-5 py-16" style={{ borderColor: C.border, background: `${C.bgRaised}66` }}>
          <div className="mx-auto max-w-lg">
            <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.textDim }}>How It Works</p>
            <h2 className="mb-3 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              From trade to journal in{" "}
              <span style={{ color: C.primary }}>5 seconds</span>
            </h2>
            <p className="mb-10 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
              The fastest way to build a complete trading journal. No excuses, no missed entries.
            </p>
            <div className="mb-10 space-y-6">
              {STEPS.map(({ n, title, desc }) => (
                <div key={n} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] border" style={{ background: "rgba(142,194,221,0.08)", borderColor: "rgba(142,194,221,0.2)" }}>
                    <span className="font-mono text-sm font-medium" style={{ color: C.primary }}>{n}</span>
                  </div>
                  <div>
                    <h3 className="mb-1 font-sans text-base font-medium" style={{ color: C.text }}>{title}</h3>
                    <p className="font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <WaveformIllustration />

            <div className="mt-12 text-center">
              <h3 className="mb-1 font-sans text-base font-medium" style={{ color: C.text }}>See it on mobile →</h3>
              <p className="mb-6 font-sans text-sm" style={{ color: C.textDim }}>
                TradePulse works natively on your phone — record trades anywhere
              </p>
              <div className="mx-auto" style={{ maxWidth: 320 }}>
                <div style={{ position: "relative", paddingBottom: "177.78%", height: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${DEMO_MOBILE_VIDEO_ID}`}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", borderRadius: 8 }}
                    frameBorder="0"
                    loading="lazy"
                    allow="fullscreen"
                    allowFullScreen
                    title="TradePulse Mobile Demo"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────── */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-lg">
            <div className="mb-8 grid grid-cols-2 gap-4">
              {STATS.map(({ value, label }) => (
                <div key={label} className="rounded-[6px] border p-5" style={{ background: C.bgRaised, borderColor: C.border }}>
                  <p className="font-sans text-3xl font-bold" style={{ color: C.primary, letterSpacing: "-0.03em" }}>{value}</p>
                  <p className="mt-1 font-mono text-[11px]" style={{ color: C.textDim }}>{label}</p>
                </div>
              ))}
            </div>
            <PerformanceChart />
          </div>
        </section>

        {/* ── Analytics ──────────────────────────────── */}
        <section className="border-t px-5 py-16" style={{ borderColor: C.border, background: `${C.bgRaised}66` }}>
          <div className="mx-auto max-w-lg">
            <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.primary }}>Analytics</p>
            <h2 className="mb-3 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              See exactly where you{" "}
              <span style={{ color: C.primary }}>win and lose</span>
            </h2>
            <p className="mb-8 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
              TradePulse turns your journal into actionable insights. Track performance by chain,
              token, time of day, and emotional state. Stop guessing — start knowing.
            </p>
            <div className="space-y-3">
              {ANALYTICS_BULLETS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px]" style={{ background: "rgba(142,194,221,0.10)" }}>
                    <Icon className="h-4 w-4" style={{ color: C.primary }} />
                  </div>
                  <span className="font-sans text-sm" style={{ color: C.text }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────── */}
        <section id="pricing" className="px-5 py-16">
          <div className="mx-auto max-w-lg">
            <p className="mb-3 text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.primary }}>Pricing</p>
            <h2 className="mb-2 text-center font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              Simple, honest pricing
            </h2>
            <p className="mb-10 text-center font-sans text-sm" style={{ color: C.textDim }}>
              Start free. Upgrade when you're ready to go unlimited.
            </p>
            <div className="space-y-4">
              {/* Free tier */}
              <div className="rounded-[6px] border p-6" style={{ background: C.bgRaised, borderColor: C.border }}>
                <h3 className="mb-1 font-sans text-lg font-medium" style={{ color: C.text }}>Free</h3>
                <p className="mb-4 font-sans text-xs" style={{ color: C.textDim }}>
                  Perfect for getting started and testing the waters.
                </p>
                <p className="mb-6 font-sans text-3xl font-bold" style={{ color: C.text }}>$0</p>
                <ul className="mb-6 space-y-2">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 font-sans text-sm" style={{ color: C.textDim }}>
                      <Check className="h-3.5 w-3.5 shrink-0" style={{ color: C.primary }} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/app")}
                  className={`${outlineBtn} h-11 w-full text-sm`}
                >
                  Start Free
                </button>
              </div>

              {/* Pro tier */}
              <div className="rounded-[6px] border p-6" style={{ background: "rgba(142,194,221,0.04)", borderColor: "rgba(142,194,221,0.35)" }}>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-sans text-lg font-medium" style={{ color: C.text }}>Pro</h3>
                  <span className="rounded-[3px] px-2.5 py-0.5 font-mono text-[10px] font-medium" style={{ background: C.primary, color: C.bg }}>
                    BEST VALUE
                  </span>
                </div>
                <p className="mb-4 font-sans text-xs" style={{ color: C.textDim }}>
                  For serious traders who never want to miss a trade.
                </p>
                <div className="mb-6">
                  <span className="font-sans text-3xl font-bold" style={{ color: C.text }}>$99</span>
                  <span className="ml-2 font-mono text-[11px]" style={{ color: C.textDim }}>
                    one-time · no subscription
                  </span>
                </div>
                <ul className="mb-6 space-y-2">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-center gap-2 font-sans text-sm" style={{ color: C.text }}>
                      <Check className="h-3.5 w-3.5 shrink-0" style={{ color: C.primary }} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/upgrade")}
                  className={`${ctaBtn} h-11 w-full text-sm`}
                  style={{ boxShadow: "0 8px 24px -8px rgba(142,194,221,0.3)" }}
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────── */}
        <section id="faq" className="border-t px-5 py-16" style={{ borderColor: C.border, background: `${C.bgRaised}66` }}>
          <div className="mx-auto max-w-lg">
            <p className="mb-3 text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.textDim }}>FAQ</p>
            <h2 className="mb-10 text-center font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              Common questions
            </h2>
            <div className="space-y-2">
              {FAQS.map(({ q, a }) => (
                <Collapsible key={q}>
                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-[6px] border px-4 py-4 text-left transition-colors" style={{ background: C.bgRaised, borderColor: C.border }}>
                    <span className="font-sans text-sm font-medium" style={{ color: C.text }}>{q}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" style={{ color: C.textDim }} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="-mt-1 rounded-b-[6px] border-x border-b px-4 pb-4 pt-1" style={{ background: C.bgRaised, borderColor: C.border }}>
                      <p className="font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>{a}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </section>

        {/* ── Giving Back ────────────────────────────── */}
        <section className="border-t px-5 py-16" style={{ borderColor: C.border, background: `${C.bgRaised}66` }}>
          <div className="mx-auto max-w-lg">
            <p className="mb-3 text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: C.primary }}>Giving Back</p>
            <h2 className="mb-2 text-center font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              Built by a small-town trader in Connecticut.
            </h2>
            <p className="mb-8 text-center font-sans text-sm" style={{ color: C.textDim }}>
              Funded by traders. For the community that raised him.
            </p>
            <p className="mb-5 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
              50% of every Pro upgrade is donated to three organizations close to home:
            </p>
            <div className="mb-8 space-y-3">
              {[
                { name: "St. Anthony's Church",                  loc: "Prospect, CT",  note: "Handicapped elevator fund & renovations" },
                { name: "Knights of Columbus Council 13459",     loc: "Prospect, CT",  note: "" },
                { name: "St. Vincent DePaul Mission Soup Kitchen", loc: "Waterbury, CT", note: "" },
              ].map(({ name, loc, note }) => (
                <div key={name} className="rounded-[6px] border p-4" style={{ background: C.bgRaised, borderColor: C.border }}>
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 inline-block w-1.5 h-1.5 shrink-0 rounded-full" style={{ background: C.primary }} />
                    <div>
                      <p className="font-sans text-sm font-medium" style={{ color: C.text }}>{name}</p>
                      <p className="font-mono text-[10px]" style={{ color: C.primary }}>{loc}</p>
                      {note && <p className="mt-0.5 font-sans text-xs" style={{ color: C.textDim }}>{note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/giving")}
              className={`${outlineBtn} mx-auto px-6 h-11 text-sm`}
            >
              See every dollar tracked on our Giving page →
            </button>
          </div>
        </section>

        {/* ── Footer CTA ─────────────────────────────── */}
        <section className="border-t px-5 py-16" style={{ borderColor: C.border }}>
          <div className="mx-auto max-w-lg text-center">
            <h2 className="mb-3 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              Ready to trade smarter?
            </h2>
            <p className="mb-8 font-sans text-sm" style={{ color: C.textDim }}>
              Join traders who never miss an entry. Start free — no credit card needed.
            </p>
            <button
              onClick={() => navigate("/app")}
              className={`${ctaBtn} mx-auto px-8 h-12 text-sm`}
              style={{ boxShadow: "0 8px 32px -8px rgba(142,194,221,0.33)" }}
            >
              <Mic className="h-4 w-4" />
              Start Logging Free
            </button>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────── */}
        <MarketingFooter />
      </main>

      {/* ── Demo modal ───────────────────────────────── */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-w-[840px] w-full p-0" style={{ background: C.bgSunk, border: `1px solid ${C.border}` }}>
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
