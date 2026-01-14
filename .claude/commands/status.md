# /status — Report Current State

Display the current state of the project including phase progress, tickets, and decisions.

## Output Format

```markdown
# Project Status

**Generated:** YYYY-MM-DD HH:MM

---

## Current Phase

**Phase:** N - [Phase Name]
**Status:** IN_PROGRESS | BLOCKED | COMPLETE
**Started:** YYYY-MM-DD

### Progress

| Status      | Count |
| ----------- | ----- |
| DONE        | X     |
| IN_PROGRESS | X     |
| BLOCKED     | X     |
| TODO        | X     |
| **Total**   | **X** |

### Current Ticket

[PN-TXXX] [Title]

- Status: IN_PROGRESS
- Started: YYYY-MM-DD HH:MM
- Blocked by: None

### Next Up

[PN-TXXX] [Title] — [Brief description]

---

## Decisions

### Spec Decisions (specs/decisions/)

| ID     | Title           | Status  | Blocks  |
| ------ | --------------- | ------- | ------- |
| SD-001 | Auth provider   | PENDING | P1-T006 |
| SD-002 | Vector database | DECIDED | -       |

### Architecture Decisions (docs/decisions/)

| ID     | Title            | Status  | Blocks  |
| ------ | ---------------- | ------- | ------- |
| AD-001 | Caching strategy | PENDING | P2-T015 |

---

## Recent Activity

From progress/build-log.md:

- [YYYY-MM-DD HH:MM] Completed P1-T005: Set up Vitest
- [YYYY-MM-DD HH:MM] Completed P1-T004: Configure linting
- [YYYY-MM-DD HH:MM] Started Phase 1

---

## Blockers

### Blocking Decisions

1. **SD-001: Auth provider choice**
   - Blocks: P1-T006, P1-T007, P1-T008
   - Options: BetterAuth vs NextAuth
   - Action needed: Human decision required

### External Blockers

[None currently]

---

## Health Check

| Check             | Status  |
| ----------------- | ------- |
| Tests passing     | ✅      |
| Test coverage     | ✅ [X]% |
| Test:source ratio | ✅ 0.X  |
| Lint clean        | ✅      |
| Type check        | ✅      |
| No console.log    | ✅      |

### Test Health (Critical)

| Metric            | Value  | Threshold | Status |
| ----------------- | ------ | --------- | ------ |
| Test files        | X      | >0        | ✅/❌  |
| Test:source ratio | 0.X    | >0.3      | ✅/❌  |
| Coverage          | X%     | >60%      | ✅/❌  |
| Vitest configured | Yes/No | Yes       | ✅/❌  |

⚠️ **Zero tests is a critical blocker.** If test count is 0 after Phase 1, work should stop until tests are added.

---

## Next Steps

1. Resolve PENDING decision: SD-001
2. Continue with ticket: P1-T003
3. [Or other recommended action]
```

---

## Data Sources

| Data            | Source                              |
| --------------- | ----------------------------------- |
| Phase number    | `specs/CURRENT_PHASE`               |
| Phase details   | `specs/phases/PHASE-N-*.md`         |
| Spec decisions  | `specs/decisions/*.md`              |
| Arch decisions  | `docs/decisions/*.md`               |
| Activity log    | `progress/build-log.md`             |
| CLAUDE.md state | `CLAUDE.md` (Current State section) |

---

## Quick Status

For a shorter status, use:

```markdown
# Quick Status

Phase 1: 5/12 tickets done (42%)
Blocked: 2 tickets (pending SD-001)
Current: P1-T006 (IN_PROGRESS)
Next: P1-T003 (TODO)
```

---

## Update CLAUDE.md State

After generating status, update the Current State section in CLAUDE.md:

```yaml
current_phase: 1
current_ticket: P1-T006
blocked_on: SD-001
last_completed: P1-T005
tickets_done: 5
tickets_in_phase: 12
open_spec_decisions: 1
open_arch_decisions: 0
```
