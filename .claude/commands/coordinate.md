---
name: coordinate
description: Run a phase's independent tickets in parallel via the deterministic coordinate-phase workflow — dependency-ordered waves, file-disjoint parallelism, merge-and-gate between waves.
---

# /coordinate — Parallel Phase Execution (Deterministic)

Run the independent TODO tickets in the current phase as parallel `feature` agents,
coordinated by the **`coordinate-phase` workflow** rather than hand-rolled orchestration.

This replaces the old pattern of spawning the `coordinator` agent and having it
improvise `git worktree add` + `Task` spawns. That improvisation caused a real bug
(agents branching from a stale base commit). The workflow makes worktree base commits,
file ownership, merge order, and the quality gate **structural** — they cannot be
forgotten or done out of order.

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

## Setup (one-time per project)

The `Workflow` tool resolves `name:` only against workflow scripts in the **project's own**
`.claude/workflows/` directory. Claude Code plugins cannot yet auto-distribute workflow
scripts (no `workflows` include key; `${CLAUDE_PLUGIN_ROOT}` does not expand in command
markdown — see anthropics/claude-code#9354). So if you installed this harness as a plugin,
copy the workflow into your project once:

```bash
mkdir -p .claude/workflows
# adjust the source path to wherever the harness is installed/cloned:
cp <harness>/.claude/workflows/coordinate-phase.js .claude/workflows/
```

If you're working inside the harness repo itself, the file is already at
`.claude/workflows/coordinate-phase.js` — no copy needed.

## Execution

Once `coordinate-phase.js` exists in `.claude/workflows/`, invoke it from the main loop
(subagents cannot call Workflow):

```
Workflow({
  name: 'coordinate-phase',
  args: { phase: <N or omit for CURRENT_PHASE>, maxParallel: <1-3, default 3> },
})
```

The workflow runs in the background and reports a `<task-notification>` on completion.
Watch live progress with `/workflows`.

## What the workflow does (so you know what you're delegating)

1. **Parse** — one agent reads the phase file into a structured ticket graph
   (id, size, status, `dependsOn`, file-ownership globs, blocking decision).
2. **Plan (deterministic JS)** — topological layering by `dependsOn`, then packs each
   layer into waves of ≤`maxParallel` **file-disjoint** tickets. No two agents in a
   wave can touch the same file.
3. **Per wave: implement → integrate** —
   - Implement: parallel `feature` agents, each in an isolated worktree cut from
     current HEAD, each owning only its declared files, each committing once.
   - Integrate: an `implementer` agent merges the wave's branches onto the working
     branch and runs the full gate (`bun test && lint && typecheck`).
   - **Waves are sequential**: wave N is merged before wave N+1's worktrees are cut,
     so later agents always branch from a HEAD that contains earlier work.
   - **Halt on red gate**: if the gate fails after a merge, the workflow stops rather
     than building more work on a broken base.
4. **Report** — coordination report (completed / blocked / failures) + build-log update.

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
