import { Logo } from "@/components/design/Logo";
import { C } from "./theme";

export default function MarketingFooter() {
  return (
    <footer className="border-t px-5 py-10" style={{ borderColor: C.border }}>
      <div className="mx-auto max-w-lg">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 mb-8">
          {/* Brand column */}
          <div>
            <div className="mb-3">
              <Logo size={15} />
            </div>
            <p className="font-mono text-[11px]" style={{ color: C.textDim }}>Voice-powered trade journal.</p>
            <p className="font-mono text-[11px]" style={{ color: C.textDim }}>© 2025–2026 TradePulse</p>
          </div>

          {/* Product column */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Product</p>
            <nav className="space-y-2">
              {[["Features", "/#features"], ["How It Works", "/#how-it-works"], ["Pricing", "/#pricing"], ["FAQ", "/#faq"]].map(([l, h]) => (
                <a key={h} href={h} className="block font-sans text-sm transition-colors" style={{ color: C.textDim }}>{l}</a>
              ))}
            </nav>
          </div>

          {/* Company column */}
          <div>
            <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-widest" style={{ color: C.textDim }}>Company</p>
            <nav className="space-y-2">
              {[["About", "/about"], ["Giving", "/giving"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Support", "mailto:support@tradepulseapp.io"]].map(([l, h]) => (
                <a key={h} href={h} className="block font-sans text-sm transition-colors" style={{ color: C.textDim }}>{l}</a>
              ))}
            </nav>
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: C.border }}>
          <p className="font-mono text-[11px] leading-relaxed" style={{ color: C.textDim }}>
            TradePulse is a journaling tool, not financial advice. Stats shown are illustrative. Trading crypto carries substantial risk of loss. Do your own research.
          </p>
        </div>
      </div>
    </footer>
  );
}
