/**
 * Browserless SSR entry for build-time prerendering of the public marketing
 * routes. Built via `vite build --ssr` and consumed by scripts/prerender.mjs.
 *
 * It imports ONLY the marketing pages and a static router — no app pages, no
 * wallet/Supabase/react-query providers — so renderToString runs in plain Node.
 */
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import type { ComponentType } from "react";
import Landing from "@/pages/Landing";
import AboutPage from "@/pages/AboutPage";
import GivingPage from "@/pages/GivingPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import { ROUTE_META, type RouteMeta } from "./route-meta";

const PAGES: Record<string, ComponentType> = {
  "/": Landing,
  "/about": AboutPage,
  "/giving": GivingPage,
  "/privacy": PrivacyPage,
  "/terms": TermsPage,
};

export async function render(path: string): Promise<{ html: string; meta: RouteMeta }> {
  const Page = PAGES[path];
  if (!Page) throw new Error(`No marketing page registered for "${path}"`);

  const html = renderToString(
    <StaticRouter location={path}>
      <Page />
    </StaticRouter>
  );

  return { html, meta: ROUTE_META[path] };
}
