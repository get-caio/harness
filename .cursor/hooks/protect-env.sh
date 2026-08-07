#!/usr/bin/env bash
# beforeShellExecution + preToolUse helper: block writing/clobbering .env* secrets files
set -euo pipefail
input=$(cat)

# Shell form
cmd=$(printf '%s' "$input" | jq -r '.command // empty')
if [ -n "$cmd" ]; then
  if echo "$cmd" | grep -qE '(^|[;&|[:space:]])(rm|mv|cp|tee|truncate|chmod|chown)([[:space:]]|$).*\.env'; then
    jq -n '{permission:"deny",user_message:"Blocked: do not modify .env* files via shell. Use human-approved env configuration.",agent_message:"Blocked: .env protection — request human for secrets/env changes."}'
    exit 0
  fi
  if echo "$cmd" | grep -qE '>\s*\.env|>>\s*\.env|cat\s*>\s*\.env'; then
    jq -n '{permission:"deny",user_message:"Blocked: do not redirect into .env* files.",agent_message:"Blocked: .env write via redirect."}'
    exit 0
  fi
fi

# Tool form (Write/Edit path)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // .path // empty')
if [ -n "$path" ] && echo "$path" | grep -qE '(^|/)\.env(\.|$)'; then
  jq -n '{permission:"deny",user_message:"Blocked: agents must not edit .env* files.",agent_message:"Blocked: .env file edit."}'
  exit 0
fi

jq -n '{permission:"allow"}'
exit 0
