# Feature Specification: Result, Restart & Final Validation

**Feature Branch**: `scribbleAppByPriyanka`

**Created**: 2026-06-09

**Status**: Draft

**Input**: User description: "Result, Restart & Final Validation — Scenario 4: all players see the correct word, final scores, and full guess history on round end; on restart, everyone returns to the lobby with players preserved and all round state cleared."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Result State Visible to All Players (Priority: P1)

When a round ends (triggered by the host), all participants see a result screen
showing the secret word, the final scores, and the complete guess history. Every
player's view shows the same information simultaneously.

**Why this priority**: The result state is the culmination of the round. Without
it players have no feedback on the outcome, and the restart flow has no trigger
point.

**Independent Test**: With two browser tabs (drawer + guesser) in an active
game, the host triggers the end-of-round. Both tabs within ~2 seconds show:
- The secret word (`"rocket"`) revealed to everyone
- Final scores for all participants
- Full guess history in submission order

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the host ends the round (via a button or
   API call), **Then** the room status transitions from `"playing"` to `"result"`.

2. **Given** the room is in `"result"` status, **When** any participant's game
   screen polls the room snapshot, **Then** they see the secret word (`"rocket"`),
   all participants' final scores, and the complete guess history.

3. **Given** the room is in `"result"` status, **When** the drawer's tab polls,
   **Then** the secret word is visible to everyone (no longer drawer-only) and
   displayed prominently on the result screen.

4. **Given** two tabs are open during a round, **When** one tab polls and detects
   `status === "result"`, **Then** that tab automatically navigates to (or renders)
   the result view within approximately 2 seconds.

---

### User Story 2 — Host Restarts the Game (Priority: P1)

The host can restart the game from the result screen. On restart, all
participants are returned to the lobby with their names preserved, and all
round state (secret word, drawer assignment, guess history, scores) is cleared.
The room is ready for a new round.

**Why this priority**: The restart flow closes the gameplay loop and enables
multi-attempt play. Without it, players must create a new room to play again.

**Independent Test**: After the result screen is showing for both tabs, the
host clicks Restart. Both tabs navigate to the lobby within ~2 seconds. The
lobby shows the same participants with 0 scores. Starting a new game selects
`"rocket"` again (deterministic) and assigns the first participant as drawer.

**Acceptance Scenarios**:

1. **Given** the room is in `"result"` status, **When** the host triggers a
   restart, **Then** the room status transitions back to `"lobby"` and all
   round state is cleared: `drawerId = null`, `secretWord = null`,
   `guesses = []`, `scores = {}`.

2. **Given** a restart has occurred, **When** participants' screens poll and
   detect `status === "lobby"`, **Then** all participants are navigated to the
   lobby screen within approximately 2 seconds.

3. **Given** the lobby is shown after restart, **When** any participant views
   it, **Then** the participant list contains the same players who were in the
   round (no one is dropped).

4. **Given** a restart has occurred and the host starts a new game, **When**
   the game begins, **Then** the drawer is again the first participant
   (deterministic assignment) and the word is again `"rocket"`.

---

### User Story 3 — End-of-Round Trigger (Priority: P1)

The host can end the round from the game screen. Only the host can trigger this
action. The button is visible to all but actionable only by the host.

**Why this priority**: The end-of-round trigger is the gate between `"playing"`
and `"result"`. Without it, the result state can never be reached.

**Independent Test**: Tab 1 (host/drawer): End Round button is active. Tab 2
(non-host): End Round button is visible but disabled with explanatory label.
Host clicks End Round — both tabs transition to result view.

**Acceptance Scenarios**:

1. **Given** a round is active, **When** the host clicks End Round, **Then**
   the room status transitions to `"result"` and all participants' polling detects
   the change.

2. **Given** a round is active, **When** a non-host participant views the game
   screen, **Then** the End Round button is visible but disabled with a label
   (e.g., "Only the host can end the round").

3. **Given** the room is already in `"result"` status, **When** any participant
   attempts to end the round again, **Then** the action is rejected with an error.

---

### Edge Cases

- What if the backend restarts mid-result? → All state is lost (in-memory);
  participants see a "Room not found" error on the next poll.
- What if only 1 participant remains by result time? → Restart proceeds normally;
  the participant list is preserved as-is.
- What if the host leaves the browser during the result state? → No host-transfer
  mechanism; the room remains in `"result"` indefinitely unless another tab
  triggers restart. This is acceptable for the single-round demo scope.
- What if the non-host clicks End Round via a direct API call? → The backend
  MUST validate `participantId === room.hostId` and reject with 403.
- What if restart is called when status is not `"result"`? → The backend MUST
  reject with a 400 error.
- What if a correct guess was submitted just before End Round? → The guess is
  already persisted in `room.guesses`; the result screen reflects it correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The backend MUST expose a `POST /rooms/:code/end` endpoint that
  transitions `room.status` from `"playing"` to `"result"`, validates that the
  caller is the host, and returns the updated snapshot.
- **FR-002**: The backend MUST expose a `POST /rooms/:code/restart` endpoint that
  transitions `room.status` from `"result"` to `"lobby"` and clears:
  `drawerId = null`, `secretWord = null`, `guesses = []`, `scores = {}`.
  Participants MUST be preserved unchanged.
- **FR-003**: In `"result"` status, `toRoomSnapshot()` MUST return the `secretWord`
  to all callers (no longer filtered by `drawerId`) so everyone sees the word.
- **FR-004**: `GamePage.tsx` MUST detect `status === "result"` during polling and
  replace the playing UI with a result section showing: secret word revealed to all,
  final scores for all participants, and full guess history in submission order.
- **FR-005**: The result view (or game screen in result state) MUST show a Restart
  button visible to all participants; only the host's button is active.
  Non-host participants see it disabled with an explanatory label.
- **FR-006**: The result view MUST show a Restart button visible to all but only
  actionable by the host (`myParticipantId === room.hostId`).
- **FR-007**: After restart, the game screen polling MUST detect `status === "lobby"`
  and navigate all participants to the lobby screen.
- **FR-008**: The game screen MUST show an End Round button during `"playing"` status;
  it MUST be active only for the host; non-hosts see it disabled with a label.

### Key Entities

- **Room** (updated): `status` now cycles through `"lobby"` → `"playing"` →
  `"result"` → `"lobby"`. No new fields added; the restart endpoint resets
  existing fields.
- **RoomSnapshot** (updated): `secretWord` visibility rule changes: in `"result"`
  status it is returned to all callers (not filtered).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested end-of-round triggers, both tabs show the result
  view (secret word + scores + history) within approximately 2 seconds.
- **SC-002**: In 100% of restart triggers, all participant tabs navigate to the
  lobby within approximately 2 seconds with the participant list intact.
- **SC-003**: After restart, starting a new game produces the same drawer
  (first participant) and the same word (`"rocket"`) in 100% of tests —
  confirming determinism is preserved across rounds.
- **SC-004**: The End Round and Restart buttons are blocked 100% of the time
  for non-host participants (backend 403 and frontend disabled state).

## Assumptions

- The "end of round" is explicitly triggered by the host — there is no automatic
  end condition (e.g., all guessers correct, timer expired). Timers and automatic
  end conditions are out of scope per README.
- The result screen is rendered as a conditional section directly within
  `GamePage.tsx`. When `snapshot.status === "result"`, the playing UI is replaced
  with a result section showing the secret word, scores, and guess history.
  No separate route or `ResultPanel.tsx` delegation is needed — the `/game`
  route handles both `"playing"` and `"result"` states based on `snapshot.status`.
- Only the host can end the round and restart. No host-transfer mechanism is in
  scope.
- After restart, scores are fully cleared to `{}` (empty object). The next game
  start will re-initialise them to 0 for all current participants.
- The `secretWord` visibility rule in `toRoomSnapshot()` needs one additional
  condition: when `status === "result"`, return `secretWord` to everyone.
- Polling continues on the game screen through the result state — the same
  `setInterval` from Scenario 3 handles status transitions to both `"playing"`
  and `"result"`.
- Out-of-scope: multiple rounds with drawer rotation, timers, speed bonuses,
  room passwords, spectator mode, persistent leaderboards.

## Clarifications

### Session 2026-06-09

- Q: Where should the result state UI be rendered — inside GamePage.tsx or delegated to ResultPanel.tsx? → A: Conditional section directly inside GamePage.tsx; when status === "result", replace playing UI with result section
