---
description: "Task list for Gameplay Interaction"
---

# Tasks: Gameplay Interaction

**Input**: Design documents from `specs/003-gameplay-interaction/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested — validation via manual two-browser flow per
`quickstart.md` and constitution standards.

**Organization**: Tasks grouped by user story. US2 (guess submission) is the
core backend story and must be completed before US3/US4 which depend on the
`/guess` endpoint and `scores` data.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths in all descriptions

---

## Phase 1: Setup

**Purpose**: Verify Scenario 2 baseline is intact before extending it.

- [x] T001 [P] Run `cd backend && npm run build` — confirm 0 TypeScript errors ✅
- [x] T002 [P] Run `cd frontend && npm run build` — confirm 0 TypeScript errors ✅
- [x] T003 Verify two-tab game start: Alice = Drawer role visible, Bob = Guesser role visible, secret word shown to drawer only *(verified by Scenario 2)*

**Checkpoint**: Scenario 2 baseline confirmed — Scenario 3 work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add `Guess` type and `guesses`/`scores` fields to backend types.
All user stories depend on these model and schema changes.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add `Guess` interface to `backend/src/models/game.ts` — fields: `participantId: string`, `participantName: string`, `word: string`, `correct: boolean`, `submittedAt: string`
- [x] T005 Add `guesses: Guess[]` field to `Room` interface in `backend/src/models/game.ts` (initialise as `[]` in `createRoom()`)
- [x] T006 Add `scores: Record<string, number>` field to `Room` interface in `backend/src/models/game.ts` (initialise as `{}` in `createRoom()`)
- [x] T007 Add `guesses: Guess[]` and `scores: Record<string, number>` fields to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T008 Add `guessSchema` to `backend/src/api/schemas.ts` — `{ participantId: z.string().uuid(), guess: z.string().trim().min(1) }`
- [x] T009 Update `createRoom()` in `backend/src/services/roomStore.ts` — initialise `guesses: []` and `scores: {}` on the new Room object
- [x] T010 Update `startGame()` in `backend/src/services/roomStore.ts` — after setting `status: "playing"`, initialise `scores` with `{ [p.id]: 0 }` for every participant in `room.participants`
- [x] T011 Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `guesses: room.guesses` and `scores: room.scores` in the returned snapshot (no viewer filtering needed)

**Checkpoint**: Type + schema foundation ready — all user stories can begin.

---

## Phase 3: User Story 2 — Guesser Submits a Guess (Priority: P1) 🎯 MVP

**Goal**: Guessers can submit words; empty guesses are rejected; correct guesses
(`"rocket"`, case-insensitive) award 100 points; incorrect award 0; drawer is
blocked from guessing.

**Independent Test**: Tab 2 (guesser): submit empty → error. Submit `"pizza"` →
0 pts in history. Submit `"ROCKET"` → 100 pts. See `quickstart.md` Scenarios B, E.

### Implementation for User Story 2

- [x] T012 [US2] Add `submitGuess(code, participantId, guess)` to `backend/src/services/roomStore.ts` — validate `status === "playing"`, reject drawer with 403, trim+lowercase compare against `room.secretWord`, update `scores[participantId]`, push `Guess` record to `room.guesses`, return updated Room
- [x] T013 [US2] Add `POST /rooms/:code/guess` route to `backend/src/api/rooms.ts` — parse params with `roomCodeParamsSchema`, parse body with `guessSchema`, call `roomStore.submitGuess()`, return 200 with `{ room: toRoomSnapshot(...) }` or appropriate error (400/403/404)
- [x] T014 [US2] Add `api.submitGuess(code, participantId, guess)` to `frontend/src/services/api.ts` — typed call to `POST /rooms/:code/guess` returning `{ room: RoomSnapshot }`
- [x] T015 [US2] Add `guesses: Guess[]` and `scores: Record<string, number>` fields to `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [x] T016 [US2] Update `GuessForm.tsx` (`frontend/src/components/GuessForm.tsx`) — add props `code: string`, `participantId: string`, `onGuessSubmitted?: () => void`; wire form to call `api.submitGuess(code, participantId, guess)` with frontend trim+non-empty validation; show inline error on empty guess; clear input and call `onGuessSubmitted()` on success
- [x] T017 [US2] Update `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — render `<GuessForm code={snapshot.code} participantId={participantId} />` only when `isDrawer === false`; do not render it at all for the drawer

**Checkpoint**: US2 functional — guesser submits guesses with correct
scoring; drawer cannot guess. Verify with quickstart Scenarios B and E.

---

## Phase 4: User Story 1 — Drawer Uses the Drawing Canvas (Priority: P1)

**Goal**: Drawer can draw freehand strokes on an HTML5 `<canvas>` and clear it.
Guessers see a blank white canvas with no controls.

**Independent Test**: Tab 1 (drawer): draw strokes → visible. Click Clear →
blank. Tab 2 (guesser): blank canvas, no controls. See `quickstart.md` Scenario A.

### Implementation for User Story 1

- [x] T018 [US1] Replace the canvas placeholder `<div>` in `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) with a `<canvas>` element using a `useRef`; set fixed dimensions (600×400); style with white background and border
- [x] T019 [US1] Add mouse event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`, `onMouseLeave`) to the canvas in `GamePage.tsx` — use `useRef` to access the 2D context; draw strokes with `ctx.beginPath()`, `ctx.moveTo()`, `ctx.lineTo()`, `ctx.stroke()`; lineWidth=3, strokeStyle=#000000, lineCap=round
- [x] T020 [US1] Add **Clear Canvas** button below the canvas in `GamePage.tsx` — visible only when `isDrawer === true`; on click call `ctx.clearRect(0, 0, canvas.width, canvas.height)`
- [x] T021 [US1] Ensure mouse event handlers and Clear button are only registered/rendered when `isDrawer === true`; guesser sees the same `<canvas>` element but with no event handlers or Clear button

**Checkpoint**: US1 functional — drawer draws and clears; guesser sees blank
canvas with no controls. No server interaction needed for this story.

---

## Phase 5: User Story 3 — Synced Guess History via Polling (Priority: P2)

**Goal**: Game screen polls every ~2s to sync guess history. New guesses appear
on all tabs automatically. History replaces (not appends) on each cycle.

**Independent Test**: Guesser submits a guess → within ~2s the drawer's tab
shows the new entry without any user action. See `quickstart.md` Scenario C.

### Implementation for User Story 3

- [x] T022 [US3] Upgrade `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) from single mount fetch to continuous polling: keep the initial `api.fetchRoom(room.code, participantId)` call on mount (for immediate load and 404 guard), then add a `setInterval(2000)` in the same `useEffect` that also calls `api.fetchRoom` and replaces local `snapshot` state on each cycle; handle 404 in both the initial fetch and the interval callback (clear interval + navigate to `/` with "Room not found")
- [x] T023 [US3] Add `useEffect` cleanup in `GamePage.tsx` — return a cleanup function that calls `clearInterval` on unmount to prevent memory leaks
- [x] T024 [US3] Render the guess history list in `GamePage.tsx` from `snapshot.guesses` — show participant name, word submitted, and a "Correct ✓" or "Incorrect ✗" label for each entry, in submission order

**Checkpoint**: US3 functional — all tabs auto-update guess list within ~2s;
no duplicate entries; polling clears on unmount.

---

## Phase 6: User Story 4 — Scoring System (Priority: P2)

**Goal**: Scoreboard shows all participants with accurate cumulative scores,
updated within one polling cycle of each guess. All start at 0.

**Independent Test**: After correct guess: scoreboard shows 100 for that
guesser, 0 for drawer. See `quickstart.md` Scenario D.

### Implementation for User Story 4

- [x] T025 [US4] Update `Scoreboard.tsx` (`frontend/src/components/Scoreboard.tsx`) — accept `participants: Participant[]` and `scores: Record<string, number>` as props; render each participant's name and current score, sorted by score descending
- [x] T026 [US4] Pass `snapshot.participants` and `snapshot.scores` to `<Scoreboard />` in `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`)

**Checkpoint**: US4 functional — scoreboard shows correct cumulative scores for
all participants, updating automatically via polling.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T027 [P] Run `cd backend && npm run build` — confirm zero TypeScript errors ✅
- [x] T028 [P] Run `cd frontend && npm run build` — confirm zero TypeScript errors ✅
- [ ] T029 Execute Scenarios A–F in `specs/003-gameplay-interaction/quickstart.md` with two browser tabs
- [ ] T030 Verify DevTools network check: guesser's `GET /rooms/:code` response includes `guesses` array and `scores` object; `secretWord` still `null`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US2)**: Depends on Phase 2 — core backend; no dependency on US1/US3/US4
- **Phase 4 (US1)**: Depends on Phase 2 — frontend canvas only; can run in parallel with US2 (different concerns)
- **Phase 5 (US3)**: Depends on US2 (needs `guesses` in snapshot to display)
- **Phase 6 (US4)**: Depends on US2 (needs `scores` in snapshot) and US3 (polling delivers scores)
- **Phase 7 (Polish)**: Depends on all phases complete

### Within Each Story

- Backend model types before services
- Services (`submitGuess`) before route handler
- Route handler before frontend `api.submitGuess`
- Frontend API call before `GuessForm` wiring
- `GuessForm` before `GamePage` integration

### Parallel Opportunities

- T001 + T002 (build checks — independent)
- T004–T008 (foundational — same file `game.ts`, sequential within file but fast)
- T018 + T019 + T020 (canvas tasks — same file but logical sequence; T019 depends on T018)
- T025 (Scoreboard component) can be worked on in parallel with T022–T024 (polling)
- T027 + T028 (final build checks — independent)

---

## Implementation Strategy

### MVP First (US2 only — guess submission works)

1. Phase 1: Setup verification
2. Phase 2: Foundational types + schema + service init
3. Phase 3: US2 — `submitGuess()` endpoint + frontend `GuessForm` wiring
4. **STOP & VALIDATE**: Guesser submits guesses; correct = 100pts; errors shown

### Full Delivery

5. Phase 4: US1 — interactive canvas + clear button
6. Phase 5: US3 — game screen polling (upgrade from single mount fetch)
7. Phase 6: US4 — scoreboard populated from `scores`
8. Phase 7: Build + full quickstart validation

---

## Notes

- [P] tasks = different files or independent operations
- `toRoomSnapshot()` change (T011) is the only backend change touching the snapshot — all new fields (`guesses`, `scores`) are passed through without filtering
- `GuessForm.tsx` wired with props: `code`, `participantId`, `onGuessSubmitted`
- `Scoreboard.tsx` placeholder replaced with props-driven implementation
- Game screen polling: initial mount fetch retained + `setInterval(2000)` added in same `useEffect`
- Commit after each checkpoint
