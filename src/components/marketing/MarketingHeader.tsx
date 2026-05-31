import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/design/Logo";
import { Menu, X } from "lucide-react";
import { C, ctaBtn } from "./theme";

const NAV_LINKS = [
  ["Features", "/#features"],
  ["How It Works", "/#how-it-works"],
  ["Pricing", "/#pricing"],
  ["FAQ", "/#faq"],
  ["Giving", "/giving"],
  ["About", "/about"],
] as const;

export default function MarketingHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ background: `${C.bg}e6`, borderColor: C.border }}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2" aria-label="Go to homepage">
          <Logo size={16} />
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5">
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href} className="font-mono text-[12px] transition-colors" style={{ color: C.textDim }} onMouseOver={e => (e.currentTarget.style.color = C.text)} onMouseOut={e => (e.currentTarget.style.color = C.textDim)}>
              {label}
            </a>
          ))}
          <a href="/upgrade" className="font-mono text-[12px]" style={{ color: C.textDim }}>
            Sign In
          </a>
          <button
            onClick={() => navigate("/app")}
            className={`${ctaBtn} h-9 px-4 text-sm`}
            style={{ boxShadow: "0 4px 16px -4px rgba(142,194,221,0.3)" }}
          >
            Start Free
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-[4px] transition-colors"
          style={{ color: C.textDim }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden border-t px-5 pb-5 pt-4" style={{ background: C.bg, borderColor: C.border }}>
          <nav className="mb-4">
            {[...NAV_LINKS, ["Sign In", "/upgrade"] as const].map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between border-b py-3 font-sans text-sm transition-colors"
                style={{ borderColor: C.border, color: C.text }}
              >
                {label}
              </a>
            ))}
          </nav>
          <button
            onClick={() => { setMenuOpen(false); navigate("/app"); }}
            className={`${ctaBtn} h-12 w-full text-sm`}
          >
            Start Free
          </button>
        </div>
      )}
    </header>
  );
}
