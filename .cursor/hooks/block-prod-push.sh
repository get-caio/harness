#!/usr/bin/env bash
# beforeShellExecution: block pushes/merges to prod (and force-push to main/prod)
set -euo pipefail
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.command // empty')

deny() {
  jq -n --arg msg "$1" '{permission:"deny",user_message:$msg,agent_message:$msg}'
  exit 0
}

# git push … prod / origin prod / HEAD:prod
if echo "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+push([[:space:]]|$)'; then
  if echo "$cmd" | grep -qE '(^|[[:space:]])prod([[:space:]]|$)|:prod([[:space:]]|$)|refs/heads/prod|/prod([[:space:]]|$)'; then
    deny "Blocked: never push to prod. Humans deploy production."
  fi
  if echo "$cmd" | grep -qE '[[:space:]](--force|-f)([[:space:]]|$)' && echo "$cmd" | grep -qE '(^|[[:space:]])(main|master|prod)([[:space:]]|$)'; then
    deny "Blocked: force-push to main/master/prod is not allowed."
  fi
fi

# git merge … into prod checkout, or merge prod strategies that land on prod
if echo "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+merge([[:space:]]|$)'; then
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
  if [ "$branch" = "prod" ]; then
    deny "Blocked: never merge into prod checkout. Humans only."
  fi
fi

jq -n '{permission:"allow"}'
exit 0
