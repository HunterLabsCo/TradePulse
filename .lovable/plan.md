

# New Trade Entry Page — 9-Point Update

## Summary

Nine targeted changes to the New Trade form: remove entry price, fix token parsing, upgrade setup type to dropdown, add indicators field, replace volume/wallet toggles with multi-select confirmation signals, expand session status, expand emotional state grid with free text, split transcript from notes, and general cleanup.

## Changes

### 1. Update `src/lib/sample-data.ts` — Expand Types

- Add new `EmotionalState` values: `"disciplined"`, `"hesitant"`, `"impulsive"`, `"euphoric"`, `"detached"`, `"sharp"`, `"tired"`
- Expand `Trade.sessionType` union to include all 6 new statuses: `"full-session"`, `"partially-interrupted"`, `"intermittently-interrupted"`, `"work-trade"`, `"mobile-only"`, `"forced-exit-risk"`
- Remove `interruptionStatus` field (replaced by expanded `sessionType`)
- Add new optional fields to `Trade`: `confirmationSignals: string[]`, `confirmationSignalOther?: string`, `indicatorsUsed?: string`, `emotionFreeText?: string`, `additionalNotes?: string`
- Keep `entryPrice` in the type (other pages may use it) but remove from the form

### 2. Update `supabase/functions/parse-trade-transcript/index.ts` — Fix Parser

- **Token name fix**: Update system prompt to instruct AI to extract only the ticker symbol (1-4 words max, typically the first proper noun after "entering/entered/bought")
- Add the new emotional states to the enum list
- Update `sessionType` enum to match new values
- Replace `volumeConfirmed`/`walletConfirmed` with `confirmationSignals` array
- Remove `entryPrice` from tool schema
- Add `interruptionStatus` → `sessionType` mapping in prompt

### 3. Rebuild `src/pages/NewTrade.tsx` — All 9 Form Changes

**State changes:**
- Remove `entryPrice` state
- Remove `volumeConfirmed`, `walletConfirmed`, `interruptionStatus` states
- Add: `confirmationSignals: string[]`, `confirmationSignalOther: string`, `indicatorsUsed: string`, `showIndicators: boolean`, `emotionFreeText: string`, `additionalNotes: string`, `customSetupType: string`
- Change `sessionType` to use new expanded union
- Change `setupType` to use dropdown values

**Form layout (top to bottom):**
1. Voice recorder section (unchanged)
2. Token + Chain row (unchanged, minus entry price)
3. Entry MC + Size row (2 columns instead of 3)
4. Setup Type dropdown + Narrative row — Setup Type becomes a `<Select>` with 8 options; "Custom" shows a text input
5. Collapsible "Add indicators" section with free text input
6. "Confirmation Signals" multi-select chips: Volume, Wallets, Social/Twitter, Chart Pattern, Gut/Intuition, Other (Other shows free text)
7. "Session Status" single `<Select>` with 6 options (replaces both old dropdowns)
8. Emotional State grid — add 7 new tags + free text field below
9. Quick Tags (unchanged)
10. "Raw Transcript" section — darker bg, read-only display
11. "Additional Notes" section — editable textarea below transcript

**Save handler:** Map new fields to the Trade object. Pass `confirmationSignals`, `indicatorsUsed`, `emotionFreeText`, `additionalNotes` through.

**Parser response handling:** Map new parsed fields (`confirmationSignals`, expanded `sessionType`, new emotions) to form state.

### Files Modified
- `src/lib/sample-data.ts`
- `src/pages/NewTrade.tsx`
- `supabase/functions/parse-trade-transcript/index.ts`

