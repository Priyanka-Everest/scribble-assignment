# Reflection Report

**Lab**: Scribble — AI-Assisted Brownfield Enhancement
**Branch**: `scribbleAppByPriyanka`

---

## What the starter app already had

The scaffold provided a runnable but intentionally incomplete Scribble-style drawing/guessing game:

- **App shell and routing** — five pages wired up: Start, Create Room, Join Room, Lobby, and Game
- **Create and join room flows** — backend `POST /rooms` and `POST /rooms/:code/join` endpoints with an in-memory Map store
- **Fetch room snapshot** — `GET /rooms/:code` returning participants and seed data
- **Lobby participant display** — manual refresh button that fetched the latest snapshot
- **Game screen placeholders** — canvas area, guess input, scoreboard, and result panel all present as empty shells
- **Seed data** — five words (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and two roles (`drawer`, `guesser`)
- **Basic styling** — light-theme CSS and branded landing page

What was missing: host tracking, automatic polling, start game logic, drawer assignment, word visibility rules, interactive canvas, guess submission, scoring, result state, and restart.

---

## What I added

### Spec Kit Artifacts
Used Spec Kit to drive all four scenarios before touching code:
- **Constitution** — five engineering principles (HTTP-polling only, in-memory state, TypeScript first, deterministic game rules, brownfield discipline)
- **Specs** — four feature specifications with acceptance scenarios, functional requirements, and success criteria
- **Clarifications** — 10 interactive Q&A sessions resolving ambiguities (host data model, polling strategy, canvas behaviour, guess form visibility, etc.)
- **Plans** — four implementation plans with data models, API contracts, and quickstart validation guides
- **Tasks** — four task lists (35 + 24 + 30 + 21 tasks) with dependency ordering and parallel opportunities

### Scenario 1 — Room Setup & Lobby
- **`hostId`** added to `Room` and `RoomSnapshot` (first participant = host)
- **Name validation** — `.trim().min(1)` on Zod schemas; frontend pre-submission check
- **API base URL bug fix** — removed `/bug` suffix from `api.ts`
- **`POST /rooms/:code/start`** — host-only, requires ≥2 players, transitions to `"playing"`
- **Lobby polling** — `setInterval(2000)` in `LobbyPage.tsx`; clears on unmount; 404 redirects to Start screen
- **Host indicator** — "Host" badge in participant list; Start Game button disabled for non-hosts

### Scenario 2 — Game Start & Drawer Flow
- **`drawerId`** and **`secretWord`** fields on `Room` (set deterministically in `startGame()`)
- **Drawer assignment** — `participants[0].id` (first joiner, always deterministic)
- **Word selection** — `STARTER_WORDS[0]` = `"rocket"` (no randomness)
- **Drawer-only visibility** — `toRoomSnapshot()` returns `secretWord` only when caller matches `drawerId`
- **`availableWords` fix** — returns `[]` during `"playing"` to prevent word leakage
- **Game screen** — mount fetch; role label ("Drawer"/"Guesser"); word shown to drawer, placeholder to guessers

### Scenario 3 — Gameplay Interaction
- **`Guess` type** — `{ participantId, participantName, word, correct, submittedAt }`
- **`guesses[]` and `scores{}`** on `Room`; scores initialised to 0 for all participants in `startGame()`
- **`POST /rooms/:code/guess`** — validates status, rejects drawer (403), trims + case-insensitive compares, awards 100/0 points
- **Interactive canvas** — HTML5 `<canvas>` with `mousedown/mousemove/mouseup` handlers; `lineWidth=3`, `strokeStyle=#000`; Clear Canvas button (drawer only)
- **Guess form** — wired `GuessForm.tsx` with frontend validation, API call, error display
- **Scoreboard** — `Scoreboard.tsx` rebuilt with props (`participants`, `scores`); sorted by score descending
- **Guess history** — rendered from `snapshot.guesses` in submission order with Correct/Incorrect labels
- **Game screen polling** — upgraded from single mount fetch to `setInterval(2000)`

### Scenario 4 — Result, Restart & Final Validation
- **`POST /rooms/:code/end`** — host-only, transitions `"playing"` → `"result"`
- **`POST /rooms/:code/restart`** — host-only, transitions `"result"` → `"lobby"`, clears round state, preserves participants
- **Result view** — conditional section in `GamePage.tsx` when `status === "result"`: secret word revealed to all, final scores, full guess history, Restart button
- **End Round button** — in playing view; disabled for non-hosts
- **Restart detection** — polling detects `status === "lobby"` and navigates all tabs to lobby

---

## AI usage and tradeoffs

Spec Kit structured every decision before implementation. The clarification sessions (e.g., `hostId` on Room vs `isHost` on Participant; guess form hidden vs disabled; canvas for guessers) prevented implementation-level ambiguity that would otherwise have surfaced as bugs or rework.

The constitution's non-negotiable principles (no WebSockets, no DB, deterministic game logic) kept scope disciplined. Every AI suggestion was reviewed against the spec before committing — the spec acted as a checklist rather than just documentation.

**Main tradeoff**: canvas synchronisation to guessers was explicitly deferred. Guessers see a blank white canvas rather than the drawer's strokes. This is documented in the spec and constitution as out-of-scope, not an oversight.

---

## What I would do differently

- The `RoomStatus` type could have included `"result"` from Scenario 1 to avoid a second type-expansion pass in Scenario 4
- The reflection and final validation (quickstart scenarios) should be run before the PR rather than deferred
