# Research: Result, Restart & Final Validation

**Feature**: 004-result-restart
**Date**: 2026-06-09

## Decision Log

### 1. Result view: conditional section in `GamePage.tsx`

**Decision**: When `snapshot.status === "result"`, `GamePage.tsx` renders a
result section replacing the playing UI. No separate route or `ResultPanel.tsx`
delegation.

**Rationale**: Clarification Q1. `GamePage.tsx` already holds the snapshot in
state and the polling loop. A `status`-based conditional is the least-new-code
path and consistent with how the same component handles `"playing"` vs lobby
detection.

**Alternatives considered**: Separate `/result` route — rejected (adds routing
complexity for a single-round demo). Delegating to `ResultPanel.tsx` — rejected
per clarification; keeps logic in one place.

---

### 2. `toRoomSnapshot()` visibility rule for `"result"`

**Decision**: Add a third condition to the `secretWord` logic:
```
if status === "result" → return room.secretWord (always)
```
The existing `isDrawer` check only applies during `"playing"`.

**Rationale**: The result state requires the word to be revealed to everyone
as part of the round conclusion. This is a one-line addition to the existing
function — no new function needed.

---

### 3. `endGame()` and `restartGame()` as separate service functions

**Decision**: Two new exported functions in `roomStore.ts` following the same
error-union pattern as `startGame()` and `submitGuess()`.

**Rationale**: Consistent with the established brownfield pattern. Each function
validates preconditions, mutates the room, and returns either `{ room }` or
`{ error, message }`. The route handler then calls `HttpError` on the error case.

---

### 4. Schemas: `endGameSchema` and `restartGameSchema`

**Decision**: Both use `{ participantId: z.string().uuid() }` — same shape as
`startGameSchema`. Host validation is done server-side by comparing to `room.hostId`.

**Rationale**: Consistent with existing patterns. No new fields needed; the
`participantId` is the only input required to verify caller identity.

---

### 5. Polling handles `"result"` and `"lobby"` detection

**Decision**: The existing `setInterval(2000)` in `GamePage.tsx` already replaces
`snapshot` state on each cycle. Adding two new `if` branches to the callback:
- `status === "result"` → stop rendering playing UI, show result view (no navigation needed — same page)
- `status === "lobby"` → `navigate("/lobby")` (already handled from Scenario 1 lobby polling; GamePage adds this case)

**Rationale**: No new polling infrastructure. The `"result"` case is an in-page
render change (no navigation). The `"lobby"` case triggers navigation, consistent
with how Scenario 1's lobby polling navigated to `/game` when status changed.

---

### 6. End Round button: host-only, visible to all

**Decision**: Same pattern as the Start Game button in Scenario 1 — visible and
rendered for all participants, but `disabled` with a label for non-hosts.

**Rationale**: Per spec US3 scenario 2 — non-hosts see the button disabled with
"Only the host can end the round". Consistent with the established Start Game
button pattern.
