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

# `git -C <dir> …` runs against another checkout; follow it. The command is
# split into shell words first, so the directory may be quoted
# (`git -C "/path with spaces" …`) and a `git -C /tmp` inside a quoted commit
# message or PR body is one prose word, not an invocation. Following prose
# would cd out of the repo and switch every gate off.
git_c_dir() {
  printf '%s' "$1" | tr '\n' ' ' | awk '
    function emit() {
      if (st == 2) { print w; done = 1; exit }
      if (st == 1 && w == "-C") st = 2
      else if (w == "git") st = 1
      else st = 0
      w = ""; inw = 0
    }
    {
      n = length($0); q = ""; st = 0; w = ""; inw = 0
      for (i = 1; i <= n; i++) {
        c = substr($0, i, 1)
        if (q != "") {
          if (c == q) q = ""
          else if (q == "\"" && c == "\\" && index("\"\\$`", substr($0, i + 1, 1))) { i++; w = w substr($0, i, 1) }
          else w = w c
          continue
        }
        if (c == "\"" || c == "\047") { q = c; inw = 1; continue }
        if (c == "\\" && i < n) { i++; w = w substr($0, i, 1); inw = 1; continue }
        if (c == " " || c == "\t") { if (inw) emit(); continue }
        if (index(";&|()", c)) { if (inw) emit(); st = 0; continue }
        w = w c; inw = 1
      }
      if (inw && !done) emit()
    }'
}
follow_git_dir() {
  local dir
  dir=$(git_c_dir "$1")
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

# For matching a push target: a quoted single token ("HEAD:prod", 'prod') is
# still an argument, so unwrap it in place. Quoted text with whitespace or a
# command separator is prose and is dropped, as in unquoted().
push_args() {
  printf '%s' "$1" | tr '\n' ' ' | sed -E 's/"([^"'"'"';&|[:space:]]*)"/\1/g; s/'"'"'([^"'"'"';&|[:space:]]*)'"'"'/\1/g; s/"[^"]*"//g; s/'"'"'[^'"'"']*'"'"'//g'
}

# The -C directory is optional in the pattern: unquoted() deletes a quoted one
# (`git -C "/repo" commit` arrives here as `git -C  commit`), and that is still
# a commit. Rewriting the quoted directory instead would re-pair quotes and
# could swallow a real command, so the matcher is widened and the text is not.
is_git_commit() { unquoted "$1" | grep -qE '(^|[;&|(]|[[:space:]])git( +-C( +[^ ]+)?)? +commit([[:space:]]|$)'; }
# True when a `git commit` in the command commits working-tree content rather
# than the index alone: -a / --all, -o / --only, -i / --include (as a flag or
# in a short-flag cluster such as -am), or a pathspec (`git commit -m x
# src/a.ts` is an implicit --only). Read from the unquoted text, one commit
# segment at a time, so a quoted message that mentions " -a " and a later
# `ls -a` do not count. A short-flag cluster has one leading dash, which keeps
# --amend / --author / --allow-empty out. Any other bare word counts as a
# pathspec, including an unquoted message word (`-m update`): that only widens
# the scan to HEAD. Redirections (`2>/dev/null`) are not pathspecs.
commit_reads_worktree() {
  unquoted "$1" |
    grep -oE '(^|[;&|(]|[[:space:]])git( +-C( +[^ ]+)?)? +commit([[:space:]][^;&|()]*)?' |
    sed -E 's/^.?git( +-C( +[^ ]+)?)? +commit//' |
    awk '{
      for (i = 1; i <= NF; i++) {
        if ($i ~ /^(-[a-zA-Z]*[aio][a-zA-Z]*|--all|--only|--include)$/) found = 1
        else if ($i !~ /^-/ && $i !~ /^[0-9]*[<>]/) found = 1
      }
    } END { exit !found }'
}
is_git_push() { unquoted "$1" | grep -qE '(^|[;&|(]|[[:space:]])git( +-C( +[^ ]+)?)? +push([[:space:]]|$)'; }
