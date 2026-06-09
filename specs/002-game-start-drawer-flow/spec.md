# Feature Specification: Game Start & Drawer Flow

**Feature Branch**: `scribbleAppByPriyanka`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Game Start & Drawer Flow — Scenario 2: player name validation (trim, reject empty), drawer assignment (first participant = drawer), deterministic secret word selection (index 0 of starter list), drawer-only word visibility."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Player Name Validation at Join Time (Priority: P1)

When a player creates or joins a room, their display name is validated: it must
be non-empty after trimming. Whitespace-only names are rejected with a clear
message before any room state changes.

**Why this priority**: Name validation is a prerequisite to all gameplay. Without
it, players can enter the game with blank or misleading names, making the drawer
and guesser roles unidentifiable.

**Independent Test**: On the Create Room and Join Room forms, attempt to submit
empty and whitespace-only names. Confirm inline error is shown and no room is
created or joined. Accept a name with surrounding spaces and confirm it is stored
trimmed.

**Acceptance Scenarios**:

1. **Given** a player is on the Create Room form, **When** they submit with an
   empty name, **Then** an inline error "Player name must not be empty" is shown
   and no room is created.

2. **Given** a player submits a name consisting only of whitespace (e.g. `"   "`),
   **When** the form is submitted on either Create or Join, **Then** the same
   error is shown and no network request is made.

3. **Given** a player enters `"  Alice  "`, **When** they create or join a room,
   **Then** the stored participant name is `"Alice"` (trimmed) and the form
   accepts the submission.

4. **Given** a player submits a single valid character (e.g. `"A"`), **When**
   they create a room, **Then** the room is created and the participant name is
   `"A"`.

---

### User Story 2 — Drawer Assignment on Game Start (Priority: P1)

When the host starts the game, the first participant who joined the room is
automatically assigned as the drawer. All other participants are guessers. The
drawer role is visible to all players on the game screen.

**Why this priority**: Drawer assignment must happen at game start — it determines
the entire round flow (word visibility, canvas access, guess evaluation). All
subsequent scenarios depend on knowing who the drawer is.

**Independent Test**: With two players in a lobby (Alice created, Bob joined),
start the game. Confirm Alice's game screen identifies her as the drawer. Confirm
Bob's screen identifies him as a guesser.

**Acceptance Scenarios**:

1. **Given** the game starts with Alice (creator, first participant) and Bob,
   **When** the game screen loads, **Then** Alice's view shows her role as
   "Drawer" and Bob's view shows his role as "Guesser".

2. **Given** the game starts with three participants (Alice, Bob, Carol),
   **When** the game screen loads, **Then** Alice (first to join) is the drawer
   and Bob and Carol are both guessers.

3. **Given** the game screen is showing, **When** any player views the
   participant list, **Then** each participant has a visible role label ("Drawer"
   or "Guesser").

---

### User Story 3 — Deterministic Secret Word Selection (Priority: P1)

When the game starts, the secret word is deterministically selected as the first
word in the starter word list (`"rocket"`). The same word is always selected for
the first round.

**Why this priority**: Determinism is required by the constitution — no
`Math.random()` in game logic. It makes acceptance testing reliable and
reproducible.

**Independent Test**: Start a game, note the word shown to the drawer. Restart
the backend, create a fresh room, start again. The word is `"rocket"` both times.

**Acceptance Scenarios**:

1. **Given** a game is started for the first time in a session, **When** the
   drawer's game screen loads, **Then** the secret word displayed is `"rocket"`
   (index 0 of `["rocket", "pizza", "castle", "guitar", "sunflower"]`).

2. **Given** two separate rooms both start a game, **When** each drawer views
   their word, **Then** both see `"rocket"` (word selection is deterministic, not
   random).

---

### User Story 4 — Drawer-Only Word Visibility (Priority: P1)

The secret word is visible only to the drawer. Guessers do not see the word at
any point during the round. The word is never exposed in API responses accessible
to guessers.

**Why this priority**: Exposing the word to guessers defeats the purpose of the
game. The current scaffold exposes `availableWords` to all participants — this
must be fixed.

**Independent Test**: Start a game with two browser tabs (drawer + guesser).
Confirm the word `"rocket"` appears on the drawer's screen. Confirm no word is
shown on the guesser's screen. Open DevTools in the guesser's tab and inspect the
network response for the room snapshot — confirm the word is absent or masked.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the drawer views the game screen,
   **Then** the secret word `"rocket"` is displayed prominently to them.

2. **Given** a round is active, **When** a guesser views the game screen,
   **Then** no secret word is shown — they see the static placeholder text
   `"Guess the word!"` in place of the word.

3. **Given** a guesser's browser fetches the room snapshot during a round,
   **When** the API response is inspected, **Then** the `secretWord` field is
   absent or `null` in the guesser's response (the word is not present in the
   network payload).

---

### Edge Cases

- What if the game is started with exactly 2 players (minimum)? → The first to
  join is the drawer, the second is the guesser. Both role labels MUST appear on
  their respective screens.
- What if the drawer refreshes their browser during a round? → They lose local
  state. The game screen must re-derive the drawer role from the room snapshot
  (by comparing their participant ID to the room's `drawerId`). The word must be
  re-fetched and still shown.
- What if a player joins a room that is already in `"playing"` status? → Late
  joins are out of scope. The system MUST reject the join with an appropriate
  error message.
- What if the backend restarts mid-round? → All state is lost (in-memory).
  Players will see a "Room not found" error on the next poll (handled by Scenario
  1 polling logic).
- What if the drawer refreshes during a round? → The game screen fetches the
  snapshot once on mount; the drawer's `participantId` is in context, so the
  snapshot returns `secretWord` and the role is re-derived correctly.
- What about the `availableWords` field in the snapshot? → It MUST return an
  empty array `[]` for all participants once the game starts (status `"playing"`),
  regardless of role. Word leakage is prevented without changing the API shape.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store `drawerId: string` on the Room, set to
  `participants[0].id` when the game starts (first participant to join = drawer).
- **FR-002**: The system MUST store `secretWord: string` on the Room, set
  deterministically to `STARTER_WORDS[0]` (`"rocket"`) when the game starts.
- **FR-003**: The `GET /rooms/:code` snapshot endpoint MUST return `secretWord`
  only when the requesting participant is the drawer (`participantId` query param
  matches `room.drawerId`); all other callers receive `secretWord: null`.
- **FR-004**: The `availableWords` field in the snapshot MUST be an empty array
  `[]` for all participants during an active round (status `"playing"`), regardless
  of role. This prevents word leakage while keeping the API shape consistent.
- **FR-005**: The game screen MUST display the participant's role ("Drawer" or
  "Guesser") prominently, derived by comparing `myParticipantId` to
  `room.drawerId`.
- **FR-006**: The game screen for the drawer MUST display the `secretWord`
  returned in the snapshot.
- **FR-007**: The game screen for guessers MUST NOT display the secret word; they
  see a neutral placeholder instead.
- **FR-008**: Player name validation (trim + reject empty) MUST be enforced on
  both the frontend (before submission) and the backend (Zod schema). *(Note:
  this was partially implemented in Scenario 1; this requirement confirms it
  applies to the game start flow as well and must be verified end-to-end.)*
- **FR-009**: The `RoomSnapshot` MUST include `drawerId: string | null` so the
  frontend can identify the drawer without scanning the participant list.

### Key Entities

- **Room** (updated): gains `drawerId: string | null` (null in lobby, set on
  game start) and `secretWord: string | null` (null in lobby, set on game start).
- **RoomSnapshot** (updated): gains `drawerId: string | null` and `secretWord:
  string | null` (null for non-drawer callers).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of game starts, the participant who created the room
  (first to join) is identified as the drawer on their game screen.
- **SC-002**: In 100% of game starts, the secret word shown to the drawer is
  `"rocket"` — verifiable by inspection across multiple independent test runs.
- **SC-003**: In 100% of tests, the guesser's game screen shows no secret word
  and the network response for their room snapshot contains no `secretWord` value.
- **SC-004**: 100% of empty or whitespace-only name submissions are rejected
  before any server request is made (frontend validation) and at the server
  boundary (backend validation).
- **SC-005**: Each participant's role label ("Drawer" / "Guesser") is visible on
  the game screen immediately on mount (players arrive from lobby with current
  snapshot; no polling interval required on the game screen for this scenario).

## Assumptions

- Drawer assignment uses `participants[0].id` — the UUID of the participant who
  called `POST /rooms` (the host). This is always the first element in the
  `participants` array as maintained by the in-memory store.
- Word selection is `STARTER_WORDS[0]` — the constant `"rocket"`. No rotation,
  no randomness, no user choice. This is fixed for the single-round scope.
- The `participantId` query parameter on `GET /rooms/:code` is the mechanism used
  to determine drawer vs guesser visibility — already present in the scaffold.
- The `availableWords` array in the snapshot is a scaffold artefact not used in
  active gameplay; it will be returned as `[]` for all participants once the game
  starts. The drawer receives the secret word via the dedicated `secretWord` field.
- The game screen fetches the room snapshot once on mount (not on an interval);
  this handles both the normal arrival-from-lobby flow and the browser-refresh
  edge case. Continuous game-screen polling is deferred to Scenario 3.
- The game screen already exists as a placeholder (`GamePage.tsx`); this scenario
  adds role display and word visibility to it without a full canvas
  implementation (that is Scenario 3).
- Multiple rounds, drawer rotation, timers, and speed bonuses are out of scope
  per the README and constitution.
- Late joins (joining a room with `status: "playing"`) are out of scope; the
  backend already returns a 404/error for rooms not found — a specific "game in
  progress" error message is a low-priority improvement.

## Clarifications

### Session 2026-06-09

- Q: Should the game screen poll continuously or fetch once on mount? → A: Fetch once on mount (handles browser refresh; no polling interval on game screen for this scenario)
- Q: What placeholder do guessers see where the secret word would appear? → A: Static text "Guess the word!"
- Q: How should `availableWords` be handled in the snapshot during an active round? → A: Return empty array `[]` for all participants (all roles) once status is "playing"
