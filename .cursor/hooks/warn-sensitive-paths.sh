#!/usr/bin/env bash
# afterFileEdit / afterShellExecution: warn on auth/api/payment/schema edits (non-blocking)
set -euo pipefail
input=$(cat)

paths=""
# afterFileEdit often provides path
p=$(printf '%s' "$input" | jq -r '.path // .file_path // .tool_input.file_path // .tool_input.path // empty')
if [ -n "$p" ]; then
  paths="$p"
fi

# git commit in shell — inspect staged names
cmd=$(printf '%s' "$input" | jq -r '.command // empty')
if echo "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+commit([[:space:]]|$)'; then
  staged=$(git diff --cached --name-only 2>/dev/null || true)
  paths="$paths"$'\n'"$staged"
fi

sensitive=$(printf '%s\n' "$paths" | grep -iE '(^|/)(\.env|auth|middleware|webhook|payment|stripe|schema\.prisma|drizzle|.*/api/)' || true)

if [ -n "$sensitive" ]; then
  echo "⚠️  SECURITY-SENSITIVE PATHS touched — verify auth checks, Zod validation, no secrets, human review if payment/auth/schema:" >&2
  printf '%s\n' "$sensitive" | sort -u | head -30 >&2
fi

# Non-blocking: empty or allow JSON depending on hook type
if printf '%s' "$input" | jq -e '.command' >/dev/null 2>&1; then
  # afterShellExecution — no required output
  exit 0
fi
exit 0
