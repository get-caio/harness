#!/usr/bin/env bash
# beforeShellExecution: block pushes/merges to prod (and force-push to main/prod)
set -euo pipefail
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.command // empty')

deny() {
  jq -n --arg msg "$1" '{permission:"deny",user_message:$msg,agent_message:$msg}'
  exit 0
}

allow() {
  jq -n '{permission:"allow"}'
  exit 0
}

# Strip simple shell quoting around tokens for ref matching: 'prod' "prod" → prod
normalize_cmd() {
  printf '%s' "$1" | sed -E "s/[\"']([[:alnum:]_./:-]+)[\"']/\1/g"
}

norm=$(normalize_cmd "$cmd")

# Extract last -C path if present (git -C <dir> …)
git_c_dir=""
if [[ "$cmd" =~ git([[:space:]]+-C[[:space:]]+([^[:space:]]+)) ]]; then
  # Prefer the last -C occurrence
  git_c_dir=$(printf '%s' "$cmd" | grep -oE '\-C[[:space:]]+[^[:space:]]+' | tail -1 | awk '{print $2}')
  # Strip quotes around path
  git_c_dir=$(printf '%s' "$git_c_dir" | sed -E "s/^[\"']|[\"']$//g")
fi

branch_in() {
  local dir="${1:-.}"
  git -C "$dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""
}

# git [global opts]* <subcommand>
is_git_cmd() {
  local sub="$1"
  echo "$norm" | grep -qE "(^|[;&|[:space:]])git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|--git-dir=[^[:space:]]+|--work-tree=[^[:space:]]+|-[a-zA-Z@]+))*[[:space:]]+${sub}([[:space:]]|$)"
}

# Destination / ref mentions protected branch as a whole token (after quote strip)
targets_ref() {
  local ref="$1"
  echo "$norm" | grep -qE "(^|[[:space:]])${ref}([[:space:]]|$)|:${ref}([[:space:]]|$)|refs/heads/${ref}([[:space:]]|$)"
}

is_force() {
  echo "$norm" | grep -qE '[[:space:]](-f|--force|--force-with-lease|--force-if-includes)(=|[[:space:]]|$)'
}

# Branch for the repo the command targets
branch=$(branch_in "${git_c_dir:-.}")
# Also consider cwd branch when -C is absent
cwd_branch=$(branch_in ".")

if is_git_cmd push; then
  if [ "$branch" = "prod" ] || { [ -z "$git_c_dir" ] && [ "$cwd_branch" = "prod" ]; }; then
    deny "Blocked: never push from a prod checkout. Humans deploy production."
  fi

  if targets_ref prod; then
    deny "Blocked: never push to prod. Humans deploy production."
  fi

  if is_force; then
    if targets_ref main || targets_ref master || targets_ref prod; then
      deny "Blocked: force-push to main/master/prod is not allowed."
    fi
    if [ "$branch" = "main" ] || [ "$branch" = "master" ] || [ "$cwd_branch" = "main" ] || [ "$cwd_branch" = "master" ]; then
      # Only when force has no explicit non-protected dest — still block force from main/master tip
      if ! echo "$norm" | grep -qE '[[:space:]][^[:space:]]+:[^[:space:]]+'; then
        deny "Blocked: force-push from main/master is not allowed."
      fi
      if targets_ref main || targets_ref master || targets_ref prod; then
        deny "Blocked: force-push to main/master/prod is not allowed."
      fi
    fi
  fi
fi

if is_git_cmd merge; then
  if [ "$branch" = "prod" ] || [ "$cwd_branch" = "prod" ]; then
    deny "Blocked: never merge into prod checkout. Humans only."
  fi
fi

allow
