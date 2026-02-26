# CLAUDE.md — Build Harness Instructions

You are an autonomous development agent working on a CAIO incubator project. This file contains your operating instructions.

---

## Project State

| Purpose        | Location                                                  |
| -------------- | --------------------------------------------------------- |
| Master Spec    | `specs/SPEC.md` (read-only reference)                     |
| Design System  | `specs/design/DESIGN.md` (colors, typography, components) |
| Design Assets  | `specs/design/assets/` (logo, icons, brand files)         |
| Figma Links    | `specs/design/FIGMA.md` (design file references)          |
| Current Phase  | `specs/CURRENT_PHASE` (contains phase number)             |
| Phase Tickets  | `specs/phases/PHASE-N-name.md`                            |
| Spec Decisions | `specs/decisions/*.md` (ambiguities in spec)              |
| Arch Decisions | `docs/decisions/*.md` (implementation choices)            |
| Progress Log   | `progress/build-log.md`                                   |
| Dead Ends      | `progress/dead-ends.md` (failed approaches log)           |
| Conventions    | `progress/conventions.md` (established patterns)          |
| Living Docs    | `docs/` (VitePress site — architecture, API, components)  |

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

| Status        | Meaning                            |
| ------------- | ---------------------------------- |
| `TODO`        | Ready to work                      |
| `IN_PROGRESS` | Currently being worked on          |
| `BLOCKED`     | Waiting on decision (spec or arch) |
| `DONE`        | Complete and committed             |
| `SKIPPED`     | Explicitly skipped (with reason)   |

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

| Layer      | Technology                   |
| ---------- | ---------------------------- |
| Framework  | Next.js 14+ (App Router)     |
| Runtime    | Bun                          |
| Database   | PostgreSQL                   |
| ORM        | Prisma                       |
| API        | tRPC                         |
| Auth       | BetterAuth (or as specified) |
| Payments   | Stripe                       |
| Styling    | Tailwind CSS + shadcn/ui     |
| Testing    | Vitest + Playwright          |
| Docs       | VitePress                    |
| Deployment | Vercel                       |

_Modify per project as specified in SPEC.md_

---

## Available Skills

Reference these before implementing related features:

| Skill                      | Use For                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `nextjs-bun-prisma`        | Project structure, API routes, database                       |
| `react-best-practices`     | React/Next.js performance patterns, bundle optimization       |
| `auth`                     | Authentication, sessions, OAuth                               |
| `trpc`                     | Type-safe API, routers, client setup                          |
| `ai-integration`           | Claude API, prompts, tool use, streaming                      |
| `react-native`             | Mobile app, Expo, offline, notifications                      |
| `payments`                 | Stripe, subscriptions, webhooks                               |
| `testing`                  | Vitest, unit tests, component tests, MSW mocking              |
| `e2e-testing`              | Playwright, browser tests, visual regression, a11y            |
| `security`                 | Input validation, auth checks, secrets                        |
| `code-quality`             | Complexity limits, refactoring                                |
| `code-audit`               | Security scanning, dependency audit, codebase health          |
| `red-team`                 | Adversarial testing against running app, OWASP coverage       |
| `observability`            | Logging, monitoring, health checks, debugging                 |
| `incident-response`        | Production incidents, rollback, post-mortems                  |
| `data-protection`          | GDPR, CCPA, privacy, data handling compliance                 |
| `design-craft`             | Empty states, loading states, micro-interactions, delight     |
| `context-engineering`      | Context window management, progressive disclosure, compaction |
| `multi-agent-coordination` | Subagent patterns, token economics, coordination strategies   |
| `evaluation`               | Agent quality rubrics, LLM-as-judge, test set design          |
| `vitepress`                | Documentation site, markdown conventions, sidebar config      |
| `ci-cd`                    | GitHub Actions, PR checks, preview/prod deploy pipelines      |
| `git-workflow`             | Multi-engineer branch strategy, PR conventions, conflicts     |
| `database-migrations`      | Prisma migrations, zero-downtime changes, rollback strategy   |

---

## Approval Levels

| Action                   | Approval Required      |
| ------------------------ | ---------------------- |
| Write/edit code          | None                   |
| Create new files         | None                   |
| Run tests/lint           | None                   |
| Install dependencies     | None (logged)          |
| Commit to feature branch | None                   |
| Create PR                | Agent can create       |
| Merge to `main`          | Human                  |
| Merge to `prod`          | **NEVER** (human only) |
| Payment/auth changes     | Human review           |
| Schema migrations        | Human review           |
| Environment variables    | Human approval         |

---

## Agent & Model Strategy

### Model Selection

| Model    | Setting      | Use For                                 | Cost   |
| -------- | ------------ | --------------------------------------- | ------ |
| `opus`   | Main session | Planning, architecture, review          | High   |
| `sonnet` | Agent config | Feature implementation, testing         | Medium |
| `haiku`  | Agent config | Documentation, exploration, cheap tasks | Low    |

The main session runs `opus` for maximum reasoning quality. Subagents use the model specified in their frontmatter — `sonnet` for implementation, `haiku` for docs.

### Available Agents

| Agent         | Model  | Purpose                                       | Isolation |
| ------------- | ------ | --------------------------------------------- | --------- |
| `feature`     | sonnet | Large feature implementation (L/XL tickets)   | worktree  |
| `implementer` | sonnet | Medium ticket implementation (M tickets)      | same tree |
| `architect`   | opus   | System design, architecture decisions         | same tree |
| `reviewer`    | opus   | Code review, catches issues before human      | same tree |
| `tester`      | sonnet | Test writing, coverage improvement            | same tree |
| `interviewer` | opus   | Requirements refinement, ambiguity resolution | same tree |
| `coordinator` | opus   | Orchestrates parallel agents across a phase   | same tree |
| `doc-writer`  | haiku  | Documentation updates (cheap and fast)        | same tree |

### Ticket Sizing & Delegation

| Size     | Est. Lines | Approach                      | Agent         |
| -------- | ---------- | ----------------------------- | ------------- |
| S (< 2h) | < 200      | Work directly in main loop    | (self)        |
| M (2-4h) | 200-500    | Subagent (stays in same tree) | `implementer` |
| L (4-8h) | 500+       | Subagent in worktree          | `feature`     |
| XL (8h+) | 1000+      | Subagent in worktree          | `feature`     |

### Parallel Coordination

When 3+ independent tickets have no file overlap, spawn the `coordinator` agent. It manages parallel feature agents in separate worktrees with file ownership rules to prevent merge conflicts. Max 3 parallel agents.

### Documentation Updates

After each ticket, spawn a `doc-writer` agent (haiku model — cheap and fast) to update the relevant docs. Skip for test-only changes.

---

## Environment Configuration

The harness configures these environment variables in `.claude/settings.json`:

| Variable                          | Value    | Purpose                                   |
| --------------------------------- | -------- | ----------------------------------------- |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | `70`     | Compact context at 70% usage (default 80) |
| `CLAUDE_CODE_SUBAGENT_MODEL`      | `sonnet` | Default model for subagents               |

### Session Management

For long-running work sessions:

```bash
# Start a named session for easy resumption
claude --session-id "phase-1-work" --resume

# Resume after interruption or context exhaustion
claude --session-id "phase-1-work" --resume
```

On resume, the agent re-reads phase state, build log, and conventions to pick up where it left off.

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
3. **Read existing docs before touching a feature** — before modifying or extending any feature, read the relevant pages in `docs/` (architecture, API, components, auth) to understand the current documented state. This applies to every ticket, bug fix, and refactor — not just new features. The docs are the fastest way to gain context on how the system works today.
4. **Check for PENDING decisions** before starting work
5. **Don't guess** — if spec is unclear, create a spec decision
6. **Stay in phase** — don't work on tickets outside current phase
7. **Frontend-first** — Build UI with dummy data; reveals what APIs actually need
8. **Write tests for every ticket** — No ticket is complete without tests. "N/A" is not an acceptable test status. If you believe a ticket genuinely doesn't need tests, create a spec decision for human review and mark the ticket BLOCKED until approved.
9. **Tests must verify actual requirements** — Assert real behavior, not just that code runs. Each acceptance criterion needs a corresponding assertion. `expect(true).toBe(true)` or `expect(result).toBeDefined()` are not meaningful tests.
10. **Read `progress/conventions.md`** before starting work — follow established patterns. When you set a new precedent (error handling pattern, component structure, API convention), add it to the file.
11. **Log failed approaches** — When something doesn't work, document it in `progress/dead-ends.md` before trying an alternative. This prevents future contexts from repeating the same mistake.
12. **Commit after each ticket** — this is the check-in point
13. **Update ticket status** as you progress
14. **Never touch prod** — humans handle production deployments
15. **Read relevant skills** before implementing features
16. **Run /audit after Phase 1 and 2** — catch issues early, not at the end
17. **Run /red-team after Phase 1** — validate auth controls actually work (requires running app)
18. **Run /pre-ship before production** — final checklist to prevent career-ending failures
19. **Add observability in Phase 1** — health checks, structured logging, error tracking from day one
20. **Run /design-review after Phase 2** — verify visual polish, empty states, loading states, animations
21. **Update docs after every ticket** — spawn a `doc-writer` agent (haiku, cheap) to update `docs/`. Skip for test-only changes.
22. **Never stop between tickets** — after committing a ticket, immediately pick up the next TODO. Only stop when the phase is complete, all tickets are blocked, or the human interrupts.
23. **Delegate by ticket size** — S/M tickets: work inline. L/XL tickets: spawn `feature` agent in worktree. 3+ independent tickets: spawn `coordinator` for parallel execution.
24. **Read `git-workflow` skill** before creating branches or PRs on multi-engineer projects.
25. **Read `database-migrations` skill** before any schema changes — follow expand-contract for zero-downtime.
26. **Read `ci-cd` skill** when setting up or modifying GitHub Actions workflows.

---

## Career-Critical Failures to Prevent

These failures can end careers. The harness is designed to prevent them:

| Failure Mode                  | Prevention                                       | Gate                 |
| ----------------------------- | ------------------------------------------------ | -------------------- |
| **Data breach**               | Secrets detection hook, /red-team, /audit        | Pre-commit + Phase 1 |
| **Production outage**         | /pre-ship rollback plan, incident-response skill | Pre-deploy           |
| **GDPR/compliance violation** | data-protection skill, /pre-ship checklist       | Phase 1 + Pre-deploy |
| **Major bug in production**   | Mandatory tests, /audit, /red-team               | Every commit         |
| **Can't debug production**    | observability skill, health endpoint             | Phase 1              |
| **No rollback possible**      | /pre-ship migration check, tagging               | Pre-deploy           |

**If any of these gates fail, DO NOT SHIP. Escalate to human.**

---

## Pre-Push Checklist

Always run `npm run lint` and `npm run build` locally before pushing to GitHub. Fix any errors before committing.

---

## Code Editing Best Practices

When fixing TypeScript errors, trace all usages of modified types/variables across the codebase using Grep before making changes. Nullable field changes especially require checking all consumers.

---

## Debugging Guidelines

When debugging API issues, first check:

1. Is the correct API endpoint being called?
2. Is authentication passing correctly?
3. Are required IDs being stored from previous API calls?

Check git history for working implementations before assuming the API is broken.

---

## Feature Implementation

For feature requests involving existing data (like "add existing companies to X"), clarify whether user wants to SELECT from existing records or CREATE new ones before implementing.
