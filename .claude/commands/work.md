# /work — Execute Tickets in Current Phase

Continuously work through tickets in the current phase until blocked or complete.

**CRITICAL: Auto-continuation is mandatory.** After completing a ticket, you MUST immediately pick up the next TODO ticket. Do NOT stop to summarize, ask permission, or wait for input between tickets. The only valid exit conditions are listed at the bottom of this file.

## Prerequisites

Before running `/work`:

1. ✅ `specs/CURRENT_PHASE` exists with phase number
2. ✅ `specs/phases/PHASE-N-*.md` exists with tickets
3. ✅ `/check-decisions` has been run
4. ✅ All PENDING spec decisions for this phase are DECIDED
5. ✅ Git repo initialized and clean

## Session Management

### Starting a session

Name your session for easy resumption:

```bash
# Start a named work session
claude --session-id "phase-1-work" --resume

# Or use /rename inside Claude Code
/rename phase-1-tickets
```

### Resuming after interruption

If context runs out or the session is interrupted:

```bash
# Resume the same session
claude --session-id "phase-1-work" --resume
```

On resume, re-read:

1. `specs/CURRENT_PHASE`
2. `specs/phases/PHASE-N-*.md` — check which tickets are DONE, find next TODO
3. `progress/build-log.md` — see what was last completed
4. `progress/conventions.md` — maintain established patterns

### Context management

The environment is configured with `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=70` for aggressive compaction. This means context auto-compacts at 70% usage, keeping you working longer before needing a new session.

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
│  ┌─ No TODO tickets? ──→ Run /audit + /audit types,     │
│  │                       then exit. Phase complete!     │
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
│  12. Update docs (parallel subagents)                    │
│     - Determine affected doc categories                  │
│     - Spawn subagents per category in parallel           │
│     - Each reads VitePress skill + source + current doc  │
│     - Updates docs/ markdown files                       │
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

### 6. Read Context & Relevant Skills

**Before every ticket**, read:

- `progress/conventions.md` — follow established patterns
- `progress/dead-ends.md` — avoid repeating failed approaches
- **Relevant `docs/` pages** — read the existing documentation for any feature area the ticket touches. This is the fastest way to understand the current state of that part of the system (data model, API contracts, auth flow, component inventory). Check the mapping below.

| Ticket touches...     | Read first...                     |
| --------------------- | --------------------------------- |
| Database / schema     | `docs/architecture/data-model.md` |
| API routes / tRPC     | `docs/architecture/api.md`        |
| Auth / sessions       | `docs/architecture/auth.md`       |
| UI components         | `docs/components/index.md`        |
| System architecture   | `docs/architecture/index.md`      |
| Setup / env / tooling | `docs/guide/getting-started.md`   |

Then, based on ticket content, read applicable skills:

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

**Ticket Sizing and Agent Delegation:**

| Size     | Lines (est.) | Approach                      | Agent         |
| -------- | ------------ | ----------------------------- | ------------- |
| S (< 2h) | < 200        | Work directly in main loop    | (self)        |
| M (2-4h) | 200-500      | Subagent (stays in same tree) | `implementer` |
| L (4-8h) | 500+         | Subagent in worktree          | `feature`     |
| XL (8h+) | 1000+        | Subagent in worktree          | `feature`     |

**For S/M tickets — work inline:**

```
Frontend-first approach:
1. Define types/schema (shared contract)
2. Build UI components with dummy data
3. Use MSW to mock API responses
4. Once UI is solid, implement backend
5. Connect real API, remove mocks
```

**For L/XL tickets — spawn feature agent in worktree:**

```
Task tool call:
  subagent_type: feature
  isolation: worktree
  prompt: |
    Implement [PN-TXXX]: [ticket title]

    Ticket details: [paste from phase file]
    Relevant spec section: [paste from SPEC.md]
    Existing patterns: [paste from conventions.md]

    Read these skills first: [relevant skill names]
    Read these docs first: [relevant doc paths]

    Commit with: [PN-TXXX] [description]
```

**For parallel independent tickets — use coordinator:**

When 3+ independent tickets have no file overlap, spawn the coordinator agent:

```
Task tool call:
  subagent_type: coordinator (custom agent)
  prompt: |
    Coordinate parallel work on these independent tickets:
    - PN-TXXX: [title] (files: src/components/auth/*)
    - PN-TXXX: [title] (files: src/components/dashboard/*)
    - PN-TXXX: [title] (files: prisma/*, src/lib/db.ts)

    Phase file: specs/phases/PHASE-N-*.md
    Max 3 parallel agents. Respect file ownership.
```

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

### 12. Update Documentation

After each ticket, update the living documentation in `docs/` using parallel documentation subagents.

**Read the VitePress skill first:** `.claude/skills/vitepress/SKILL.md`

**Step 12a: Determine affected doc categories**

Based on what the ticket changed, identify which docs need updating:

| Ticket changed...                 | Update these docs                       |
| --------------------------------- | --------------------------------------- |
| Prisma schema / migrations        | `docs/architecture/data-model.md`       |
| tRPC routers / API routes         | `docs/architecture/api.md`, `docs/api/` |
| Auth (login, session, middleware) | `docs/architecture/auth.md`             |
| New shared UI component           | `docs/components/index.md`              |
| Setup / tooling / env vars        | `docs/guide/getting-started.md`         |
| New integration / service         | `docs/architecture/` (new page)         |
| Architecture decision             | `docs/decisions/index.md`               |
| System diagram changes            | `docs/architecture/index.md`            |

If no doc categories are affected (e.g., pure test-only changes), skip this step.

**Step 12b: Spawn doc-writer agent**

Use the dedicated `doc-writer` agent (runs on haiku — cheap and fast):

```
Task:
  subagent_type: doc-writer (custom agent)
  prompt: |
    TICKET CONTEXT:
    - Ticket: [PN-TXXX] [Title]
    - Files changed: [list of files]
    - What was implemented: [brief summary]
    - Doc files to update: [list from 12a mapping]
```

The doc-writer agent already has the VitePress skill preloaded and knows the formatting rules. For multiple doc categories, spawn one doc-writer per category in parallel.

**Example: After a schema ticket**

```
Spawn in parallel:
  1. Subagent → Update docs/architecture/data-model.md
     - Read prisma/schema.prisma
     - Update ER diagram, model tables, migration log

  2. Subagent → Update docs/architecture/index.md
     - Update system diagram if new entities affect architecture
```

**Example: After an API + component ticket**

```
Spawn in parallel:
  1. Subagent → Update docs/architecture/api.md
     - Read the new tRPC router
     - Add procedures to the route table

  2. Subagent → Update docs/api/index.md
     - Add detailed endpoint docs with request/response shapes

  3. Subagent → Update docs/components/index.md
     - Add new component to appropriate category table
```

**Step 12c: Verify sidebar**

After subagents complete, check if any new pages were added to `docs/`. If so, update `docs/.vitepress/config.ts` sidebar to include them.

---

## Logging Failed Approaches

When an approach doesn't work during implementation (wrong library, bad pattern, hitting a dead end), log it in `progress/dead-ends.md` BEFORE trying an alternative:

```markdown
## YYYY-MM-DD — [PN-TXXX] Brief description

**Ticket:** PN-TXXX
**Approach:** What was attempted
**Result:** What went wrong
**Why it failed:** Root cause if known
**What worked instead:** The successful approach
```

This is not optional busywork — it prevents the highest-waste pattern in agent development: a fresh context re-trying something that already failed.

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

Then, in this exact order:

1. Update phase file status to COMPLETE
2. Log phase completion to `progress/build-log.md`
3. **Run `/audit`** to catch issues early (especially after Phase 1 and 2)
4. **Run `/audit types`** — MANDATORY. Generates `specs/phases/PHASE-N-type-manifest.md`. The next phase will not see this phase's exports without it. Do not skip even if the standard `/audit` was clean.
5. Verify the manifest file exists at `specs/phases/PHASE-N-type-manifest.md` before continuing.
6. Run `/init-phase N+1` for the next phase — it will read the manifest you just generated.

**⚠️ AUDIT GATE:** Run `/audit` after completing Phase 1, Phase 2, and before any PR. Catching issues early prevents drift that compounds across phases.

**⚠️ TYPE MANIFEST GATE:** `/audit types` is mandatory at every phase boundary. Skipping it causes the next phase to reinvent existing types, which is the single highest-cost integration bug pattern. The manifest takes 1-2 minutes to generate and prevents days of debugging.

---

## Exit Conditions

**ONLY stop the work loop when one of these conditions is met:**

1. **Phase complete** — All tickets are DONE or SKIPPED
2. **All blocked** — Every remaining ticket has a PENDING decision
3. **Human interrupt** — User explicitly says stop (Ctrl+C or message)
4. **Error threshold** — 3+ consecutive failures on the same ticket

**These are NOT valid reasons to stop:**

- "I completed a ticket" — pick up the next one
- "I want to summarize progress" — summarize after exiting, not instead of continuing
- "The ticket was complex" — complexity is expected, continue working
- "I should check with the user" — only stop if you're genuinely blocked

On exit, report:

```
Work Session Summary
━━━━━━━━━━━━━━━━━━━
Phase: N
Tickets completed: X (list them)
Tickets remaining: Y
Blocked tickets: Z (with blocking decision IDs)
Next steps: [what human needs to do]

Resume with: claude --session-id "[session-name]" --resume
```
