# Data Model: Result, Restart & Final Validation

**Feature**: 004-result-restart
**Date**: 2026-06-09

## No New Types

This feature adds no new interfaces or types. It extends existing behaviour only.

---

## Updated Behaviour: `toRoomSnapshot()` Visibility Rules

The `secretWord` visibility logic in `toRoomSnapshot()` gains a third case:

```typescript
// Before (Scenario 2):
secretWord: isDrawer ? room.secretWord : null

// After (this scenario):
const isResult = room.status === "result";
secretWord: (isDrawer || isResult) ? room.secretWord : null
```

| Room status | Caller | `secretWord` in snapshot |
|-------------|--------|--------------------------|
| `"lobby"` | Any | `null` |
| `"playing"` | Drawer (viewerParticipantId === drawerId) | `room.secretWord` |
| `"playing"` | Guesser / unknown | `null` |
| `"result"` | Any | `room.secretWord` (revealed to everyone) |

---

## State Transition Model (complete)

```
createRoom()
  status: "lobby", drawerId: null, secretWord: null, guesses: [], scores: {}

startGame()
  status: "lobby" → "playing"
  drawerId = participants[0].id
  secretWord = STARTER_WORDS[0]
  scores = { [p.id]: 0, ... }

submitGuess()
  status: "playing" (required)
  scores[participantId] += correct ? 100 : 0
  guesses.push(guessRecord)

endGame()  [NEW]
  status: "playing" → "result"
  hostId validation required
  no field changes beyond status

restartGame()  [NEW]
  status: "result" → "lobby"
  hostId validation required
  drawerId = null
  secretWord = null
  guesses = []
  scores = {}
  participants: UNCHANGED
```

---

## Validation Rules (Zod — `backend/src/api/schemas.ts`)

### endGameSchema (new)

```typescript
const endGameSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID")
});
```

### restartGameSchema (new)

```typescript
const restartGameSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID")
});
```

Both are identical in shape to `startGameSchema` and `endGameSchema` — they could
share a schema, but are kept separate for clarity and future divergence.

---

## Constraints & Invariants

- `endGame()` MUST only succeed when `status === "playing"`.
- `restartGame()` MUST only succeed when `status === "result"`.
- Both MUST validate `participantId === room.hostId`; reject with 403 otherwise.
- After `restartGame()`: `participants` array MUST be identical to what it was
  before restart — no additions, no removals.
- After restart, `scores` is `{}` (empty); the next `startGame()` re-initialises
  it to `{ [p.id]: 0 }` for all current participants.
