# Feature Specification: Room Setup & Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-08

**Status**: Draft

**Input**: User description: "Room Setup & Lobby — refer readme.md and discovery.md"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Room and Become Host (Priority: P1)

A player opens the app, enters a display name, and creates a new game room.
The system generates a unique 4-character room code, stores the room in memory,
marks the creator as the host, and navigates them to the Lobby screen showing
their own name in the participant list.

**Why this priority**: Room creation is the entry point for all other scenarios.
Without a host-tracked room, no other lobby or game flow can be validated.

**Independent Test**: Open one browser tab, create a room with a valid name, and
confirm the Lobby screen shows the room code and the creator's name. Verify the
creator is identified as host in the UI. No second player required.

**Acceptance Scenarios**:

1. **Given** a player is on the Start screen, **When** they enter a non-empty
   trimmed name and click Create Room, **Then** they land on the Lobby screen
   showing their name, the unique room code, and a "Host" indicator.

2. **Given** a player submits a name that is empty or whitespace-only,
   **When** the Create Room form is submitted, **Then** the form displays a
   clear inline error message and does not create a room.

3. **Given** a player enters a valid name with leading/trailing whitespace,
   **When** they create a room, **Then** the stored participant name is the
   trimmed value (e.g., `"  Alice  "` → `"Alice"`).

4. **Given** two rooms are created independently, **When** each is inspected,
   **Then** they have different room codes and each room's participant list
   contains only its own players (full isolation).

---

### User Story 2 — Join a Room by Code (Priority: P1)

A second player opens the app, enters a valid room code and a display name,
and is added to the existing room's participant list. Both the joining player
and the host see the updated list after the lobby refreshes.

**Why this priority**: Joining is co-equal with creation — the two-player
minimum needed to start a game requires at least one successful join.

**Independent Test**: Open a second browser tab, join the room created in US1,
and confirm the join succeeds. The lobby in both tabs should eventually display
both participants after the polling interval.

**Acceptance Scenarios**:

1. **Given** a valid room code exists, **When** a player enters that code and a
   non-empty trimmed name and clicks Join Room, **Then** they land on the Lobby
   screen showing both participants.

2. **Given** a player submits an invalid or non-existent room code, **When**
   the Join Room form is submitted, **Then** a clear error message is displayed
   and no navigation occurs.

3. **Given** a player enters an empty or whitespace-only name on the Join
   screen, **When** the form is submitted, **Then** an inline error is shown
   and the join is not attempted.

4. **Given** a player enters a valid code with leading/trailing whitespace,
   **When** they submit, **Then** the code is trimmed before lookup (e.g.,
   `" A2B3 "` resolves the same as `"A2B3"`).

---

### User Story 3 — Automatic Lobby Polling (~2s) (Priority: P2)

While waiting in the lobby, all participants' screens automatically refresh the
participant list without any manual action. New joiners appear within approximately
2 seconds on all open lobby screens.

**Why this priority**: Without polling, players can't see when others join,
making the "2-player minimum" start check unusable in practice.

**Independent Test**: Open two tabs in the lobby of the same room. In the second
tab, the first participant should be visible automatically within ~2 seconds of
joining, with no manual refresh button clicked.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby screen, **When** another player joins
   the room, **Then** within approximately 2 seconds the first player's lobby
   automatically shows the new participant without any user interaction.

2. **Given** a player's lobby is polling, **When** no changes have occurred,
   **Then** the lobby remains stable (no flicker, no error messages, no
   duplicate entries).

3. **Given** the polling is active, **When** the player navigates away from the
   lobby, **Then** the polling interval is cleared (no memory leaks or background
   requests).

---

### User Story 4 — Host-Only Start Game (Priority: P2)

The host can start the game from the lobby once at least 2 players are present.
Non-host players see the lobby but cannot trigger a start. Attempting to start
with fewer than 2 players is rejected with a clear message.

**Why this priority**: Enforcing the 2-player minimum and host-only permission
are explicit acceptance criteria in Scenario 1 of the README and depend on US1
and US2 being complete.

**Independent Test**: With two browser tabs in the same room lobby, confirm only
the host tab shows an active Start Game button. Click it and verify the backend
transitions the room status and both tabs navigate to the game screen (or that
navigation is gated appropriately).

**Acceptance Scenarios**:

1. **Given** the host is in the lobby with at least 2 participants, **When**
   the host clicks Start Game, **Then** the game start is triggered and the
   room status transitions from `"lobby"` to `"playing"`.

2. **Given** only 1 participant is present, **When** the host clicks Start
   Game (or the button is shown), **Then** the action is blocked and a message
   explains that at least 2 players are required.

3. **Given** a non-host participant is in the lobby, **When** they view the
   lobby, **Then** the Start Game button is visible but disabled with a label
   indicating host-only access (e.g., "Only the host can start").

4. **Given** the host has started the game, **When** a non-host participant's
   lobby polls and detects the `"playing"` status, **Then** that participant
   is also navigated to the game screen.

---

### Edge Cases

- What happens when a player tries to join a room that is already in `"playing"`
  or `"result"` state? → Return a clear error; late joins are out of scope.
- What happens when two players simultaneously submit the same room code to
  join? → Both succeed; each gets a unique UUID; the participant list grows
  to accommodate both.
- What happens if the backend restarts while players are in the lobby? → The
  room is lost (in-memory only); the frontend MUST redirect the player to the
  Start screen with a "Room not found" error message and stop polling.
- What happens if a player refreshes their browser in the lobby? → They lose
  local state; they must rejoin. Re-joining with the same name is permitted
  (results in a second participant entry with a new UUID).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store the host as `hostId: string` on the Room,
  set to the UUID of the first participant at room creation time.
- **FR-002**: The system MUST reject player names that are empty or consist
  entirely of whitespace, returning a descriptive error message on both the
  backend and frontend.
- **FR-003**: The system MUST trim leading and trailing whitespace from player
  names before storing them.
- **FR-004**: The backend MUST expose a `POST /rooms/:code/start` endpoint (or
  equivalent) that transitions room status from `"lobby"` to `"playing"`,
  enforcing a minimum of 2 participants and host-only permission.
- **FR-005**: The `RoomStatus` type MUST include at least `"lobby"` and
  `"playing"` values; `"result"` MAY be included to support future scenarios.
- **FR-006**: The lobby MUST poll the room snapshot endpoint on approximately a
  2-second interval while the Lobby screen is mounted.
- **FR-007**: The polling interval MUST be cancelled when the Lobby component
  unmounts.
- **FR-008**: The frontend MUST fix the incorrect API base URL
  (`http://localhost:3001/bug` → `http://localhost:3001`) so all API calls
  reach the backend.
- **FR-009**: The frontend MUST display a "host" indicator alongside the
  participant whose UUID matches `RoomSnapshot.hostId`.
- **FR-010**: The Start Game button MUST be visible to all participants but
  disabled with an explanatory label for non-host participants (e.g., "Only the
  host can start"); only the host's button is interactive.
- **FR-011**: Each room MUST be fully isolated; actions in one room MUST NOT
  affect any other room's state or participant list.

### Key Entities

- **Room**: Uniquely identified by a 4-character alphanumeric code; holds status,
  participant list, host reference, timestamps.
- **Participant**: Identified by a UUID; has a trimmed display name and a join
  timestamp. No `isHost` flag on the Participant — host identity is resolved via
  `Room.hostId`.
- **RoomSnapshot**: The API response shape returned by `GET /rooms/:code`; MUST
  include `hostId` so the frontend can identify the host and current status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and land on the lobby screen in under
  5 seconds on a local development setup.
- **SC-002**: A second player can join using the room code and appear in both
  players' lobby views within approximately 2 seconds (one polling cycle).
- **SC-003**: 100% of empty or whitespace-only name submissions are rejected
  with a visible error before any network request reaches the backend.
- **SC-004**: The host-only Start Game action is blocked 100% of the time when
  triggered by a non-host participant or when fewer than 2 players are present.
- **SC-005**: Two simultaneously active rooms remain fully isolated — no
  cross-room participant visibility in any tested scenario.
- **SC-006**: The lobby polling produces no visible errors and no duplicate
  participant entries across a 30-second observation window with two active
  browser tabs.

## Assumptions

- The frontend identifies "who I am" by persisting the participant UUID returned
  at room creation or join time in the existing `roomStore` context
  (`src/state/roomStore.ts`). No authentication or session storage is used.
- The host is determined solely by `Room.hostId` (the UUID of the first participant);
  there is no host-transfer mechanism in scope.
- The room code generated by the backend is sufficiently unique for a small
  local demo (4 alphanumeric characters); collision handling is not required.
- Lobby polling uses `setInterval` in a `useEffect` hook, following the
  established React patterns in the codebase.
- The `GET /rooms/:code` snapshot endpoint is sufficient as the polling target;
  no new polling-specific endpoint is required for this scenario.
- "Game started" navigation for non-host players is achieved by detecting
  `status === "playing"` in the polled snapshot and navigating to the Game screen.
- Out-of-scope items per README and constitution: WebSockets, databases,
  authentication, multiple rounds, timers, room passwords, spectator mode.

## Clarifications

### Session 2026-06-09

- Q: Should the host be tracked as `hostId` on the Room, or as `isHost` on each Participant? → A: `hostId: string` on Room (single UUID reference to the first participant)
- Q: For non-host participants, should the Start Game button be hidden or disabled? → A: Visible but disabled with an explanatory label (e.g., "Only the host can start")
- Q: Where should the participant's own UUID be stored after room creation/join? → A: Existing `roomStore` context (`src/state/roomStore.ts`)
- Q: When lobby polling receives a 404, should the frontend redirect or show inline error? → A: Redirect to Start screen with a "Room not found" error message, stop polling
