import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  ["Features", "/#features"],
  ["How It Works", "/#how-it-works"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"],
  ["Giving", "/giving"],
  ["About", "/about"],
] as const;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:font-bold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
            aria-label="Go to homepage"
          >
            <img src={logo} alt="TradePulse" className="h-8 w-8 rounded-xl" />
            <span className="font-display text-base font-bold">
              <span className="text-foreground">Trade</span>
              <span className="text-primary">Pulse</span>
            </span>
          </button>

          {/* Nav links — drawer only, never a horizontal bar */}
          <nav className="hidden" aria-hidden="true" />

          {/* Right-side controls: always visible at all screen sizes */}
          <div className="flex items-center gap-2">
            <a href="/upgrade" className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors px-1">
              Sign In
            </a>
            <button
              onClick={() => navigate("/app")}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-primary px-4 font-display text-sm font-bold text-primary-foreground active:scale-[0.97] transition-transform"
            >
              Start Free
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Drawer menu — visible at all screen sizes when open */}
        {menuOpen && (
          <div className="border-t border-border bg-background px-5 pb-5 pt-4">
            <nav className="mb-4">
              {NAV_LINKS.map(([label, href]) => (
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

      <main id="main" tabIndex={-1}>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border px-5 py-8 pb-safe-bottom">
        <div className="mx-auto max-w-lg">
          {/* Brand + links row */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="TradePulse" className="h-6 w-6 rounded-lg" />
              <span className="font-display text-sm font-bold">
                <span className="text-foreground">Trade</span>
                <span className="text-primary">Pulse</span>
              </span>
              <span className="font-body text-xs text-muted-foreground">© 2025–2026 TradePulse</span>
            </div>
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {([
                ["About", "/about"],
                ["Giving", "/giving"],
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
                ["Support", "mailto:support@tradepulseapp.io"],
              ] as const).map(([label, href]) => (
                <a key={href} href={href} className="font-body text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-border pt-4">
            <p className="font-body text-[11px] leading-relaxed text-muted-foreground">
              TradePulse is a journaling tool, not financial advice. Stats shown are illustrative. Trading crypto carries substantial risk of loss. Do your own research.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
