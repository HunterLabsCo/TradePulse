

# Fix: "No speech detected" after recording

## Problem

The token fetch succeeds (confirmed: 200 response with valid token), ElevenLabs connects, but when the user taps stop, `fullTranscript` is empty so "No speech detected" fires. Two likely causes:

1. **Stale closure in `stopRecording`**: Even though `fullTranscript` is in the dependency array, there's a timing gap — `scribe.disconnect()` may trigger re-renders that race with reading state values.
2. **`CommitStrategy.VAD` enum vs string**: The docs show `commitStrategy: "vad"` as a string literal. If the enum export is undefined, the scribe may not be configured properly.

## Fix

### 1. Use refs to accumulate transcript (eliminates closure issues)

Add `fullTranscriptRef` and `livePartialRef` that mirror their state counterparts. Update them in the scribe callbacks and Web Speech handlers. Read from refs in `stopRecording` instead of state.

### 2. Use string literal for commitStrategy

Change `CommitStrategy.VAD` to the string `"vad"` to avoid potential enum import issues.

### 3. Add debug logging to scribe callbacks

Log when `onPartialTranscript` and `onCommittedTranscript` fire so we can confirm ElevenLabs is actually sending data. Also log the connection state after `scribe.connect()`.

### 4. Read transcript before disconnecting

Move `scribe.disconnect()` after reading the transcript values from refs, so disconnection cleanup can't interfere.

### Changes — `src/pages/NewTrade.tsx`

- Add `useRef` mirrors for `fullTranscript` and `livePartial`
- Update refs in `onPartialTranscript`, `onCommittedTranscript`, and Web Speech callbacks
- In `stopRecording`: read from refs first, then disconnect
- Change `CommitStrategy.VAD` to `"vad"` string
- Add `console.log` in scribe callbacks for debugging

