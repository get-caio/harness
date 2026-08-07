#!/usr/bin/env bash
# stop: if phase still has TODO tickets, nudge the agent to continue (Cloud babysit /work)
set -euo pipefail
input=$(cat)
status=$(printf '%s' "$input" | jq -r '.status // "completed"')
loop_count=$(printf '%s' "$input" | jq -r '.loop_count // 0')

# Only auto-continue clean completions
if [ "$status" != "completed" ]; then
  jq -n '{}'
  exit 0
fi

# Cap automatic follow-ups (hooks.json also sets loop_limit)
if [ "$loop_count" -ge 5 ]; then
  jq -n '{}'
  exit 0
fi

phase_file=""
if [ -f specs/CURRENT_PHASE ]; then
  phase=$(tr -d '[:space:]' < specs/CURRENT_PHASE)
  # Prefer matching PHASE-N-*.md
  phase_file=$(ls specs/phases/PHASE-"${phase}"-*.md 2>/dev/null | head -1 || true)
fi

if [ -z "$phase_file" ] || [ ! -f "$phase_file" ]; then
  jq -n '{}'
  exit 0
fi

# grep -c exits 1 on zero matches — swallow so set -e does not abort
todo_count=$(grep -cE '\|[[:space:]]*P[0-9]+-T[0-9]+[[:space:]]*\|[^|]*\|[[:space:]]*TODO[[:space:]]*\|' "$phase_file" 2>/dev/null || true)
blocked_count=$(grep -cE '\|[[:space:]]*P[0-9]+-T[0-9]+[[:space:]]*\|[^|]*\|[[:space:]]*BLOCKED[[:space:]]*\|' "$phase_file" 2>/dev/null || true)
todo_count=${todo_count:-0}
blocked_count=${blocked_count:-0}

if [ "$todo_count" -gt 0 ]; then
  msg="Harness stop-continue: ${todo_count} TODO ticket(s) remain in ${phase_file}. Continue the /work loop: pick the next unblocked TODO, implement with TDD, commit with [PN-TXXX], mark DONE. Do not invent DECIDED decisions. If all remaining are blocked (${blocked_count} BLOCKED), stop and report blockers."
  jq -n --arg m "$msg" '{followup_message:$m}'
  exit 0
fi

jq -n '{}'
exit 0
