---
description: "Task list for Result, Restart & Final Validation"
---

# Tasks: Result, Restart & Final Validation

**Input**: Design documents from `specs/004-result-restart/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested — validation via manual two-browser flow per
`quickstart.md` and constitution standards.

**Organization**: US3 (End Round trigger) is implemented first as it's the
prerequisite for US1 (result view). US1 and US2 (restart) are then sequential.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Exact file paths in all descriptions

---

## Phase 1: Setup

**Purpose**: Verify Scenario 3 baseline (gameplay + scoring) is intact.

- [x] T001 [P] Run `cd backend && npm run build` — confirm 0 TypeScript errors ✅
- [x] T002 [P] Run `cd frontend && npm run build` — confirm 0 TypeScript errors ✅
- [x] T003 Verify end-to-end gameplay: two tabs, submit a guess, confirm guess history and scores update via polling *(verified by Scenario 3)*

**Checkpoint**: Scenario 3 baseline confirmed — Scenario 4 work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add `endGameSchema` and `restartGameSchema` to the backend. Both
user story phases depend on these.

- [x] T004 Add `endGameSchema` to `backend/src/api/schemas.ts` — `{ participantId: z.string().uuid("participantId must be a valid UUID") }`
- [x] T005 Add `restartGameSchema` to `backend/src/api/schemas.ts` — `{ participantId: z.string().uuid("participantId must be a valid UUID") }`

**Checkpoint**: Schemas ready — service and route tasks can begin.

---

## Phase 3: User Story 3 — End-of-Round Trigger (Priority: P1) 🎯 MVP

**Goal**: Host clicks End Round → room transitions from `"playing"` to `"result"`.
Non-host sees disabled button. Backend validates host identity.

**Independent Test**: Tab 1 (host): End Round button active. Tab 2 (non-host):
button disabled with label. Host clicks → both tabs detect status change within
~2s. See `quickstart.md` Scenarios A, B.

### Implementation for User Story 3

- [x] T006 [US3] Add `endGame(code, participantId)` to `backend/src/services/roomStore.ts` — validate `status === "playing"`, validate `participantId === room.hostId` (else 403), transition `room.status = "result"`, return updated Room; use same error-union pattern as `startGame()`
- [x] T007 [US3] Add `POST /rooms/:code/end` route to `backend/src/api/rooms.ts` — parse params with `roomCodeParamsSchema`, parse body with `endGameSchema`, call `roomStore.endGame()`, return 200 with `{ room: toRoomSnapshot(...) }` or error (400/403/404)
- [x] T008 [US3] Add `api.endGame(code, participantId)` to `frontend/src/services/api.ts` — typed call to `POST /rooms/:code/end` returning `{ room: RoomSnapshot }`
- [x] T009 [US3] Add **End Round** button to `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) in the playing view — visible to all; disabled with label `"Only the host can end the round"` when `!isHost`; active for host only; on click call `api.endGame(snapshot.code, participantId)`, then call `setSnapshot(response.room)` so the host's result view renders immediately without waiting for the next poll cycle

**Checkpoint**: US3 functional — host can end round; non-host button disabled;
backend rejects non-host with 403. Verify quickstart Scenarios A and B.

---

## Phase 4: User Story 1 — Result State Visible to All Players (Priority: P1)

**Goal**: When `snapshot.status === "result"`, `GamePage.tsx` renders a result
section showing: secret word (now visible to all), final scores, full guess
history. All tabs show this automatically via existing polling.

**Independent Test**: After host ends round, both tabs within ~2s show secret
word `"rocket"`, scores, and full guess history. Drawer's tab also shows the
word (no longer hidden). See `quickstart.md` Scenario A.

### Implementation for User Story 1

- [x] T010 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` — add result state condition: when `room.status === "result"`, return `secretWord: room.secretWord` to all callers regardless of `viewerParticipantId` (change `isDrawer` check to `isDrawer || isResult`)
- [x] T011 [US1] Update the polling callback in `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — when the polled snapshot has `status === "result"`, call `setSnapshot(response.room)` as normal (do NOT skip the state update), and do NOT navigate away; the conditional render in T012 will switch to the result view automatically
- [x] T012 [US1] Add result view conditional section to `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — when `isResult` (`snapshot.status === "result"`), render a result section showing: `snapshot.secretWord` prominently, `snapshot.scores` for all participants, and `snapshot.guesses` history in submission order; replace the playing UI

**Checkpoint**: US1 functional — both tabs show result view with word, scores,
and history within ~2s of host ending round. Quickstart Scenario A passes.

---

## Phase 5: User Story 2 — Host Restarts the Game (Priority: P1)

**Goal**: Host clicks Restart → room transitions to `"lobby"`, round state
cleared, participants preserved. All tabs navigate to `/lobby` within ~2s.

**Independent Test**: After result view is showing, host clicks Restart → both
tabs navigate to lobby → same participants listed → start new game → same
drawer + same word (`"rocket"`). See `quickstart.md` Scenarios C, D, E.

### Implementation for User Story 2

- [x] T013 [US2] Add `restartGame(code, participantId)` to `backend/src/services/roomStore.ts` — validate `status === "result"`, validate `participantId === room.hostId` (else 403), clear `drawerId = null`, `secretWord = null`, `guesses = []`, `scores = {}`, set `status = "lobby"`, preserve participants unchanged, return updated Room
- [x] T014 [US2] Add `POST /rooms/:code/restart` route to `backend/src/api/rooms.ts` — parse params with `roomCodeParamsSchema`, parse body with `restartGameSchema`, call `roomStore.restartGame()`, return 200 with `{ room: toRoomSnapshot(...) }` or error (400/403/404)
- [x] T015 [US2] Add `api.restartGame(code, participantId)` to `frontend/src/services/api.ts` — typed call to `POST /rooms/:code/restart` returning `{ room: RoomSnapshot }`
- [x] T016 [US2] Add **Restart** button to the result view section in `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — visible to all; disabled with label `"Only the host can restart"` for non-hosts; active for host; on click call `api.restartGame(snapshot.code, participantId)` and update local snapshot
- [x] T017 [US2] Update the polling callback in `GamePage.tsx` (`frontend/src/pages/GamePage.tsx`) — add a `status === "lobby"` detection case: when detected, call `navigate("/lobby")` so all participants are redirected after restart

**Checkpoint**: US2 functional — all tabs navigate to lobby after restart;
participant list preserved; new game starts deterministically. Quickstart
Scenarios C, D, E pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T018 [P] Run `cd backend && npm run build` — confirm zero TypeScript errors ✅
- [x] T019 [P] Run `cd frontend && npm run build` — confirm zero TypeScript errors ✅
- [ ] T020 Execute Scenarios A–F in `specs/004-result-restart/quickstart.md` with two browser tabs
- [ ] T021 Verify full end-to-end loop: create room → join → start → draw → guess → end round → see result → restart → lobby → start again

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US3)**: Depends on Phase 2 — end round trigger (prerequisite for result state)
- **Phase 4 (US1)**: Depends on Phase 3 (needs `endGame()` to produce `"result"` status)
- **Phase 5 (US2)**: Depends on Phase 4 (restart is triggered from result view)
- **Phase 6 (Polish)**: Depends on all phases complete

### Within Each Story

- Backend schema before service function
- Service function before route handler
- Route handler before frontend API call
- Frontend API call before UI integration

### Parallel Opportunities

- T001 + T002 (setup build checks — independent)
- T004 + T005 (both schema additions — same file, sequential but fast)
- T006 + T013 (different service functions — can be written in parallel if different developers)
- T018 + T019 (final build checks — independent)

---

## Implementation Strategy

### MVP First (US3 only — end round works)

1. Phase 1: Setup verification
2. Phase 2: Foundational schemas
3. Phase 3: US3 — `endGame()` endpoint + End Round button
4. **STOP & VALIDATE**: Host ends round; non-host blocked; status transitions

### Full Delivery

5. Phase 4: US1 — result view rendered in `GamePage.tsx`; `toRoomSnapshot()` reveals word
6. Phase 5: US2 — `restartGame()` endpoint + Restart button + lobby navigation
7. Phase 6: Build + full quickstart validation + end-to-end loop

---

## Notes

- [P] tasks = different files or independent operations
- `toRoomSnapshot()` change (T010) is a one-line addition to the existing visibility logic
- The polling callback in `GamePage.tsx` is extended: T011 handles `"result"` (stay + setSnapshot); T017 handles `"lobby"` (navigate); both in the same setInterval callback
- `ResultPanel.tsx` is NOT used — result view is a conditional section in `GamePage.tsx` per clarification
- Commit after each checkpoint
