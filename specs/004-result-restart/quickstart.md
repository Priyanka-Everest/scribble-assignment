# Quickstart: Result, Restart & Final Validation

**Feature**: 004-result-restart
**Date**: 2026-06-09

## Prerequisites

- Scenarios 1–3 fully working (room creation, game start, gameplay, scoring)
- Backend: `cd backend && npm run dev` → `http://localhost:3001`
- Frontend: `cd frontend && npm run dev` → `http://localhost:5173`
- Two browser tabs: Tab 1 = Alice (host/drawer), Tab 2 = Bob (guesser)

## Scenario A — End Round & Result View

1. Alice creates a room, Bob joins, Alice starts the game
2. Bob submits a guess (`"rocket"` — correct)
3. On Tab 1 (Alice = host): click **End Round**
4. **Expected Tab 1**: Transitions to result view showing:
   - Secret word: `"rocket"` (now visible to all)
   - Scores: Alice 0, Bob 100
   - Full guess history
   - Restart button (active for host)
5. **Expected Tab 2 within ~2s**: Automatically shows same result view
   - Secret word visible
   - Same scores and history
   - Restart button visible but disabled with label

## Scenario B — Non-Host Cannot End Round

1. In an active game, on Tab 2 (Bob = non-host):
2. **Expected**: End Round button is visible but disabled
3. (Optional) POST directly to `/rooms/:code/end` with Bob's UUID
4. **Expected**: 403 response from backend

## Scenario C — Restart Returns to Lobby

1. After Scenario A result view is showing:
2. On Tab 1 (Alice = host): click **Restart**
3. **Expected Tab 1**: Navigates to lobby with Alice and Bob listed
4. **Expected Tab 2 within ~2s**: Also navigates to lobby
5. **Verify**: Participant list is intact; scores are gone (fresh lobby)
6. **Verify**: Room code is the same

## Scenario D — Determinism Preserved After Restart

1. After lobby is shown (post-restart):
2. Alice starts a new game
3. **Expected**: Alice is again Drawer (first participant), word is again `"rocket"`
4. This confirms determinism is preserved across restart

## Scenario E — Non-Host Cannot Restart

1. In result state, on Tab 2 (Bob): Restart button is disabled
2. (Optional) POST directly to `/rooms/:code/restart` with Bob's UUID
3. **Expected**: 403 response

## Scenario F — Cannot End Round Twice

1. After round has ended (status = `"result"`):
2. POST to `/rooms/:code/end` again
3. **Expected**: 400 response (`"Room is not in playing status"`)

## Build Verification

```bash
cd backend && npm run build   # 0 errors
cd frontend && npm run build  # 0 errors
```

## API Reference

- [POST /rooms/:code/end](contracts/post-end.md)
- [POST /rooms/:code/restart](contracts/post-restart.md)
