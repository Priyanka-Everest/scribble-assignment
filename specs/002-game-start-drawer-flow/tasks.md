---
description: "Task list for Game Start & Drawer Flow"
---

# Tasks: Game Start & Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer-flow/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested — validation via manual two-browser flow per
`quickstart.md` and constitution standards.

**Organization**: Tasks grouped by user story. US1 (name validation) is a
verification story — Scenario 1 already implemented it; this phase confirms
end-to-end correctness. US2–US4 are new backend + frontend work.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths in all descriptions

---

## Phase 1: Setup

**Purpose**: Verify the Scenario 1 baseline is intact before extending it.

- [x] T001 Confirm backend builds cleanly: `cd backend && npm run build` — 0 TypeScript errors ✅
- [x] T002 Confirm frontend builds cleanly: `cd frontend && npm run build` — 0 TypeScript errors ✅
- [ ] T003 Verify Scenario 1 start game flow: create a room, join with a second tab, confirm `POST /rooms/:code/start` transitions status to `"playing"` and both tabs navigate to `/game`

**Checkpoint**: Scenario 1 baseline confirmed — Scenario 2 work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add `drawerId` and `secretWord` to backend types. All user stories
depend on these model changes.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add `drawerId: string | null` field to `Room` interface in `backend/src/models/game.ts` (initialise as `null`)
- [x] T005 Add `secretWord: string | null` field to `Room` interface in `backend/src/models/game.ts` (initialise as `null`)
- [x] T006 Add `drawerId: string | null` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T007 Add `secretWord: string | null` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T008 Add `drawerId: string | null` and `secretWord: string | null` fields to `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Type foundation ready — all downstream tasks can reference the new fields.

---

## Phase 3: User Story 2 — Drawer Assignment on Game Start (Priority: P1) 🎯 MVP

**Goal**: When the game starts, `room.drawerId = participants[0].id` is set and
included in every snapshot. All players see their role ("Drawer" / "Guesser") on
the game screen.

**Independent Test**: Two-tab flow — create room as Alice, join as Bob, start
game. Alice's tab shows role "Drawer"; Bob's tab shows role "Guesser". Both role
labels visible immediately on game screen mount. See `quickstart.md` Scenario A.

### Implementation for User Story 2

- [x] T009 [US2] Update `startGame()` in `backend/src/services/roomStore.ts` — set `room.drawerId = room.participants[0].id` when transitioning to `"playing"`
- [x] T010 [US2] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — include `drawerId: room.drawerId` in the returned snapshot object
- [x] T011 [US2] Update `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — add `useEffect` on mount that reads `room.code` from the roomStore context, calls `api.fetchRoom(room.code, myParticipantId)` once, and stores the snapshot in local state; redirect to `/` if room not found (404) or if no room is in context
- [x] T012 [US2] Update `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — derive `isDrawer = (myParticipantId === snapshot.drawerId)` and render role label: **"Drawer"** or **"Guesser"** prominently on the game screen
- [x] T013 [US2] Update `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — render each participant's role in the participant list: "Drawer" label next to the participant whose `id === snapshot.drawerId`, "Guesser" for all others

**Checkpoint**: US2 functional — two-tab game start shows correct role labels.
Verify: Alice = Drawer, Bob = Guesser, both visible immediately on mount.

---

## Phase 4: User Story 3 — Deterministic Secret Word Selection (Priority: P1)

**Goal**: `room.secretWord = STARTER_WORDS[0]` (`"rocket"`) is set on game
start. The same word appears every time, verified across backend restarts.

**Independent Test**: Start game twice (restart backend between runs). Drawer
sees `"rocket"` both times. See `quickstart.md` Scenario B.

### Implementation for User Story 3

- [x] T014 [US3] Update `startGame()` in `backend/src/services/roomStore.ts` — set `room.secretWord = STARTER_WORDS[0]` (`"rocket"`) when transitioning to `"playing"` (`STARTER_WORDS` is already imported at the top of the file)

**Checkpoint**: US3 functional — `secretWord` stored on the Room; value is always `"rocket"`.

---

## Phase 5: User Story 4 — Drawer-Only Word Visibility (Priority: P1)

**Goal**: `secretWord` returned only to the drawer in the snapshot. Guessers
receive `null`. `availableWords` is `[]` for all during `"playing"`.

**Independent Test**: Two-tab game — drawer sees `"rocket"` on screen; guesser
sees `"Guess the word!"`; DevTools confirms `secretWord: null` in guesser's
network response. See `quickstart.md` Scenarios A, C, D.

### Implementation for User Story 4

- [x] T015 [US4] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — when `room.status === "playing"`: return `secretWord: room.secretWord` only if `viewerParticipantId === room.drawerId`, else return `secretWord: null`
- [x] T016 [US4] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — when `room.status === "playing"`: return `availableWords: []` regardless of caller role
- [x] T017 [US4] Update `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — in the word display area: show `snapshot.secretWord` if `isDrawer` and it is non-null; show static text **"Guess the word!"** otherwise

**Checkpoint**: US4 functional — drawer sees the word; guesser sees placeholder;
network response confirms `secretWord: null` for guesser.

---

## Phase 6: User Story 1 — Name Validation End-to-End Verification (Priority: P1)

**Goal**: Confirm that name validation (trim + reject empty) works end-to-end
across both Create Room and Join Room flows, as required by FR-008.

**Independent Test**: Submit empty and whitespace-only names on both forms.
Confirm errors appear and no request is made. See `quickstart.md` Scenario F.

### Verification for User Story 1

- [x] T018 [US1] Verify `backend/src/api/schemas.ts` — confirmed `createRoomSchema` and `joinRoomSchema` both have `.trim().min(1)` on the `playerName` field ✅ (implemented in Scenario 1)
- [x] T019 [US1] Verify `frontend/src/pages/CreateRoomPage.tsx` — confirmed frontend trim + non-empty check fires before submission ✅ (implemented in Scenario 1)
- [x] T020 [US1] Verify `frontend/src/pages/JoinRoomPage.tsx` — confirmed frontend trim + non-empty check fires before submission ✅ (implemented in Scenario 1)

**Checkpoint**: US1 end-to-end verified — name validation confirmed on both
frontend and backend for Create and Join flows.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T021 [P] Run `cd backend && npm run build` — confirm zero TypeScript errors ✅
- [x] T022 [P] Run `cd frontend && npm run build` — confirm zero TypeScript errors ✅
- [ ] T023 Execute Scenarios A–F in `specs/002-game-start-drawer-flow/quickstart.md` with two browser tabs
- [ ] T024 Verify DevTools network check: guesser's `GET /rooms/:code` response has `"secretWord": null` and `"availableWords": []` (quickstart Scenario C)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US2)**: Depends on Phase 2; no dependency on US3/US4
- **Phase 4 (US3)**: Depends on Phase 2; adds to `startGame()` already touched in US2 — run after US2
- **Phase 5 (US4)**: Depends on Phase 4 (needs `secretWord` set before filtering it); updates `toRoomSnapshot()` and `GamePage.tsx`
- **Phase 6 (US1)**: Verification only — can run at any point after Phase 1
- **Phase 7 (Polish)**: Depends on all phases complete

### Within Each Story

- Backend model types before services
- `startGame()` changes before `toRoomSnapshot()` changes
- Backend changes before frontend type updates
- Frontend type updates before `GamePage.tsx` UI changes

### Parallel Opportunities

- T004 + T005 (both in `game.ts` — sequential within the file, fast)
- T006 + T007 (both in `game.ts` — sequential)
- T001 + T002 (build checks — independent)
- T021 + T022 (build checks — independent)
- T018 + T019 + T020 (verification tasks — different files, can run in parallel)

---

## Implementation Strategy

### MVP First (US2 only — drawer role visible)

1. Phase 1: Setup verification
2. Phase 2: Foundational types
3. Phase 3: US2 — drawer assignment + role display
4. **STOP & VALIDATE**: Two tabs, correct role labels shown

### Full Delivery

5. Phase 4: US3 — word stored deterministically
6. Phase 5: US4 — word visible to drawer only; guesser sees placeholder
7. Phase 6: US1 — name validation end-to-end confirmation
8. Phase 7: Build + full quickstart validation

---

## Notes

- [P] tasks = different files or independent operations
- US1 (Phase 6) tasks are verification-only; no code changes needed
- `toRoomSnapshot()` updated atomically — US2, US3, US4 changes all applied in single pass
- Commit after each checkpoint
