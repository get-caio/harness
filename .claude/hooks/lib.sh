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

# The checks have to run in the checkout the commit or push will run in, which
# is not always the hook cwd: `cd <repo> && git commit`, `git -C <dir> push`,
# `git --work-tree=<dir> …`. git_dirs prints the directory steps that lead to
# the first real `git commit` / `git push` in the command, one per line:
# `D<dir>` for a literal directory (`P<dir>` from pushd), `-` for `cd -`, `p`
# for `popd`, `?` for a step that cannot be resolved here (`cd "$VAR"`). With no commit or push in the command it prints
# the cd steps alone, which is where `cd <repo> && gh pr create` runs.
#
# The command is split into shell words first, so a directory may be quoted
# (`git -C "/path with spaces" …`) and a `cd /tmp` or `git -C /tmp` inside a
# quoted commit message or PR body is one prose word, not an invocation.
# Following prose would leave the repo and switch every gate off. For the same
# reason `cd` / `pushd` count only as the command word of a segment, a step
# taken inside a closed `( … )` group is dropped, heredoc bodies are skipped,
# and nothing after the commit or push is read.
#
# Between `git` and the subcommand, git's global options are skipped: -C <dir>
# (followed, relative to the directory so far), --work-tree (followed),
# --git-dir (its parent is followed when it names a `.git` directory and no
# work tree is given), the other options that take a separate value, and any
# other dash word.
git_dirs() {
  printf '%s' "$1" | awk '
    function op(x) { ops[++no] = x }
    function sep() {
      if (inw) word()
      if (cs == 1) op(pd ? "?" : "D" ENVIRON["HOME"])
      cs = 0; gs = 0; first = 1
    }
    function gitword(v, lit,   x, k) {
      if (want != "") {
        x = lit ? "D" v : "?"
        if (want == "C") gops[++gn] = x
        else if (want == "W") wt = x
        else if (want == "G") gd = x
        want = ""; return
      }
      if (v == "-C") { want = "C"; return }
      if (v == "--work-tree") { want = "W"; return }
      if (v == "--git-dir") { want = "G"; return }
      if (v ~ /^(-c|--namespace|--config-env|--attr-source)$/) { want = "x"; return }
      if (v ~ /^--work-tree=/) { wt = lit ? "D" substr(v, 13) : "?"; return }
      if (v ~ /^--git-dir=/) { gd = lit ? "D" substr(v, 11) : "?"; return }
      if (v ~ /^-/) return
      gs = 0
      if (v != "commit" && v != "push") return
      for (k = 1; k <= gn; k++) op(gops[k])
      if (wt != "") op(wt)
      else if (gd ~ /(^D|\/)\.git\/*$/) op(gd "/..")
      found = 1
    }
    function word(   v, lit) {
      v = w; lit = !nl
      if (tl && (v == "~" || substr(v, 1, 2) == "~/")) v = ENVIRON["HOME"] substr(v, 2)
      w = ""; inw = 0; nl = 0; tl = 0
      if (gs) { gitword(v, lit); return }
      if (cs == 1) {
        if (v == "-") { op(pd ? "?" : "-"); cs = 2 }
        else if (v !~ /^-/) { op(lit ? (pd ? "P" : "D") v : "?"); cs = 2 }
        return
      }
      if (cs == 2) return
      if (first) {
        if (v ~ /^(if|then|else|elif|do|while|until|time|!|[{])$/) return
        first = 0
        if (v == "cd" || v == "pushd") { cs = 1; pd = (v == "pushd"); return }
        if (v == "popd") { op("p"); return }
      }
      if (v == "git") { gs = 1; gn = 0; want = ""; wt = ""; gd = "" }
    }
    { s = s $0 "\n" }
    END {
      n = length(s) - 1; first = 1
      for (i = 1; i <= n && !found; i++) {
        c = substr(s, i, 1)
        if (q != "") {
          if (c == q) q = ""
          else if (q == "\"" && c == "\\" && index("\"\\$`", substr(s, i + 1, 1))) { i++; w = w substr(s, i, 1) }
          else { if (q == "\"" && (c == "$" || c == "`")) nl = 1; w = w c }
          continue
        }
        if (c == "\"" || c == "\047") { q = c; inw = 1; continue }
        if (c == "\\" && i < n) {
          i++
          if (substr(s, i, 1) != "\n") { w = w substr(s, i, 1); inw = 1 }
          continue
        }
        if (c == " " || c == "\t") { if (inw) word(); continue }
        if (c == "<" && substr(s, i + 1, 1) == "<") {
          if (substr(s, i + 2, 1) == "<") { i += 2; continue }
          if (inw) word()
          i += 2; tab = 0
          if (substr(s, i, 1) == "-") { tab = 1; i++ }
          while (i <= n && index(" \t", substr(s, i, 1))) i++
          d = ""
          for (; i <= n; i++) {
            c = substr(s, i, 1)
            if (index(" \t\n;&|()<>", c)) break
            if (c != "\"" && c != "\047" && c != "\\") d = d c
          }
          i--
          hd[++hn] = d; ht[hn] = tab
          continue
        }
        if (c == "\n") {
          sep()
          for (h = 1; h <= hn; h++) {
            while (i < n) {
              j = index(substr(s, i + 1), "\n")
              line = substr(s, i + 1, j - 1); i += j
              if (ht[h]) sub(/^\t+/, "", line)
              if (line == hd[h]) break
            }
          }
          hn = 0
          continue
        }
        if (c == "(") { sep(); stk[++sp] = no; continue }
        if (c == ")") { sep(); if (sp > 0 && !found) no = stk[sp--]; continue }
        if (index(";&|", c)) { sep(); continue }
        if (c == "$" || c == "`") nl = 1
        if (c == "~" && !inw) tl = 1
        w = w c; inw = 1
      }
      if (!found) sep()
      for (k = 1; k <= no; k++) print ops[k]
    }'
}
# Applies the steps in this shell. A directory that does not exist is skipped
# (a failed `cd` leaves the real shell where it was). `cd -` and `popd` return
# to a directory an earlier step in the same command left. A step that cannot
# be resolved puts the hook back where it started, and relative steps are then
# skipped until an absolute one: a half-followed path is never checked in place
# of the hook cwd.
follow_git_dir() {
  local step dir old top start=$PWD prev="" lost=false
  local -a stack=()
  while IFS= read -r step; do
    old=$PWD
    case "$step" in
      "") ;;
      [DP]?*)
        dir=${step#?}
        case "$dir" in /*) lost=false ;; esac
        if ! $lost && cd "$dir" 2>/dev/null; then
          prev=$old
          case "$step" in P*) stack[${#stack[@]}]=$old ;; esac
        fi ;;
      -)
        if [ -n "$prev" ] && cd "$prev" 2>/dev/null; then prev=$old
        else cd "$start" 2>/dev/null; prev=""; lost=true; fi ;;
      p)
        top=$((${#stack[@]} - 1))
        if [ "$top" -ge 0 ] && cd "${stack[$top]}" 2>/dev/null; then
          unset "stack[$top]"; prev=$old
        else cd "$start" 2>/dev/null; prev=""; lost=true; fi ;;
      *) cd "$start" 2>/dev/null; prev=""; lost=true ;;
    esac
  done <<EOF
$(git_dirs "$1")
EOF
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

# `git`, then any of git's global options, up to the subcommand:
# `git -c k=v commit`, `git --no-pager -C dir push`. Shared by every matcher
# below and by the prod-push check, so no form is recognised by one and missed
# by another. An option that takes a separate value (-C, -c, --git-dir,
# --work-tree, --namespace, --config-env, --attr-source) may be followed by one;
# any other dash word takes none, so `git --no-pager log commit` is not a
# commit. The value is optional: unquoted() deletes a quoted one
# (`git -C "/repo" commit` arrives here as `git -C  commit`), and that is still
# a commit. Rewriting the quoted value instead would re-pair quotes and could
# swallow a real command, so the matcher is widened and the text is not.
GIT_RE='git( +((-[Cc]|--(git-dir|work-tree|namespace|config-env|attr-source))( +[^ ]+)?|-[^ ]*))*'
is_git_commit() { unquoted "$1" | grep -qE "(^|[;&|(]|[[:space:]])$GIT_RE +commit([[:space:]]|$)"; }
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
    grep -oE "(^|[;&|(]|[[:space:]])$GIT_RE +commit([[:space:]][^;&|()]*)?" |
    sed -E "s/^.?$GIT_RE +commit//" |
    awk '{
      for (i = 1; i <= NF; i++) {
        if ($i ~ /^(-[a-zA-Z]*[aio][a-zA-Z]*|--all|--only|--include)$/) found = 1
        else if ($i !~ /^-/ && $i !~ /^[0-9]*[<>]/) found = 1
      }
    } END { exit !found }'
}
is_git_push() { unquoted "$1" | grep -qE "(^|[;&|(]|[[:space:]])$GIT_RE +push([[:space:]]|$)"; }
# Prints `mirror` or `all` when a `git push` in the command is a bulk push:
# --mirror, or --all / --branches. Read from the push segment alone, so another
# command's --all (`ls --all`) and a quoted message do not count; a quoted
# single token ("--all") is still an argument. git accepts any unambiguous
# prefix of a long option (--al, --mirr), so the prefixes are matched too.
push_bulk_mode() {
  push_args "$1" |
    grep -oE "(^|[;&|(]|[[:space:]])$GIT_RE +push([[:space:]][^;&|()]*)?" |
    sed -E "s/^.?$GIT_RE +push//" |
    awk '{
      for (i = 1; i <= NF; i++) {
        if ($i ~ /^--m[a-z]*$/) mirror = 1
        else if ($i ~ /^--(all?|b[a-z]*)$/) all = 1
      }
    } END { if (mirror) print "mirror"; else if (all) print "all" }'
}
# True when the command also runs a staging command (`git add`, `git stage`,
# `git rm`, `git mv`), matched on unquoted text like the commit itself.
stages_in_call() { unquoted "$1" | grep -qE "(^|[;&|(]|[[:space:]])$GIT_RE +(add|stage|rm|mv)([[:space:]]|$)"; }
# True when a `git add` / `git stage` in the command carries -f / --force (as a
# flag, in a short-flag cluster, or as a long-option prefix).
force_adds_in_call() {
  push_args "$1" |
    grep -oE "(^|[;&|(]|[[:space:]])$GIT_RE +(add|stage)([[:space:]][^;&|()]*)?" |
    sed -E "s/^.?$GIT_RE +(add|stage)//" |
    awk '{
      for (i = 1; i <= NF; i++) {
        if ($i == "--") break
        if ($i ~ /^(-[a-zA-Z]*f[a-zA-Z]*|--f[a-z]*)$/) found = 1
      }
    } END { exit !found }'
}
