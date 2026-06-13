/**
 * Build-time prerendering for PUBLIC marketing routes only.
 *
 * Serves the freshly built SPA from dist/ and snapshots each public route in
 * headless Chromium (via Playwright, already a devDependency). The rendered
 * HTML — real page text + per-page title/description/canonical set by
 * src/lib/page-meta.ts — is written back into dist/ as static files.
 *
 * App routes (/app, /journal, /new-trade, etc.) are deliberately NOT listed
 * here, so they are never prerendered and keep working as a normal SPA.
 *
 * If a browser can't be launched (e.g. a CI box without Chromium installed),
 * the script logs a loud warning and exits 0 so the SPA build still ships.
 */
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { join, dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, "..", "dist");
const HOST = "127.0.0.1";
const PORT = 4182;

// Public routes to prerender. Keep this list in sync with the public routes in
// src/App.tsx. Do NOT add app routes here.
const ROUTES = ["/", "/about", "/giving", "/privacy", "/terms"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

// Minimal static server with SPA fallback so client-side routes resolve to the
// app shell exactly like production would.
function startServer(shellHtml) {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      let filePath = join(DIST, urlPath);

      if (existsSync(filePath) && (await stat(filePath)).isDirectory()) {
        filePath = join(filePath, "index.html");
      }

      if (extname(filePath) && existsSync(filePath)) {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
        res.end(body);
        return;
      }

      // SPA fallback: serve the app shell for any non-file route.
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(shellHtml);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((res) => server.listen(PORT, HOST, () => res(server)));
}

// Locates a Chromium executable already on disk (any build version) so a
// version mismatch between Playwright and a pre-baked browser cache doesn't
// block prerendering.
function findInstalledChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!base || !existsSync(base)) return null;
  const candidates = [];
  for (const entry of readdirSync(base)) {
    if (!entry.startsWith("chromium")) continue;
    candidates.push(
      join(base, entry, "chrome-linux", "chrome"),
      join(base, entry, "chrome-linux", "headless_shell")
    );
  }
  return candidates.find((p) => existsSync(p)) || null;
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[prerender] dist/index.html not found — run `vite build` first.");
    process.exit(1);
  }

  // The freshly built index.html is the empty SPA shell. Preserve it as the
  // app-route fallback (app.html) BEFORE we overwrite index.html with the
  // prerendered home page, so logged-in routes never serve home markup.
  const shellHtml = await readFile(join(DIST, "index.html"), "utf8");
  await writeFile(join(DIST, "app.html"), shellHtml, "utf8");

  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    try {
      ({ chromium } = await import("@playwright/test"));
    } catch {
      console.warn("\n[prerender] ⚠ Playwright not available — skipping prerender. SPA build is intact.\n");
      return;
    }
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (firstErr) {
    // Version-matched browser missing (common in pre-baked CI images). Fall
    // back to any Chromium already present in PLAYWRIGHT_BROWSERS_PATH.
    const execPath = findInstalledChromium();
    if (execPath) {
      try {
        browser = await chromium.launch({ executablePath: execPath });
        console.log(`[prerender] Using existing Chromium at ${execPath}`);
      } catch (err) {
        browser = null;
        firstErr = err;
      }
    }
    if (!browser) {
      console.warn(
        "\n[prerender] ⚠ Could not launch a browser — skipping prerender. SPA build is intact." +
          "\n[prerender]   To enable prerendering, install Chromium: npx playwright install chromium" +
          `\n[prerender]   (${firstErr.message})\n`
      );
      return;
    }
  }

  const server = await startServer(shellHtml);
  const page = await browser.newPage();

  // External requests (fonts, analytics) aren't needed to capture the DOM and
  // can hang the snapshot — abort anything not served by our local server.
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith(`http://${HOST}:${PORT}`)) route.continue();
    else route.abort();
  });

  let ok = 0;
  try {
    for (const routePath of ROUTES) {
      const url = `http://${HOST}:${PORT}${routePath}`;
      try {
        await page.goto(url, { waitUntil: "load", timeout: 30000 });

        // Wait until React has rendered real content into #root.
        await page.waitForFunction(
          () => {
            const root = document.getElementById("root");
            return !!root && root.innerText.trim().length > 150;
          },
          { timeout: 30000 }
        );

        const html = "<!doctype html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));

        const outFile =
          routePath === "/"
            ? join(DIST, "index.html")
            : join(DIST, routePath.replace(/^\//, ""), "index.html");

        await mkdir(dirname(outFile), { recursive: true });
        await writeFile(outFile, html, "utf8");

        const title = await page.title();
        console.log(`[prerender] ✓ ${routePath.padEnd(9)} → ${outFile.replace(DIST + "/", "dist/")}  (“${title}”)`);
        ok++;
      } catch (err) {
        console.warn(`[prerender] ⚠ ${routePath} did not render (${err.message.split("\n")[0]}) — leaving SPA shell.`);
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (ok === 0) {
    const isDeploy =
      process.env.VERCEL === "1" || process.env.CI === "true" || process.env.CI === "1";
    const reason =
      "No routes prerendered. The app likely failed to boot during the build" +
      "\n[prerender]   (commonly missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY env vars).";
    if (isDeploy) {
      // On a real deploy (Vercel/CI) we must NOT ship a blank SPA shell to crawlers.
      console.error(
        `\n[prerender] ✗ ${reason}` +
          "\n[prerender]   Failing the build so a non-indexable shell is never deployed.\n"
      );
      process.exit(1);
    }
    console.warn(
      `\n[prerender] ⚠ ${reason}` +
        "\n[prerender]   SPA build is intact — continuing (local/non-deploy build).\n"
    );
  } else {
    console.log(`[prerender] Done. ${ok}/${ROUTES.length} public routes prerendered. App routes remain client-side.`);
  }
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
