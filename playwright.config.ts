import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
    // Escape hatch for pre-baked CI images whose Chromium revision doesn't match
    // Playwright's expected build. Unset in normal runs → default managed browser.
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Serve a real production build, not `npm run dev`: runtime bundling/minification
  // bugs (e.g. a missing import surfacing as "X is not defined") only appear in the
  // built bundle. The Supabase client throws on boot without VITE_SUPABASE_* env, so
  // provide placeholders when none are set (CI/deploy can inject real values).
  webServer: {
    command: "npm run build:spa && npm run preview -- --host 127.0.0.1 --port 8080 --strictPort",
    url: "http://localhost:8080",
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? "https://placeholder.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY:
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "placeholder-anon-key",
    },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
