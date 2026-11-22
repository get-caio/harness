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
# `git --work-tree=<dir> …`. git_dirs prints the directory steps of the whole
# command, one per line: `D<dir>` for a literal directory (`P<dir>` from pushd),
# `-` for `cd -`, `p` for `popd`, `?` for a step that cannot be resolved here
# (`cd "$VAR"`), and `(` / `)` around a subshell group, whose steps end with it.
# Every real `git commit` / `git push` adds `[`, the steps its own global
# options take, `!` (the checkout it runs in) and `]`: -C and --work-tree move
# that one invocation, not the commands after it. With no commit or push in the
# command only the cd steps are left, which is where `cd <repo> && gh pr create`
# runs.
#
# The command is split into shell words first, so a directory may be quoted
# (`git -C "/path with spaces" …`) and a `cd /tmp` or `git -C /tmp` inside a
# quoted commit message or PR body is one prose word, not an invocation.
# Following prose would leave the repo and switch every gate off. For the same
# reason `cd` / `pushd` count only as the command word of a segment and heredoc
# bodies are skipped, the body of `-m "$(cat <<'EOF' … EOF)"` included: a quote
# character in that message must not turn the rest of it into commands.
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
      op("[")
      for (k = 1; k <= gn; k++) op(gops[k])
      if (wt != "") op(wt)
      else if (gd ~ /(^D|\/)\.git\/*$/) op(gd "/..")
      op("!"); op("]")
    }
    # An unquoted `$( … )` or backtick substitution is part of the word it sits
    # in: the word is set aside, the commands inside are read as a group of
    # their own, and the word then goes on as one that cannot be resolved here
    # (`git -C $(pwd)/x commit`, `cd $(mktemp -d)`).
    function sub_open(   k) {
      sn++
      sv[sn] = w SUBSEP inw SUBSEP tl SUBSEP gs SUBSEP want SUBSEP wt SUBSEP gd SUBSEP cs SUBSEP pd SUBSEP first SUBSEP gn
      for (k = 1; k <= gn; k++) svg[sn, k] = gops[k]
      w = ""; inw = 0; nl = 0; tl = 0; cs = 0; gs = 0; first = 1
      op("(")
    }
    function sub_close(   k, f) {
      sep(); op(")")
      split(sv[sn], f, SUBSEP)
      w = f[1]; tl = f[3]; gs = f[4]; want = f[5]; wt = f[6]; gd = f[7]; cs = f[8]; pd = f[9]; first = f[10]; gn = f[11]
      for (k = 1; k <= gn; k++) gops[k] = svg[sn, k]
      sn--
      inw = 1; nl = 1
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
      for (i = 1; i <= n; i++) {
        c = substr(s, i, 1)
        if (q != "") {
          if (q == "\"" && dp > 0 && c == "<" && substr(s, i + 1, 1) == "<" && substr(s, i + 2, 1) != "<") {
            # A heredoc inside "$( … )": skip its body, quotes and all.
            i += 2; tab = 0
            if (substr(s, i, 1) == "-") { tab = 1; i++ }
            while (i <= n && index(" \t", substr(s, i, 1))) i++
            d = ""
            for (; i <= n; i++) {
              c = substr(s, i, 1)
              if (index(" \t\n;&|()<>", c)) break
              if (c != "\"" && c != "\047" && c != "\\") d = d c
            }
            i += index(substr(s, i), "\n") - 1
            while (i < n) {
              j = index(substr(s, i + 1), "\n")
              line = substr(s, i + 1, j - 1); i += j
              if (tab) sub(/^\t+/, "", line)
              if (line == d) break
            }
            continue
          }
          if (c == q) { q = ""; dp = 0 }
          else if (q == "\"" && c == "\\" && index("\"\\$`", substr(s, i + 1, 1))) { i++; w = w substr(s, i, 1) }
          else {
            if (q == "\"") {
              if (c == "$" || c == "`") nl = 1
              if (c == "$" && substr(s, i + 1, 1) == "(") dp++
              else if (c == ")" && dp > 0) dp--
            }
            w = w c
          }
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
        if (c == "$" && substr(s, i + 1, 1) == "(") { sub_open(); kd[++kn] = 1; i++; continue }
        if (c == "`") {
          if (bt) { bt = 0; sub_close() } else { bt = 1; sub_open() }
          continue
        }
        if (c == "(") { sep(); op("("); kd[++kn] = 0; continue }
        if (c == ")") {
          if (kn > 0 && kd[kn--]) sub_close()
          else { sep(); op(")") }
          continue
        }
        if (index(";&|", c)) { sep(); continue }
        if (c == "$" || c == "`") nl = 1
        if (c == "~" && !inw) tl = 1
        w = w c; inw = 1
      }
      sep()
      for (k = 1; k <= no; k++) print ops[k]
    }'
}
# Applies the steps in this shell and leaves it in the checkout of the first
# commit or push (with none, where the cd steps end). A directory that does not
# exist is skipped (a failed `cd` leaves the real shell where it was). `cd -`
# and `popd` return to a directory an earlier step in the same command left. A
# step that cannot be resolved puts the hook back where it started, and relative
# steps are then skipped until an absolute one: a half-followed path is never
# checked in place of the hook cwd.
#
# The gates run once, against one checkout. A command with several commits or
# pushes is fine while they all run in the same one (`git commit … && git
# push`). When they do not, or one of them runs somewhere that cannot be
# resolved, GIT_TARGETS_DIFFER is set and GIT_TARGET_DIRS lists where each one
# was placed, so the caller can refuse the command instead of checking only the
# first. Two targets in the same unresolved place (`cd "$DIR" && git commit … &&
# git push`) count as one checkout.
GIT_TARGETS_DIFFER=false
GIT_TARGET_DIRS=()
follow_git_dir() {
  local step dir old top key n start=$PWD prev="" lost=false lostid=0 nlost=0
  local first="" firstkey=""
  local -a stack=() s_pwd=() s_prev=() s_lost=() s_id=() s_n=()
  GIT_TARGETS_DIFFER=false; GIT_TARGET_DIRS=()
  while IFS= read -r step; do
    old=$PWD
    case "$step" in
      "") ;;
      [DP]?*)
        dir=${step#?}
        case "$dir" in /*) lost=false ;; esac
        if $lost; then
          nlost=$((nlost + 1)); lostid=$nlost
        elif cd "$dir" 2>/dev/null; then
          prev=$old
          case "$step" in P*) stack[${#stack[@]}]=$old ;; esac
        fi ;;
      -)
        if [ -n "$prev" ] && cd "$prev" 2>/dev/null; then prev=$old
        else cd "$start" 2>/dev/null; prev=""; lost=true; nlost=$((nlost + 1)); lostid=$nlost; fi ;;
      p)
        top=$((${#stack[@]} - 1))
        if [ "$top" -ge 0 ] && cd "${stack[$top]}" 2>/dev/null; then
          unset "stack[$top]"; prev=$old
        else cd "$start" 2>/dev/null; prev=""; lost=true; nlost=$((nlost + 1)); lostid=$nlost; fi ;;
      "(" | "[")
        n=${#s_pwd[@]}
        s_pwd[$n]=$PWD; s_prev[$n]=$prev; s_lost[$n]=$lost; s_id[$n]=$lostid; s_n[$n]=${#stack[@]} ;;
      ")" | "]")
        n=$((${#s_pwd[@]} - 1))
        if [ "$n" -ge 0 ]; then
          cd "${s_pwd[$n]}" 2>/dev/null
          prev=${s_prev[$n]}; lost=${s_lost[$n]}; lostid=${s_id[$n]}
          while [ "${#stack[@]}" -gt "${s_n[$n]}" ]; do unset "stack[$((${#stack[@]} - 1))]"; done
          unset "s_pwd[$n]" "s_prev[$n]" "s_lost[$n]" "s_id[$n]" "s_n[$n]"
        fi ;;
      "!")
        if $lost; then key="?$lostid"
        else key=$(git rev-parse --show-toplevel 2>/dev/null) || key=$(pwd -P); fi
        GIT_TARGET_DIRS[${#GIT_TARGET_DIRS[@]}]=$PWD
        if [ -z "$first" ]; then first=$PWD; firstkey=$key
        elif [ "$key" != "$firstkey" ]; then GIT_TARGETS_DIFFER=true; fi ;;
      *) cd "$start" 2>/dev/null; prev=""; lost=true; nlost=$((nlost + 1)); lostid=$nlost ;;
    esac
  done <<EOF
$(git_dirs "$1")
EOF
  [ -n "$first" ] && cd "$first" 2>/dev/null
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
# The arguments of every `git push` in the command, one push per line.
push_segments() {
  push_args "$1" |
    grep -oE "(^|[;&|(]|[[:space:]])$GIT_RE +push([[:space:]][^;&|()]*)?" |
    sed -E "s/^.?$GIT_RE +push//"
}
# `prod` / `heads/prod` / `refs/heads/prod` -> `refs/heads/prod`.
full_head() {
  case "$1" in refs/*) printf '%s' "$1" ;; heads/*) printf 'refs/%s' "$1" ;; *) printf 'refs/heads/%s' "$1" ;; esac
}
# push_config_dest <push args> <prod> <current branch>: true when a push that
# leaves its destination to git's configuration would update refs/heads/<prod>.
# git fills in the destination when the push names no refspec (`git push`,
# `git push origin`) and when a refspec names a branch without a `:<dst>`
# (`git push origin feature`):
#   - remote.<remote>.push maps the branch, e.g. HEAD:refs/heads/prod;
#   - with no such mapping, push.default=upstream sends a branch to its
#     branch.<name>.merge (a named branch on whichever remote the command
#     names), and push.default=matching sends every local branch the remote
#     also has, a local <prod> included.
# A mapping that could apply is treated as one that does: git itself remaps a
# named branch only when the configured source spells it out in full.
# The remote is the one the command names, else --repo, else
# branch.<name>.pushRemote, remote.pushDefault, branch.<name>.remote, origin.
# Everything is read from local config: nothing here contacts the remote, and a
# lookup that fails resolves to nothing, which lets the push through. Pushes
# that spell their refs out (--tags, --delete, --all, --mirror) are left to the
# checks on the command text.
push_config_dest() {
  local prod=$2 branch=$3 target="refs/heads/$2"
  local w spec src dst pre suf star remote="" repo="" skip=false wantrepo=false pd b
  local -a words=() pos=() cfg=() refs=()
  read -r -a words <<EOF
$1
EOF
  for w in ${words[@]+"${words[@]}"}; do
    if $skip; then skip=false; continue; fi
    if $wantrepo; then repo=$w; wantrepo=false; continue; fi
    case "$w" in
      [\<\>]* | [0-9][\<\>]* | [0-9][0-9][\<\>]*) case "$w" in *[\<\>]) skip=true ;; esac ;;
      -o | --push-option | --receive-pack | --exec | --recurse-submodules) skip=true ;;
      --repo) wantrepo=true ;;
      --repo=*) repo=${w#--repo=} ;;
      --ta | --tag | --tags | --d | --de | --del* | --al | --all | --b* | --m*) return 1 ;;
      --*) ;;
      -*d*) return 1 ;;
      -*) ;;
      *) pos[${#pos[@]}]=$w ;;
    esac
  done
  [ "$branch" = "HEAD" ] && branch=""
  remote=${pos[0]:-$repo}
  if [ -z "$remote" ]; then
    [ -n "$branch" ] && remote=$(git config --get "branch.$branch.pushRemote" 2>/dev/null)
    [ -n "$remote" ] || remote=$(git config --get remote.pushDefault 2>/dev/null)
    [ -n "$remote" ] || { [ -n "$branch" ] && remote=$(git config --get "branch.$branch.remote" 2>/dev/null); }
    [ -n "$remote" ] || remote=origin
  fi
  # The local branches whose destination git works out: the ones named without
  # a `:<dst>`. HEAD stands for the current branch. A name that is not a local
  # branch (a tag, a SHA, `$VAR`) is not followed.
  if [ "${#pos[@]}" -gt 1 ]; then
    for w in "${pos[@]:1}"; do
      w=${w#+}
      case "$w" in
        *:*) continue ;;
        HEAD | @) [ -n "$branch" ] && refs[${#refs[@]}]="refs/heads/$branch" ;;
        *) b=$(full_head "$w"); git show-ref --verify --quiet "$b" 2>/dev/null && refs[${#refs[@]}]=$b ;;
      esac
    done
    [ "${#refs[@]}" -gt 0 ] || return 1
  fi
  while IFS= read -r spec; do
    [ -n "$spec" ] && cfg[${#cfg[@]}]=$spec
  done <<EOF
$(git config --get-all "remote.$remote.push" 2>/dev/null)
EOF
  if [ "${#cfg[@]}" -gt 0 ]; then
    for spec in "${cfg[@]}"; do
      spec=${spec#+}
      case "$spec" in *:*) src=${spec%%:*}; dst=${spec#*:} ;; *) src=$spec; dst=$spec ;; esac
      case "$src" in HEAD | @) [ -n "$branch" ] && src="refs/heads/$branch" ;; esac
      case "$dst" in
        *\**)
          # A pattern: the local ref that lands on <prod> is the source pattern
          # with the same `*`.
          pre=${dst%%\**}; suf=${dst#*\*}
          case "$target" in "$pre"*"$suf") ;; *) continue ;; esac
          star=${target#"$pre"}; star=${star%"$suf"}
          src="${src%%\**}$star${src#*\*}"
          git show-ref --verify --quiet "$src" 2>/dev/null || continue ;;
        *)
          [ "$(full_head "$dst")" = "$target" ] || continue
          [ -n "$src" ] && src=$(full_head "$src") ;;
      esac
      # With no refspec on the command line every configured one is pushed.
      [ "${#pos[@]}" -gt 1 ] || return 0
      for b in "${refs[@]}"; do [ "$b" = "$src" ] && return 0; done
    done
    # Configured refspecs replace the default for a push that names none. A
    # named branch they do not cover still follows push.default below.
    [ "${#pos[@]}" -gt 1 ] || return 1
  fi
  pd=$(git config --get push.default 2>/dev/null)
  case "$pd" in
    upstream | tracking)
      if [ "${#pos[@]}" -le 1 ]; then
        [ -n "$branch" ] && refs[0]="refs/heads/$branch"
      fi
      for b in ${refs[@]+"${refs[@]}"}; do
        [ "$(git config --get "branch.${b#refs/heads/}.merge" 2>/dev/null)" = "$target" ] && return 0
      done ;;
    matching)
      [ "${#pos[@]}" -le 1 ] && [ "${#cfg[@]}" -eq 0 ] && git show-ref --verify --quiet "$target" 2>/dev/null && return 0 ;;
  esac
  return 1
}
# True when the command also runs a `git switch` or `git checkout` whose target
# the gates cannot vouch for, matched on unquoted text like the commit itself.
#
# One form is safe and very common, so it is allowed: creating a NEW branch with
# a plain literal name that is not the prod branch (`git checkout -b feature/x`,
# `git switch -c feature/x`, `git switch --create feature/x`), optionally from a
# start point. The commit then lands on that new branch, which has no PR and is
# not prod. Every other form (switching to an existing branch, -B / -C, `--`,
# a quoted or computed name) is still refused alongside a commit or push.
#   $1 command   $2 prod branch name
switches_branch_in_call() {
  local text prod="$2" seg rest name
  text=$(unquoted "$1")
  printf '%s' "$text" | grep -qE "(^|[;&|(]|[[:space:]])$GIT_RE +(switch|checkout)([[:space:]]|$)" || return 1
  # Check each switch/checkout invocation, one per command segment.
  while IFS= read -r seg; do
    printf '%s' "$seg" | grep -qE "(^|[(]|[[:space:]])$GIT_RE +(switch|checkout)([[:space:]]|$)" || continue
    rest=$(printf '%s' "$seg" | sed -E "s/^.*$GIT_RE +(switch|checkout)[[:space:]]+//")
    case "$seg" in
      *switch*) printf '%s' "$rest" | grep -qE '^(-c|--create)[[:space:]]+[A-Za-z0-9][A-Za-z0-9._/-]*([[:space:]]+[A-Za-z0-9][A-Za-z0-9._/~^-]*)?[[:space:]]*$' || return 0 ;;
      *) printf '%s' "$rest" | grep -qE '^-b[[:space:]]+[A-Za-z0-9][A-Za-z0-9._/-]*([[:space:]]+[A-Za-z0-9][A-Za-z0-9._/~^-]*)?[[:space:]]*$' || return 0 ;;
    esac
    name=$(printf '%s' "$rest" | awk '{print $2}')
    [ "$name" = "$prod" ] && return 0
  done <<<"$(printf '%s' "$text" | tr ';&|' '\n\n\n')"
  return 1
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
