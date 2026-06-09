# Implementation Plan: Room Setup & Lobby

**Branch**: `scribbleAppByPriyanka` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-room-setup-lobby/spec.md`

## Summary

Implement host tracking, player name validation, automatic lobby polling, and
host-only game start for the Scribble brownfield scaffold. The backend gains a
`hostId` field on Room, an expanded `RoomStatus` type, and a new
`POST /rooms/:code/start` endpoint. The frontend fixes the broken API base URL,
adds `myParticipantId` to the room context, enables 2-second lobby polling, and
renders a host indicator with conditional Start Game button behaviour.

## Technical Context

**Language/Version**: TypeScript 5.6.3 — backend (Node.js 18+) and frontend (React 18)

**Primary Dependencies**: Express 4.21.1 + Zod 3.23.8 (backend); React 18 + React Router 6 + Vite 5 (frontend) — no new dependencies introduced

**Storage**: In-memory Map in `backend/src/services/roomStore.ts` — no database

**Testing**: Vitest 3.1.3 in both `backend/` and `frontend/`; manual two-browser validation per constitution

**Target Platform**: Local dev — Node.js backend on port 3001, Vite frontend on port 5173

**Project Type**: Web application (frontend + minimal REST backend)

**Performance Goals**: Lobby polling cycle ~2s; room creation → lobby navigation under 5s

**Constraints**: No WebSockets, no DB, no auth; brownfield — touch only files listed below

**Scale/Scope**: Small local multi-player demo; no horizontal scaling required

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. HTTP-Polling Only | No WebSockets or push protocol introduced | ✅ PASS | Lobby uses `setInterval` + `GET /rooms/:code` |
| II. In-Memory State Only | No DB, no auth, no sessions introduced | ✅ PASS | `roomStore` Map unchanged as storage mechanism |
| III. TypeScript First | All new/modified files fully typed; Zod on new endpoint | ✅ PASS | New endpoint schema added to `schemas.ts` |
| IV. Deterministic Game Rules | `hostId` = first participant UUID (deterministic) | ✅ PASS | No `Math.random()` in host assignment |
| V. Brownfield Discipline | No new top-level dependencies; only required files touched | ✅ PASS | 9 files modified, 0 new dependencies |

*Post-design re-check: all gates still pass — see contracts and data model.*

## Project Structure

### Documentation (this feature)

```text
specs/001-room-setup-lobby/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── get-room.md
│   ├── post-rooms.md
│   ├── post-join.md
│   └── post-start.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          # ADD hostId to Room; expand RoomStatus
│   ├── services/
│   │   └── roomStore.ts     # SET hostId on create; ADD startGame()
│   └── api/
│       ├── rooms.ts         # ADD POST /rooms/:code/start route
│       └── schemas.ts       # ADD name trim validation; ADD startGameSchema
└── (tests/ — optional Vitest unit tests for roomStore)

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           # FIX base URL; ADD startGame() call
│   ├── state/
│   │   └── roomStore.ts     # ADD myParticipantId to context state
│   └── pages/
│       ├── CreateRoomPage.tsx  # ADD name validation; STORE myParticipantId
│       ├── JoinRoomPage.tsx    # ADD name validation; STORE myParticipantId
│       └── LobbyPage.tsx       # ADD polling; ADD host indicator; ADD start logic
```

**Structure Decision**: Web application layout (Option 2). Two separate projects
under `backend/` and `frontend/` — the established scaffold structure. No new
directories needed.

## Implementation Sequence

Dependencies must be respected:

1. **backend/src/models/game.ts** — expand types first; everything depends on this
2. **backend/src/api/schemas.ts** — validation schemas before route handlers
3. **backend/src/services/roomStore.ts** — business logic before route wiring
4. **backend/src/api/rooms.ts** — wire new endpoint last (depends on 1–3)
5. **frontend/src/services/api.ts** — fix URL bug first (blocks all FE work)
6. **frontend/src/state/roomStore.ts** — add `myParticipantId` before pages use it
7. **frontend/src/pages/CreateRoomPage.tsx** — stores `myParticipantId` on create
8. **frontend/src/pages/JoinRoomPage.tsx** — stores `myParticipantId` on join
9. **frontend/src/pages/LobbyPage.tsx** — polling + host UI (depends on 5–8)

## Data Flow

### Room Creation
```
CreateRoomPage
  → POST /rooms { name: trimmed }
  ← { code, hostId, participants: [{ id, name, joinedAt }], status: "lobby" }
  → store { code, hostId, myParticipantId: participants[0].id } in roomStore context
  → navigate to /lobby/:code
```

### Lobby Polling
```
LobbyPage (mounted)
  → setInterval(2000)
    → GET /rooms/:code
    ← RoomSnapshot { code, status, hostId, participants, availableWords, roles }
    → if status === "playing" → navigate to /game/:code
    → if 404 → navigate to / with "Room not found" error
    → else → update participant list in local state
  → clearInterval on unmount
```

### Start Game
```
LobbyPage (host only)
  → POST /rooms/:code/start { participantId: myParticipantId }
  ← 200 { status: "playing", ... } or 403/400 error
  → navigate to /game/:code (host)
  (non-host participants navigate via polling detecting status change)
```
