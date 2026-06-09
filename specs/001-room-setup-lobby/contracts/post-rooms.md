# Contract: POST /rooms

**Create a new room**

## Request

```
POST /rooms
Content-Type: application/json
```

```json
{ "name": "Alice" }
```

| Field | Type   | Rules                              |
|-------|--------|------------------------------------|
| name  | string | Required; trimmed; min 1 char      |

## Response — 201 Created

```json
{
  "code": "A2B3",
  "status": "lobby",
  "hostId": "uuid-of-alice",
  "participants": [
    { "id": "uuid-of-alice", "name": "Alice", "joinedAt": "2026-06-09T10:00:00.000Z" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

`hostId` equals `participants[0].id` — the creator is always the host.

## Error Responses

| Status | Condition                          |
|--------|------------------------------------|
| 400    | Name missing, empty, or whitespace |
