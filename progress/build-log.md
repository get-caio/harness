# Build Log

Progress tracking for phased development.

---

<!--
Template for phase initialization:

## YYYY-MM-DD HH:MM — Phase N Initialized

**Phase:** N - [Phase Name]
**Tickets Generated:** X
**Estimates:** S=X, M=X, L=X
**Spec Decisions Created:** X

---
-->

<!--
Template for session start:

## YYYY-MM-DD HH:MM — Session Start

**Phase:** N - [Phase Name]
**Phase Progress:** X/Y (XX%)
**Open Spec Decisions:** X
**Open Arch Decisions:** X
**Ready to Work:** PN-TXXX, PN-TXXX

---
-->

<!--
Template for ticket completion:

### YYYY-MM-DD HH:MM — PN-TXXX: [Title]

**Status:** TODO → DONE
**Files Changed:**
- src/... (new)
- src/... (modified)
**Tests:** [REQUIRED - list test files added/modified, or link to spec decision justifying skip]
- tests/... (X tests added)
- src/...test.ts (Y tests added)
**Test Coverage:** X% → Y% (or N/A if coverage not configured yet)
**Commit:** abc123f
**Notes:** [Any relevant notes]

⚠️ GATE: If "Tests:" field is empty or says "N/A" without a linked spec decision, this ticket is NOT complete.

---
-->

<!--
Template for spec decision created:

### YYYY-MM-DD HH:MM — Spec Decision Created

**Decision:** SD-NNN - [Title]
**Phase:** N
**Blocks:** PN-TXXX, PN-TXXX
**Options:** A) [Option A], B) [Option B]
**Status:** PENDING — awaiting human input

---
-->

<!--
Template for spec decision resolved:

### YYYY-MM-DD HH:MM — Spec Decision Resolved

**Decision:** SD-NNN - [Title]
**Chosen:** [Option chosen]
**Unblocked:** PN-TXXX, PN-TXXX

---
-->

<!--
Template for phase complete:

## YYYY-MM-DD HH:MM — Phase N Complete

**Phase:** N - [Phase Name]
**Tickets Completed:** X
**Tickets Skipped:** X
**Duration:** X days
**Ready for:** Phase N+1

---
-->

<!--
Template for session end:

## YYYY-MM-DD HH:MM — Session End

**Phase:** N - [Phase Name]
**Completed This Session:** PN-TXXX, PN-TXXX
**In Progress:** PN-TXXX (partial)
**Blocked:** PN-TXXX (SD-NNN)
**Phase Progress:** X/Y (XX%)
**Next Up:** PN-TXXX

---
-->
2026-02-06 21:41 - Dependency installed: bun add -D vitepress
2026-02-06 21:47 - Dependency installed: bun add -D vitepress-plugin-mermaid mermaid
2026-03-19 11:34 - Dependency installed: bun add @anthropic-ai/sdk yaml

## 2026-06-10 — Skill revalidation against Fable 5 / Sonnet 4.6

Re-ran the absorption eval suite (127 cases) against both skill consumers: `claude-fable-5`
(main loop, ~$47) and `claude-sonnet-4-6` (subagents, ~$14, saved as the new regression
baseline). The prior baseline was 2026-03-19 on `claude-sonnet-4-20250514`.

- **Removed** (zero delta on three model generations; rules preserved in CLAUDE.md
  Compressed Skill Rules): `auth`, `observability`, `stripe-billing`. Also removed
  `anti-slop` — both models pass every slop assertion natively.
- **Kept — old verdict reversed**: `nextjs-bun-prisma` (+0.3/+0.3), `vitepress` (+0.5/+0.5),
  `ui-patterns`, `seo-foundations` were negative on Sonnet 4 but positive on the new models.
  Do not prune on a stale baseline.
- **Kept despite zeros**: routing/procedural skills (`design-routing`, `seo-routing`,
  `council`, `code-audit`, `red-team`, `seo-agent-playbook`) — absorption regexes can't
  measure them; they're load-bearing references in agents/commands/workflows.
- Eval runner defaults updated: model `claude-sonnet-4-6`, judge `claude-haiku-4-5`,
  current pricing table.

---

## 2026-08-07 — Phase A: Cursor dual-harness surface

**Change:** Extracted `HARNESS.md`, thinned `CLAUDE.md`, added `AGENTS.md`, `.cursor/agents` (model-pinned), `.cursor/skills/workflow` slash skills, `harness.mdc`, `hooks.json`, `environment.json`.
**Branch:** `cursor/cursor-harness-ca82`
**Note:** Domain skills remain in `.claude/skills/` (no copy). Claude Code remains compatible.


## 2026-08-07 — Phase B+C: Skill diet + daily-driver playbook

**Change:** Expanded skill allowlist / situational / do-not-auto-load in `HARNESS.md` + `harness.mdc`; full Cursor day playbook in `docs/guide/cursor-harness.md`; AGENTS.md overrides.
**Branch:** `cursor/cursor-harness-ca82`


## 2026-08-07 — Sol review fixes (PR #10)

**Change:** Hardened block-prod-push / protect-env / stop-continue hooks; Delete matcher; warn uses diff-tree; doc-writer + README/INSTALL nits; regression tests for Sol blockers.
**Reviewer:** gpt-5.6-sol-high


## 2026-08-08 — Pin routine Cursor agents to Grok 4.5

**Change:** `implementer`/`feature`/`tester`/`deployer`/`refactorer`/`doc-writer` now `grok-4.5[effort=high]` (not `inherit`). Docs warn that missing `.cursor/agents` falls through to `.claude` → Sonnet.
**Why:** Product repos were spawning Sonnet implementers from Claude Code agent frontmatter.

