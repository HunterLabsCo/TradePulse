/**
 * Build-time prerendering for PUBLIC marketing routes only — browserless.
 *
 * Builds an SSR bundle of the marketing pages (vite build --ssr) and renders
 * each public route with react-dom/server, then bakes the real page markup and
 * per-route SEO meta (title/description/canonical/OG) into static HTML files in
 * dist/. No headless browser is involved, so this runs anywhere Node runs
 * (local, CI, Vercel's build image).
 *
 * App routes (/app, /journal, /new-trade, etc.) are deliberately NOT listed
 * here, so they are never prerendered and keep working as a normal SPA via the
 * dist/app.html fallback.
 *
 * The build FAILS (exit 1) on EVERY environment if any route fails to render or
 * yields an empty #root — a blank, non-indexable shell must never deploy.
 */
import { execSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const SSR_OUT = join(ROOT, "dist-ssr");

// Public routes to prerender. Keep in sync with the public routes in
// src/App.tsx and the PAGES map in src/prerender/entry-server.tsx. Do NOT add
// app routes here.
const ROUTES = ["/", "/about", "/giving", "/privacy", "/terms"];

const SITE_ORIGIN = "https://www.tradepulseapp.io";

function escapeAttr(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Replace the content="" of a meta tag matched by its name/property attribute.
function replaceMeta(html, matchAttr, value) {
  const re = new RegExp(`(<meta\\s+${matchAttr}\\s+content=")[^"]*(")`, "i");
  if (!re.test(html)) {
    throw new Error(`shell is missing <meta ${matchAttr} ...>`);
  }
  return html.replace(re, `$1${escapeAttr(value)}$2`);
}

function injectMeta(shell, { title, description, canonical }) {
  let html = shell;

  if (!/<title>[\s\S]*?<\/title>/i.test(html)) throw new Error("shell is missing <title>");
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  html = replaceMeta(html, 'name="description"', description);
  html = replaceMeta(html, 'property="og:title"', title);
  html = replaceMeta(html, 'property="og:description"', description);
  html = replaceMeta(html, 'property="og:url"', canonical);
  html = replaceMeta(html, 'name="twitter:title"', title);
  html = replaceMeta(html, 'name="twitter:description"', description);

  const canonicalRe = /(<link\s+rel="canonical"\s+href=")[^"]*(")/i;
  if (!canonicalRe.test(html)) throw new Error('shell is missing <link rel="canonical">');
  html = html.replace(canonicalRe, `$1${escapeAttr(canonical)}$2`);

  return html;
}

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("[prerender] dist/index.html not found — run `vite build` first.");
    process.exit(1);
  }

  // Build the SSR bundle of the marketing pages. With "type": "module" in
  // package.json, the emitted dist-ssr/entry-server.js is ESM and importable.
  console.log("[prerender] Building SSR bundle (build:ssr)…");
  execSync("npm run build:ssr", { cwd: ROOT, stdio: "inherit" });

  const entryPath = join(SSR_OUT, "entry-server.js");
  if (!existsSync(entryPath)) {
    console.error(`[prerender] SSR bundle not found at ${entryPath}.`);
    process.exit(1);
  }
  const { render } = await import(pathToFileURL(entryPath).href);

  // The freshly built index.html is the empty SPA shell. Preserve it UNCHANGED
  // as the app-route fallback (app.html) BEFORE we overwrite index.html with the
  // prerendered home page, so logged-in routes never serve home markup.
  const shell = await readFile(join(DIST, "index.html"), "utf8");
  await writeFile(join(DIST, "app.html"), shell, "utf8");

  const failures = [];
  let ok = 0;

  for (const routePath of ROUTES) {
    try {
      const { html, meta } = await render(routePath);
      if (!html || html.trim().length === 0) {
        throw new Error("render produced an empty #root");
      }
      if (!meta || !meta.title || !meta.description) {
        throw new Error("missing route meta (title/description)");
      }

      const canonical = `${SITE_ORIGIN}${routePath}`;
      let out = shell.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
      if (out === shell) {
        throw new Error('shell is missing <div id="root"></div>');
      }
      out = injectMeta(out, { title: meta.title, description: meta.description, canonical });

      const outFile =
        routePath === "/"
          ? join(DIST, "index.html")
          : join(DIST, routePath.replace(/^\//, ""), "index.html");
      await mkdir(dirname(outFile), { recursive: true });
      await writeFile(outFile, out, "utf8");

      console.log(
        `[prerender] ✓ ${routePath.padEnd(9)} → ${outFile.replace(DIST + "/", "dist/")}  ("${meta.title}")`
      );
      ok++;
    } catch (err) {
      failures.push(`${routePath}: ${err.message}`);
      console.error(`[prerender] ✗ ${routePath} failed — ${err.message}`);
    }
  }

  if (failures.length > 0) {
    console.error(
      `\n[prerender] ✗ ${failures.length}/${ROUTES.length} route(s) failed to prerender.` +
        "\n[prerender]   Failing the build so a non-indexable shell is never deployed.\n"
    );
    process.exit(1);
  }

  console.log(
    `[prerender] Done. ${ok}/${ROUTES.length} public routes prerendered. App routes remain client-side.`
  );
}

main().catch((err) => {
  console.error("[prerender] Failed:", err);
  process.exit(1);
});
