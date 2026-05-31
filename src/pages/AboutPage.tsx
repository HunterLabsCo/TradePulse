import { useNavigate } from "react-router-dom";
import MarketingLayout from "@/components/MarketingLayout";
import { Seo } from "@/components/Seo";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <MarketingLayout>
      <Seo
        path="/about"
        title="About — TradePulse"
        description="TradePulse is built and run independently by TheVeinGhost — an active crypto trader from small-town Connecticut. Built by a trader, for traders."
      />
      <div className="mx-auto max-w-lg px-5 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">About TradePulse</h1>
        <p className="font-display text-lg text-primary mb-8">Built by a trader. For traders.</p>

        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          TradePulse is built and run independently by <strong className="text-foreground">TheVeinGhost</strong> — an active crypto trader from small-town Connecticut.
        </p>

        {/* Headshot placeholder */}
        <div className="rounded-2xl bg-card border border-border p-6 mb-8 flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-[hsl(var(--green-primary)/0.12)] border border-[hsl(var(--green-primary)/0.2)] flex items-center justify-center">
            <span className="font-mono-label text-[10px] text-primary text-center leading-tight">PHOTO<br/>SOON</span>
          </div>
          <div>
            <p className="font-display text-base font-bold text-foreground">TheVeinGhost</p>
            <p className="font-body text-xs text-muted-foreground">Founder — Prospect, CT</p>
          </div>
        </div>

        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          I built TradePulse because every trade journal I tried made me think more than I wanted to. Forms. Dropdowns. Twelve fields per trade. By the time I had everything entered, the next setup was already gone.
        </p>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          I wanted something where I could just <em>talk</em> into my phone — <em>"Long ETH at 3200, Ethereum, feeling confident"</em> — and have a real journal write itself.
        </p>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          So I built it.
        </p>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          There's no team. There's no VC. There's no marketing budget. It's a one-person indie project funded entirely by the Pro tier — and half of every dollar goes back to my church and community in Connecticut.{" "}
          <button onClick={() => navigate("/giving")} className="text-primary underline bg-transparent border-0 p-0 cursor-pointer font-body text-sm">
            See Giving →
          </button>
        </p>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-8">
          If you're using TradePulse and have feedback, ideas, or just want to yell at me about a bug:{" "}
          <a href="mailto:support@tradepulseapp.io" className="text-primary underline">support@tradepulseapp.io</a>
        </p>

        <p className="font-body text-sm font-medium text-foreground mb-8">— TheVeinGhost</p>

        <hr className="border-border my-8" />

        <h2 className="font-display text-xl font-bold text-foreground mb-4">What we won't do</h2>
        <div className="space-y-3 mb-8">
          {[
            ["We won't sell your data.", "Ever."],
            ["We won't lock you in.", "Export to CSV or JSON anytime from Settings."],
            ["We won't become a subscription.", "Pro is one-time, lifetime."],
            ["We won't pretend to be financial advisors.", "We make a journal. You make the trades."],
          ].map(([bold, rest]) => (
            <div key={bold} className="flex items-start gap-3 rounded-xl bg-card border border-border p-4">
              <div className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-[hsl(var(--green-primary)/0.2)] flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <p className="font-body text-sm text-muted-foreground">
                <strong className="text-foreground">{bold}</strong> {rest}
              </p>
            </div>
          ))}
        </div>

        <hr className="border-border my-8" />

        <h2 className="font-display text-xl font-bold text-foreground mb-3">Why "TheVeinGhost"?</h2>
        <p className="font-body text-sm leading-relaxed text-muted-foreground mb-4">
          It's the handle I trade under. Crypto runs on pseudonyms, and I like that part of the culture — your reputation is what you build, not what you're called. But this project isn't a black box. It's a small-town guy trying to make a tool that doesn't suck, and using it to fund things that matter at home.
        </p>
        <p className="font-body text-sm leading-relaxed text-muted-foreground">
          If you want to know more about who's behind this, the{" "}
          <button onClick={() => navigate("/giving")} className="text-primary underline bg-transparent border-0 p-0 cursor-pointer font-body text-sm">
            Giving page
          </button>{" "}
          tells you everything that matters.
        </p>
      </div>
    </MarketingLayout>
  );
}
