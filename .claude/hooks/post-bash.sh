#!/usr/bin/env bash
# PostToolUse (Bash): remind the session that an open PR with new commits needs
# the Codex review loop. Sent as additionalContext so the model sees it.
. "$(dirname "$0")/lib.sh"
cmd=$(hook_field '.tool_input.command')
[ -z "$cmd" ] && exit 0
follow_git_dir "$cmd"
require_opt_in
gate_on codexReview || exit 0
is_git_push "$cmd" || printf '%s' "$cmd" | grep -qE '(^|[;&|]|[[:space:]])gh pr create' || exit 0
command -v gh >/dev/null 2>&1 || exit 0
git log -1 --format=%s 2>/dev/null | grep -q '^\[codex-review\]' && exit 0
git log -1 --format=%B 2>/dev/null | grep -qiE '\[(skip ci|ci skip|no ci|skip actions|actions skip)\]' && exit 0
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
pr=$(gh pr view "$branch" --json number,state --jq 'select(.state=="OPEN") | .number' 2>/dev/null)
[ -n "$pr" ] || exit 0
jq -n --arg pr "$pr" '{hookSpecificOutput: {hookEventName: "PostToolUse", additionalContext: ("PR #" + $pr + " has new commits. Run /codex-review " + $pr + " and drive it to mergeable, human-steps-remaining or blocked before starting the next feature.")}}'
exit 0
