# Implementation Plan: Result, Restart & Final Validation

**Branch**: `scribbleAppByPriyanka` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-result-restart/spec.md`

## Summary

Add two new backend endpoints (`POST /rooms/:code/end` and
`POST /rooms/:code/restart`), update `toRoomSnapshot()` to reveal `secretWord`
to all callers in `"result"` status, and extend `GamePage.tsx` to render the
result view (word + scores + history + restart/end-round controls) as a
conditional section based on `snapshot.status`. The existing game-screen polling
from Scenario 3 already handles status transitions — no new polling infrastructure
needed. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.6.3 — backend (Node.js 18+) and frontend (React 18)

**Primary Dependencies**: Express + Zod (backend); React 18 + React Router 6 (frontend) — no new dependencies

**Storage**: In-memory Map in `backend/src/services/roomStore.ts`

**Testing**: Manual two-browser validation per quickstart.md

**Target Platform**: Local dev — backend port 3001, frontend port 5173

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: Result view and lobby redirect detected within ~2s via existing polling

**Constraints**: No WebSockets, no DB, no auth; brownfield — touch only listed files

**Scale/Scope**: Single-round local demo; no multi-round rotation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. HTTP-Polling Only | Existing `setInterval` detects `"result"` and `"lobby"`; no push | ✅ PASS | No new interval needed |
| II. In-Memory State Only | `endGame()` and `restartGame()` mutate in-memory Map only | ✅ PASS | No DB |
| III. TypeScript First | New schemas + typed service functions; build gate enforced | ✅ PASS | |
| IV. Deterministic Game Rules | Restart clears state; next `startGame()` re-uses `participants[0]` + `STARTER_WORDS[0]` | ✅ PASS | SC-003 verifies |
| V. Brownfield Discipline | No new dependencies; 4 files touched | ✅ PASS | |

*Post-design re-check: all gates pass.*

## Project Structure

### Documentation (this feature)

```text
specs/004-result-restart/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── post-end.md
│   └── post-restart.md
└── tasks.md
```

### Source Code

```text
backend/
└── src/
    ├── api/
    │   ├── schemas.ts       # ADD endGameSchema, restartGameSchema
    │   └── rooms.ts         # ADD POST /rooms/:code/end + POST /rooms/:code/restart
    └── services/
        └── roomStore.ts     # ADD endGame(); ADD restartGame(); UPDATE toRoomSnapshot() for "result"

frontend/
└── src/
    └── pages/
        └── GamePage.tsx     # ADD result view section; ADD End Round button; ADD Restart button;
                             # UPDATE polling to handle "result" and "lobby" states
```

**Structure Decision**: Web application. 4 files total; no new directories.

## Implementation Sequence

1. `backend/src/api/schemas.ts` — add `endGameSchema`, `restartGameSchema`
2. `backend/src/services/roomStore.ts` — add `endGame()`, `restartGame()`; update `toRoomSnapshot()`
3. `backend/src/api/rooms.ts` — wire two new routes
4. `frontend/src/pages/GamePage.tsx` — result view + End Round button + Restart button + polling updates

Steps 1–3 are backend-sequential. Step 4 is frontend after backend complete.

## Data Flow

### End Round
```
GamePage (host) → POST /rooms/:code/end { participantId }
  → roomStore.endGame()
    → validate: status === "playing" && participantId === hostId
    → room.status = "result"
  ← RoomSnapshot { status: "result", secretWord: "rocket" (for all), scores, guesses }
→ GamePage renders result view immediately
→ Other tabs detect status === "result" on next poll → render result view
```

### Restart
```
GamePage (host, result view) → POST /rooms/:code/restart { participantId }
  → roomStore.restartGame()
    → validate: status === "result" && participantId === hostId
    → room.status = "lobby"
    → room.drawerId = null, room.secretWord = null
    → room.guesses = [], room.scores = {}
    → participants preserved unchanged
  ← RoomSnapshot { status: "lobby", participants: [...unchanged] }
→ GamePage polling detects status === "lobby" → navigate to /lobby
→ Other tabs detect on next poll → navigate to /lobby
```

### `toRoomSnapshot()` visibility update
```
"lobby"   → secretWord: null  (unchanged)
"playing" → secretWord: room.secretWord if viewer === drawer, else null  (unchanged)
"result"  → secretWord: room.secretWord  (NEW: returned to everyone)
```
