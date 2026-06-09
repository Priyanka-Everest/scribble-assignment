# Contract: POST /rooms/:code/start

**Start the game — host only, minimum 2 participants**

## Request

```
POST /rooms/:code/start
Content-Type: application/json
```

| Param | Location | Rules                      |
|-------|----------|----------------------------|
| code  | path     | 4-char alphanumeric        |

```json
{ "participantId": "uuid-of-alice" }
```

| Field         | Type   | Rules                              |
|---------------|--------|------------------------------------|
| participantId | string | Required; valid UUID               |

## Response — 200 OK

Returns the updated room snapshot with `status: "playing"`.

```json
{
  "code": "A2B3",
  "status": "playing",
  "hostId": "uuid-of-alice",
  "participants": [
    { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "2026-06-09T10:00:00.000Z" },
    { "id": "uuid-of-bob",   "name": "Bob",   "joinedAt": "2026-06-09T10:00:05.000Z" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

## Error Responses

| Status | Condition                                             |
|--------|-------------------------------------------------------|
| 400    | Fewer than 2 participants in the room                 |
| 400    | Room is not in "lobby" status                         |
| 403    | `participantId` does not match `room.hostId`          |
| 404    | Room code not found                                   |
