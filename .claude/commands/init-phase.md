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

## Tickets

### Scaffolding

| ID | Title | Status | Est | Blocked By |
|----|-------|--------|-----|------------|
| P{N}-T001 | [Title] | TODO | S/M/L | - |
| P{N}-T002 | [Title] | TODO | S/M/L | T001 |

### [Feature Area 1]

| ID | Title | Status | Est | Blocked By |
|----|-------|--------|-----|------------|
| P{N}-T003 | [Title] | TODO | S/M/L | T002 |
| P{N}-T004 | [Title] | TODO | S/M/L | T003 |

### [Feature Area 2]

| ID | Title | Status | Est | Blocked By |
|----|-------|--------|-----|------------|
| P{N}-T005 | [Title] | TODO | S/M/L | - |
| P{N}-T006 | [Title] | TODO | S/M/L | T005 |

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
- [ ] Tests pass

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

### 4. Estimate Sizing

| Size | Hours | Typical Scope |
|------|-------|---------------|
| S | 1-2 | Single file, simple logic |
| M | 2-4 | Few files, moderate complexity |
| L | 4-8 | Multi-file feature, tests included |
| XL | 8+ | Should be split into multiple tickets |

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

## Example: Phase 1 Foundation Tickets

```markdown
# Phase 1: Foundation

## Tickets

### Scaffolding

| ID | Title | Status | Est | Blocked By |
|----|-------|--------|-----|------------|
| P1-T001 | Initialize Next.js project with Bun | TODO | S | - |
| P1-T002 | Configure Prisma with PostgreSQL | TODO | S | T001 |
| P1-T003 | Set up project structure | TODO | S | T001 |
| P1-T004 | Configure ESLint, Prettier, TypeScript | TODO | S | T001 |
| P1-T005 | Set up Vitest for testing | TODO | S | T004 |

### Authentication

| ID | Title | Status | Est | Blocked By |
|----|-------|--------|-----|------------|
| P1-T006 | Implement BetterAuth setup | TODO | M | T002 |
| P1-T007 | Add email/password authentication | TODO | M | T006 |
| P1-T008 | Add Google OAuth | TODO | M | T006 |
| P1-T009 | Add Apple Sign In | TODO | M | T006 |
| P1-T010 | Create auth middleware | TODO | S | T006 |

### Core Schema

| ID | Title | Status | Est | Blocked By |
|----|-------|--------|-----|------------|
| P1-T011 | Define User model | TODO | S | T002 |
| P1-T012 | Define AthleteProfile model | TODO | S | T011 |
| P1-T013 | Define TrainingPlan model | TODO | M | T011 |
| P1-T014 | Define Workout model | TODO | M | T013 |
| P1-T015 | Run initial migration | TODO | S | T014 |
```
