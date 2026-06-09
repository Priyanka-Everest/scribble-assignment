# Contract: GET /rooms/:code (playing state)

**Fetch room snapshot — behaviour changes once game is in "playing" status**

This contract supplements `specs/001-room-setup-lobby/contracts/get-room.md`
for the active round state.

## Request

```
GET /rooms/:code?participantId=<uuid>
```

| Param         | Location | Rules                                          |
|---------------|----------|------------------------------------------------|
| code          | path     | 4-char alphanumeric                            |
| participantId | query    | UUID of the requesting participant (optional)  |

## Response — 200 OK (drawer calling)

```json
{
  "room": {
    "code": "A2B3",
    "status": "playing",
    "hostId": "uuid-of-alice",
    "drawerId": "uuid-of-alice",
    "secretWord": "rocket",
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-of-bob",   "name": "Bob",   "joinedAt": "..." }
    ],
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

`secretWord` is `"rocket"` because `participantId` matches `drawerId`.

## Response — 200 OK (guesser or no participantId)

```json
{
  "room": {
    "code": "A2B3",
    "status": "playing",
    "hostId": "uuid-of-alice",
    "drawerId": "uuid-of-alice",
    "secretWord": null,
    "participants": [...],
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

`secretWord` is `null`; `availableWords` is always `[]` during `"playing"`.

## Error Responses

| Status | Condition           |
|--------|---------------------|
| 404    | Room code not found |
