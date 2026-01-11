# CLAUDE.md — Build Harness Instructions

You are an autonomous development agent working on a CAIO incubator project. This file contains your operating instructions.

---

## Project State

| Purpose | Location |
|---------|----------|
| Master Spec | `specs/SPEC.md` (read-only reference) |
| Design System | `specs/design/DESIGN.md` (colors, typography, components) |
| Design Assets | `specs/design/assets/` (logo, icons, brand files) |
| Figma Links | `specs/design/FIGMA.md` (design file references) |
| Current Phase | `specs/CURRENT_PHASE` (contains phase number) |
| Phase Tickets | `specs/phases/PHASE-N-name.md` |
| Spec Decisions | `specs/decisions/*.md` (ambiguities in spec) |
| Arch Decisions | `docs/decisions/*.md` (implementation choices) |
| Progress Log | `progress/build-log.md` |

---

## Phased Development Model

Large specs are split into phases. Each phase has its own ticket file and must be completed before moving to the next.

```
specs/
├── SPEC.md                        # Master spec (never modify)
├── CURRENT_PHASE                  # File containing: "1" or "2" etc.
├── phases/
│   ├── PHASE-1-foundation.md      # Auth, schema, scaffold
│   ├── PHASE-2-core-web.md        # Main web features
│   ├── PHASE-3-ai-engine.md       # AI/ML features
│   ├── PHASE-4-mobile.md          # React Native app
│   ├── PHASE-5-integrations.md    # Garmin, Strava, etc.
│   └── PHASE-6-polish.md          # Admin, notifications, etc.
└── decisions/
    ├── 001-auth-provider.md       # PENDING or DECIDED
    ├── 002-vector-database.md
    └── ...
```

---

## Execution Flow

### Initial Setup (Once Per Project)

```
1. Human provides specs/SPEC.md
2. Run /plan-phases → Analyze spec, propose phases
3. Human approves/adjusts phases
4. Run /init-phase 1 → Generate Phase 1 tickets
5. Run /check-decisions → Identify spec ambiguities for Phase 1
6. Human resolves PENDING spec decisions
7. Run /work → Execute Phase 1 tickets
```

### Per-Phase Flow

```
1. /init-phase N → Generate tickets for phase N
2. /check-decisions → Find ambiguities blocking this phase
3. Wait for human to resolve PENDING decisions
4. /work → Execute tickets continuously
5. When phase complete → /init-phase N+1
```

### Continuous Work Loop

```
Read CURRENT_PHASE → Get phase number
Read PHASE-N-*.md → Find next TODO ticket
IF spec decision needed → Create in specs/decisions/, mark BLOCKED
IF arch decision needed → Create in docs/decisions/, mark BLOCKED
IF clear → Implement with TDD
Commit with [PN-TXXX] prefix
Update ticket → DONE
Repeat until phase complete or all blocked
```

---

## Two Types of Decisions

### Spec Decisions (`specs/decisions/`)

**What:** Ambiguities or gaps in the product specification that need human clarification BEFORE building.

**When to create:**
- Spec contradicts itself
- Technology choice not specified (which auth provider? which database?)
- Business logic unclear
- Multiple valid interpretations exist
- Spec references something undefined
- Scope is ambiguous

**Format:**
```markdown
# [NNN] Decision Title

**Status:** PENDING | DECIDED
**Phase:** N (which phase this blocks)
**Created:** YYYY-MM-DD

## Question

What specific clarification is needed from the spec?

## Context

Why this matters. What does the spec say (or not say)?

## Options

### Option A: [Name]
- Pros: ...
- Cons: ...

### Option B: [Name]
- Pros: ...
- Cons: ...

## Decision

<!-- Human fills this in -->

## Rationale

<!-- Human explains why -->
```

### Architecture Decisions (`docs/decisions/`)

**What:** Implementation choices during development where multiple valid approaches exist.

**When to create:**
- Multiple implementation patterns could work
- Performance vs simplicity tradeoff
- Breaking change to established pattern
- External dependency selection
- Data model design choices

**Format:** Same as above, but for implementation not spec clarification.

---

## Decision Gate: Check Before Starting Each Phase

Before executing tickets in a new phase, run `/check-decisions` which:

1. Scans the phase's tickets for potential ambiguities
2. Cross-references with SPEC.md
3. Creates PENDING spec decisions for anything unclear
4. Reports what needs human input before proceeding

**The agent MUST wait for all PENDING spec decisions to become DECIDED before starting work on blocked tickets.**

---

## Ticket Statuses

| Status | Meaning |
|--------|---------|
| `TODO` | Ready to work |
| `IN_PROGRESS` | Currently being worked on |
| `BLOCKED` | Waiting on decision (spec or arch) |
| `DONE` | Complete and committed |
| `SKIPPED` | Explicitly skipped (with reason) |

---

## Commit Messages

Format: `[PN-TXXX] Brief description`

- `P1-T001` = Phase 1, Ticket 001
- `P3-T015` = Phase 3, Ticket 015

Examples:
- `[P1-T001] Add user authentication with BetterAuth`
- `[P2-T008] Implement training plan creation form`
- `[P3-T015] Add Claude API workout generation`

---

## Tech Stack (Standard CAIO Stack)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Runtime | Bun |
| Database | PostgreSQL |
| ORM | Prisma |
| API | tRPC |
| Auth | BetterAuth (or as specified) |
| Payments | Stripe |
| Styling | Tailwind CSS + shadcn/ui |
| Testing | Vitest + Playwright |
| Deployment | Vercel |

*Modify per project as specified in SPEC.md*

---

## Available Skills

Reference these before implementing related features:

| Skill | Use For |
|-------|---------|
| `nextjs-bun-prisma` | Project structure, API routes, database |
| `auth` | Authentication, sessions, OAuth |
| `trpc` | Type-safe API, routers, client setup |
| `ai-integration` | Claude API, prompts, tool use, streaming |
| `react-native` | Mobile app, Expo, offline, notifications |
| `payments` | Stripe, subscriptions, webhooks |
| `testing` | Vitest, unit tests, component tests, MSW mocking |
| `e2e-testing` | Playwright, browser tests, visual regression, a11y |
| `security` | Input validation, auth checks, secrets |
| `code-quality` | Complexity limits, refactoring |
| `code-audit` | Security scanning, dependency audit, codebase health |

---

## Approval Levels

| Action | Approval Required |
|--------|-------------------|
| Write/edit code | None |
| Create new files | None |
| Run tests/lint | None |
| Install dependencies | None (logged) |
| Commit to feature branch | None |
| Create PR | Agent can create |
| Merge to `main` | Human |
| Merge to `prod` | **NEVER** (human only) |
| Payment/auth changes | Human review |
| Schema migrations | Human review |
| Environment variables | Human approval |

---

## Feature Subagents

For substantial features (3+ hours or multi-file changes):
- Spawn a dedicated feature subagent via Task tool
- Keeps context focused and clean
- Subagent works until feature complete
- Returns control to main loop after commit

For small tickets (1-2 hours, few files):
- Work directly in main loop
- No subagent overhead needed

---

## Current State

<!-- UPDATED BY AGENT AFTER EACH TICKET -->

```yaml
current_phase: 1
current_ticket: null
blocked_on: null
last_completed: null
tickets_done: 0
tickets_in_phase: 0
open_spec_decisions: 0
open_arch_decisions: 0
```

---

## Notes for Agents

1. **Read SPEC.md** before starting any phase
2. **Read DESIGN.md** before any UI work (colors, typography, spacing)
3. **Check for PENDING decisions** before starting work
4. **Don't guess** — if spec is unclear, create a spec decision
5. **Stay in phase** — don't work on tickets outside current phase
6. **Frontend-first** — Build UI with dummy data; reveals what APIs actually need
7. **Write tests first** (TDD) for all new functionality
8. **Commit after each ticket** — this is the check-in point
9. **Update ticket status** as you progress
10. **Never touch prod** — humans handle production deployments
11. **Read relevant skills** before implementing features
