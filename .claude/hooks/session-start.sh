#!/usr/bin/env bash
# SessionStart: point the session at the operating rules and open decisions.
. "$(dirname "$0")/lib.sh"
require_opt_in
root=$(repo_root)
plugin_root=${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}
cat <<RULES
CAIO Build Harness is active in this repo. Full rules: $plugin_root/HARNESS.md (read the section you need before multi-step work). Product map: AGENTS.md. Patterns: progress/conventions.md. Failed approaches: progress/dead-ends.md.
The rules that matter most:
- Layers: Fable orchestrator (liaison and advisor, no product code) -> Opus sub-sessions (one task, one PR each) -> Opus or Sonnet subagents.
- Sub-sessions send every question to the orchestrator, never to the stakeholder. The orchestrator answers only low-impact questions and logs each answer as a decision file with Status: DECIDED (orchestrator); everything else goes to the stakeholder.
- Pass model on every subagent spawn: "sonnet" for mechanical, fully specified work; omit it (inherits Opus) for design-bearing, security-sensitive or underspecified work.
- Never write DECIDED for the stakeholder. Never touch prod. One PR per feature, opened when complete; run /codex-review on it.
- Gates block with a BLOCKED message. Fix the cause; do not route around a gate.
RULES
pending=$(grep -rl 'Status.*PENDING' "$root/specs/decisions" "$root/docs/decisions" 2>/dev/null | wc -l | tr -d ' ')
[ "$pending" -gt 0 ] && echo "$pending PENDING decision(s) are waiting on a human — see specs/decisions/ and docs/decisions/. Do not build on top of them."
exit 0
