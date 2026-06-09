# Quickstart: Game Start & Drawer Flow Validation

**Feature**: 002-game-start-drawer-flow
**Date**: 2026-06-09

## Prerequisites

- Scenario 1 (Room Setup & Lobby) fully working
- Backend running: `cd backend && npm run dev` → `http://localhost:3001`
- Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`
- Two browser tabs open side-by-side

## Scenario A — Drawer Assignment & Role Display

1. Tab 1: Create room as `"Alice"` → land in lobby
2. Tab 2: Join same room as `"Bob"` → land in lobby
3. Tab 1 (host): click **Start Game**
4. **Expected Tab 1 (Alice = drawer)**:
   - Role label shows **"Drawer"**
   - Secret word **"rocket"** is displayed
5. **Expected Tab 2 (Bob = guesser)**:
   - Role label shows **"Guesser"**
   - Text **"Guess the word!"** shown — no word visible

## Scenario B — Deterministic Word Selection

1. Complete Scenario A — note the word is `"rocket"`
2. Stop the backend (`Ctrl+C`), restart (`npm run dev`)
3. Create a new room, join with a second tab, start the game
4. **Expected**: Drawer sees `"rocket"` again — word is always the same

## Scenario C — Network Response Verification (guesser sees no word)

1. In Tab 2 (guesser), open DevTools → Network tab
2. After the game starts, locate the `GET /rooms/:code` request
3. Inspect the JSON response
4. **Expected**: `"secretWord": null` and `"availableWords": []` in the response

## Scenario D — Browser Refresh Edge Case

1. After game starts, Tab 1 (drawer) refreshes the page
2. **Expected**: Game screen reloads, role **"Drawer"** shown, word **"rocket"** shown
3. Tab 2 (guesser) refreshes
4. **Expected**: Role **"Guesser"** shown, **"Guess the word!"** shown — no word

## Scenario E — Participant Role Labels

1. Create a room with 3 participants (open a third tab and join)
2. Start the game from the host tab
3. **Expected**: First joiner (Alice) is Drawer; Bob and Carol are both Guessers
4. All three tabs show the correct role label

## Scenario F — Name Validation (end-to-end confirmation)

1. On Create Room form: submit empty name → inline error shown, no room created
2. Submit `"   "` (spaces) → same error
3. Submit `"  Alice  "` → room created, stored name is `"Alice"` (trimmed)
4. Repeat on Join Room form

## Build Verification

```bash
cd backend && npm run build   # 0 errors
cd frontend && npm run build  # 0 errors
```

## API Reference

See [contracts/get-room-playing.md](contracts/get-room-playing.md) for full
request/response shapes for the playing state.
