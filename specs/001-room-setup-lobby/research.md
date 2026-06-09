# Research: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-09

## Decision Log

### 1. Host tracking: `hostId` on Room vs `isHost` on Participant

**Decision**: `hostId: string` field on Room, set at creation time to the first
participant's UUID.

**Rationale**: Single source of truth; checking host permission is O(1)
(`room.hostId === participantId`) vs scanning all participants. The Room already
owns the authoritative participant list, so storing host identity there is
cohesive.

**Alternatives considered**: `isHost: boolean` on Participant — rejected because
it requires scanning participants and risks inconsistency if the array is mutated.

---

### 2. Frontend identity persistence: `roomStore` context

**Decision**: Store `myParticipantId: string` in the existing
`frontend/src/state/roomStore.ts` Context.

**Rationale**: The Context is already passed through all pages (Lobby, Game,
Result). Adding `myParticipantId` there avoids prop-drilling and follows the
established brownfield pattern without introducing new state management.

**Alternatives considered**: `useState` local to each page — rejected because it
is lost on navigation between pages (e.g., Lobby → Game → back).

---

### 3. Lobby polling mechanism

**Decision**: `setInterval` inside a `useEffect` in `LobbyPage.tsx`, calling
`GET /rooms/:code` every 2000ms.

**Rationale**: Standard React pattern for polling. `useEffect` cleanup
(`clearInterval`) prevents memory leaks on unmount. Aligns with AGENTS.md
React patterns and constitution principle I.

**Alternatives considered**: External polling library — rejected (no new
dependencies; constitution Principle V).

---

### 4. Start game endpoint design

**Decision**: `POST /rooms/:code/start` with body `{ participantId: string }`.
Returns 200 with updated snapshot on success; 400 if < 2 players; 403 if caller
is not the host; 404 if room not found.

**Rationale**: RESTful action endpoint consistent with existing `/rooms/:code/join`
pattern. Passing `participantId` in the body avoids introducing auth/sessions
(Principle II) while still allowing the backend to verify host identity.

**Alternatives considered**: Query param for participantId — rejected; body is
more conventional for POST and consistent with the join endpoint.

---

### 5. Non-host Start button treatment

**Decision**: Button rendered for all participants but `disabled` with
`title="Only the host can start"` for non-host participants.

**Rationale**: Better UX — players understand the feature exists and why they
cannot use it. Consistent with common lobby UI patterns (e.g., Steam, Discord
games).

**Alternatives considered**: Hidden for non-host — rejected per clarification Q2.

---

### 6. 404 polling error handling

**Decision**: Redirect to Start screen (`/`) with an error message "Room not
found" and clear the polling interval.

**Rationale**: A 404 means the room is permanently gone (backend restarted or
code invalid). The lobby is unrecoverable; the player needs a clear path to
start fresh.

**Alternatives considered**: Inline error on lobby — rejected per clarification Q4.

---

### 7. API base URL bug fix

**Decision**: Change `frontend/src/services/api.ts` default base URL from
`http://localhost:3001/bug` to `http://localhost:3001`.

**Rationale**: Identified in discovery.md as a known bug blocking all API calls.
Fixing this is a prerequisite for any frontend work in this scenario.

**Source**: `discovery.md` — Known Issues §1.
