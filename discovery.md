# Scribble Discovery Document

## Project Overview

**Type:** Brownfield enhancement project  
**Description:** Multiplayer drawing/guessing game ("Scribble") with REST backend and React frontend  
**Current State:** Scaffold with basic room management; core gameplay features not implemented

---

## Tech Stack

### Backend (`/backend`)
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime |
| Express | 4.21.1 | HTTP server framework |
| TypeScript | 5.6.3 | Type safety |
| Zod | 3.23.8 | Request validation |
| tsx | 4.19.2 | Development execution |
| Vitest | 3.1.3 | Testing |

### Frontend (`/frontend`)
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| React Router | 6.30.1 | Client-side routing |
| Vite | 5.4.10 | Build tool & dev server |
| TypeScript | 5.6.3 | Type safety |
| Vitest | 3.1.3 | Testing |

---

## Architecture

### Backend Structure
```
backend/src/
├── app.ts           # Express app factory
├── server.ts        # Server entry point
├── api/
│   ├── router.ts    # Main API router + error handlers
│   ├── rooms.ts     # Room endpoints
│   └── schemas.ts   # Zod validation schemas
├── models/
│   └── game.ts      # Type definitions (Room, Participant, etc.)
├── services/
│   └── roomStore.ts # In-memory room storage + operations
└── seed/
    └── starterData.ts # Starter words and roles
```

### Frontend Structure
```
frontend/src/
├── App.tsx          # Root component
├── main.tsx         # Entry point
├── routes/
│   └── index.tsx    # BrowserRouter + route definitions
├── pages/
│   ├── StartPage.tsx      # Landing page
│   ├── CreateRoomPage.tsx # Create room form
│   ├── JoinRoomPage.tsx   # Join room form
│   ├── LobbyPage.tsx      # Pre-game waiting room
│   └── GamePage.tsx       # Main game screen
├── components/
│   ├── AppShell.tsx       # Layout wrapper
│   ├── Card.tsx           # Card UI component
│   ├── GuessForm.tsx      # Guess input (placeholder)
│   ├── PageHeader.tsx     # Page headers
│   ├── ResultPanel.tsx    # Activity panel (placeholder)
│   ├── RoomCodeBadge.tsx  # Room code display
│   └── Scoreboard.tsx     # Score display (placeholder)
├── state/
│   └── roomStore.ts       # Room state management (Context-based)
├── services/
│   └── api.ts             # HTTP client
└── styles/
    └── app.css            # Global styles
```

---

## Current API Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/health` | Health check | ✅ Implemented |
| GET | `/` | API info | ✅ Implemented |
| POST | `/rooms` | Create a room | ✅ Implemented |
| POST | `/rooms/:code/join` | Join a room | ✅ Implemented |
| GET | `/rooms/:code` | Fetch room snapshot | ✅ Implemented |

---

## Data Models

### Room (Backend)
```typescript
interface Room {
  code: string;              // 4-char alphanumeric (e.g., "A2B3")
  status: "lobby";           // Only "lobby" implemented
  participants: Participant[];
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}
```

### Participant
```typescript
interface Participant {
  id: string;       // UUID
  name: string;     // Display name
  joinedAt: string; // ISO timestamp
}
```

### RoomSnapshot (API Response)
```typescript
interface RoomSnapshot {
  code: string;
  status: "lobby";
  participants: Participant[];
  availableWords: string[];   // ["rocket", "pizza", "castle", "guitar", "sunflower"]
  roles: ParticipantRole[];   // ["drawer", "guesser"]
}
```

---

## Implemented Features

| Feature | Status | Notes |
|---------|--------|-------|
| App shell and routing | ✅ Complete | 5 routes defined |
| Landing page UI | ✅ Complete | Branded with game info |
| Create room flow | ✅ Complete | Creates room + joins as first participant |
| Join room by code | ✅ Complete | Validates room exists |
| Fetch room snapshot | ✅ Complete | Manual refresh button only |
| In-memory room storage | ✅ Complete | Map-based, lost on restart |
| Lobby participant display | ✅ Complete | Shows list from snapshot |
| Game screen layout | ✅ Complete | Placeholders only |
| Basic styling | ✅ Complete | Light theme CSS |

---

## Incomplete Behaviors (Gaps)

### 1. Host Tracking & Permissions
- **Gap:** Room creator is not marked as host
- **Impact:** Cannot enforce host-only actions
- **Files:** [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts), [backend/src/models/game.ts](backend/src/models/game.ts)

### 2. Automatic Lobby Polling
- **Gap:** Lobby requires manual refresh button click
- **Impact:** Players don't see real-time participant updates
- **Files:** [frontend/src/pages/LobbyPage.tsx](frontend/src/pages/LobbyPage.tsx)

### 3. Start Game Flow
- **Gap:** Start button navigates to game without backend state change
- **Impact:** No validation of player count, no status transition
- **Files:** [frontend/src/pages/LobbyPage.tsx](frontend/src/pages/LobbyPage.tsx), [backend/src/api/rooms.ts](backend/src/api/rooms.ts)

### 4. Player Name Validation
- **Gap:** Empty/whitespace names allowed
- **Impact:** Violates business requirement for trimmed, non-empty names
- **Files:** [backend/src/api/schemas.ts](backend/src/api/schemas.ts), [frontend/src/pages/CreateRoomPage.tsx](frontend/src/pages/CreateRoomPage.tsx), [frontend/src/pages/JoinRoomPage.tsx](frontend/src/pages/JoinRoomPage.tsx)

### 5. Drawer Assignment
- **Gap:** No drawer selection logic
- **Impact:** No one designated to draw
- **Files:** [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts), [backend/src/models/game.ts](backend/src/models/game.ts)

### 6. Secret Word Visibility
- **Gap:** Word exposed to all in `availableWords`
- **Impact:** Guessers can see the answer
- **Files:** [backend/src/services/roomStore.ts](backend/src/services/roomStore.ts#L88-L96) (`toRoomSnapshot`)

### 7. Drawing Canvas
- **Gap:** Canvas is placeholder text only
- **Impact:** Core drawing mechanic missing
- **Files:** [frontend/src/pages/GamePage.tsx](frontend/src/pages/GamePage.tsx)

### 8. Clear Canvas Action
- **Gap:** Not implemented
- **Impact:** Drawer cannot reset canvas
- **Files:** N/A (needs new component/endpoint)

### 9. Guess Submission
- **Gap:** Form submits but does nothing
- **Impact:** No guess handling
- **Files:** [frontend/src/components/GuessForm.tsx](frontend/src/components/GuessForm.tsx), [backend/src/api/rooms.ts](backend/src/api/rooms.ts)

### 10. Guess History & Syncing
- **Gap:** Not implemented
- **Impact:** Players cannot see each other's guesses
- **Files:** [frontend/src/components/ResultPanel.tsx](frontend/src/components/ResultPanel.tsx)

### 11. Scoring System
- **Gap:** No score tracking (100 for correct, 0 for incorrect)
- **Impact:** Core gameplay loop incomplete
- **Files:** [frontend/src/components/Scoreboard.tsx](frontend/src/components/Scoreboard.tsx), [backend/src/models/game.ts](backend/src/models/game.ts)

### 12. Result State Display
- **Gap:** No round-end state showing word, scores, history
- **Impact:** Players don't know round outcome
- **Files:** [frontend/src/components/ResultPanel.tsx](frontend/src/components/ResultPanel.tsx)

### 13. Restart Flow
- **Gap:** No mechanism to return to lobby with preserved players
- **Impact:** Cannot play multiple rounds
- **Files:** N/A (needs new endpoint)

---

## Assumptions

### 1. Single Round Per Game Session
The starter only references "Round 1" in the UI. Multi-round gameplay requires new state tracking.

### 2. No Real-time Updates
Per AGENTS.md constraints: **WebSockets strictly forbidden**. All synchronization must use HTTP polling.

### 3. In-memory Only
Per AGENTS.md constraints: **Databases forbidden**. All state lost on backend restart.

### 4. No Authentication
Per AGENTS.md constraints: **Auth forbidden**. Participant identity tracked by UUID only.

### 5. Deterministic Word Selection
Business scenario requires deterministic (not random) word selection from starter list.

---

## Known Issues / Bugs

### 1. Incorrect API Base URL
- **Location:** [frontend/src/services/api.ts](frontend/src/services/api.ts#L22)
- **Issue:** Default URL includes `/bug` suffix
- **Current:** `http://localhost:3001/bug`
- **Expected:** `http://localhost:3001`

### 2. RoomStatus Type Limitation
- **Location:** [backend/src/models/game.ts](backend/src/models/game.ts#L2)
- **Issue:** Only `"lobby"` defined; needs `"playing"`, `"result"` states

---

## Seed Data

### Words (5 total)
```typescript
["rocket", "pizza", "castle", "guitar", "sunflower"]
```

### Roles
```typescript
["drawer", "guesser"]
```

---

## Development Commands

| Command | Location | Purpose |
|---------|----------|---------|
| `npm run dev` | `/backend` | Start backend with hot reload (port 3001) |
| `npm run dev` | `/frontend` | Start frontend with hot reload (port 5173) |
| `npm test` | Both | Run Vitest tests |
| `npm run build` | Both | Production build |

---

## Verification Checklist

- [ ] Backend health check returns `{ "ok": true }` at `http://localhost:3001/health`
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Create room navigates to lobby with room code
- [ ] Join room with valid code succeeds
- [ ] Manual refresh shows updated participant list
- [ ] Game screen shows placeholder components

---

## Priority Implementation Order

Based on business scenarios and dependencies:

1. **Fix API base URL bug** (blocker)
2. **Host tracking** (required for permissions)
3. **Player name validation** (data integrity)
4. **Automatic lobby polling** (~2s interval)
5. **Start game flow** (status transition, 2-player minimum)
6. **Drawer assignment** (deterministic selection)
7. **Secret word visibility rules** (drawer-only)
8. **Drawing canvas** (core interaction)
9. **Guess submission & validation**
10. **Scoring system**
11. **Synced guess history**
12. **Result state display**
13. **Restart flow**

---

## Files to Modify (By Scenario)

### Scenario 1: Room Setup & Lobby
- `backend/src/models/game.ts` — Add hostId, expand RoomStatus
- `backend/src/services/roomStore.ts` — Host tracking, room validation
- `backend/src/api/rooms.ts` — Start game endpoint
- `backend/src/api/schemas.ts` — Name validation
- `frontend/src/pages/LobbyPage.tsx` — Polling, host UI, start validation
- `frontend/src/services/api.ts` — Fix base URL, add endpoints

### Scenario 2: Game Start & Drawer Flow
- `backend/src/models/game.ts` — Round state, drawer tracking
- `backend/src/services/roomStore.ts` — Word selection, drawer assignment
- `frontend/src/pages/GamePage.tsx` — Drawer/guesser conditional UI

### Scenario 3: Gameplay Interaction
- `frontend/src/pages/GamePage.tsx` — Canvas component
- `frontend/src/components/GuessForm.tsx` — Submit handling
- `backend/src/api/rooms.ts` — Guess endpoint
- `backend/src/models/game.ts` — Guess history, scores

### Scenario 4: Result & Restart
- `backend/src/services/roomStore.ts` — Restart logic
- `frontend/src/components/ResultPanel.tsx` — Final state display
- `frontend/src/components/Scoreboard.tsx` — Score display
