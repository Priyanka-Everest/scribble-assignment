# Implementation Plan: Gameplay Interaction

**Branch**: `scribbleAppByPriyanka` | **Date**: 2026-06-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-gameplay-interaction/spec.md`

## Summary

Add the interactive drawing canvas (drawer only), guess submission with
validation and scoring, synced guess history via ~2s polling, and scoreboard
display. Extends the Room model with `guesses[]` and `scores{}`, adds a
`POST /rooms/:code/guess` endpoint, replaces the canvas placeholder in
`GamePage.tsx` with a real HTML5 `<canvas>`, and upgrades game-screen polling
to include guess history and scores. No new dependencies.

## Technical Context

**Language/Version**: TypeScript 5.6.3 — backend (Node.js 18+) and frontend (React 18)

**Primary Dependencies**: Express + Zod (backend); React 18 + React Router 6 (frontend) — no new dependencies; HTML5 Canvas API for drawing

**Storage**: In-memory Map in `backend/src/services/roomStore.ts`

**Testing**: Manual two-browser validation per quickstart.md

**Target Platform**: Local dev — backend port 3001, frontend port 5173

**Project Type**: Web application (frontend + REST backend)

**Performance Goals**: Guess appears in all views within ~2s; canvas strokes render without visible lag on local dev

**Constraints**: No WebSockets, no DB, no auth; no canvas sync to guessers; brownfield — touch only listed files

**Scale/Scope**: Single-round local demo

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. HTTP-Polling Only | Game screen polls `GET /rooms/:code` every ~2s; no WebSockets | ✅ PASS | `setInterval` in `GamePage.tsx` |
| II. In-Memory State Only | `guesses[]` and `scores{}` stored in Map-based roomStore; no DB | ✅ PASS | |
| III. TypeScript First | All new/modified files fully typed; Zod on `POST /guess`; build gate | ✅ PASS | |
| IV. Deterministic Game Rules | Scoring: correct=100, incorrect=0; case-insensitive exact match | ✅ PASS | No `Math.random()` |
| V. Brownfield Discipline | No new dependencies; HTML5 Canvas API is built-in; 6 files touched | ✅ PASS | |

*Post-design re-check: all gates pass.*

## Project Structure

### Documentation (this feature)

```text
specs/003-gameplay-interaction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── post-guess.md
│   └── get-room-playing-v2.md
└── tasks.md
```

### Source Code

```text
backend/
└── src/
    ├── models/
    │   └── game.ts          # ADD Guess type; ADD guesses[], scores{} to Room + RoomSnapshot
    ├── api/
    │   ├── schemas.ts       # ADD guessSchema
    │   └── rooms.ts         # ADD POST /rooms/:code/guess route
    └── services/
        └── roomStore.ts     # ADD submitGuess(); update startGame() to init scores; update toRoomSnapshot()

frontend/
└── src/
    └── pages/
        └── GamePage.tsx     # REPLACE canvas placeholder with interactive <canvas>;
                             # ADD polling interval; ADD guess history; ADD scoreboard data
```

**Structure Decision**: Web application. 6 files total; no new directories in source.

## Implementation Sequence

1. `backend/src/models/game.ts` — add `Guess` type, `guesses`, `scores` fields
2. `backend/src/api/schemas.ts` — add `guessSchema`
3. `backend/src/services/roomStore.ts` — init `scores` in `startGame()`; add `submitGuess()`; update `toRoomSnapshot()`
4. `backend/src/api/rooms.ts` — wire `POST /rooms/:code/guess` route
5. `frontend/src/pages/GamePage.tsx` — interactive canvas + polling + guess form + history + scoreboard

Steps 1–4 are backend-sequential. Step 5 is frontend, after backend complete.

## Data Flow

### Guess Submission
```
GamePage (guesser) → POST /rooms/:code/guess { participantId, guess: "ROCKET" }
  → roomStore.submitGuess()
    → validate: room.status === "playing"
    → reject if participantId === room.drawerId (403)
    → trimmed = "rocket", lowered = "rocket"
    → correct = ("rocket" === room.secretWord.toLowerCase())  → true
    → scores[participantId] += correct ? 100 : 0
    → guesses.push({ participantId, participantName, word: "rocket", correct: true, submittedAt })
  ← 200 { room: RoomSnapshot }
```

### Game Screen Polling (upgraded from single mount fetch)
```
GamePage (mounted)
  → setInterval(2000)
    → GET /rooms/:code?participantId=<myParticipantId>
    ← RoomSnapshot {
         drawerId, secretWord (drawer only),
         guesses: [...],
         scores: { "uuid-alice": 0, "uuid-bob": 100 }
       }
    → replace local snapshot state
    → re-render: guess history list, scoreboard, role/word area
  → clearInterval on unmount
```

### Drawing Canvas (drawer only, local state)
```
<canvas> element — onMouseDown/Move/Up handlers
  → draw strokes using Canvas 2D context (ctx.beginPath, ctx.lineTo, ctx.stroke)
  → state: isDrawing boolean, last position
  → Clear button → ctx.clearRect(0, 0, width, height)
  (canvas data is NOT synced to server in this scenario)
```
