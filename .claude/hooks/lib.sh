#!/usr/bin/env bash
# Shared helpers for the CAIO harness hooks.
#
# Rules every hook follows:
#   - Exit 2 is the only code that blocks a tool call. Exit 1 does NOT block.
#   - Block only when a check ran and failed. If a check cannot run (no jq,
#     no gh, tool crashed, repo not opted in), exit 0 so unattended sessions
#     never deadlock on a broken environment.
#   - Hooks do nothing unless the repo opts in with .claude/harness.json.
#
# Scope: these gates catch an agent's honest mistakes in the ways agents
# actually phrase commands (`git commit`, `cd dir && git commit`,
# `git -C dir push`). They are not a security boundary and do not try to
# out-parse every shell construct; branch protection on the remote is what
# protects prod. Keep this file small: every extra parsing rule is another way
# to refuse a normal command.

command -v jq >/dev/null 2>&1 || exit 0

HOOK_INPUT=$(cat)
hook_field() { printf '%s' "$HOOK_INPUT" | jq -r "$1 // empty" 2>/dev/null; }

HOOK_CWD=$(hook_field '.cwd')
[ -n "$HOOK_CWD" ] && [ -d "$HOOK_CWD" ] && cd "$HOOK_CWD" || true

# Quoted text (commit messages, PR bodies) is not a command. Strip it before
# looking for `git commit` / `git push` / `npm install`, so prose that mentions
# one never trips a gate. A quoted single token ("HEAD:prod", "/some/dir") is an
# argument, not prose, so it is unwrapped and kept.
unquoted() {
  printf '%s' "$1" | tr '\n' ' ' |
    sed -E "s/\"([^\" ]*)\"/\1/g; s/'([^' ]*)'/\1/g" |
    sed -E 's/"[^"]*"//g; s/'"'"'[^'"'"']*'"'"'//g'
}

# `git`, optionally with `-C <dir>` (the dir is gone if it was quoted and had spaces).
GIT_RE='git( +-C( +[^ -][^ ]*)?)?'
is_git_commit() { unquoted "$1" | grep -qE "(^|[;&|(]|[[:space:]])$GIT_RE +commit([[:space:]]|$)"; }
is_git_push() { unquoted "$1" | grep -qE "(^|[;&|(]|[[:space:]])$GIT_RE +push([[:space:]]|$)"; }
is_git_add() { unquoted "$1" | grep -qE "(^|[;&|(]|[[:space:]])$GIT_RE +(add|stage)([[:space:]]|$)"; }

# Move into the checkout the git command will run in. Two forms cover what
# agents write: a leading `cd <dir>` (then `&&`, `;` or a newline), and `git -C <dir>`. The directory may
# be quoted. A `git -C` that only appears inside a quoted message is ignored.
follow_git_dir() {
  local dir text
  dir=$(printf '%s' "$1" | sed -nE "s/^[[:space:]]*cd +(\"[^\"]+\"|'[^']+'|[^ ;&|]+) *((&&|;).*|\$)/\1/p" | head -1 | sed -E "s/^[\"']//; s/[\"']\$//")
  [ -n "$dir" ] && [ -d "$dir" ] && cd "$dir"
  text=$(unquoted "$1")
  printf '%s' "$text" | grep -qE '(^|[;&|(]|[[:space:]])git +-C([[:space:]]|$)' || return 0
  dir=$(printf '%s' "$text" | grep -oE 'git +-C +[^ -][^ ]*' | head -1 | sed -E 's/^git +-C +//')
  # A quoted directory with spaces was stripped above; read it from the original.
  [ -n "$dir" ] && [ -d "$dir" ] || dir=$(printf '%s' "$1" | grep -oE "git +-C +(\"[^\"]+\"|'[^']+')" | head -1 | sed -E "s/^git +-C +[\"']//; s/[\"']\$//")
  [ -n "$dir" ] && [ -d "$dir" ] && cd "$dir"
  return 0
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
