# Research: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer-flow
**Date**: 2026-06-09

## Decision Log

### 1. Drawer assignment: `participants[0].id`

**Decision**: `room.drawerId = room.participants[0].id` set inside `startGame()`.

**Rationale**: `participants[0]` is always the room creator (the host) — the UUID
assigned at `POST /rooms` creation time. The array order is insertion-ordered in
the in-memory Map and is never shuffled. This is deterministic and requires no
additional tracking.

**Alternatives considered**: Random selection — rejected (constitution Principle IV
prohibits `Math.random()` in game logic). Separate host-picks-drawer UI — rejected
(out of scope, adds complexity).

---

### 2. Secret word: `STARTER_WORDS[0]` = `"rocket"`

**Decision**: `room.secretWord = STARTER_WORDS[0]` — constant `"rocket"`.

**Rationale**: Constitution Principle IV mandates determinism. Index 0 of the
seed list is a stable, reproducible choice. Acceptance tests can always expect
`"rocket"` without runtime variation.

**Alternatives considered**: `STARTER_WORDS[Math.floor(Math.random() * ...)]` —
rejected (constitution violation). User-selects word — rejected (out of scope).

---

### 3. Word visibility: viewer-aware `toRoomSnapshot()`

**Decision**: `toRoomSnapshot(room, viewerParticipantId)` already receives the
viewer's UUID. Add: if `room.status === "playing"` and
`viewerParticipantId !== room.drawerId`, return `secretWord: null`. Drawer
receives `secretWord: "rocket"`.

**Rationale**: The `viewerParticipantId` param is already threaded through from
the `GET /rooms/:code?participantId=` query — no API contract changes needed.
Server-side filtering is the correct layer for this; the client cannot be trusted.

**Alternatives considered**: Client-side hiding only — rejected (word would still
appear in network response, violating FR-003/SC-003). New dedicated endpoint —
rejected (brownfield principle; existing endpoint already supports viewer context).

---

### 4. `availableWords` during active round: always `[]`

**Decision**: In `toRoomSnapshot()`, when `room.status === "playing"`, return
`availableWords: []` for all callers regardless of role.

**Rationale**: `availableWords` is a lobby scaffold artefact. During gameplay it
is unused and its presence could leak the word list context. Emptying it for all
callers is the simplest, consistent fix. The drawer gets the word via `secretWord`
instead.

**Alternatives considered**: Filter only for guessers — rejected (per clarification
Q3, empty for all is simpler and equally correct). Remove field entirely — rejected
(would break existing client code that destructures the snapshot shape).

---

### 5. Game screen: single mount fetch (no polling interval)

**Decision**: `GamePage.tsx` calls `api.fetchRoom(code, myParticipantId)` once
inside a `useEffect` on mount, stores result in local state.

**Rationale**: Players arrive from the lobby already holding the current snapshot.
A single mount fetch handles the browser-refresh edge case (word re-fetched with
correct `participantId`). Continuous polling is deferred to Scenario 3 (guess
history sync). Keeping it simple here avoids premature complexity.

**Alternatives considered**: Continuous polling — deferred to Scenario 3.
Relying solely on lobby navigation state — rejected (browser refresh would lose
the word).

---

### 6. Role derivation: client-side from `drawerId`

**Decision**: `isDrawer = (myParticipantId === snapshot.drawerId)`. No role
field on `Participant`; role is derived on the fly.

**Rationale**: Role is a derived property of a single comparison. Storing it
redundantly on participants would introduce a consistency risk (what if
participants array and drawerId disagree?). Single source of truth = `drawerId`.

**Alternatives considered**: `role` field on each Participant — rejected
(redundant, consistency risk, unnecessary data model change).
