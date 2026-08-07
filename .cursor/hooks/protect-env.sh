#!/usr/bin/env bash
# beforeShellExecution + preToolUse: block writing/clobbering .env* secrets files
set -euo pipefail
input=$(cat)

deny() {
  jq -n --arg msg "$1" '{permission:"deny",user_message:$msg,agent_message:$msg}'
  exit 0
}

allow() {
  jq -n '{permission:"allow"}'
  exit 0
}

# Tool form (Write / Edit / Delete / path fields)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.path // .path // empty')
tool_name=$(printf '%s' "$input" | jq -r '.tool_name // .toolName // empty')
if [ -n "$path" ] && echo "$path" | grep -qE '(^|/)\.env([A-Za-z0-9_.-]*)?$'; then
  deny "Blocked: agents must not edit or delete .env* files."
fi
if [ "$tool_name" = "Delete" ] && echo "$path" | grep -qE '\.env'; then
  deny "Blocked: agents must not delete .env* files."
fi

cmd=$(printf '%s' "$input" | jq -r '.command // empty')
if [ -z "$cmd" ]; then
  allow
fi

# Any shell mention of .env* — default deny; allow only a single read-only invocation
if ! echo "$cmd" | grep -qE '\.env([A-Za-z0-9_.-]*)?'; then
  allow
fi

# Reject chaining / subshells / redirections / process substitution involving .env
if echo "$cmd" | grep -qE ';|\||&&|\|\||`|\$\(|>|<'; then
  deny "Blocked: do not modify .env* files via shell. Use human-approved env configuration."
fi

# Explicit mutation entrypoints
if echo "$cmd" | grep -qE '(^|[[:space:]])(sed|python[0-9.]*|node|bun|dd|truncate|rm|mv|cp|chmod|chown|tee|install|perl|ruby|php|nano|vim|vi|code)([[:space:]]|$)|git[[:space:]]+(checkout|restore|clean|rm|add)([[:space:]]|$)'; then
  deny "Blocked: do not modify .env* files via shell. Use human-approved env configuration."
fi

# Entire command must be one read-only invocation (optional args/paths only)
if echo "$cmd" | grep -qE '^(cat|head|tail|less|more|bat|file|stat|ls|wc|rg|grep|git[[:space:]]+(show|diff|log))([[:space:]]+[^;&|<>`\$]+)*[[:space:]]*$'; then
  allow
fi

deny "Blocked: .env* referenced by a non-read-only command. Request human for secrets/env changes."
