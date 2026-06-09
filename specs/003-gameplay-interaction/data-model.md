# Data Model: Gameplay Interaction

**Feature**: 003-gameplay-interaction
**Date**: 2026-06-09

## Backend Types (`backend/src/models/game.ts`)

### Guess (new)

```typescript
export interface Guess {
  participantId: string;     // UUID of the guesser
  participantName: string;   // Display name at time of submission
  word: string;              // Trimmed submitted word (stored as-submitted, lowercase comparison only)
  correct: boolean;          // true if word matches secretWord (case-insensitive)
  submittedAt: string;       // ISO 8601 timestamp
}
```

---

### Room (updated)

```typescript
interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];                    // append-only; empty array until game starts
  scores: Record<string, number>;      // participantId → score; initialised in startGame()
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

**Added**: `guesses: Guess[]` — initialised as `[]` in `createRoom()`; populated by `submitGuess()`.
**Added**: `scores: Record<string, number>` — initialised as `{}` in `createRoom()`; all participants set to `0` in `startGame()`.

---

### RoomSnapshot (updated)

```typescript
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;   // null for non-drawer (from Scenario 2)
  guesses: Guess[];            // full history, all callers
  scores: Record<string, number>;  // all participants
  participants: Participant[];
  availableWords: string[];    // [] during "playing" (from Scenario 2)
  roles: ParticipantRole[];
}
```

**Added**: `guesses` and `scores` — no viewer-based filtering; everyone sees the full history and scores.

---

## Validation Rules (Zod — `backend/src/api/schemas.ts`)

### guessSchema (new)

```typescript
const guessSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID"),
  guess: z.string().trim().min(1, "Guess must not be empty")
});
```

---

## State Transitions (extended)

```
startGame():
  room.scores = { [p.id]: 0 for each p in room.participants }
  room.guesses = []   (already [] from createRoom, but explicit reset is safe)

submitGuess(code, participantId, guess):
  PRE: room.status === "playing"
  PRE: participantId !== room.drawerId   (else 403)
  trimmed = guess.trim()
  correct = trimmed.toLowerCase() === room.secretWord!.toLowerCase()
  room.scores[participantId] += correct ? 100 : 0
  room.guesses.push({ participantId, participantName, word: trimmed, correct, submittedAt: now() })
```

---

## Constraints & Invariants

- `room.scores` MUST have an entry for every participant present at game start.
- `submitGuess()` MUST only execute when `room.status === "playing"`.
- The drawer (`room.drawerId`) MUST be rejected with 403 — never added to `guesses`.
- Guess words are stored as-trimmed (preserving original case); comparison is always lowercased.
- `guesses` is append-only — no deletion, no deduplication.
