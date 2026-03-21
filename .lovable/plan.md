

# Switch to Web Speech API as Primary STT

## Problem
ElevenLabs Scribe WebSocket connection fails consistently (code 1006, unclean close) — the token is fetched successfully but the WebSocket never establishes, so no transcripts are received.

## Solution
Make the browser's native Web Speech API (`SpeechRecognition`) the primary and only STT engine. Remove the ElevenLabs Scribe connection attempt entirely. This eliminates the WebSocket failure and gives instant, reliable voice recording.

## Changes — `src/pages/NewTrade.tsx`

1. **Remove ElevenLabs imports and hook**: Remove `useScribe`, `CommitStrategy` import and the `scribe` hook instance
2. **Remove ElevenLabs token