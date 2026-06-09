# Data Model: Room Setup & Lobby

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-09

## Backend Types (`backend/src/models/game.ts`)

### RoomStatus

```typescript
type RoomStatus = "lobby" | "playing" | "result";
```

Previously only `"lobby"` was defined. `"playing"` is required for this scenario
(start game transition). `"result"` is added to enable future scenarios without
a breaking change.

---

### Participant (unchanged)

```typescript
interface Participant {
  id: string;        // UUID — generated at join time
  name: string;      // Trimmed, non-empty display name
  joinedAt: string;  // ISO 8601 timestamp
}
```

No `isHost` flag — host identity lives on Room via `hostId`.

---

### Room (updated)

```typescript
interface Room {
  code: string;                // 4-char alphanumeric (e.g. "A2B3")
  status: RoomStatus;          // "lobby" | "playing" | "result"
  hostId: string;              // UUID of the first participant (the host)
  participants: Participant[];
  createdAt: string;           // ISO 8601
  updatedAt: string;           // ISO 8601
}
```

**Changed**: `status` type widened from `"lobby"` literal to `RoomStatus`.
**Added**: `hostId: string` — set at creation time to `participants[0].id`.

---

### RoomSnapshot (updated — API response shape)

```typescript
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;              // Added — frontend uses this to identify the host
  participants: Participant[];
  availableWords: string[];    // ["rocket","pizza","castle","guitar","sunflower"]
  roles: string[];             // ["drawer","guesser"]
}
```

**Changed**: `status` widened to `RoomStatus`.
**Added**: `hostId: string` — required by FR-009 so the frontend can identify
the host participant without scanning the participants array.

---

## Frontend Context (`frontend/src/state/roomStore.ts`)

The existing Context state is extended with:

```typescript
myParticipantId: string | null;  // UUID returned at create/join time; null before joining
```

This is set once (at create or join) and read throughout the session to determine
whether the current user is the host (`snapshot.hostId === myParticipantId`).

---

## Validation Rules (Zod — `backend/src/api/schemas.ts`)

### Name field (shared by create and join)

```
name: z.string().trim().min(1, "Name must not be empty")
```

This replaces any existing `z.string()` without trim/min on the name field.

### New: startGameSchema

```typescript
const startGameSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID"),
});
```

Used by `POST /rooms/:code/start`.

---

## State Transitions

```
Room status:
  "lobby"   ──[POST /rooms/:code/start, ≥2 participants, caller=hostId]──►  "playing"
  "playing" ──[future: round ends]──────────────────────────────────────►  "result"
  "result"  ──[future: restart]────────────────────────────────────────►   "lobby"
```

Only the `lobby → playing` transition is in scope for this scenario.

---

## Constraints & Invariants

- `Room.hostId` MUST equal `participants[0].id` at the moment of creation and
  MUST NOT change for the lifetime of the room.
- `Participant.name` MUST be stored as the trimmed value; the raw input is
  discarded after trim/validate.
- A room with `status !== "lobby"` MUST reject new join requests (out of scope
  to implement joins to in-progress rooms).
