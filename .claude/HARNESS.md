# HARNESS.md — CAIO Build Harness

The operating rules for agents working on CAIO projects in Claude Code. It ships inside the `caio-build-harness` plugin; a repo turns it on by committing `.claude/harness.json`. Stack and layout for a specific product belong in that repo's `AGENTS.md`, not here.

**What the plugin gives a repo:** blocking safety gates (hooks), seven agents, four workflows, four commands and the domain skills. Nothing is copied into the repo. If a repo still carries copied harness hooks, agents, skills or a forked harness `CLAUDE.md`, remove them (see `INSTALL.md` → Migrating).

---

## Project State

| Purpose        | Location                                                               |
| -------------- | ---------------------------------------------------------------------- |
| Product map    | `AGENTS.md` (stack, paths, product-specific rules)                     |
| Master spec    | `specs/SPEC.md` (read-only reference)                                  |
| Design system  | `specs/design/DESIGN.md`, assets in `specs/design/assets/`             |
| Phase tickets  | `specs/phases/PHASE-N-name.md`, current phase in `specs/CURRENT_PHASE` |
| Type manifests | `specs/phases/PHASE-N-type-manifest.md`                                |
| Spec decisions | `specs/decisions/*.md`                                                 |
| Arch decisions | `docs/decisions/*.md`                                                  |
| Progress log   | `progress/build-log.md`                                                |
| Dead ends      | `progress/dead-ends.md` (failed approaches)                            |
| Conventions    | `progress/conventions.md` (established patterns)                       |
| Living docs    | `docs/` (VitePress)                                                    |

Read `progress/conventions.md` before starting work and add to it when you set a precedent. Log a failed approach in `progress/dead-ends.md` before trying the next one.

---

## Sessions and Delegation

Work is organised as three layers. Each layer has a fixed model so that cost and capability are predictable.

| Layer            | Model                                     | Job                                                                                                                    |
| ---------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Orchestrator** | Fable, medium effort                      | Liaison to the stakeholder and advisor to every sub-session. Starts and archives sub-sessions. Writes no product code. |
| **Sub-session**  | Opus, medium effort                       | Owns one task that ends in something of its own (a branch and PR). Plans it, does or delegates the work, verifies it.  |
| **Subagent**     | Opus (medium) or Sonnet, chosen per spawn | A bounded piece of a sub-session's task: an implementation slice, a search, a review.                                  |

### Orchestrator rules

- One sub-session per independent task. Give each its own worktree; two sessions never write the same files.
- A brief names the goal, the files or area, what done looks like, and what has already been ruled out. A sub-session knows only what the brief says.
- A sub-session's report is a claim, not proof. Read the diff or the PR before telling the stakeholder something is done.
- Archive a sub-session once its PR is merged or its task is abandoned.

### Questions go up, not out

Sub-sessions never ask the stakeholder directly. Every question goes to the orchestrator, which either answers it or escalates it.

The orchestrator may answer on its own only when the question is **low impact**, meaning all of these hold:

1. The choice can be reversed inside the same PR without rework elsewhere.
2. It touches nothing in a "Human" row of the Approval Levels table (payments, auth, schema migrations, env vars, CI, merges).
3. It does not change behaviour the spec or the stakeholder has stated, or anything a user would notice as scope.
4. It adds no recurring cost and no new dependency or vendor.

Anything else goes to the stakeholder as one question with a recommendation. While waiting, the sub-session carries on with work that does not depend on the answer.

**Every orchestrator answer is logged.** Write it as a decision file (`docs/decisions/` for implementation, `specs/decisions/` for spec gaps) with `Status: DECIDED (orchestrator)`, the question, the answer and the reason. The stakeholder can read the list and overturn any entry; an overturned entry goes back to `PENDING`.

### Choosing a subagent model

`implementer`, `feature` and `refactorer` inherit the model of the session that spawns them, so from an Opus sub-session they run on Opus unless told otherwise. Pass `model` on every spawn:

| The piece is…                                                                          | Spawn with                       |
| -------------------------------------------------------------------------------------- | -------------------------------- |
| Mechanical and fully specified: a rename, a migration of call sites, boilerplate, docs | `model: "sonnet"`                |
| A search or inventory where only the conclusion matters                                | `Explore` (or `model: "sonnet"`) |
| Design-bearing, cross-cutting, security-sensitive, or underspecified                   | inherit (Opus)                   |
| Review of someone else's work                                                          | inherit (Opus)                   |

Cost note: before 4.0 these agents were pinned to Sonnet and about 85% of spawns passed no model. Inheriting makes Opus the default, so leaving `model` off a mechanical spawn now costs more than it did.

### Open option — Fable utilisation

In this topology Fable mostly routes and advises, and the code is written two layers down. If that proves to be the wrong place for the strongest model, there are two changes the stakeholder can choose, both of which alter the rule above:

- **Flatten:** sub-sessions do the implementation themselves and use subagents only for search and review, so the model with the full task context writes the code.
- **Fable workers:** give a long, hard or mostly unsupervised task to a Fable sub-session instead of an Opus one.

Neither is in force until the stakeholder says so. Separately, `"advisorModel": "fable"` in `~/.claude/settings.json` lets Opus sessions consult Fable on hard calls without changing who does the work.

---

## Decisions

Two kinds, same file format (`/decision` has the template):

- **Spec decisions** (`specs/decisions/`) — the spec contradicts itself, leaves a technology or business rule open, or admits more than one reading.
- **Architecture decisions** (`docs/decisions/`) — more than one sound implementation, a performance-versus-simplicity trade, a break from an established pattern, a new dependency, a data-model choice.

| Status                   | Meaning                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `PENDING`                | Waiting on the stakeholder. Do not build on it.                          |
| `DECIDED`                | Decided by the stakeholder.                                              |
| `DECIDED (orchestrator)` | Low-impact call made by the orchestrator, logged for stakeholder review. |

Never write `DECIDED` on the stakeholder's behalf. Do not guess at a spec gap: raise it. Work that a `PENDING` decision blocks is `BLOCKED`; everything else continues. The session-start and stop hooks list what is pending.

---

## Tickets, Phases and Commits

Large builds are split into phases, each with a ticket file in `specs/phases/`. Small tasks need neither: a sub-session's brief is its ticket.

- Ticket statuses: `TODO`, `IN_PROGRESS`, `BLOCKED` (waiting on a decision), `DONE`, `SKIPPED` (with a reason).
- Commit format for ticketed work: `[PN-TXXX] Brief description` (repos with several products prefix the product: `[SHED-P58-T103] …`). Untracked work uses a plain imperative subject.
- Commit after each ticket. Stay inside the current phase.
- At a phase boundary run the `phase-gate` workflow: audit, product critique and code audit in parallel, adversarially verified findings, the type manifest, and a zero-behaviour refactor pass. Confirmed criticals block the next phase.

---

## Testing Policy

Work is test-first, and the first test is the one a real user's bug would fail:

| Change touches                        | Write first                                        |
| ------------------------------------- | -------------------------------------------------- |
| A user-facing flow                    | Playwright e2e through the UI (`e2e-testing`)      |
| An API route, server action, DB query | Integration test against a real test database      |
| Pure logic                            | Unit test                                          |
| A third-party API                     | Mock at the network boundary only (`msw-mock-api`) |

Every acceptance criterion maps to a test that would fail if the feature broke. Do not mock the module under test, the database layer or framework internals. Never run a bare `bun test` as the gate; pass the unit-test roots explicitly.

The full policy, with the rules and exceptions, is the first section of the `testing` skill, which `implementer` and `feature` preload.

---

## Approval Levels

| Action                                | Approval required                                                       |
| ------------------------------------- | ----------------------------------------------------------------------- |
| Write or edit code, create files      | None                                                                    |
| Run tests and lint                    | None                                                                    |
| Install dependencies                  | None for an existing vendor; a new vendor is a stakeholder question     |
| Commit to a feature branch            | None                                                                    |
| Create a PR                           | Agent can create                                                        |
| Merge to `main`                       | Human                                                                   |
| Anything on `prod`                    | **Never** (human only; the gate blocks it)                              |
| Payment or auth changes               | Human review                                                            |
| Schema migrations                     | Human review                                                            |
| Environment variables                 | Human approval                                                          |
| CI workflows, merge gates, test setup | Human approval, with the cost stated first (see CI and Process Changes) |

---

## Pull Requests and Pushes

CI runs on a push to an open pull request, when a label is added to one, on a merge to `main`, nightly, and on manual dispatch. A commit, or a push to a branch with no pull request, runs nothing.

- Commit and push your branch as often as you need. Open the pull request only when the feature is complete and you expect CI to pass. Do not open a pull request to find out what CI says, and do not run the workflow by hand on a feature branch (`gh workflow run --ref <branch>`): a manual run runs the full tier.
- One pull request per feature, not one per ticket. A feature is the unit a human reviews and merges; tickets are the agent's internal checklist. If an open pull request covers related work, add the new work to it.
- Keep at most 2 open pull requests per repository from the agent account, counted across all sessions and worktrees, not per session. Merge or close one before you open another.
- On an open pull request, push once per round of changes, not after each commit. Batch review fixes into one push. Rebase and push once; do not push, then push again to fix the push.
- To push work in progress to an open pull request, put `[skip ci]` in the message of the last commit of that push. Push without it when the round is complete.
- Before merging, check that the merge or squash commit message does not contain `[skip ci]`. A squash message lists every commit message by default, so one WIP commit can skip CI on `main`. Edit the message, or set the repository's squash default to "Pull request title and description".
- When CI fails, read the full log and fix every failure in it before you push again. If the failing check can run locally, run it first.
- Add `ci:full` or `preview` only when the pull request is ready for review. Adding any label starts a run, so do not label a pull request for bookkeeping while it is in progress. Remove `ci:full` after the run you need; while it is on, every push runs the full tier. Leave `preview` on only while you want each push redeployed.

The Codex review loop runs once the pull request is open and after each round of fixes, not after every commit or `[skip ci]` push. Each loop iteration that pushes a fix counts as one round.

Run `/codex-review <PR#>` when the PR is opened and after each round of fixes, and drive it to `mergeable`, `human-steps-remaining` or `blocked` before starting the next feature. The every-5-iterations human check-in is part of the loop.

---

## CI and Process Changes

CI runs on a self-hosted Linux runner with Docker (`runs-on: self-hosted`). GitHub-hosted runners (`ubuntu-latest`, `macos-*`, `windows-*`) are not used in any workflow; the Actions spending limit is $0.

- Do not add CI jobs, merge gates, required local commands, or committed verification artifacts (hashes, fingerprints, evidence or attestation files, generated manifests) unless the user explicitly asks for them.
- Before changing CI workflows, build gates or test setup, state the cost: wall-clock minutes per PR, runner minutes per run, and any new step a person must take. Wait for approval.
- A green CI run on the commit is the evidence. Do not build a second proof system on top of it.
- Never require a local run before CI can pass, and never let merging the base branch invalidate anything.
- Keep pull requests fast. Run slow suites (long rehearsals, benchmarks, full end-to-end runs) on main, on a schedule or on demand, unless told otherwise.
- Make cheap checks run first and gate expensive jobs on them, so an early failure doesn't keep billing for the rest of the suite.
- In multi-app repos, run only the jobs for what changed.
- Prefer removing or merging checks over adding new ones. If a new safeguard seems necessary, propose it with its cost, separately from feature work.
- When a job times out, the first question is whether the job belongs on pull requests at all, not how many more minutes to give it.

The workflow shape is in the `ci-cd` skill: a `gate` tier on every PR push (lint, typecheck, build, unit), a `full` tier on main, nightly, `workflow_dispatch`, or a PR labeled `ci:full`, and preview deploys only on a PR labeled `preview`.

---

## Gates

Hooks live in the plugin (`hooks/hooks.json`) and run only in repos with `.claude/harness.json`. They catch an agent's honest mistakes in the ways agents normally phrase commands (`git commit`, `cd dir && git commit`, `git -C dir push`); they are not a security boundary and do not try to out-parse every shell construct. Branch protection on the remote is what protects prod. A gate blocks by exiting 2. A gate that cannot run its check (missing tool, crash, timeout) lets the command through and says so: a broken environment must never deadlock an unattended session.

| Gate (`gates.<name>`) | When                     | Blocks                                                                                            |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| `prod`                | commit, push             | Any commit or push while on the prod branch, and any push whose target is it                      |
| `mergedPr`            | commit, push             | Adding work to a branch whose PR is already merged                                                |
| `secrets`             | commit                   | Added lines containing a known key format, a long literal credential, or a DB URL with a password |
| `typecheck`           | commit touching `.ts(x)` | Real compiler errors (`error TS…`) from the repo's `typecheck` script                             |
| `bunOnly`             | `npm install` and kin    | npm in a repo with a bun lockfile                                                                 |
| `protectedFiles`      | Write, Edit              | `.env*` (not `.env.example`), lockfiles, `.git/`                                                  |
| `testOnEdit`          | after Write, Edit        | Nothing; a failing sibling `*.test.*` is reported back to the model                               |
| `format`              | after Write, Edit        | Nothing; runs the repo's own prettier and eslint                                                  |
| `codexReview`         | after push or PR create  | Nothing; reminds the session to run `/codex-review`                                               |

Turn a gate off per repo in `.claude/harness.json`, for example `{ "gates": { "typecheck": false } }` in a monorepo where a full typecheck takes minutes; set `"prodBranch"` if production is not `prod`. Mark a false-positive secret line with `gitleaks:allow`; set `"secretScanner": "gitleaks"` to use gitleaks instead of the built-in scanner.

Cost: the commit-time gates add one `gh` call (about a second) and, when TypeScript files are staged, one run of the repo's `typecheck` script. Full test, lint and build runs are **not** in the hooks; CI on the commit is the evidence.

---

## Agents, Workflows and Commands

| Agent            | Model   | Use                                                              |
| ---------------- | ------- | ---------------------------------------------------------------- |
| `implementer`    | inherit | A medium implementation slice in the current tree                |
| `feature`        | inherit | A large slice, isolated in its own worktree                      |
| `refactorer`     | inherit | Cleanup with zero new behaviour                                  |
| `reviewer`       | Opus    | Code review before human review; never approves or merges        |
| `auditor`        | Opus    | Product-wide walk between phases: dead endpoints, missing states |
| `product-critic` | Opus    | Does the flow make sense to a user                               |
| `doc-writer`     | Haiku   | Update `docs/` after a change                                    |

| Workflow            | Run it                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| `review-ticket`     | After a ticket commit or before human PR review (five lenses, verified) |
| `codex-review-loop` | On every PR, through `/codex-review`                                    |
| `phase-gate`        | At every phase boundary                                                 |
| `design-review`     | After UI work, before shipping                                          |

| Command          | Purpose                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `/codex-review`  | Drive the Codex review loop on a PR                                |
| `/decision`      | Create a decision file                                             |
| `/audit`         | Security and code-quality audit; `types` writes the phase manifest |
| `/design-review` | Visual polish audit                                                |

The phase-loop commands (`/work`, `/init-phase`, `/status` and the rest), five agents, four workflows and the Cursor mirror were retired in 4.0 after four months without use. They are in `archive/` in the harness repo.

---

## Skills

Skills load on demand; the description list is always in context, so load one when the task enters its domain and not otherwise.

| Load                                                                                                                                      | When                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `testing`, `e2e-testing`, `msw-mock-api`                                                                                                  | Per the Testing Policy                            |
| `security`                                                                                                                                | Auth, input handling, webhooks, secrets           |
| `database-migrations`, `data-migration`                                                                                                   | Schema or data changes                            |
| `design-routing`                                                                                                                          | Any UI work; it routes to the other design skills |
| `seo-routing`                                                                                                                             | SEO work; it routes to the other SEO skills       |
| `ci-cd`                                                                                                                                   | Anything under `.github/`                         |
| `ai-integration`, `mcp-server`, `evaluation`                                                                                              | LLM, MCP or eval work                             |
| `code-audit`, `security-audit`, `red-team`                                                                                                | Audits and adversarial testing                    |
| Stack skills (`nextjs-bun-prisma`, `drizzle-orm`, `trpc`, `shadcn-tailwind`, `bun-runtime`, `turborepo`, `react-native`, `redis-caching`) | When the product uses that stack                  |

Archived, not shipped (`archive/skills/`, eval cases in `archive/evals/absorption-archived.yaml`): `shopify-remix`, `woocommerce`, `wordpress-plugin`, `heroku-deploy`, `cloudflare-dns`, `mysql-planetscale`, `pinecone`, and from 4.0 `council`, `resend-email`, `payments` (never loaded, and no measured effect in the last eval baseline). To restore one, move its folder to `.claude/skills/`, add it to `plugin.json`, and move its eval cases back.

Before archiving any further skill, re-run `bun run eval:absorption`: most unused skills still showed a positive effect when loaded, so the fault is that nothing loads them, not that they are useless.

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

- **Surgical modifications.** Change only what the ticket requires. Don't reformat, rename, or "while I'm here" refactor nearby code — those changes belong in a separate refactor PR (see the `refactorer` agent). Opportunistic edits balloon diffs, hide the real change in review, and break unrelated tests.

- **Define "done" before starting.** Before writing code, write down the success criteria — what passing tests must assert, what the user should be able to do, what specifically would make this ticket DONE. Stop when those are met. Don't loop past them looking for more work; don't stop short of them because the happy path works.

- **Use the model for judgment, code for determinism.** LLM calls are for classification, extraction, summarization, drafting — tasks where there isn't a deterministic right answer. Routing, retries, status code handling, data transformations, and anything with a defined input→output mapping must be code. If `if/switch/map` can answer it, don't ask the model.

- **Expose conflicts, don't average them.** If the codebase has two patterns for the same thing (two error formats, two date utilities, two auth helpers), pick one and use it — don't invent a third that blends both. If it's unclear which is canonical, add an entry to `progress/conventions.md` to lock it in, or create an arch decision if the choice is non-obvious.

- **Fail loudly, never silently.** Catching an error and returning `null`, skipping a record without logging, or swallowing an exception to "keep things working" is a career-ending bug waiting to happen. Throw, log structured errors via `pino`, and return non-2xx status codes. "Successfully processed 86% of records" is not a success — it's a partial outage you hid.

---

## Notes for Agents

1. Read `specs/SPEC.md` before a phase and `specs/design/DESIGN.md` before UI work.
2. Read the relevant pages in `docs/` before changing a feature; they are the fastest way to learn how it works today.
3. Check for `PENDING` decisions before starting. Do not guess at spec gaps.
4. Frontend first: build UI against dummy data to find out what the API needs.
5. No ticket is complete without tests that assert its acceptance criteria (see Testing Policy).
6. Add observability in the first phase: health check, structured logging, error tracking.
7. Never touch prod.
8. Update `docs/` after a change that alters documented behaviour (`doc-writer`).
9. Import, don't reinvent types (see Type Discipline).
10. Read CI and Process Changes before touching anything under `.github/`.

---

## Failures to Prevent

| Failure                      | What prevents it                                               |
| ---------------------------- | -------------------------------------------------------------- |
| Leaked credential            | `secrets` gate, `security` skill, `/audit`                     |
| Unreviewed production change | `prod` gate, human-only merges                                 |
| Broken types on main         | `typecheck` gate, CI gate tier                                 |
| Major bug in production      | Testing Policy, `review-ticket`, Codex review on every PR      |
| Compliance violation         | `data-protection` and `gdpr-consent` skills                    |
| Silent config failure        | Check migrations, env vars, webhooks and crons before a deploy |
| Product nobody uses          | `product-critic`, `design-review`                              |
| Duplicate or drifting types  | Type Discipline, the phase type manifest                       |

If one of these checks fails, do not ship. Escalate.

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

## Smaller Rules

- **Before pushing:** run the project's `check` script (or lint, typecheck and build) locally. It saves a CI round trip; it is not a gate.
- **Fixing a type error:** grep every usage of the type or variable you change first. Nullable changes ripple.
- **Debugging an API:** check the endpoint, then auth, then whether IDs from earlier calls were stored. Look at git history for a working version before blaming the API.
- **"Add existing X to Y":** ask whether the user wants to select existing records or create new ones.
