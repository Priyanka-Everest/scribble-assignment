# Contract: POST /rooms/:code/guess

**Submit a guess during an active round**

## Request

```
POST /rooms/:code/guess
Content-Type: application/json
```

| Param | Location | Rules                      |
|-------|----------|----------------------------|
| code  | path     | 4-char alphanumeric        |

```json
{ "participantId": "uuid-of-bob", "guess": "ROCKET" }
```

| Field         | Type   | Rules                                    |
|---------------|--------|------------------------------------------|
| participantId | string | Required; valid UUID                     |
| guess         | string | Required; trimmed; min 1 char            |

## Response — 200 OK

Returns the updated room snapshot with the new guess appended and scores updated.

```json
{
  "room": {
    "code": "A2B3",
    "status": "playing",
    "hostId": "uuid-of-alice",
    "drawerId": "uuid-of-alice",
    "secretWord": null,
    "guesses": [
      {
        "participantId": "uuid-of-bob",
        "participantName": "Bob",
        "word": "ROCKET",
        "correct": true,
        "submittedAt": "2026-06-09T10:05:00.000Z"
      }
    ],
    "scores": {
      "uuid-of-alice": 0,
      "uuid-of-bob": 100
    },
    "participants": [...],
    "availableWords": [],
    "roles": ["drawer", "guesser"]
  }
}
```

Note: `secretWord` is `null` because Bob is not the drawer.

## Error Responses

| Status | Condition                                              |
|--------|--------------------------------------------------------|
| 400    | Guess is empty or whitespace-only                      |
| 400    | Room is not in `"playing"` status                      |
| 403    | `participantId` matches `room.drawerId` (drawer guess) |
| 404    | Room code not found                                    |
