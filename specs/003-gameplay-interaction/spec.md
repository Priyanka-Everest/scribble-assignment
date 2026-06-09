# Feature Specification: Gameplay Interaction

**Feature Branch**: `scribbleAppByPriyanka`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Gameplay Interaction — Scenario 3: interactive drawing canvas, clear canvas, guess submission with validation, synced guess history via polling, deterministic scoring"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Uses the Drawing Canvas (Priority: P1)

The drawer can draw on a canvas using their mouse or touch. The canvas is
interactive and renders strokes in real time on their own screen. The drawer
can also clear the canvas to start over.

**Why this priority**: The drawing canvas is the core mechanic of the game.
Without it, the drawer has nothing to do and guessers have nothing to guess from.

**Independent Test**: Start a game as the drawer. Draw on the canvas — confirm
strokes appear. Click Clear Canvas — confirm the canvas resets to blank.
(Canvas sync to guessers is Scenario 3's polling concern and is covered in US3.)

**Acceptance Scenarios**:

1. **Given** the drawer is on the game screen, **When** they press and drag the
   mouse across the canvas, **Then** a visible stroke appears following the
   cursor path.

2. **Given** the drawer has drawn something, **When** they click the Clear Canvas
   button, **Then** the entire canvas is wiped to blank and the button is only
   visible to the drawer.

3. **Given** a guesser is on the game screen, **When** they view the canvas area,
   **Then** they see a blank white canvas of the same size with no drawing
   controls or Clear Canvas button.

---

### User Story 2 — Guesser Submits a Guess (Priority: P1)

A guesser types a word and submits it. The system validates the guess (non-empty,
trimmed), compares it case-insensitively to the secret word, records the result
(correct = 100 points, incorrect = 0), and adds it to the shared guess history.

**Why this priority**: Guess submission is the core interaction for guessers and
the primary driver of the scoring and history features.

**Independent Test**: As a guesser, submit an empty guess — confirm error shown.
Submit an incorrect guess — confirm it appears in guess history with 0 points.
Submit the correct word `"rocket"` (case-insensitive) — confirm correct result
and 100 points awarded.

**Acceptance Scenarios**:

1. **Given** a guesser submits an empty or whitespace-only guess, **When** the
   form is submitted, **Then** an inline error is shown and no guess is recorded.

2. **Given** a guesser submits `"ROCKET"` (uppercase), **When** the guess is
   evaluated, **Then** it is treated as correct (case-insensitive match against
   `"rocket"`) and 100 points are awarded to that participant.

3. **Given** a guesser submits `"pizza"` (wrong word), **When** the guess is
   evaluated, **Then** it is recorded as incorrect and 0 points are awarded.

4. **Given** a guesser submits `"  rocket  "` (correct word with spaces),
   **When** the guess is evaluated, **Then** the trimmed value `"rocket"` is
   compared and the guess is correct.

5. **Given** the drawer views the game screen, **When** the game screen renders,
   **Then** the guess form is not shown at all — the drawer has no guess input.

---

### User Story 3 — Synced Guess History via Polling (Priority: P2)

All participants see a shared, up-to-date list of guesses. The list updates
automatically via polling so every player sees new guesses within approximately
2 seconds without manual action.

**Why this priority**: Without synced history, guessers don't know what has
been tried, and the drawer can't see progress. Polling is the only allowed sync
mechanism per the constitution.

**Independent Test**: Open two tabs (drawer + guesser). Submit a guess from the
guesser tab. Within ~2 seconds, the drawer's tab automatically shows the guess
in the history list with the correct outcome label.

**Acceptance Scenarios**:

1. **Given** a guesser submits a guess, **When** the drawer's game screen polls,
   **Then** within approximately 2 seconds the drawer sees the new guess entry
   in the history list (participant name, guessed word, correct/incorrect).

2. **Given** multiple guesses have been made, **When** any participant views the
   game screen, **Then** all guesses appear in the history in submission order.

3. **Given** the game screen is mounted, **When** the polling interval fires,
   **Then** the guess history is replaced (not appended) with the server's
   current list — no duplicates accumulate.

4. **Given** a participant navigates away from the game screen, **When** the
   component unmounts, **Then** the polling interval is cleared.

---

### User Story 4 — Scoring System (Priority: P2)

Each participant's score is tracked and displayed. A correct guess awards 100
points; an incorrect guess awards 0. Scores start at 0 and accumulate across
the round. The scoreboard is visible to all participants.

**Why this priority**: Scoring provides feedback and motivation. It depends on
guess submission (US2) being complete first.

**Independent Test**: Start a game with two guessers. One submits a correct
guess, one submits a wrong guess. Confirm the scoreboard shows 100 for the
correct guesser and 0 for the incorrect one.

**Acceptance Scenarios**:

1. **Given** the game starts, **When** any participant views the scoreboard,
   **Then** all participants are listed with a score of 0.

2. **Given** a guesser submits a correct guess, **When** the scoreboard updates,
   **Then** that participant's score increases by 100.

3. **Given** a guesser submits an incorrect guess, **When** the scoreboard
   updates, **Then** that participant's score remains unchanged (0 added).

4. **Given** multiple correct guesses are submitted, **When** the scoreboard is
   viewed, **Then** each correct guesser's total reflects the cumulative 100-point
   increments.

---

### Edge Cases

- What if the drawer submits a guess? → The guess form is not rendered for the
  drawer (FR-003). If the backend receives a guess from the drawer's
  `participantId` anyway, it MUST reject it with a 403 error (FR-009).
- What if a guesser submits the correct word more than once? → The second
  submission is still evaluated; it scores 100 again (no deduplication). The
  history records both entries.
- What if two guessers simultaneously submit the correct word? → Both are
  evaluated independently; both score 100. No race condition — each request is
  atomic in the in-memory store.
- What if the guess history grows large? → No pagination is required for this
  single-round scope. All guesses are displayed in order.
- What if the backend restarts mid-round? → All state is lost. Players see a
  "Room not found" error on the next poll (same as lobby 404 handling).
- What if the canvas data is too large to sync? → Canvas synchronisation to
  guessers is out of scope for this scenario (Scenario 3 only covers the drawer's
  own interactive canvas). Canvas sync is deferred.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game screen MUST render an interactive drawing canvas for the
  drawer, allowing mouse/touch-based stroke drawing.
- **FR-002**: The drawer's canvas MUST have a Clear Canvas button that wipes
  all strokes when clicked. This button MUST NOT be shown to guessers.
- **FR-003**: The guess submission form MUST be rendered only for guessers; it
  MUST be completely hidden (not rendered) for the drawer.
- **FR-004**: Guesses MUST be trimmed before comparison and storage; empty or
  whitespace-only guesses MUST be rejected with an inline error.
- **FR-005**: Guess comparison MUST be case-insensitive and exact (trimmed
  guess equals trimmed secret word, ignoring case).
- **FR-006**: A correct guess MUST award exactly 100 points to the submitting
  participant. An incorrect guess MUST award 0 points.
- **FR-007**: Each submitted guess MUST be stored as a `Guess` record containing:
  participant ID, participant name, guessed word, whether it was correct, and a
  timestamp.
- **FR-008**: The backend MUST expose a `POST /rooms/:code/guess` endpoint that
  accepts `{ participantId, guess }`, validates the inputs, evaluates the guess,
  updates scores, and appends to the guess history.
- **FR-009**: The backend MUST reject guess submissions from the drawer
  (`participantId === room.drawerId`) with a 403 error.
- **FR-010**: The `GET /rooms/:code` snapshot MUST include `guesses: Guess[]`
  and `scores: Record<participantId, number>` so the frontend can display history
  and the scoreboard via polling.
- **FR-011**: The game screen MUST poll `GET /rooms/:code` on approximately a
  2-second interval to sync guess history and scores. The interval MUST be
  cleared on unmount.

### Key Entities

- **Guess**: `{ participantId: string, participantName: string, word: string, correct: boolean, submittedAt: string }`
- **Room** (updated): gains `guesses: Guess[]` (empty array initially) and
  `scores: Record<string, number>` (all participants start at 0 on game start).
- **RoomSnapshot** (updated): gains `guesses: Guess[]` and
  `scores: Record<string, number>`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The drawer can draw and clear the canvas with no error in 100% of
  tested interactions on the local dev setup.
- **SC-002**: 100% of empty or whitespace-only guess submissions are rejected
  with a visible inline error before any server request.
- **SC-003**: A correct guess (`"rocket"`, case-insensitive) awards exactly 100
  points in 100% of tested submissions; an incorrect guess awards 0.
- **SC-004**: A submitted guess appears in all participants' guess history views
  within approximately 2 seconds (one polling cycle) of submission.
- **SC-005**: The scoreboard displays accurate cumulative scores for all
  participants, updated within one polling cycle of each guess submission.

## Assumptions

- Canvas synchronisation to guessers (showing what the drawer draws on other
  screens) is out of scope for this scenario. The canvas is interactive for the
  drawer only; guessers see a blank white canvas of the same size with no
  drawing controls.
- The drawing canvas is implemented using the HTML5 `<canvas>` element with
  mouse events (`mousedown`, `mousemove`, `mouseup`). No external canvas library
  is required.
- Scores are stored as a `Record<participantId, number>` on the Room, initialised
  to 0 for all current participants inside `startGame()` when status transitions
  to `"playing"`. Every participant present at start has an entry; late joiners
  are out of scope.
- The guess history is an append-only array on the Room; no deletion or
  deduplication is performed.
- The `POST /rooms/:code/guess` endpoint does not require the room to be in a
  specific terminal state — it works during `"playing"` only; guesses in
  `"lobby"` or `"result"` are rejected with a 400 error.
- The drawer's `participantId === room.drawerId` check is the authorisation
  mechanism for rejecting drawer guesses (no auth sessions).
- Out-of-scope per README and constitution: canvas sync to other screens,
  WebSockets, databases, auth, multiple rounds, timers, speed bonuses.

## Clarifications

### Session 2026-06-09

- Q: Should the guess form be hidden or disabled for the drawer? → A: Hidden entirely — form does not render for the drawer
- Q: When should the `scores` map be initialised on the Room? → A: In `startGame()` — initialise scores to 0 for all current participants when status transitions to "playing"
- Q: What do guessers see in the canvas area during an active round? → A: Blank white canvas of the same size — no drawing controls, no text placeholder
