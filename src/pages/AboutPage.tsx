import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MarketingLayout from "@/components/MarketingLayout";
import { setPageMeta } from "@/lib/page-meta";
import { C } from "@/components/marketing/theme";

export default function AboutPage() {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setPageMeta({
      title: "About — TradePulse",
      description: "TradePulse is built and run independently by TheVeinGhost — an active crypto trader from small-town Connecticut. Built by a trader, for traders.",
      path: "/about",
    });
  }, []);

  const label = "mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em]";
  const body = "font-sans text-sm leading-relaxed mb-4";

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-lg px-5 py-12">
        <p className={label} style={{ color: C.primary }}>About</p>
        <h1 className="mb-3 font-sans text-[2.5rem] font-bold leading-[1.1]" style={{ color: C.text, letterSpacing: "-0.03em" }}>
          About TradePulse
        </h1>
        <p className="mb-8 font-sans text-lg font-medium" style={{ color: C.primary }}>Built by a trader. For traders.</p>

        <p className={body} style={{ color: C.textDim }}>
          TradePulse is built and run independently by <strong style={{ color: C.text }}>TheVeinGhost</strong> — an active crypto trader from small-town Connecticut.
        </p>

        {/* Founder card */}
        <div className="mb-8 flex items-center gap-4 rounded-[6px] border p-5" style={{ background: C.bgRaised, borderColor: C.border }}>
          {imgError ? (
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(142,194,221,0.10)", border: `1px solid ${C.border}` }}
            >
              <span className="font-mono text-sm font-medium" style={{ color: C.primary }}>TVG</span>
            </div>
          ) : (
            <img
              src="/founder.jpg"
              alt="TheVeinGhost"
              loading="lazy"
              onError={() => setImgError(true)}
              className="h-16 w-16 shrink-0 rounded-full object-cover"
              style={{ border: `1px solid ${C.border}` }}
            />
          )}
          <div>
            <p className="font-sans text-base font-medium" style={{ color: C.text }}>TheVeinGhost</p>
            <p className="font-mono text-[11px]" style={{ color: C.textDim }}>Founder — Prospect, CT</p>
          </div>
        </div>

        <p className={body} style={{ color: C.textDim }}>
          I built TradePulse because every trade journal I tried made me think more than I wanted to. Forms. Dropdowns. Twelve fields per trade. By the time I had everything entered, the next setup was already gone.
        </p>
        <p className={body} style={{ color: C.textDim }}>
          I wanted something where I could just <em>talk</em> into my phone — <em>"Long ETH at 3200, Ethereum, feeling confident"</em> — and have a real journal write itself.
        </p>
        <p className={body} style={{ color: C.textDim }}>
          So I built it.
        </p>
        <p className={body} style={{ color: C.textDim }}>
          There's no team. There's no VC. There's no marketing budget. It's a one-person indie project funded entirely by the Pro tier — and half of every dollar goes back to my church and community in Connecticut.{" "}
          <button onClick={() => navigate("/giving")} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm underline" style={{ color: C.primary }}>
            See Giving →
          </button>
        </p>
        <p className="mb-8 font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
          If you're using TradePulse and have feedback, ideas, or just want to yell at me about a bug:{" "}
          <a href="mailto:support@tradepulseapp.io" className="underline" style={{ color: C.primary }}>support@tradepulseapp.io</a>
        </p>

        <p className="mb-8 font-sans text-sm font-medium" style={{ color: C.text }}>— TheVeinGhost</p>

        <hr className="my-8" style={{ borderColor: C.border }} />

        <p className={label} style={{ color: C.textDim }}>Principles</p>
        <h2 className="mb-4 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>What we won't do</h2>
        <div className="mb-8 space-y-3">
          {[
            ["We won't sell your data.", "Ever."],
            ["We won't lock you in.", "Export to CSV or JSON anytime from Settings."],
            ["We won't become a subscription.", "Pro is one-time, lifetime."],
            ["We won't pretend to be financial advisors.", "We make a journal. You make the trades."],
          ].map(([bold, rest]) => (
            <div key={bold} className="flex items-start gap-3 rounded-[6px] border p-4" style={{ background: C.bgRaised, borderColor: C.border }}>
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: C.primary }} />
              <p className="font-sans text-sm" style={{ color: C.textDim }}>
                <strong style={{ color: C.text }}>{bold}</strong> {rest}
              </p>
            </div>
          ))}
        </div>

        <hr className="my-8" style={{ borderColor: C.border }} />

        <p className={label} style={{ color: C.textDim }}>The Handle</p>
        <h2 className="mb-3 font-sans text-2xl font-bold" style={{ color: C.text, letterSpacing: "-0.02em" }}>Why "TheVeinGhost"?</h2>
        <p className={body} style={{ color: C.textDim }}>
          It's the handle I trade under. Crypto runs on pseudonyms, and I like that part of the culture — your reputation is what you build, not what you're called. But this project isn't a black box. It's a small-town guy trying to make a tool that doesn't suck, and using it to fund things that matter at home.
        </p>
        <p className="font-sans text-sm leading-relaxed" style={{ color: C.textDim }}>
          If you want to know more about who's behind this, the{" "}
          <button onClick={() => navigate("/giving")} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-sm underline" style={{ color: C.primary }}>
            Giving page
          </button>{" "}
          tells you everything that matters.
        </p>
      </div>
    </MarketingLayout>
  );
}
