# Data Model: Game Start & Drawer Flow

**Feature**: 002-game-start-drawer-flow
**Date**: 2026-06-09

## Backend Types (`backend/src/models/game.ts`)

### Room (updated)

```typescript
interface Room {
  code: string;
  status: RoomStatus;          // "lobby" | "playing" | "result"
  hostId: string;              // UUID of creator (from Scenario 1)
  drawerId: string | null;     // UUID of drawer; null until game starts
  secretWord: string | null;   // The secret word; null until game starts
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}
```

**Added**: `drawerId: string | null` — set to `participants[0].id` in `startGame()`.
**Added**: `secretWord: string | null` — set to `STARTER_WORDS[0]` in `startGame()`.
Both are `null` while `status === "lobby"`.

---

### RoomSnapshot (updated — API response shape)

```typescript
interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;              // from Scenario 1
  drawerId: string | null;     // null in lobby; set in playing
  secretWord: string | null;   // null for guessers and in lobby; "rocket" for drawer
  participants: Participant[];
  availableWords: string[];    // always [] during "playing"; seed list in lobby
  roles: ParticipantRole[];
}
```

**Added**: `drawerId: string | null` — always present; null in lobby.
**Added**: `secretWord: string | null` — server-filtered:
  - `status === "lobby"` → `null` for everyone
  - `status === "playing"` and `viewerParticipantId === drawerId` → `"rocket"`
  - `status === "playing"` and anyone else → `null`

**Changed**: `availableWords` — returns `[]` when `status === "playing"`.

---

## Visibility Rules (enforced in `toRoomSnapshot`)

| Caller | Room status | `secretWord` returned | `availableWords` returned |
|--------|-------------|----------------------|--------------------------|
| Any | `"lobby"` | `null` | full seed list |
| Drawer | `"playing"` | `"rocket"` | `[]` |
| Guesser / unknown | `"playing"` | `null` | `[]` |
| Any | `"result"` | `"rocket"` (revealed) | `[]` |

*Result-state word reveal is noted for future Scenario 4 consistency; not in scope for this scenario.*

---

## State Transitions (extended)

```
Room.status:
  "lobby"
    drawerId   = null
    secretWord = null
        │
        │ POST /rooms/:code/start (host, ≥2 players)
        ▼
  "playing"
    drawerId   = participants[0].id   ("rocket" visible to drawer only)
    secretWord = "rocket"
        │
        │ [future Scenario 4 — round ends]
        ▼
  "result"
```

---

## Constraints & Invariants

- `Room.drawerId` MUST equal `participants[0].id` at the moment `startGame()` is
  called and MUST NOT change for the lifetime of the round.
- `Room.secretWord` MUST equal `STARTER_WORDS[0]` (`"rocket"`) — no other value
  is valid for this scenario.
- `toRoomSnapshot()` MUST NOT return `secretWord` to any caller whose
  `participantId` differs from `room.drawerId` when `status === "playing"`.
- `availableWords` MUST be `[]` whenever `status === "playing"`.
