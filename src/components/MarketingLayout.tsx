import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  ["Features", "/#features"],
  ["How It Works", "/#how-it-works"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"],
] as const;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md pt-safe-top">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
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
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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

      <main>{children}</main>

      <footer className="border-t border-border px-5 py-6 pb-safe-bottom">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="TradePulse" className="h-6 w-6 rounded-lg" />
            <span className="font-display text-sm font-bold">
              <span className="text-foreground">Trade</span>
              <span className="text-primary">Pulse</span>
            </span>
          </div>
          <p className="font-body text-xs text-muted-foreground">© 2025 TradePulse</p>
        </div>
      </footer>
    </div>
  );
}
