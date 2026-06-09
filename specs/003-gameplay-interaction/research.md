# Research: Gameplay Interaction

**Feature**: 003-gameplay-interaction
**Date**: 2026-06-09

## Decision Log

### 1. Drawing canvas: HTML5 Canvas API (no library)

**Decision**: Use the browser's native `<canvas>` element with the 2D rendering
context (`getContext("2d")`). Event handlers: `mousedown`, `mousemove`, `mouseup`,
`mouseleave` on the canvas element.

**Rationale**: No external library needed (constitution Principle V). The 2D
context API (`beginPath`, `moveTo`, `lineTo`, `stroke`) is sufficient for freehand
drawing. React manages the canvas via a `useRef` — the ref is used to get the
context; React does not manage the canvas pixels.

**Alternatives considered**: Fabric.js, Konva.js — rejected (new dependencies,
out-of-scope complexity). SVG paths — rejected (heavier for freehand; canvas
is the standard for drawing apps).

---

### 2. Canvas state: local component state only

**Decision**: Canvas pixels live only in the browser's canvas buffer on the
drawer's screen. No canvas data is sent to the server, no sync to guessers.

**Rationale**: Canvas sync is explicitly out of scope (README, constitution).
Guessers see a blank white canvas. The `clear` action only calls
`ctx.clearRect(0, 0, canvas.width, canvas.height)` — no server call needed.

**Alternatives considered**: Encoding canvas as base64 and storing on Room —
rejected (out of scope, large payload, no WebSocket support anyway).

---

### 3. Guess evaluation: `trimmedGuess.toLowerCase() === secretWord.toLowerCase()`

**Decision**: Both the submitted guess and the stored `secretWord` are trimmed
and lowercased before comparison. The stored word `"rocket"` is already lowercase,
but defensive lowercasing on both sides ensures correctness.

**Rationale**: Constitution Principle IV mandates deterministic, case-insensitive
exact match. No fuzzy matching, no partial credit.

**Alternatives considered**: `localeCompare` — unnecessary complexity for this
scope. Levenshtein distance — rejected (out of scope).

---

### 4. Scores: `Record<string, number>` initialised in `startGame()`

**Decision**: `room.scores = {}` populated with `{ [participant.id]: 0 }` for
every participant in `room.participants` at the moment `startGame()` transitions
status to `"playing"`.

**Rationale**: Clarification Q2 — initialising at start ensures every participant
has a score entry from the beginning of the round, including the drawer (score
stays 0). Lazy initialisation on first guess would require null-checks everywhere.

**Alternatives considered**: Lazy init on first guess — rejected per clarification.

---

### 5. Guess history: append-only `Guess[]` on Room

**Decision**: `room.guesses.push(guessRecord)` on each `submitGuess()` call.
No deduplication. Returned in full in every `RoomSnapshot`.

**Rationale**: Single-round scope; no pagination needed. Append-only is simplest
and consistent with the in-memory-only constraint. The spec explicitly permits
duplicate correct guesses (edge case covered).

---

### 6. Game screen polling: upgrade from single mount fetch to `setInterval`

**Decision**: Replace the single `useEffect` mount fetch in `GamePage.tsx` with
a `setInterval(2000)` that calls `api.fetchRoom(code, participantId)` and
replaces local snapshot state each cycle. Cleanup on unmount.

**Rationale**: Scenario 3 requires guess history and scores to sync to all
players within ~2s (SC-004, SC-005). The single mount fetch from Scenario 2 is
sufficient for role/word display but cannot deliver continuous sync. Upgrading
to polling is the only allowed mechanism (constitution Principle I).

**Note**: The `participantId` query param must still be passed on every poll so
the server can return `secretWord` to the drawer.

---

### 7. `POST /rooms/:code/guess` request shape

**Decision**: `{ participantId: string, guess: string }`. `participantId` is
passed in the body (consistent with `POST /rooms/:code/start` pattern). No auth
headers needed.

**Rationale**: Keeps the API shape consistent with the established brownfield
pattern. `participantId` is the only identity mechanism available (no sessions).
