# TradePulse — Cowork Session Handoff

> **How to use**: Update this file at the end of each session and upload it to Cowork context alongside CLAUDE.md. It gives the next agent immediate situational awareness without re-reading the whole codebase.

---

## Last Session Summary

<!-- What did the previous session accomplish? What was changed, fixed, or shipped? -->

- [ ] Fill in after session ends

**Branch state**: `claude/stoic-gauss-kNrov`
**Last commit**: <!-- paste `git log --oneline -1` output here -->

---

## Current Status

### What's Working
- [ ] Fill in (e.g. "Auth flow, wallet connect, voice recording, Pro upgrade payment")

### What's Broken / Incomplete
- [ ] Fill in (e.g. "Exit modal doesn't save emotion on partial exits")

### Known Issues / Tech Debt
- [ ] Fill in

---

## Open Tasks (Priority Order)

1. <!-- highest priority item -->
2. <!-- next item -->
3. <!-- next item -->

---

## Blocked / Needs Decision

<!-- Items that can't proceed without input from Ricky or a design decision -->

- [ ] Fill in

---

## Active Context

### Files Most Recently Touched
<!-- List files changed in the last session so the agent knows where to look first -->

- `src/pages/...`
- `supabase/functions/...`

### Supabase State
<!-- Note any schema changes applied, migrations pending, or edge functions deployed -->

- Migrations applied through: `<!-- timestamp -->`
- Edge functions last deployed: `<!-- which ones -->`

### Environment Variables Needed
<!-- Any new env vars added that aren't yet set in Vercel/Supabase dashboard -->

- None / <!-- list any new ones -->

---

## Notes for Next Agent

<!-- Anything else the next agent should know: edge cases discovered, user preferences, decisions already made -->

- Always check `src/lib/sample-data.ts` first for type definitions before adding new fields
- The `voice-utils.ts` keyword maps need to stay in sync with the emotion/signal pickers in `NewTrade.tsx`
- When modifying Supabase schema, write a new migration file — never edit existing ones
- Test wallet connect flows with Phantom on devnet before touching payment logic

---

## Quick Reference

```bash
npm run dev                          # dev server
git log --oneline -5                 # recent commits
git push -u origin claude/stoic-gauss-kNrov  # push to active branch
```

Supabase project: check `.env` or Supabase dashboard for project URL.
