# Contract: GET /rooms/:code

**Fetch current room snapshot (used by lobby polling)**

## Request

```
GET /rooms/:code
```

| Param | Location | Rules                      |
|-------|----------|----------------------------|
| code  | path     | 4-char alphanumeric        |

## Response — 200 OK

```json
{
  "code": "A2B3",
  "status": "lobby",
  "hostId": "uuid-of-alice",
  "participants": [
    { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "2026-06-09T10:00:00.000Z" },
    { "id": "uuid-of-bob",   "name": "Bob",   "joinedAt": "2026-06-09T10:00:05.000Z" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

`hostId` is always present. Frontend compares it to `myParticipantId` to
determine host status. When `status` changes to `"playing"`, the frontend
navigates to the game screen.

## Error Responses

| Status | Condition           |
|--------|---------------------|
| 404    | Room code not found |
