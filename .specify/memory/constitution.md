<!--
## Sync Impact Report

**Version change**: [template] → 1.0.0
**Bump rationale**: Initial population — all placeholder tokens replaced with project-specific
content. First versioned constitution.

### Principles
- [PRINCIPLE_1_NAME] → I. HTTP-Polling Only (NON-NEGOTIABLE)
- [PRINCIPLE_2_NAME] → II. In-Memory State Only (NON-NEGOTIABLE)
- [PRINCIPLE_3_NAME] → III. TypeScript First
- [PRINCIPLE_4_NAME] → IV. Deterministic Game Rules
- [PRINCIPLE_5_NAME] → V. Brownfield Discipline

### Added Sections
- Core Principles (5 principles fully defined)
- AI Usage & Review Rules
- Testing & Validation Standards
- Governance

### Removed Sections
- None (all template sections retained and filled)

### Templates
- `.specify/templates/plan-template.md` — Constitution Check section reads
  "[Gates determined based on constitution file]"; ⚠ pending — update to list
  the five principles explicitly as gates.
- `.specify/templates/spec-template.md` — ✅ no constitution-specific placeholders;
  no update required.
- `.specify/templates/tasks-template.md` — ✅ no constitution-specific placeholders;
  no update required.

### Deferred TODOs
- None — all fields resolved from repo context.
-->

# Scribble Constitution

## Core Principles

### I. HTTP-Polling Only (NON-NEGOTIABLE)

All client–server synchronisation MUST use HTTP polling. WebSockets, Socket.io,
Server-Sent Events, or any real-time push protocol are strictly forbidden.

- Lobby participant lists MUST refresh on a ~2-second polling interval.
- Guess history and game state MUST be fetched via the existing `GET /rooms/:code`
  snapshot endpoint (or a new polling endpoint), never pushed.
- Rationale: the assignment constraint is absolute; violating it introduces an
  out-of-scope dependency and disqualifies the submission.

### II. In-Memory State Only (NON-NEGOTIABLE)

All game state MUST live in the backend's in-memory `roomStore`. No database,
file, cache layer, or external storage of any kind is permitted.

- State is intentionally ephemeral; room data is lost on backend restart by design.
- No authentication, sessions, JWT, OAuth, or user accounts may be introduced.
- Participant identity is tracked by UUID only (generated at join time).
- Rationale: assignment constraint; adding persistence or auth is out of scope and
  will be penalised.

### III. TypeScript First

All new and modified source files MUST be fully typed TypeScript.

- `any` is forbidden; use `unknown` for genuinely dynamic values.
- All backend request/response payloads MUST be validated with Zod schemas
  (`backend/src/api/schemas.ts`).
- Frontend state and API service calls MUST carry explicit type annotations.
- Build (`npm run build`) MUST pass without type errors in both `backend/` and
  `frontend/` before a feature is considered complete.

### IV. Deterministic Game Rules

Game mechanics MUST produce the same outcome given the same inputs — no
`Math.random()` calls in game logic.

- **Drawer assignment**: the first participant who joined the room becomes the drawer.
- **Word selection**: the secret word is the element at index 0 of the starter word
  list (`["rocket","pizza","castle","guitar","sunflower"]`). Rotation across rounds
  is out of scope.
- **Scoring**: a correct guess scores exactly 100; an incorrect guess scores 0.
  No speed bonuses, drawer bonuses, or partial credit.
- **Guess comparison**: trimmed, case-insensitive string equality against the secret
  word.
- **Name validation**: player names MUST be trimmed; empty or whitespace-only names
  MUST be rejected with a clear error message on both frontend and backend.
- Rationale: determinism makes acceptance testing reliable and eliminates flaky
  multi-browser validation.

### V. Brownfield Discipline

This is a brownfield enhancement. The scaffold MUST NOT be rewritten without
explicit justification documented in the plan.

- Follow established patterns: Zod validation, Express router, React functional
  components, hooks, Context-based state (`src/state/roomStore.ts`).
- No new top-level dependencies may be introduced unless the plan documents why
  existing tools are insufficient.
- No unrelated refactors. Touch only the files required by the current scenario.
- Rationale: the assignment evaluates incremental, traceable change — not a ground-up
  rewrite.

## AI Usage & Review Rules

AI-generated code MUST be reviewed before committing.

- Every AI suggestion MUST be read line-by-line and verified against the current
  spec acceptance criteria before it is committed.
- AI output that introduces a forbidden pattern (WebSockets, database calls, `any`
  types, random game logic) MUST be rejected and corrected manually.
- Commit messages MUST describe the intent of the change, not just "AI suggestion"
  or "generated code".
- AI assistants MAY be used for discovery, specification drafting, plan generation,
  and task decomposition, but the author remains responsible for correctness.
- Spec Kit artifacts (constitution, spec, plan, tasks) MUST be committed alongside
  or before the implementation they describe — not retrofitted.

## Testing & Validation Standards

Each scenario MUST be validated with two browser tabs before moving to the next.

- **Acceptance criteria**: verify every Given/When/Then in the spec against live
  running frontend (`http://localhost:5173`) and backend (`http://localhost:3001`).
- **Edge cases**: empty names, invalid room codes, duplicate room codes, and
  single-player start attempts MUST be exercised manually.
- **Multi-room isolation**: create two rooms simultaneously and confirm actions in
  one do not affect the other.
- **Build gate**: `npm run build` MUST succeed in both `backend/` and `frontend/`
  before raising a PR.
- Automated tests (Vitest) are encouraged but not required by the assignment; if
  written they MUST pass before committing.
- Rationale: the rubric explicitly rewards edge-case handling and working two-browser
  game flows.

## Governance

This constitution supersedes all other development guidance except explicit
assignment constraints stated in `README.md` and `AGENTS.md`. Where they conflict,
`README.md`/`AGENTS.md` take precedence.

- **Amendments**: any change to a principle requires updating this file, incrementing
  the version, and noting the change in the next spec or plan artifact.
- **Versioning policy**:
  - MAJOR — principle removed, redefined, or made incompatible with prior work.
  - MINOR — new principle or section added.
  - PATCH — clarifications, wording fixes, non-semantic refinements.
- **Compliance review**: each PR description MUST confirm that no forbidden patterns
  (WebSockets, databases, auth, `any` types, random game logic) were introduced.
- **Guidance files**: `AGENTS.md` governs AI agent behaviour; `README.md` governs
  assignment scope. This file governs engineering and workflow decisions.

**Version**: 1.0.0 | **Ratified**: 2026-06-08 | **Last Amended**: 2026-06-08
