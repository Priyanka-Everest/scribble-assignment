# Contract: GET /rooms/:code (playing state — v2 with guesses & scores)

**Fetch room snapshot with guess history and scores (used by game screen polling)**

Extends the contract from `specs/002-game-start-drawer-flow/contracts/get-room-playing.md`.

## Request

```
GET /rooms/:code?participantId=<uuid>
```

## Response — 200 OK (any participant during "playing")

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
        "word": "pizza",
        "correct": false,
        "submittedAt": "2026-06-09T10:04:00.000Z"
      },
      {
        "participantId": "uuid-of-bob",
        "participantName": "Bob",
        "word": "rocket",
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

`guesses` and `scores` are returned to all callers — no viewer-based filtering.
`secretWord` is still filtered by `drawerId` (from Scenario 2 logic).

## Error Responses

| Status | Condition           |
|--------|---------------------|
| 404    | Room code not found |
