---
description: "Task list for Room Setup & Lobby"
---

# Tasks: Room Setup & Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Tests**: Not explicitly requested — no test tasks generated. Validation via
manual two-browser flow per `quickstart.md` and constitution standards.

**Organization**: Tasks grouped by user story to enable independent
implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Fix the known blocker and confirm the scaffold is runnable before
any feature work begins.

- [x] T001 Fix API base URL in `frontend/src/services/api.ts` — change default from `http://localhost:3001/bug` to `http://localhost:3001` *(was already correct in scaffold)*
- [x] T002 Verify backend starts and `GET http://localhost:3001/health` returns `{"ok":true}`
- [x] T003 Verify frontend starts at `http://localhost:5173` and Start screen loads without console errors

**Checkpoint**: Scaffold confirmed working — feature work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Expand backend types and validation schemas that ALL user stories
depend on. Must be complete before any story phase starts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Expand `RoomStatus` type in `backend/src/models/game.ts` — add `"playing"` and `"result"` to the union (currently only `"lobby"`)
- [x] T005 Add `hostId: string` field to `Room` interface in `backend/src/models/game.ts`
- [x] T006 Add `hostId: string` field to `RoomSnapshot` interface in `backend/src/models/game.ts`
- [x] T007 Update `createRoom` Zod schema in `backend/src/api/schemas.ts` — add `.trim().min(1)` to the `name` field
- [x] T008 Update `joinRoom` Zod schema in `backend/src/api/schemas.ts` — add `.trim().min(1)` to the `name` field
- [x] T009 Add `startGameSchema` to `backend/src/api/schemas.ts` — `{ participantId: z.string().uuid() }`
- [x] T010 Add `myParticipantId: string | null` to the room context state shape in `frontend/src/state/roomStore.ts` and initialise to `null` *(already present as `participantId` in existing RoomState)*

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Create Room & Become Host (Priority: P1) 🎯 MVP

**Goal**: A player creates a room; they are marked as host; the lobby shows
their name with a Host indicator; room isolation is enforced.

**Independent Test**: One browser tab — create room with valid name → lobby
shows room code, creator's name, and "Host" indicator. See `quickstart.md`
Scenario A.

### Implementation for User Story 1

- [x] T011 [US1] Update `createRoom` in `backend/src/services/roomStore.ts` — set `room.hostId = firstParticipant.id` when creating the room
- [x] T012 [US1] Update `toRoomSnapshot` in `backend/src/services/roomStore.ts` — include `hostId` in the returned snapshot object
- [x] T013 [US1] Update `POST /rooms` route handler in `backend/src/api/rooms.ts` — ensure the response serialises the updated `RoomSnapshot` (including `hostId`)
- [x] T014 [P] [US1] Update `CreateRoomPage.tsx` (`frontend/src/pages/CreateRoomPage.tsx`) — add frontend name validation (trim + non-empty check) and show inline error before submitting
- [x] T015 [US1] Update `CreateRoomPage.tsx` (`frontend/src/pages/CreateRoomPage.tsx`) — after successful `POST /rooms`, store returned `participants[0].id` as `myParticipantId` in the room context *(handled by existing `setRoomSession` → `participantId`)*
- [x] T016 [US1] Update `LobbyPage.tsx` (`frontend/src/pages/LobbyPage.tsx`) — read `hostId` from snapshot and `myParticipantId` from context; render "Host" badge next to the matching participant

**Checkpoint**: US1 fully functional — one-tab create + host indicator working
independently. Verify: create room, see host label, confirm room code displayed.

---

## Phase 4: User Story 2 — Join Room by Code (Priority: P1)

**Goal**: A second player joins using a room code; invalid/empty inputs are
rejected; both players see each other in the lobby after the next refresh.

**Independent Test**: Two browser tabs — Tab 1 creates, Tab 2 joins → Tab 2
shows both participants; invalid code shows error. See `quickstart.md` Scenario B
(manual refresh acceptable at this stage; polling added in US3).

### Implementation for User Story 2

- [x] T017 [US2] Update `JoinRoomPage.tsx` (`frontend/src/pages/JoinRoomPage.tsx`) — add frontend name validation (trim + non-empty) and show inline error before submitting
- [x] T018 [US2] Update `JoinRoomPage.tsx` (`frontend/src/pages/JoinRoomPage.tsx`) — trim the room code input before submitting (strip leading/trailing whitespace)
- [x] T019 [US2] Update `JoinRoomPage.tsx` (`frontend/src/pages/JoinRoomPage.tsx`) — after successful `POST /rooms/:code/join`, store returned participant UUID as `myParticipantId` in the room context *(handled by existing `setRoomSession`)*
- [x] T020 [US2] Update `JoinRoomPage.tsx` (`frontend/src/pages/JoinRoomPage.tsx`) — handle 404 response from join by displaying a clear "Room not found" inline error with no navigation

**Checkpoint**: US2 functional — two-tab join flow works; invalid code and
empty name show errors; both participants visible after manual refresh.

---

## Phase 5: User Story 3 — Automatic Lobby Polling (~2s) (Priority: P2)

**Goal**: The lobby auto-refreshes participants every ~2 seconds without user
interaction. New joiners appear within one polling cycle. Polling cleans up on
unmount. 404 redirects to Start screen.

**Independent Test**: Two browser tabs in same lobby — join from Tab 2, Tab 1
shows new participant within ~2s with no click. See `quickstart.md` Scenarios B
and G.

### Implementation for User Story 3

- [x] T021 [US3] Add `api.getRoom(code)` function to `frontend/src/services/api.ts` if not already exported — typed to return `RoomSnapshot` *(exposed as `api.fetchRoom`; used directly in polling)*
- [x] T022 [US3] Add `setInterval` polling in `LobbyPage.tsx` (`frontend/src/pages/LobbyPage.tsx`) inside a `useEffect` — call `api.fetchRoom(code)` every 2000ms and replace local participant state with full snapshot
- [x] T023 [US3] Add `useEffect` cleanup in `LobbyPage.tsx` — call `clearInterval` on unmount to prevent memory leaks
- [x] T024 [US3] Handle `status === "playing"` in the polling callback in `LobbyPage.tsx` — navigate to `/game` when detected
- [x] T025 [US3] Handle 404 in the polling callback in `LobbyPage.tsx` — clear the interval and navigate to `/` with a "Room not found" error message

**Checkpoint**: US3 functional — Tab 1 lobby auto-updates within 2s when Tab 2
joins; browser restart → "Room not found" redirect works.

---

## Phase 6: User Story 4 — Host-Only Start Game (Priority: P2)

**Goal**: Host can start the game with ≥2 players; non-host sees disabled
button with label; start triggers status transition; non-host players navigate
via polling.

**Independent Test**: Two-tab lobby — host tab has active Start button; non-host
tab shows disabled button with label; clicking Start navigates both tabs to game
screen within ~2s. See `quickstart.md` Scenario E.

### Implementation for User Story 4

- [x] T026 [US4] Add `startGame(code, participantId)` function to `backend/src/services/roomStore.ts` — validates ≥2 participants, validates `participantId === room.hostId`, transitions `status` to `"playing"`, returns updated `RoomSnapshot`
- [x] T027 [US4] Add `POST /rooms/:code/start` route to `backend/src/api/rooms.ts` — uses `startGameSchema`, calls `roomStore.startGame()`, returns 200/400/403/404 as per contract
- [x] T028 [US4] Add `api.startGame(code, participantId)` function to `frontend/src/services/api.ts` — typed to call `POST /rooms/:code/start`
- [x] T029 [US4] Update `LobbyPage.tsx` (`frontend/src/pages/LobbyPage.tsx`) — render Start Game button for all participants; disable with label `"Only the host can start"` when `myParticipantId !== snapshot.hostId`
- [x] T030 [US4] Update `LobbyPage.tsx` (`frontend/src/pages/LobbyPage.tsx`) — disable Start button when participant count < 2, with label `"Need at least 2 players"`
- [x] T031 [US4] Wire Start Game button click in `LobbyPage.tsx` — call `api.startGame(code, myParticipantId)` and navigate host to `/game` on success; show inline error on 400/403

**Checkpoint**: US4 functional — full two-tab start game flow works; non-host
button disabled; both players reach game screen.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Build verification, manual acceptance testing, and cleanup.

- [x] T032 [P] Run `cd backend && npm run build` — confirm zero TypeScript errors ✅
- [x] T033 [P] Run `cd frontend && npm run build` — confirm zero TypeScript errors ✅
- [ ] T034 Execute all 7 scenarios in `specs/001-room-setup-lobby/quickstart.md` with two browser tabs and confirm each passes
- [ ] T035 Verify multi-room isolation: create two rooms, join each from separate tabs, confirm no cross-room participant visibility (quickstart Scenario F)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 completion — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 — no dependency on US2/US3/US4
- **Phase 4 (US2)**: Depends on Phase 2 — no dependency on US1 (shares backend, different FE page)
- **Phase 5 (US3)**: Depends on US1 + US2 being complete (polling builds on create/join flow)
- **Phase 6 (US4)**: Depends on US1 + US2 + US3 (start game relies on host identity + polling for non-host nav)
- **Phase 7 (Polish)**: Depends on all user stories complete

### Within Each User Story

- Backend models/types before services
- Services before route handlers
- Route handlers before frontend API calls
- Frontend API calls before page/component updates

### Parallel Opportunities

- T004 + T005 + T006 (type changes in same file — sequential within game.ts)
- T007, T008, T009 (schema additions to same file — independent, run sequentially)
- T014 and T017 (different FE pages, can run in parallel after Phase 2)
- T032 + T033 (build checks run independently)

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup (fix URL bug, verify scaffold)
2. Complete Phase 2: Foundational (types + schemas)
3. Complete Phase 3: US1 (create room + host indicator)
4. **STOP & VALIDATE**: One-tab create flow works with host label
5. Complete Phase 4: US2 (join room + name validation)
6. **STOP & VALIDATE**: Two-tab join flow works; errors display correctly

### Full Delivery

7. Complete Phase 5: US3 (lobby polling + 404 redirect)
8. Complete Phase 6: US4 (start game endpoint + host-only UI)
9. Complete Phase 7: Build check + full quickstart validation

---

## Notes

- [P] tasks = different files or independent operations, no unresolved dependencies
- [Story] label maps each task to its user story for traceability
- No test tasks generated — validation via `quickstart.md` manual scenarios
- Commit after each checkpoint to keep history granular and assessable
- Do not proceed past a checkpoint until that story's acceptance criteria pass
