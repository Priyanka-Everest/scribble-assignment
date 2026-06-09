# Quickstart: Gameplay Interaction Validation

**Feature**: 003-gameplay-interaction
**Date**: 2026-06-09

## Prerequisites

- Scenarios 1 & 2 fully working (room creation, join, lobby, game start, drawer/guesser roles)
- Backend running: `cd backend && npm run dev` → `http://localhost:3001`
- Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`
- Two browser tabs open side-by-side (Tab 1 = Alice/Drawer, Tab 2 = Bob/Guesser)

## Scenario A — Drawing Canvas (Drawer Only)

1. Create a room as Alice, Bob joins, Alice starts the game
2. On Tab 1 (Alice = Drawer): click and drag across the canvas area
3. **Expected**: Visible strokes appear following the cursor path
4. Click the **Clear Canvas** button
5. **Expected**: Canvas resets to blank; button is visible only on Tab 1
6. On Tab 2 (Bob = Guesser): confirm the canvas area shows a blank white canvas
7. **Expected**: No drawing controls or Clear Canvas button on Tab 2

## Scenario B — Guess Submission Validation

1. On Tab 2 (Bob = Guesser), submit an **empty guess** → inline error shown, no request made
2. Submit `"   "` (spaces only) → same error
3. Submit `"pizza"` (wrong word) → accepted, appears in guess history as incorrect, 0 points
4. Submit `"ROCKET"` (uppercase correct word) → accepted as correct, 100 points awarded

## Scenario C — Synced Guess History (~2s)

1. On Tab 2, submit a guess (`"castle"`)
2. **Expected on Tab 1 within ~2s**: The guess `"castle"` appears in the history
   list automatically — no manual refresh — showing Bob's name, the word, and
   "Incorrect"
3. Tab 2 submits `"rocket"` (correct)
4. **Expected on Tab 1 within ~2s**: New entry appears showing "Correct" for Bob

## Scenario D — Scoreboard Updates

1. After Scenario C: Tab 1 (Alice) scoreboard shows **0** points (drawer)
2. Tab 2 (Bob) scoreboard shows **100** points (one correct guess)
3. Open a third tab as Carol, join and start a new game; Carol submits `"rocket"`
4. Carol's score shows **100**; Alice and Bob (if present) show prior scores

## Scenario E — Drawer Cannot Guess

1. On Tab 1 (Alice = Drawer): confirm no guess form is visible
2. (Optional) POST directly to `/rooms/:code/guess` with Alice's `participantId`
3. **Expected**: 403 error returned from backend

## Scenario F — Multiple Correct Guesses (No Deduplication)

1. On Tab 2 (Bob): submit `"rocket"` → 100 points, entry in history
2. Submit `"rocket"` again → 100 more points, second entry in history
3. **Expected**: Bob's score is 200; history shows two "rocket" entries

## Build Verification

```bash
cd backend && npm run build   # 0 errors
cd frontend && npm run build  # 0 errors
```

## API Reference

- [POST /rooms/:code/guess](contracts/post-guess.md)
- [GET /rooms/:code — playing v2](contracts/get-room-playing-v2.md)
