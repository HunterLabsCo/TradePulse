import { type ReactNode } from "react";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { C } from "@/components/marketing/theme";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: C.bg, color: C.text }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[6px] focus:px-4 focus:py-2 focus:font-sans focus:text-sm focus:font-medium focus:text-[#0e1311]"
        style={{ background: C.primary }}
      >
        Skip to main content
      </a>

      <MarketingHeader />

      <main id="main" tabIndex={-1}>{children}</main>

      <MarketingFooter />
    </div>
  );
}
