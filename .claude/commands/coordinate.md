---
name: coordinate
description: Run a phase's independent TODO tickets in parallel — a deterministic planner (bundled MCP `plan_waves` tool, or the coordinate-phase workflow) builds dependency-ordered, file-disjoint waves; feature agents execute them with merge-and-gate between waves.
---

# /coordinate — Parallel Phase Execution (Deterministic)

Run the independent TODO tickets in the current phase as parallel `feature` agents, with the
hard part — dependency-ordered, file-disjoint wave planning with cascading blockage — done by a
**deterministic, tested planner** instead of improvised orchestration.

This replaces the old pattern of spawning the `coordinator` agent and having it improvise
`git worktree add` + `Task` spawns, which caused a real bug (agents branching from a stale base
commit). There are two execution modes below; both use the **same** planning core. Prefer
**Mode A** (the bundled MCP tool) — it works for installed-plugin users with no setup.

## When to Use

- The current phase has **3+ independent TODO tickets** that can run in parallel.
- For 1–2 tickets, or tightly coupled tickets, use `/work` (sequential) instead.

## Prerequisites

Same as `/work`:

1. ✅ `specs/CURRENT_PHASE` exists
2. ✅ `specs/phases/PHASE-N-*.md` exists with tickets
3. ✅ `/check-decisions` has run; all PENDING spec decisions for this phase are DECIDED
4. ✅ Git repo clean (the workflow merges onto the current working branch)

## Usage

```
/coordinate            # coordinate the phase in specs/CURRENT_PHASE, max 3 parallel
/coordinate 2          # coordinate Phase 2 explicitly
/coordinate 2 2        # Phase 2, max 2 parallel agents
```

## Mode A — MCP planner + Task execution (default; ships with the plugin)

The harness bundles an MCP server (`coordinate`) exposing the deterministic **`plan_waves`**
tool. This needs no per-project setup — installed-plugin users get it automatically. The
agent loop drives execution around the planner:

1. **Parse** — read `specs/CURRENT_PHASE` and `specs/phases/PHASE-N-*.md`; build the ticket
   list: `id`, `size`, `status`, `dependsOn` (blocked-by ids), `files` (directory-granular
   ownership the ticket will write — err toward overlap when unsure), `blockedByDecision`.
2. **Plan (deterministic — call the tool, do not eyeball it):**
   ```
   mcp__coordinate__plan_waves({ tickets: [ ...parsed... ], maxParallel: 3 })
   ```
   Returns `{ waves, deferredByDependency }`. Each wave is a set of **file-disjoint** tickets
   safe to run in parallel (≤ maxParallel, capped at 3). Dependency order is enforced across
   waves; blockage **cascades** to dependents; DONE / cross-phase deps count as satisfied.
3. **Execute wave by wave — the order is load-bearing, do not reorder or overlap:**
   For each wave in `waves`, in order:
   - **a.** Spawn one `feature` agent per ticket **in parallel** via `Task`, each
     `isolation: worktree`, each told it owns only its declared `files` and must NOT create
     its own worktree or branch off any other ref. Each commits once and reports its branch.
   - **b.** **Wait for the entire wave**, then merge each branch onto the working branch in
     order and run the repo's gate scripts (`npm run typecheck` / `npm test` / `npm run lint`
     — whichever exist in package.json; a missing script is N/A, not a failure).
   - **c.** **Only on a green gate**: set the merged tickets to DONE and append to
     `progress/build-log.md`. **On a red gate: STOP** — do not start the next wave and do not
     mark anything DONE; leave statuses for a human to triage.
     Merging each wave before spawning the next is what guarantees later worktrees branch from a
     HEAD that already contains earlier work (this is the bug the planner+discipline prevent).
4. **Report** — completed / deferred-by-dependency / decision-blocked / failed.

## Mode B — coordinate-phase Workflow (optional; stronger determinism)

If the `Workflow` tool is available AND `.claude/workflows/coordinate-phase.js` exists in the
project, run the whole thing as one script — execution sequencing (merge-before-next-wave,
halt-on-red) is then enforced **structurally**, not by the Mode-A instructions above:

```
Workflow({ name: 'coordinate-phase', args: { phase: N, maxParallel: 3 } })
```

Plugins can't auto-distribute workflow scripts (no `workflows` include key; `${CLAUDE_PLUGIN_ROOT}`
doesn't expand in command markdown — anthropics/claude-code#9354), so for plugin installs copy
it once:

```bash
mkdir -p .claude/workflows && cp <harness>/.claude/workflows/coordinate-phase.js .claude/workflows/
```

Both modes share the **same** planning algorithm: the workflow's inline planner is parity-tested
against the MCP server's `.claude/mcp/wave-planner.ts`, so they cannot drift.

## After Completion

- Review the returned report. Resolve any tickets that came back `blocked` (decisions)
  or `failed`, then re-run `/coordinate` for the remainder, or `/work` to finish inline.
- When the phase is fully DONE: run `/audit` then `/audit types` (mandatory type manifest)
  before `/init-phase N+1`.

## Caveats

- **Billed**: spawns real `feature` agents (multi-agent ≈ 15× token baseline). Use only
  when parallelism is worth it (3+ independent tickets).
- **Commits to the current branch**: run on a feature/phase branch, not `main`.
- **Ownership granularity**: the parse step declares file ownership at directory level
  and errs toward overlap when unsure — the failure mode is "ran more sequentially than
  necessary," never "two agents clobbered each other."
