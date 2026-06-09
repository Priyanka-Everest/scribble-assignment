# Contract: POST /rooms/:code/end

**End the current round — host only**

## Request

```
POST /rooms/:code/end
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

Returns the updated snapshot with `status: "result"` and `secretWord` visible to all.

```json
{
  "room": {
    "code": "A2B3",
    "status": "result",
    "hostId": "uuid-of-alice",
    "drawerId": "uuid-of-alice",
    "secretWord": "rocket",
    "guesses": [...],
    "scores": { "uuid-of-alice": 0, "uuid-of-bob": 100 },
    "participants": [...],
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

`secretWord` is now `"rocket"` for all callers (result state reveals it).

## Error Responses

| Status | Condition                                          |
|--------|----------------------------------------------------|
| 400    | Room is not in `"playing"` status                  |
| 403    | `participantId` does not match `room.hostId`       |
| 404    | Room code not found                                |
