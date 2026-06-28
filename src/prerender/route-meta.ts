/**
 * Single source of truth for per-route SEO meta on the public marketing pages.
 *
 * Both the client (each page's setPageMeta call) and the build-time prerender
 * (scripts/prerender.mjs via entry-server.tsx) read from this map, so the
 * static HTML crawlers see and the runtime DOM stay identical.
 */
export const SITE_ORIGIN = "https://www.tradepulseapp.io";

export type RouteMeta = {
  title: string;
  description: string;
};

/** Keep keys in sync with the public routes in src/App.tsx and prerender.mjs. */
export const ROUTE_META: Record<string, RouteMeta> = {
  "/": {
    title: "TradePulse — Never Lose a Trade to Bad Timing",
    description:
      "The voice-powered trade journal for active crypto traders. Log entries, exits, PnL, and mood across Solana, Ethereum, Base, Arbitrum, BNB, and Polygon in under 5 seconds. 20 free trades, no credit card.",
  },
  "/about": {
    title: "About — TradePulse",
    description:
      "TradePulse is built and run independently by TheVeinGhost — an active crypto trader from small-town Connecticut. Built by a trader, for traders.",
  },
  "/giving": {
    title: "Giving Back — TradePulse",
    description:
      "50% of every TradePulse Pro upgrade is donated to three Connecticut organizations. Every dollar tracked publicly.",
  },
  "/privacy": {
    title: "Privacy Policy — TradePulse",
    description:
      "TradePulse Privacy Policy. We don't collect emails, don't sell data, and free-tier trades never leave your device.",
  },
  "/terms": {
    title: "Terms of Service — TradePulse",
    description:
      "TradePulse Terms of Service. Review the terms governing your use of our voice-powered crypto trade journal.",
  },
};

/** Self-referencing canonical URL for a route ("/" stays "<origin>/"). */
export function canonicalFor(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}
