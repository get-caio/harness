# CLAUDE.md — Build Harness Instructions

You are an autonomous development agent working on a CAIO incubator project. This file contains your operating instructions.

---

## Project State

| Purpose        | Location                                                           |
| -------------- | ------------------------------------------------------------------ |
| Master Spec    | `specs/SPEC.md` (read-only reference)                              |
| Design System  | `specs/design/DESIGN.md` (colors, typography, components)          |
| Design Assets  | `specs/design/assets/` (logo, icons, brand files)                  |
| Figma Links    | `specs/design/FIGMA.md` (design file references)                   |
| Current Phase  | `specs/CURRENT_PHASE` (contains phase number)                      |
| Phase Tickets  | `specs/phases/PHASE-N-name.md`                                     |
| Type Manifests | `specs/phases/PHASE-N-type-manifest.md` (exported types per phase) |
| Spec Decisions | `specs/decisions/*.md` (ambiguities in spec)                       |
| Arch Decisions | `docs/decisions/*.md` (implementation choices)                     |
| Progress Log   | `progress/build-log.md`                                            |
| Dead Ends      | `progress/dead-ends.md` (failed approaches log)                    |
| Conventions    | `progress/conventions.md` (established patterns)                   |
| Living Docs    | `docs/` (VitePress site — architecture, API, components)           |

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

**Format:** Use the template in `/decision` (`.claude/commands/decision.md`).

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

Skill names and descriptions load automatically each session — read the relevant skill before implementing a related feature. For UI work, read `design-routing` first; for SEO work, read `seo-routing` first — each says which skills to combine.

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

| Agent            | Model  | Purpose                                        | Isolation |
| ---------------- | ------ | ---------------------------------------------- | --------- |
| `feature`        | sonnet | Large feature implementation (L/XL tickets)    | worktree  |
| `implementer`    | sonnet | Medium ticket implementation (M tickets)       | same tree |
| `architect`      | opus   | System design, architecture decisions          | same tree |
| `reviewer`       | opus   | Code review, catches issues before human       | same tree |
| `tester`         | sonnet | Test writing, coverage improvement             | same tree |
| `interviewer`    | opus   | Requirements refinement, ambiguity resolution  | same tree |
| `coordinator`    | opus   | Orchestrates parallel agents across a phase    | same tree |
| `doc-writer`     | haiku  | Documentation updates (cheap and fast)         | same tree |
| `auditor`        | opus   | Full product audit — dead code, gaps, patterns | same tree |
| `product-critic` | opus   | Product quality — flows, UX, spec fidelity     | same tree |
| `deployer`       | sonnet | Pre-deploy checklist — env, migrations, hooks  | same tree |
| `refactorer`     | sonnet | Codebase cleanup — dedup, naming, dead code    | same tree |

### Ticket Sizing & Delegation

| Size     | Est. Lines | Approach                      | Agent         |
| -------- | ---------- | ----------------------------- | ------------- |
| S (< 2h) | < 200      | Work directly in main loop    | (self)        |
| M (2-4h) | 200-500    | Subagent (stays in same tree) | `implementer` |
| L (4-8h) | 500+       | Subagent in worktree          | `feature`     |
| XL (8h+) | 1000+      | Subagent in worktree          | `feature`     |

### Parallel Coordination

When 3+ independent tickets have no file overlap, run **`/coordinate`** — it invokes the deterministic `coordinate-phase` workflow (dependency-ordered, file-disjoint waves; correct worktree base; merge-and-gate between waves; max 3 parallel). Prefer this over spawning the `coordinator` agent directly; the agent now defers to the workflow and only hand-rolls git worktrees as an error-prone fallback.

### Deterministic Workflows

`.claude/workflows/` ships deterministic multi-agent scripts, run via the `Workflow` tool. Prefer these over hand-orchestrating the equivalent agents — fan-out, adversarial verification, ordering, and verdicts are enforced by code, not memory:

| Workflow            | When to Run                                                   | Replaces                                                                                                                |
| ------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `coordinate-phase`  | 3+ independent TODO tickets                                   | hand-rolled `coordinator` orchestration                                                                                 |
| `phase-gate`        | every phase boundary, before `/init-phase N+1`                | the remembered auditor / product-critic / refactorer / `/audit` checklist + `/audit types`                              |
| `check-decisions`   | after `/init-phase N`, before `/work`                         | single-context `/check-decisions` scan                                                                                  |
| `review-ticket`     | after a ticket commit / before human PR review                | single-lens `reviewer` pass                                                                                             |
| `design-review`     | after UI phases, before `/pre-ship`                           | single-context `/design-review`                                                                                         |
| `pre-ship`          | last gate before human production deploy                      | single-context `/pre-ship` checklist                                                                                    |
| `doc-sync`          | end of phase, or when docs drift is suspected                 | accumulated per-ticket `doc-writer` nags                                                                                |
| `codex-review-loop` | after `gh pr create` / `git push` to an open PR (hook nudges) | the manual "ping Codex (Sol), apply feedback, repeat" loop — run via `/codex-review`, human check-in every 5 iterations |

Invoke as `Workflow({ name: "<name>", args: { ... } })`. If the `Workflow` tool is unavailable, fall back to the corresponding command/agents — the command markdown remains the reference each workflow's lenses are aligned to. Plugin installs must copy the scripts once: `mkdir -p .claude/workflows && cp <harness>/.claude/workflows/*.js .claude/workflows/`.

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

## Compressed Skill Rules

> These rules are extracted from skills that showed zero absorption delta in evals.
> The model already knows the general patterns; only these specific rules add value.
>
> The `auth`, `observability`, and `stripe-billing` skills were **removed entirely** in the
> 2026-06 revalidation against Fable 5 and Sonnet 4.6 (zero delta on three model generations) —
> their rules below remain authoritative. `testing`, `trpc`, and `shadcn-tailwind` still show
> positive delta on Sonnet 4.6 subagents and were kept; their rules here are a supplement, not
> a replacement. Re-run `bun run eval:absorption` against both consumer models before removing
> any further skills.

- **testing**: Meaningless assertions are banned — `expect(true).toBe(true)` or `expect(result).toBeDefined()` do not count as tests; every assertion must verify a real acceptance criterion behavior. Also: configure MSW with `onUnhandledRequest: "error"` so forgotten mocks fail loudly instead of silently passing.
- **auth**: The default CAIO stack uses **BetterAuth**, not NextAuth — check SPEC.md before wiring auth. When using NextAuth, always add `user.id` to the session in the `session` callback; it is not included by default and every protected action depends on it.
- **observability**: Use `pino` for structured logging (key-value pairs, not interpolated strings); `console.log` is not structured and loses context in log aggregators. Health check endpoint must actually query the database (`SELECT 1`) and return 503 when degraded — a health route that always returns 200 is worse than no health route.
- **trpc**: Always initialize tRPC with the `superjson` transformer; without it, `Date` and `BigInt` values silently serialize to strings/null across the wire. Test routers using `createCallerFactory` to call procedures directly without an HTTP round-trip.
- **shadcn-tailwind**: Always use the `cn()` utility for conditional classes — never string-concatenate Tailwind classes, as later classes do not always win. Use semantic design tokens (`text-muted-foreground`, `bg-background`) instead of raw Tailwind colors (`text-gray-500`) or theme switching will break.
- **stripe-billing**: Webhook handlers must read the request body as raw text (`await request.text()`) before calling `stripe.webhooks.constructEvent()` — parsing as JSON first corrupts the signature and every event will fail verification.

---

## Working Principles

> Cross-cutting rules for how agents should approach work. These are not phase-specific and apply to every ticket.

- **State assumptions before coding.** Before implementing anything non-trivial, state the assumptions you're acting on (what the user means, what edge cases are in/out of scope, what the data shape will be). If an assumption is load-bearing and unverified, surface it instead of guessing. The cost of one clarifying sentence beats the cost of a wrong direction.

- **Simplicity first — no speculative abstractions.** Build what the ticket requires. No "we might need this later" config flags, base classes, or generic wrappers. Three similar lines is better than a premature abstraction. If a future ticket needs flexibility, add it then, with the real second use case in hand.

- **Surgical modifications.** Change only what the ticket requires. Don't reformat, rename, or "while I'm here" refactor nearby code — those changes belong in a separate refactor PR (see `refactorer` agent). Opportunistic edits balloon diffs, hide the real change in review, and break unrelated tests.

- **Define "done" before starting.** Before writing code, write down the success criteria — what passing tests must assert, what the user should be able to do, what specifically would make this ticket DONE. Stop when those are met. Don't loop past them looking for more work; don't stop short of them because the happy path works.

- **Use the model for judgment, code for determinism.** LLM calls are for classification, extraction, summarization, drafting — tasks where there isn't a deterministic right answer. Routing, retries, status code handling, data transformations, and anything with a defined input→output mapping must be code. If `if/switch/map` can answer it, don't ask the model.

- **Expose conflicts, don't average them.** If the codebase has two patterns for the same thing (two error formats, two date utilities, two auth helpers), pick one and use it — don't invent a third that blends both. If it's unclear which is canonical, add an entry to `progress/conventions.md` to lock it in, or create an arch decision if the choice is non-obvious.

- **Fail loudly, never silently.** Catching an error and returning `null`, skipping a record without logging, or swallowing an exception to "keep things working" is a career-ending bug waiting to happen. Throw, log structured errors via `pino`, and return non-2xx status codes. "Successfully processed 86% of records" is not a success — it's a partial outage you hid.

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
23. **Delegate by ticket size** — S/M tickets: work inline. L/XL tickets: spawn `feature` agent in worktree. 3+ independent tickets: run `/coordinate` (the deterministic `coordinate-phase` workflow) for parallel execution.
24. **Read `git-workflow` skill** before creating branches or PRs on multi-engineer projects.
25. **Read `database-migrations` skill** before any schema changes — follow expand-contract for zero-downtime.
26. **Read `ci-cd` skill** when setting up or modifying GitHub Actions workflows.
27. **Run `auditor` between phases** — full product walk: dead endpoints, schema-UI gaps, pattern inconsistencies, missing error handling. Not per-ticket — between phases.
28. **Run `product-critic` after UI phases** — product quality check: does the flow make sense? Is onboarding asking for things it doesn't use? Three clicks where one would work? Technically correct but nobody would use it?
29. **Run `deployer` before every deploy** — pre-deploy checklist: migrations, env vars, webhook registrations, cron configs. Missed config = silent failure.
30. **Run `refactorer` between phases** — codebase cleanup: copy-pasted patterns, missing utils, naming inconsistencies. Zero new behavior, just cleanup PRs.
31. **Import, don't reinvent types** — before defining ANY Zod schema or TypeScript interface, grep `lib/**/types.ts` and the prior phase's `specs/phases/PHASE-(N-1)-type-manifest.md` for the concept. If a canonical type exists, import it. See Type Discipline section for the full rule.
32. **Generate type manifest at phase end** — after the last ticket in a phase is DONE, run `/audit types` to write `specs/phases/PHASE-N-type-manifest.md` so the next phase knows what to import. This is mandatory before `/init-phase N+1`.

---

## Career-Critical Failures to Prevent

These failures can end careers. The harness is designed to prevent them:

| Failure Mode                  | Prevention                                    | Gate                 |
| ----------------------------- | --------------------------------------------- | -------------------- |
| **Data breach**               | Secrets detection hook, /red-team, /audit     | Pre-commit + Phase 1 |
| **Production outage**         | /pre-ship rollback plan, deployer agent       | Pre-deploy           |
| **GDPR/compliance violation** | data-protection skill, /pre-ship checklist    | Phase 1 + Pre-deploy |
| **Major bug in production**   | Mandatory tests, /audit, /red-team            | Every commit         |
| **Can't debug production**    | observability skill, health endpoint          | Phase 1              |
| **No rollback possible**      | /pre-ship migration check, deployer agent     | Pre-deploy           |
| **Silent config failure**     | deployer agent: env vars, webhooks, crons     | Pre-deploy           |
| **Product nobody uses**       | product-critic agent, /design-review          | End of UI phases     |
| **Accumulated tech debt**     | auditor + refactorer between phases           | Phase boundaries     |
| **Duplicate/drifting types**  | Type Discipline rule, `/audit types` manifest | Phase boundaries     |

**If any of these gates fail, DO NOT SHIP. Escalate to human.**

---

## Vercel & Serverless Pitfalls

These are hard-won lessons from production incidents. Violating any of these WILL cause silent failures.

### Cron Routes MUST Export GET

**Vercel cron jobs always send GET requests.** If your cron route only exports a `POST` handler, the cron will either 405 or hit a no-op health check GET handler while the actual logic never runs.

```typescript
// WRONG — cron logic in POST, Vercel never calls it
export async function POST(request: Request) {
  // ... actual cron logic
}
export async function GET() {
  return NextResponse.json({ status: "healthy" }); // This is what runs
}

// RIGHT — export POST as GET (or write the handler as GET)
export async function POST(request: Request) {
  // ... actual cron logic
}
export { POST as GET };
```

### No In-Memory State Across Requests

Serverless functions start cold. Module-level variables (`let cachedClient = null`) are lost between invocations and across instances. Never rely on in-memory state persisting — use the database.

Common violations:

- OAuth `client_id` cached in memory during connect, gone by callback
- Rate limiter counters in module scope
- Session caches that assume same instance handles follow-up requests

### Drizzle: Explicit UUIDs in Batch Inserts

Drizzle's `uuid().defaultRandom()` emits `DEFAULT` in multi-row `VALUES` lists, but PostgreSQL has no column-level default for this. Single-row inserts work; batch inserts fail silently or throw.

```typescript
// WRONG — fails on batch insert
await db.insert(myTable).values(
  items.map((i) => ({
    name: i.name, // id omitted, expects DEFAULT
  })),
);

// RIGHT — generate UUIDs explicitly
await db.insert(myTable).values(
  items.map((i) => ({
    id: crypto.randomUUID(),
    name: i.name,
  })),
);
```

---

## Type Discipline — Import, Don't Reinvent

Duplicate type/schema definitions are the #1 source of integration bugs. The same concept (e.g. "conditions", "user profile") gets a slightly different shape in `lib/`, the API route, and the UI component — then they drift, and a field added in one place silently disappears in another. **Before defining ANY Zod schema, TypeScript interface, or type alias:**

1. **Grep first.** Search for the concept name in `lib/**/types.ts`, `lib/**/schemas.ts`, and the prior phase's type manifest at `specs/phases/PHASE-(N-1)-type-manifest.md`. Use both the singular and plural form, and any obvious synonyms.
2. **If a canonical type exists, import it.** Do not redeclare. Do not "extend with one extra field" — add the field to the canonical type instead.
3. **API route Zod schemas MUST be derived from `lib/**/types.ts`schemas.** Use`mySchema.pick()`, `.omit()`, `.extend()` — never rewrite the shape by hand.
4. **UI component prop interfaces MUST import shared types from `lib/**/types.ts`.** A component that takes a `User`should`import type { User } from "@/lib/users/types"`— never redeclare`interface User { id: string; name: string }` locally.
5. **Never define a local type that overlaps with an existing exported type.** If you find yourself writing `type X = { ...same fields as existing type... }`, stop and import instead.

### Where canonical types live

| Layer                      | Location                                                        | Purpose                                                                                 |
| -------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Domain types & Zod schemas | `lib/<module>/types.ts`                                         | Single source of truth for one domain concept                                           |
| Phase export manifest      | `specs/phases/PHASE-N-type-manifest.md`                         | Index of every exported type/schema from a completed phase                              |
| DB models                  | `prisma/schema.prisma` (Prisma) or `lib/db/schema.ts` (Drizzle) | Database shape — derive runtime types via `Prisma.UserCreateInput` / `InferSelectModel` |

### When you genuinely need a new type

A new type is justified when (a) you grepped and found nothing, OR (b) the existing type represents a different concept that just shares some field names. In that case: **define it in `lib/<module>/types.ts`, not inline in the route or component.** This is what makes it discoverable to the next ticket.

### Why this rule exists

Past incident: Phase 2 defined `stepConditionsSchema` in `lib/orchestration/types.ts`. Phase 3 didn't grep for it, redefined a slightly different `conditionsSchema` inline in an API route, and the UI built against a third shape. Three weeks of integration debugging later, all three were merged. The cost of grepping first is < 30 seconds. The cost of skipping it is days.

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
