# Contract: POST /rooms/:code/join

**Join an existing room**

## Request

```
POST /rooms/:code/join
Content-Type: application/json
```

| Param | Location | Rules                      |
|-------|----------|----------------------------|
| code  | path     | 4-char alphanumeric; trimmed before lookup |

```json
{ "name": "Bob" }
```

| Field | Type   | Rules                              |
|-------|--------|------------------------------------|
| name  | string | Required; trimmed; min 1 char      |

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

The joining participant's UUID is in `participants[last].id`.

## Error Responses

| Status | Condition                          |
|--------|------------------------------------|
| 400    | Name missing, empty, or whitespace |
| 404    | Room code not found                |
| 409    | Room is not in "lobby" status (future guard) |
