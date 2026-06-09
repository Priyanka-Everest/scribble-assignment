# Contract: POST /rooms/:code/restart

**Restart — return to lobby with players preserved, round state cleared**

## Request

```
POST /rooms/:code/restart
Content-Type: application/json
```

| Param | Location | Rules                      |
|-------|----------|----------------------------|
| code  | path     | 4-char alphanumeric        |

```json
{ "participantId": "uuid-of-alice" }
```

## Response — 200 OK

Returns the updated snapshot with `status: "lobby"` and round state cleared.

```json
{
  "room": {
    "code": "A2B3",
    "status": "lobby",
    "hostId": "uuid-of-alice",
    "drawerId": null,
    "secretWord": null,
    "guesses": [],
    "scores": {},
    "participants": [
      { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "..." },
      { "id": "uuid-of-bob",   "name": "Bob",   "joinedAt": "..." }
    ],
    "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
    "roles": ["drawer", "guesser"]
  }
}
```

Participants are unchanged. `availableWords` returns the full seed list (lobby state).

## Error Responses

| Status | Condition                                          |
|--------|----------------------------------------------------|
| 400    | Room is not in `"result"` status                   |
| 403    | `participantId` does not match `room.hostId`       |
| 404    | Room code not found                                |
