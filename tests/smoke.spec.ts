import { test, expect, type Page } from "@playwright/test";
import type { Trade } from "../src/lib/sample-data";

// A minimal but valid open trade, seeded so /trade/:id has something to render.
const SEED_TRADE: Trade = {
  id: "seed-trade-1",
  userId: "smoke-test-user",
  tokenName: "BONK",
  chain: "solana",
  entryMarketCap: "12M",
  entryPrice: "0.0000123",
  positionSize: "1.5 SOL",
  setupType: "breakout",
  entryTime: new Date("2026-06-14T10:00:00Z").toISOString(),
  emotionalStateAtEntry: ["confident", "focused"],
  quickTags: ["breakout", "volume-spike"],
  updates: [],
  exitEvents: [],
  tradeNotes: [],
  status: "open",
  isDemo: false,
};

// Zustand persist key from src/lib/trade-store.ts.
const TRADE_STORE_KEY = "tradesnap-trades";
const STORE_VALUE = JSON.stringify({ state: { trades: [SEED_TRADE] }, version: 0 });

const ROUTES = ["/app", "/journal", "/new-trade", "/settings", `/trade/${SEED_TRADE.id}`];

// A runtime bundling bug (missing import minified to a free variable) surfaces as
// one of these console/page errors — never let it ship silently again.
const FATAL = /ReferenceError|is not defined|before initialization/;

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${String(err)}`));
  return errors;
}

for (const route of ROUTES) {
  test(`renders ${route} without a runtime crash`, async ({ page }) => {
    const errors = collectErrors(page);

    await page.addInitScript(
      ([key, value]) => {
        try {
          window.localStorage.setItem(key, value);
        } catch {
          /* ignore */
        }
      },
      [TRADE_STORE_KEY, STORE_VALUE] as const
    );

    await page.goto(route, { waitUntil: "networkidle" });

    // The Sentry error boundary (src/main.tsx) renders this when a route throws.
    await expect(page.locator("body")).not.toContainText("An unexpected error occurred");

    const fatal = errors.filter((e) => FATAL.test(e));
    expect(fatal, `Fatal runtime errors on ${route}:\n${fatal.join("\n")}`).toEqual([]);
  });
}
