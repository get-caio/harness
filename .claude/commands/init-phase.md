# /init-phase N — Generate Tickets for Phase N

Generate the ticket file for a specific phase based on the approved phase proposal and SPEC.md.

## Usage

```
/init-phase 1    # Generate Phase 1 tickets
/init-phase 2    # Generate Phase 2 tickets
```

## Prerequisites

- `specs/SPEC.md` exists
- Phase proposal approved by human
- Previous phases complete (for N > 1)
- **Prior phase type manifest exists** (for N > 1) — `specs/phases/PHASE-(N-1)-type-manifest.md` must be present. If missing, run `/audit types` against the prior phase first. Without this file, the new phase will reinvent existing types.

## Process

### 1. Update Current Phase

Write the phase number to `specs/CURRENT_PHASE`:

```bash
echo "N" > specs/CURRENT_PHASE
```

### 2. Read Phase Scope

Reference the approved phase proposal or SPEC.md section to understand:

- What features are in this phase
- What the dependencies are
- What the acceptance criteria are

### 2a. Load Prior Phase Type Manifest (N > 1 only)

For phase N > 1, read `specs/phases/PHASE-(N-1)-type-manifest.md` in full. This file lists every type, interface, Zod schema, and enum the previous phase exported, grouped by module. Treat it as a hard contract:

- The new phase MUST import these types instead of redefining them.
- The new phase's tickets MUST cite the manifest in their Technical Notes whenever they touch a concept that already exists.
- If the manifest flags any "Possible Duplicates", note them in the new phase as cleanup tickets — do not extend a duplicate further.

If the manifest does not exist:

1. Stop. Do not generate the new phase's tickets.
2. Run `/audit types` against the prior phase first to produce it.
3. Then resume `/init-phase N`.

If the manifest exists but is older than the most recent commit on the prior phase's last ticket, regenerate it with `/audit types` before proceeding.

### 3. Generate Phase Ticket File

Create `specs/phases/PHASE-N-name.md`:

```markdown
# Phase N: [Phase Name]

**Status:** IN_PROGRESS
**Started:** YYYY-MM-DD
**Target:** YYYY-MM-DD (optional)

## Phase Goal

[One paragraph describing what this phase accomplishes]

## Scope

### In Scope

- Feature A
- Feature B
- Feature C

### Out of Scope (Later Phases)

- Feature X (Phase N+1)
- Feature Y (Phase N+2)

## Dependencies

- Phase N-1 must be complete
- [Any external dependencies: API keys, design assets, etc.]

---

## Existing Exports — Import, Don't Reinvent

**(Auto-injected from `specs/phases/PHASE-(N-1)-type-manifest.md` — only present for N > 1)**

Phase N-1 exported the following types and schemas. **Every ticket in this phase MUST import these instead of redefining them.** If a ticket touches a concept listed below and you find yourself writing a `type` or `interface` for it, stop and import.

| Concept          | Kind       | Source                       | Import                                                            |
| ---------------- | ---------- | ---------------------------- | ----------------------------------------------------------------- |
| `User`           | type + Zod | `lib/users/types.ts`         | `import type { User } from "@/lib/users/types"`                   |
| `userSchema`     | Zod        | `lib/users/types.ts`         | `import { userSchema } from "@/lib/users/types"`                  |
| `StepConditions` | type + Zod | `lib/orchestration/types.ts` | `import type { StepConditions } from "@/lib/orchestration/types"` |

[Render the actual contents of PHASE-(N-1)-type-manifest.md "Module: ..." sections here, condensed to one row per export. Truncate if > 50 rows and link to the manifest file for the full list.]

### Possible Duplicates from Prior Phase (cleanup candidates)

[If the prior manifest flagged any duplicates, list them here with a TODO ticket reference.]

---

## Tickets

### Scaffolding

| ID        | Title   | Status | Est   | Blocked By |
| --------- | ------- | ------ | ----- | ---------- |
| P{N}-T001 | [Title] | TODO   | S/M/L | -          |
| P{N}-T002 | [Title] | TODO   | S/M/L | T001       |

### [Feature Area 1]

| ID        | Title   | Status | Est   | Blocked By |
| --------- | ------- | ------ | ----- | ---------- |
| P{N}-T003 | [Title] | TODO   | S/M/L | T002       |
| P{N}-T004 | [Title] | TODO   | S/M/L | T003       |

### [Feature Area 2]

| ID        | Title   | Status | Est   | Blocked By |
| --------- | ------- | ------ | ----- | ---------- |
| P{N}-T005 | [Title] | TODO   | S/M/L | -          |
| P{N}-T006 | [Title] | TODO   | S/M/L | T005       |

---

## Ticket Details

### P{N}-T001: [Title]

**Estimate:** S (1-2 hrs) | M (2-4 hrs) | L (4-8 hrs)
**Blocked By:** None
**Spec Reference:** Section X.Y

**Description:**
[What needs to be built]

**Acceptance Criteria:**

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All tests pass

**Required Tests:** [MANDATORY - specify what tests are needed]

- [ ] Unit test: [describe test case]
- [ ] Unit test: [describe test case]
- [ ] Integration test: [if applicable]

⚠️ If "Required Tests" is empty or says "N/A", a spec decision is required for human approval before this ticket can be marked DONE.

**Technical Notes:**

- [Any implementation hints]
- [Relevant skill: .claude/skills/xyz/SKILL.md]

---

### P{N}-T002: [Title]

[Repeat for each ticket...]

---

## Completion Criteria

Phase is complete when:

- [ ] All tickets DONE or explicitly SKIPPED
- [ ] All tests passing
- [ ] No PENDING spec decisions for this phase
- [ ] Human sign-off received
```

### 4. Ticket Independence

Each ticket should be independently completable. When generating tickets:

- **Split large tickets:** If a ticket touches 10+ files or can't be described in one paragraph, break it down.
- **Avoid coupling:** Two tickets should not require each other's uncommitted work. Use dependency ordering (`Blocked By` column) to enforce sequence instead.
- **One concern per ticket:** A ticket that does "add form AND create API AND write migration" is three tickets.
- **XL = always split:** Any ticket estimated as XL must be decomposed before work begins.

### 5. Estimate Sizing

| Size | Hours | Typical Scope                         |
| ---- | ----- | ------------------------------------- |
| S    | 1-2   | Single file, simple logic             |
| M    | 2-4   | Few files, moderate complexity        |
| L    | 4-8   | Multi-file feature, tests included    |
| XL   | 8+    | Should be split into multiple tickets |

### 5. Ticket Ordering

**Frontend-first with dummy data:**

1. Schema/types first (defines the data shape)
2. Frontend UI with dummy/mock data
3. Backend API once UI reveals what's actually needed
4. Integration (connect frontend to real API)
5. Tests throughout (TDD still applies per component)

This approach:

- Reveals what APIs actually need before building them
- Minimizes rework from mismatched contracts
- Gets something demoable faster
- Uses MSW to mock API responses during frontend dev

Ensure no circular dependencies.

### 6. Log Initialization

Add to `progress/build-log.md`:

```markdown
---

## Phase N Initialized

**Date:** YYYY-MM-DD HH:MM
**Tickets:** X
**Estimated:** S=X, M=X, L=X
```

---

## Ticket Naming Convention

`P{phase}-T{number}` — e.g., `P1-T001`, `P2-T015`

- Phase number: 1-9
- Ticket number: 001-999 (zero-padded)
- Ensures sorting works correctly

---

## After Initialization

1. Run `/check-decisions` to identify spec ambiguities
2. Wait for human to resolve PENDING decisions
3. Run `/work` to start executing tickets

---

## Required Phase 1 Tickets

**MANDATORY:** Phase 1 MUST include these testing infrastructure tickets early in the scaffolding section:

| ID      | Title                                 | Status | Est | Blocked By |
| ------- | ------------------------------------- | ------ | --- | ---------- |
| P1-T00X | Configure Vitest and write first test | TODO   | S   | T001       |
| P1-T00Y | Configure test coverage reporting     | TODO   | S   | T00X       |

These tickets ensure testing infrastructure exists from day one. Agents are more likely to skip writing tests if setup doesn't exist than to skip using existing tooling.

---

## Example: Phase 1 Foundation Tickets

```markdown
# Phase 1: Foundation

## Tickets

### Scaffolding

| ID      | Title                                  | Status | Est | Blocked By |
| ------- | -------------------------------------- | ------ | --- | ---------- |
| P1-T001 | Initialize Next.js project with Bun    | TODO   | S   | -          |
| P1-T002 | Configure Prisma with PostgreSQL       | TODO   | S   | T001       |
| P1-T003 | Set up project structure               | TODO   | S   | T001       |
| P1-T004 | Configure ESLint, Prettier, TypeScript | TODO   | S   | T001       |
| P1-T005 | Configure Vitest and write first test  | TODO   | S   | T004       |
| P1-T006 | Configure test coverage reporting      | TODO   | S   | T005       |

### Authentication

| ID      | Title                             | Status | Est | Blocked By |
| ------- | --------------------------------- | ------ | --- | ---------- |
| P1-T007 | Implement BetterAuth setup        | TODO   | M   | T002, T005 |
| P1-T008 | Add email/password authentication | TODO   | M   | T007       |
| P1-T009 | Add Google OAuth                  | TODO   | M   | T007       |
| P1-T010 | Add Apple Sign In                 | TODO   | M   | T007       |
| P1-T011 | Create auth middleware            | TODO   | S   | T007       |

### Core Schema

| ID      | Title                       | Status | Est | Blocked By |
| ------- | --------------------------- | ------ | --- | ---------- |
| P1-T012 | Define User model           | TODO   | S   | T002       |
| P1-T013 | Define AthleteProfile model | TODO   | S   | T012       |
| P1-T014 | Define TrainingPlan model   | TODO   | M   | T012       |
| P1-T015 | Define Workout model        | TODO   | M   | T014       |
| P1-T016 | Run initial migration       | TODO   | S   | T015       |
```

**Note:** Authentication tickets now depend on T005 (Vitest setup) to enforce that tests can be written from the start.
