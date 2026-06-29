# TradePulse Security Audit

**Date:** 2026-06-29
**Branch:** `claude/code-security-audit-51zqjd`
**Scope:** Edge functions, frontend, payment/subscription flow, RLS, infra config, secrets/keys, rate limiting.
**Status:** Report only — no remediation applied in this branch.

## Methodology

Three parallel reviews (edge functions, frontend, infra/RLS) of the repository, then **every
high-severity claim was reconciled against live production** via the Supabase MCP (deployed edge
function source, live `pg_policies`, and security advisors). This matters because **the repo and
production have diverged** (see "Repo vs. production drift") — several repo-based findings do not
reflect what actually runs in prod, and one real prod issue does not exist in the repo at all.

## Overall posture

Core security is **solid and launch-appropriate**:

- Payment is verified **on-chain server-side** (`verify-payment`): the client-supplied amount is
  ignored, price is enforced server-side, `feePayer` must equal the claimed wallet, and
  `transaction_signature` is `UNIQUE` — replay/double-spend is closed.
- Pro status is **never trusted from the client** (`isPro` is not persisted to localStorage; it is
  always re-derived server-side).
- No secrets ship to the browser; all `VITE_*` vars are public by design (Supabase URL, anon key,
  receiving wallet, Sentry DSN).
- Wallet writes require an **ed25519 signature** with a fresh-timestamp binding (`create-trade`).
- Passwords (historical promo system) used Argon2id with a constant-time compare.
- `subscribers` and `trades` are fully locked at the RLS layer (service-role only).

The real gaps are concentrated in **rate-limit robustness on the paid AI endpoints** and a couple
of **info-disclosure / hygiene** items.

## Findings summary

| ID | Severity | Issue | Status in prod |
|----|----------|-------|----------------|
| H1 | **High** | Rate limiting keyed on spoofable leftmost `x-forwarded-for` on paid AI endpoints → API billing-drain | **Live / active** |
| P1 | **Medium** | `check-pro-status` has no rate limit + wildcard CORS → unbounded wallet/Pro-status enumeration | **Live / active** |
| M2 | **Medium** | CSP allows `script-src 'unsafe-inline'` | Live (`vercel.json`) |
| M3 | **Low** | `feature_flags` readable by `authenticated` role | Live (low data sensitivity) |
| L1 | **Low** | Dev `localhost` origins in production CORS allowlists | Live |
| L2 | **Low** | Vulnerable npm dependencies (build/test toolchain) | Repo |
| L3 | **Low** | SOL price-fallback edge case during feed outage | Live |
| L4 | **Low** | Raw transcript interpolated into AI prompt (constrained by forced tool use) | Live |
| L5 | **Info** | Broad preview-domain redirect regex (not an open redirect) | Live |
| R1 | **Med (process)** | Repo edge functions are stale vs. deployed versions | — |

---

## H1 — Spoofable IP rate limiting on paid AI endpoints *(top priority)*

**Severity:** High (financial — API quota/billing drain)
**Live-confirmed in:** `parse-trade-transcript`, `elevenlabs-scribe-token`, `admin-action`, `create-trade`

Every per-IP limiter derives the client IP from the **leftmost** `x-forwarded-for` token:

```ts
function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();   // attacker-controlled
  return req.headers.get("x-real-ip") ?? "unknown";
}
```

The leftmost XFF entry is client-supplied. An attacker rotates it per request to mint unlimited
distinct "IPs," defeating the limit. Impact by endpoint:

- **`parse-trade-transcript`** (live, `verify_jwt=true`, **20 req/hr**) calls the paid **Anthropic
  API** (`claude-haiku-4-5`). This is the highest-value target: bypassing the limit is a direct
  cost-DoS / billing-drain once the app is publicly advertised.
- **`elevenlabs-scribe-token`** (live, **10 req/hr**) mints paid **ElevenLabs** single-use tokens —
  same billing-drain risk.
- **`admin-action`** (live) throttles `ADMIN_SECRET` brute force at 10 fails/15 min per IP; the
  throttle is bypassable. Mitigated in practice **only** by `ADMIN_SECRET` entropy (the compare
  itself is constant-time — good). Ensure `ADMIN_SECRET` is long and random.
- **`create-trade`** (live, 30 req/60s) — write-spam only; low impact.

Note `verify_jwt=true` does **not** mitigate this: the JWT gate is satisfied by the public anon
key, so it does not stop anonymous abuse. The IP throttle is the only real guard.

**Good news (verified live):** these limiters **fail closed** — a DB error inside `checkRateLimit`
propagates to the outer `try` and returns 500, so an outage denies rather than allows. (The
fail-*open* `.catch(() => ({ count: 0 }))` flagged by the repo pass lives only in the stale repo
`promo-auth`, which does not run in prod — see R1.)

**Recommended fix:** stop trusting the leftmost XFF hop. Options, best first:
1. Enforce limits on a **trusted client IP** (the proxy-appended hop, not the client-supplied one),
   or front the AI endpoints with **Supabase/Cloudflare platform rate limiting**.
2. Add an **identity/cost signal** to the key (e.g. wallet/owner id) so a single caller can't fan
   out across spoofed IPs.
3. Lower the AI-endpoint caps and add billing alerts as defense-in-depth.

---

## P1 — `check-pro-status`: no rate limit + wildcard CORS (live-only)

**Severity:** Medium (privacy / customer-base enumeration)
**This finding is live-only — it is NOT visible from the repo.**

The **deployed** `check-pro-status` differs from the repo copy. In production it has:

```ts
const corsHeaders = { "Access-Control-Allow-Origin": "*", ... };   // wildcard
// ...no checkRateLimit() call at all...
```

It returns `{ isPro, txSignature }` for **any** `walletAddress`, from **any** origin, with **no
throttle**. An attacker with a list of candidate wallets can enumerate which ones are paying Pro
customers (and whether banned) at unlimited speed.

Data sensitivity is moderate: `transaction_signature` is already public on-chain, but the
*mapping* of wallet → paying-customer / banned status is a privacy leak and a competitor-intel
vector right before a marketing push. (The repo version of this function actually has both a
limiter and an origin allowlist — prod is the more permissive one.)

**Recommended fix:** add the same per-key throttle used elsewhere (subject to the H1 fix), and
replace `*` with the origin allowlist already used by `verify-payment`/`create-trade`.

---

## M2 — CSP allows `script-src 'unsafe-inline'`

**Severity:** Medium (defense-in-depth)
**File:** `vercel.json:13`

```
script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' ...
```

`'unsafe-inline'` on `script-src` removes CSP's core XSS protection. The current XSS surface is
low (all user input — transcripts, notes — is rendered as text via JSX, never
`dangerouslySetInnerHTML`), so this is hardening rather than an active hole. Tightening is a
regression-risk change for a SPA (needs nonces/hashes and a build + smoke test), so schedule it
deliberately rather than hot-patching pre-launch. `style-src 'unsafe-inline'` is harder to remove
(Tailwind/shadcn runtime styles) and lower priority.

---

## M3 — `feature_flags` readable by the `authenticated` role

**Severity:** Low
**Live RLS (verified):** policy `Authenticated read feature flags` → `FOR SELECT TO authenticated USING (true)`

Correction to the repo-based finding: the repo migration shows `USING (true)` for **all** roles
(`public`), but **production restricts SELECT to the `authenticated` role**. The app's anon key is
the `anon` role and the app issues no Supabase-auth sessions, so the client cannot read this table;
admin reads go through the service-role `admin-action` function. The flag data
(`paywall_enabled`, `maintenance_mode`, …) is non-sensitive and enforced server-side.

**Recommended (cheap hygiene):** narrow the SELECT policy to service-role only to match
`subscribers`/`trades`, since nothing legitimately reads it as `authenticated`.

---

## Lower-severity items

- **L1 — Dev origins in prod CORS.** `verify-payment`, `create-trade`, `parse-trade-transcript`,
  `elevenlabs-scribe-token`, `get-trades` include `http://localhost:8080` / `:5173` in
  `ALLOWED_ORIGINS`. Low risk (these endpoints require signatures/secrets), but dev origins
  shouldn't be trusted in prod. (Separately, `check-pro-status` and `admin-action` use wildcard
  `*` — folded into P1/H1.)
- **L2 — Vulnerable dependencies.** The toolchain (`@remix-run/router`/react-router, `@babel/*`,
  `ws`, `bigint-buffer`, vitest) reports known advisories. Run `npm audit`, apply non-breaking
  patches, and track any required major bumps separately (avoid forcing upgrades right before
  launch).
- **L3 — SOL price fallback.** `verify-payment` falls back to **$120/SOL** if CoinGecko is down.
  This errs in the house's favor (requires *more* SOL) **unless** SOL trades durably below $120
  *and* the feed is down simultaneously, allowing a small underpayment. Low; revisit the constant
  if SOL sits below $120.
- **L4 — Prompt interpolation.** `parse-trade-transcript` embeds the raw transcript in the user
  message. Impact is bounded by `tool_choice: { type: "tool" }` (output is forced into the
  structured schema) and a 2000-char cap. Low.
- **L5 — Preview redirect (info).** `vercel.json` redirects `trade-pulse-*.vercel.app` to a
  hard-coded canonical host with `permanent:false`. Destination is fixed, so it is **not** an open
  redirect; optionally tighten the regex to the PR-preview pattern.

---

## Verified NOT issues (over-flagged by automated passes — do not "fix")

- **Payment double-spend / replay** — mitigated: `feePayer === walletAddress` binds each tx to its
  signer, `transaction_signature` is `UNIQUE`, plus an already-verified-wallet guard.
- **`promo-auth` "inverted"/fail-open rate limit** — the live function is a **410 tombstone**; that
  code does not run in prod (see R1). The repo logic was also functionally correct regardless.
- **Supabase project ref "exposed"** — public by design (it is in the frontend Supabase URL).
- **Frontend secret/Pro-status exposure** — none; `isPro` not persisted, payment server-verified,
  no sensitive `VITE_*`, no secret logging, no `dangerouslySetInnerHTML`.

---

## R1 — Repo vs. production drift *(process finding)*

The deployed edge functions differ from the repository in several places, so a repo-only audit
reaches wrong conclusions. Confirmed divergences:

| Function / object | Repository | Production (live) |
|---|---|---|
| `promo-auth` | full Argon2id login + DB rate limit | **410 tombstone** (promo discontinued) |
| `check-pro-status` | IP rate limit + origin allowlist | **no rate limit + wildcard CORS** |
| `admin-action` | logs to `admin_action_log` | logs to **`auth_attempts`** |
| `feature_flags` RLS | `USING (true)` for all roles | `TO authenticated USING (true)` |

**Recommend:** re-sync `supabase/functions/*` and migrations with the deployed state (commit the
real prod source, delete the stale `promo-auth`) so the repo is the source of truth before further
changes.

## Supabase security advisors (live)

- **INFO** — `subscribers` and `auth_attempts`: "RLS enabled, no policy." Intentional
  (service-role-only); benign, but expect the linter to keep flagging it.
- **WARN** — "Leaked password protection disabled." Not applicable: the app does not use Supabase
  Auth passwords. Safe to ignore (or enable for completeness).

## Suggested priority order

1. **H1** — fix spoofable IP limiting on `parse-trade-transcript` + `elevenlabs-scribe-token`
   (billing-drain) before driving paid traffic.
2. **P1** — add throttle + origin allowlist to `check-pro-status`.
3. **R1** — reconcile repo with prod.
4. **M2** — tighten CSP (scheduled, with smoke test).
5. **M3 / L1–L5** — hygiene.
