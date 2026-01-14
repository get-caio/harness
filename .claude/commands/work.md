# /work — Execute Tickets in Current Phase

Continuously work through tickets in the current phase until blocked or complete.

## Prerequisites

Before running `/work`:

1. ✅ `specs/CURRENT_PHASE` exists with phase number
2. ✅ `specs/phases/PHASE-N-*.md` exists with tickets
3. ✅ `/check-decisions` has been run
4. ✅ All PENDING spec decisions for this phase are DECIDED
5. ✅ Git repo initialized and clean

## Execution Loop

```
┌─────────────────────────────────────────────────────────┐
│                    WORK LOOP                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Read specs/CURRENT_PHASE                            │
│           ↓                                              │
│  2. Read specs/phases/PHASE-N-*.md                      │
│           ↓                                              │
│  3. Find next TODO ticket (respecting dependencies)      │
│           ↓                                              │
│  ┌─ No TODO tickets? ──→ Phase complete! Exit.          │
│  │                                                       │
│  └─ Found ticket ──→ Continue                           │
│           ↓                                              │
│  4. Check for unresolved decisions blocking this ticket  │
│           ↓                                              │
│  ┌─ Blocked? ──→ Mark BLOCKED, try next ticket          │
│  │                                                       │
│  └─ Clear ──→ Continue                                  │
│           ↓                                              │
│  5. Update ticket status → IN_PROGRESS                   │
│           ↓                                              │
│  6. Read relevant skills                                 │
│           ↓                                              │
│  7. Implement with TDD                                   │
│     - Write failing test                                 │
│     - Write implementation                               │
│     - Make test pass                                     │
│     - Refactor if needed                                 │
│           ↓                                              │
│  8. Quality Gate                                         │
│     - bun test ✓                                         │
│     - bun lint ✓                                         │
│     - bun typecheck ✓                                    │
│     - bun audit ✓                                        │
│           ↓                                              │
│  9. Commit with [PN-TXXX] prefix                        │
│           ↓                                              │
│  10. Update ticket status → DONE                         │
│           ↓                                              │
│  11. Log to progress/build-log.md                        │
│           ↓                                              │
│  └────────────→ Loop back to step 3                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Step Details

### 1. Get Current Phase

```bash
PHASE=$(cat specs/CURRENT_PHASE)
# e.g., "1"
```

### 2. Load Phase File

Find and read `specs/phases/PHASE-{N}-*.md`

### 3. Find Next Ticket

Select the next TODO ticket that:

- Has status `TODO`
- Has no unresolved dependencies (blocked-by tickets are DONE)
- Has no PENDING spec decisions

If multiple eligible, pick the one with:

1. Lowest ticket number (maintains order)
2. Fewest dependencies (simpler first)

### 4. Check Decision Gate

Before starting a ticket, verify:

- No PENDING spec decisions in `specs/decisions/` block this ticket
- No PENDING arch decisions in `docs/decisions/` block this ticket

If blocked:

```markdown
| PN-TXXX | Title | BLOCKED | M | - | SD-001 |
```

### 5. Update Status

In the phase file, change:

```markdown
| PN-TXXX | Title | TODO | M | - |
```

to:

```markdown
| PN-TXXX | Title | IN_PROGRESS | M | - |
```

### 6. Read Relevant Skills

Based on ticket content, read applicable skills:

| Ticket involves... | Read...                        |
| ------------------ | ------------------------------ |
| **Any UI work**    | `specs/design/DESIGN.md` first |
| Database/Prisma    | `skills/nextjs-bun-prisma`     |
| Authentication     | `skills/auth`                  |
| API routes/tRPC    | `skills/trpc`                  |
| Claude API         | `skills/ai-integration`        |
| React Native       | `skills/react-native`          |
| Stripe/payments    | `skills/payments`              |
| Tests              | `skills/testing`               |
| User input/auth    | `skills/security`              |

**For UI tickets:** Always check `specs/design/DESIGN.md` for colors, typography, spacing, and component patterns before implementing. Reference `specs/design/assets/` for logo and icon paths.

### 7. Implement with TDD

**Frontend-First Approach:**

For feature tickets, build in this order:

1. Define types/schema (shared contract)
2. Build UI components with dummy data
3. Use MSW to mock API responses
4. Once UI is solid, implement backend
5. Connect real API, remove mocks

This reveals what APIs actually need before building them.

**Test First:**

```typescript
// __tests__/feature.test.ts
describe("Feature", () => {
  it("should do the thing", () => {
    // Write test for expected behavior
    expect(result).toBe(expected);
  });
});
```

**Then Implement:**

```typescript
// src/feature.ts
export function feature() {
  // Implementation that makes test pass
}
```

**For Large Tickets (L or XL):**

Consider spawning a feature subagent:

```
Task: Implement [ticket title]
Context: [ticket details, relevant code, SPEC section]
Agent: feature
```

### 8. Quality Gate

Before committing, run:

```bash
bun test           # All tests pass
bun lint           # No lint errors
bun typecheck      # No type errors
bun audit          # No high/critical vulnerabilities
```

**⚠️ MANDATORY TEST GATE:**

Every ticket MUST have tests. Before committing, verify:

| Check           | Requirement                                |
| --------------- | ------------------------------------------ |
| New test files? | At least one test file created or modified |
| Test count      | At least 1 test per acceptance criterion   |
| Tests pass      | `bun test` exits with 0                    |
| Coverage        | Does not decrease from previous commit     |

**If no tests:** Do NOT commit. Either:

1. Write the tests now (preferred)
2. Create a spec decision explaining why tests are N/A for this ticket, mark ticket BLOCKED, and move to next ticket

"I'll add tests later" is NOT acceptable. "This ticket doesn't need tests" requires human approval via spec decision.

**Security checklist** (for auth/API/data tickets):

- [ ] Input validated with Zod
- [ ] Auth check at start of protected actions
- [ ] Resource ownership verified
- [ ] No secrets in code

**Complexity check:**

- [ ] Functions < 40 lines
- [ ] Nesting < 3 levels
- [ ] No magic numbers

If any fail → Fix and re-run.

### 9. Commit

```bash
git add .
git commit -m "[PN-TXXX] Brief description"
```

Examples:

- `[P1-T001] Initialize Next.js project with Bun`
- `[P2-T008] Add training plan creation form`
- `[P3-T015] Implement Claude workout generation`

### 10. Update Status

In phase file, change:

```markdown
| PN-TXXX | Title | IN_PROGRESS | M | - |
```

to:

```markdown
| PN-TXXX | Title | DONE | M | - |
```

### 11. Log Progress

Add to `progress/build-log.md`:

```markdown
### PN-TXXX: [Title]

**Completed:** YYYY-MM-DD HH:MM
**Files changed:** X
**Tests added:** Y
**Commit:** abc123
```

---

## Handling Blocks During Work

If you discover an ambiguity while working:

### Spec Ambiguity (Business/Product)

1. Create decision in `specs/decisions/NNN-title.md`
2. Mark ticket BLOCKED in phase file
3. Continue with other tickets
4. Human resolves decision
5. Resume blocked ticket

### Architecture Question (Technical)

1. Create decision in `docs/decisions/NNN-title.md`
2. Mark ticket BLOCKED in phase file
3. Continue with other tickets
4. Human (or agent with approval) resolves
5. Resume blocked ticket

---

## Phase Completion

Phase is complete when:

- All tickets are DONE or SKIPPED
- No IN_PROGRESS tickets remain
- All tests passing
- Human sign-off received

Then:

1. Update phase file status to COMPLETE
2. Log phase completion to build-log.md
3. **Run `/audit` to catch issues early** (especially after Phase 1 and 2)
4. Run `/init-phase N+1` for next phase

**⚠️ AUDIT GATE:** Run `/audit` after completing Phase 1, Phase 2, and before any PR. Catching issues early prevents drift that compounds across phases.

---

## Exit Conditions

Stop the work loop when:

1. **Phase complete** — All tickets DONE
2. **All blocked** — Remaining tickets have PENDING decisions
3. **Human interrupt** — Manual stop requested
4. **Error threshold** — Too many consecutive failures

On exit, report:

- Tickets completed this session
- Tickets remaining
- Blocking decisions (if any)
- Next steps
