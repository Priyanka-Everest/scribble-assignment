# Implementation Plan: Game Start & Drawer Flow

**Branch**: `scribbleAppByPriyanka` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-game-start-drawer-flow/spec.md`

## Summary

Extend the game start flow to assign a drawer (`participants[0]`), select the
secret word deterministically (`STARTER_WORDS[0]` = `"rocket"`), enforce
drawer-only word visibility in the API snapshot, and update `GamePage.tsx` to
display each player's role and the word (drawer only). No new dependencies.
Builds directly on the `startGame()` function and `Room` model from Scenario 1.

## Technical Context

**Language/Version**: TypeScript 5.6.3 — backend (Node.js 18+) and frontend (React 18)

**Primary Dependencies**: Express + Zod (backend); React 18 + React Router 6 (frontend) — no new dependencies

**Storage**: In-memory Map in `backend/src/services/roomStore.ts`

**Testing**: Manual two-browser validation per quickstart.md; Vitest available but not required

**Target Platform**: Local dev — backend port 3001, frontend port 5173

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: Game screen role/word visible immediately on mount; single fetch on load

**Constraints**: No WebSockets, no DB, no auth; deterministic word/drawer; brownfield

**Scale/Scope**: Single-round local demo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. HTTP-Polling Only | No push protocol; game screen fetches once on mount | ✅ PASS | Single `useEffect` fetch, no interval |
| II. In-Memory State Only | `drawerId` and `secretWord` stored in Map-based roomStore | ✅ PASS | No external storage |
| III. TypeScript First | All modified files fully typed; new fields typed as `string \| null` | ✅ PASS | Build gate enforced |
| IV. Deterministic Game Rules | `drawerId = participants[0].id`; `secretWord = STARTER_WORDS[0]` | ✅ PASS | No `Math.random()` |
| V. Brownfield Discipline | No new dependencies; only 4 files listed below touched | ✅ PASS | |

*Post-design re-check: all gates pass.*

## Project Structure

### Documentation (this feature)

```text
specs/002-game-start-drawer-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── get-room-playing.md   # GET /rooms/:code contract (playing state)
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code

```text
backend/
└── src/
    ├── models/
    │   └── game.ts          # ADD drawerId, secretWord to Room + RoomSnapshot
    └── services/
        └── roomStore.ts     # SET drawerId + secretWord in startGame(); filter in toRoomSnapshot()

frontend/
└── src/
    ├── services/
    │   └── api.ts           # UPDATE RoomSnapshot type (drawerId, secretWord fields)
    └── pages/
        └── GamePage.tsx     # ADD mount fetch; ADD role display; ADD word/placeholder display
```

**Structure Decision**: Web application. 4 files modified; no new directories.

## Implementation Sequence

1. `backend/src/models/game.ts` — add `drawerId` and `secretWord` fields (everything depends on this)
2. `backend/src/services/roomStore.ts` — set fields in `startGame()`; apply visibility filter in `toRoomSnapshot()`
3. `frontend/src/services/api.ts` — update `RoomSnapshot` type to match backend
4. `frontend/src/pages/GamePage.tsx` — single mount fetch; derive `isDrawer`; render role + conditional word

Backend steps are sequential (1 → 2). Frontend steps are sequential after backend (3 → 4).

## Data Flow

### Game Start (Scenario 1 wired; extended here)
```
LobbyPage (host) → POST /rooms/:code/start { participantId }
  → roomStore.startGame()
    → room.drawerId   = participants[0].id        (deterministic)
    → room.secretWord = STARTER_WORDS[0]          ("rocket")
    → room.status     = "playing"
  ← RoomSnapshot { drawerId, secretWord: null (host is drawer, but start response
                   doesn't need word — GamePage will fetch), status: "playing" }
→ host navigates to /game
→ non-host polling detects status "playing" → navigates to /game
```

### Game Screen Mount
```
GamePage (mounted)
  → GET /rooms/:code?participantId=<myParticipantId>
  ← RoomSnapshot {
       drawerId: "uuid-of-alice",
       secretWord: "rocket"   // only if participantId === drawerId
                              // null for all other callers
       availableWords: []     // always [] during "playing"
     }
  → isDrawer = (myParticipantId === snapshot.drawerId)
  → render role label: "Drawer" or "Guesser"
  → render word area: secretWord if isDrawer, else "Guess the word!"
```
