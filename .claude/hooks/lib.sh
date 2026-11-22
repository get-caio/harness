#!/usr/bin/env bash
# Shared helpers for the CAIO harness hooks.
#
# Rules every hook follows:
#   - Exit 2 is the only code that blocks a tool call. Exit 1 does NOT block.
#   - Block only when a check ran and failed. If a check cannot run (no jq,
#     no gh, tool crashed, repo not opted in), exit 0 so unattended sessions
#     never deadlock on a broken environment.
#   - Hooks do nothing unless the repo opts in with .claude/harness.json.

command -v jq >/dev/null 2>&1 || exit 0

HOOK_INPUT=$(cat)
hook_field() { printf '%s' "$HOOK_INPUT" | jq -r "$1 // empty" 2>/dev/null; }

HOOK_CWD=$(hook_field '.cwd')
[ -n "$HOOK_CWD" ] && [ -d "$HOOK_CWD" ] && cd "$HOOK_CWD" || true

# `git -C <dir> …` runs against another checkout; follow it.
follow_git_dir() {
  local dir
  dir=$(printf '%s' "$1" | grep -oE 'git +-C +[^ ]+' | head -1 | sed -E 's/^git +-C +//')
  [ -n "$dir" ] && [ -d "$dir" ] && cd "$dir" || true
}

repo_root() { git rev-parse --show-toplevel 2>/dev/null; }

harness_config() {
  local root
  root=$(repo_root) || return 1
  [ -f "$root/.claude/harness.json" ] && printf '%s' "$root/.claude/harness.json"
}

# Exit quietly unless this repo has opted in.
require_opt_in() { HARNESS_CONFIG=$(harness_config) || exit 0; [ -n "$HARNESS_CONFIG" ] || exit 0; }

# gate_on <name>: true unless .gates.<name> is explicitly false.
gate_on() {
  [ "$(jq -r --arg g "$1" 'if .gates[$g] == false then "false" else "true" end' "$HARNESS_CONFIG" 2>/dev/null)" != "false" ]
}

config_value() { jq -r "$1 // empty" "$HARNESS_CONFIG" 2>/dev/null; }

block() { printf '❌ BLOCKED: %s\n' "$1" >&2; exit 2; }

# Quoted text (commit messages, PR bodies, heredocs) is not a command. Strip it
# before looking for `git commit` / `git push`, so prose that mentions a push
# never trips a gate.
unquoted() { printf '%s' "$1" | tr '\n' ' ' | sed -E 's/"[^"]*"//g; s/'"'"'[^'"'"']*'"'"'//g'; }

is_git_commit() { unquoted "$1" | grep -qE '(^|[;&|(]|[[:space:]])git( +-C +[^ ]+)? +commit([[:space:]]|$)'; }
is_git_push() { unquoted "$1" | grep -qE '(^|[;&|(]|[[:space:]])git( +-C +[^ ]+)? +push([[:space:]]|$)'; }
