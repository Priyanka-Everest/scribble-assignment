# Quickstart: Room Setup & Lobby Validation

**Feature**: 001-room-setup-lobby
**Date**: 2026-06-09

Use this guide to verify the feature works end-to-end after implementation.
Run all scenarios with two browser tabs open side-by-side.

## Prerequisites

- Node.js 18+ and npm 9+
- Backend running: `cd backend && npm run dev` → `http://localhost:3001`
- Frontend running: `cd frontend && npm run dev` → `http://localhost:5173`
- Confirm health: `curl http://localhost:3001/health` returns `{"ok":true}`

## Scenario A — Create Room & Host Indicator

1. Open Tab 1 at `http://localhost:5173`
2. Click **Create Room**, enter name `"Alice"`, submit
3. **Expected**: Land on Lobby screen showing:
   - Room code (4 chars, e.g. `A2B3`)
   - `"Alice"` in the participant list with a **Host** indicator
   - Start Game button visible but disabled (only 1 player)
4. Note the room code for Scenario B

## Scenario B — Join Room & Lobby Polling

1. Open Tab 2 at `http://localhost:5173`
2. Click **Join Room**, enter the code from Scenario A and name `"Bob"`, submit
3. **Expected in Tab 2**: Land on Lobby showing both `Alice (Host)` and `Bob`
4. **Expected in Tab 1**: Within ~2 seconds (without clicking anything), `Bob`
   appears in the participant list automatically
5. Confirm Start Game button is **disabled** in Tab 2 with host-only label
6. Confirm Start Game button is **enabled** in Tab 1 (host, 2 players present)

## Scenario C — Name Validation

1. On the Create Room form, submit with an **empty name** → error message shown,
   no room created
2. Submit with `"   "` (spaces only) → same error
3. Submit with `"  Alice  "` → room created with name stored as `"Alice"` (trimmed)
4. Repeat steps 1–3 on the Join Room form

## Scenario D — Invalid Room Code

1. On the Join Room form, enter code `"ZZZZ"` (non-existent) → clear error message,
   no navigation
2. Enter `" A2B3 "` (with spaces, using the valid code from Scenario A) → join
   succeeds (code trimmed before lookup)

## Scenario E — Start Game (Host Only)

1. With 2 players in the lobby (Scenarios A + B complete):
2. In Tab 1 (host), click **Start Game**
3. **Expected**: Tab 1 navigates to the Game screen
4. **Expected**: Tab 2 automatically navigates to the Game screen within ~2 seconds
   (polling detects `status: "playing"`)

## Scenario F — Multi-Room Isolation

1. Create Room X in Tab 1 (Alice), Room Y in Tab 2 (Carol)
2. In Tab 3, join Room X as Bob
3. In Tab 4, join Room Y as Dave
4. Verify Tab 1 lobby shows only Alice + Bob; Tab 2 lobby shows only Carol + Dave
5. No cross-room participant visibility

## Scenario G — Backend Restart (404 Handling)

1. With a player in the lobby, restart the backend (`Ctrl+C` then `npm run dev`)
2. **Expected**: Within ~2 seconds the lobby redirects to the Start screen with
   a "Room not found" error message

## Build Verification

```bash
cd backend && npm run build   # must complete with 0 errors
cd frontend && npm run build  # must complete with 0 errors
```

## API Reference

See `contracts/` for full request/response shapes:
- [POST /rooms](contracts/post-rooms.md)
- [POST /rooms/:code/join](contracts/post-join.md)
- [GET /rooms/:code](contracts/get-room.md)
- [POST /rooms/:code/start](contracts/post-start.md)
