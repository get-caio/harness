# Dead Ends & Failed Approaches

Log of approaches that were tried and didn't work. Prevents future agents (or fresh contexts) from repeating the same mistakes.

---

<!--
Template for logging a dead end:

## YYYY-MM-DD — [PN-TXXX] Brief Description of What Was Tried

**Ticket:** PN-TXXX
**Approach:** What was attempted
**Result:** What went wrong (error, performance, wrong abstraction, etc.)
**Why it failed:** Root cause if known
**What worked instead:** The approach that was ultimately used (or "still unresolved")

---
-->

## Blocking with `exit 1` in a Claude Code hook

Exit 1 is a non-blocking error: the tool call goes ahead. Only exit 2 blocks. Every gate in 3.x used `exit 1` (and the gitleaks branch exited inside a subshell, then fell through to `exit 0`). Test the exit code of the real script, as `tests/hooks.test.ts` does.

## Archiving skills because nothing invoked them

Zero invocations does not mean zero value. Most never-invoked skills still showed a positive absorption delta when loaded. Check `evals/baselines/latest.json` first and archive only skills with no use and no delta.
