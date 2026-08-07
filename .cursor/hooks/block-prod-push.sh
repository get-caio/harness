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

# git [global opts]* <subcommand> — supports `git -C path push`, etc.
is_git_cmd() {
  local sub="$1"
  echo "$cmd" | grep -qE "(^|[;&|[:space:]])git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|--git-dir=[^[:space:]]+|--work-tree=[^[:space:]]+|-[a-zA-Z@]+))*[[:space:]]+${sub}([[:space:]]|$)"
}

# Destination / ref mentions protected branch names as whole tokens
targets_ref() {
  local ref="$1"
  echo "$cmd" | grep -qE "(^|[[:space:]])${ref}([[:space:]]|$)|:${ref}([[:space:]]|$)|refs/heads/${ref}([[:space:]]|$)"
}

is_force() {
  echo "$cmd" | grep -qE '[[:space:]](-f|--force|--force-with-lease|--force-if-includes)(=|[[:space:]]|$)'
}

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")

if is_git_cmd push; then
  # Any push while checked out on prod
  if [ "$branch" = "prod" ]; then
    deny "Blocked: never push from a prod checkout. Humans deploy production."
  fi

  # Any push whose destination is prod
  if targets_ref prod; then
    deny "Blocked: never push to prod. Humans deploy production."
  fi

  # Force-push to main/master/prod (all force variants)
  if is_force; then
    if targets_ref main || targets_ref master || targets_ref prod; then
      deny "Blocked: force-push to main/master/prod is not allowed."
    fi
    # `git push --force` with no explicit ref while on main/master
    if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
      deny "Blocked: force-push from main/master is not allowed."
    fi
  fi
fi

if is_git_cmd merge; then
  if [ "$branch" = "prod" ]; then
    deny "Blocked: never merge into prod checkout. Humans only."
  fi
fi

allow
