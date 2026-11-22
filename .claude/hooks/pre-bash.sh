#!/usr/bin/env bash
# PreToolUse (Bash): the gates that must actually stop a command.
#   prod guard · merged-PR guard · npm-in-bun guard · secret scan · typecheck
# Full test, lint and build runs are CI's job, not a per-commit hook.
. "$(dirname "$0")/lib.sh"
cmd=$(hook_field '.tool_input.command')
[ -z "$cmd" ] && exit 0
follow_git_dir "$cmd"
require_opt_in

commit=false; push=false
is_git_commit "$cmd" && commit=true
is_git_push "$cmd" && push=true

# --- npm in a bun project -------------------------------------------------
root=$(repo_root)
if gate_on bunOnly && { [ -f bun.lock ] || [ -f bun.lockb ] || [ -f "$root/bun.lock" ] || [ -f "$root/bun.lockb" ]; } &&
  unquoted "$cmd" | grep -qE '(^|[;&|(]|[[:space:]])npm +(install|i|add|ci)([[:space:]]|$)'; then
  block "This project uses bun. Use \`bun install\` / \`bun add\`."
fi

$commit || $push || exit 0

# symbolic-ref names the branch even before a repo's first commit; rev-parse
# covers a detached HEAD, where it prints `HEAD`.
branch=$(git symbolic-ref --quiet --short HEAD 2>/dev/null) ||
  branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

# --- production is human-only ---------------------------------------------
if gate_on prod; then
  prod=$(config_value '.prodBranch'); prod=${prod:-prod}
  [ "$branch" = "$prod" ] && block "You are on '$prod'. Production is human-only — switch to a feature branch."
  # `prod`, `HEAD:prod`, `+prod` or `refs/heads/prod` as a push target, quoted
  # or not (unquoted keeps a quoted single token and drops quoted prose).
  if $push && unquoted "$cmd" | grep -qE "$GIT_RE +push([[:space:]][^;&|]*)?([[:space:]:+]|refs/heads/)$prod([[:space:]]|\$|[;&|])"; then
    block "Cannot push to '$prod'. Production deploys are human-only."
  fi
fi

# --- never pile work onto a merged PR -------------------------------------
if gate_on mergedPr && command -v gh >/dev/null 2>&1 && [ "$branch" != "HEAD" ]; then
  state=$(gh pr view "$branch" --json state --jq .state 2>/dev/null)
  if [ "$state" = "MERGED" ]; then
    block "The PR for '$branch' is already MERGED. Start a new branch off the default branch and open a new PR."
  fi
fi

$commit || exit 0

# What will this commit contain? Normally the index. But this hook runs before
# the command does, so `git add … && git commit` and `git commit -a` have not
# staged anything yet: for those, look at the working tree and untracked files
# as well.
worktree=false
is_git_add "$cmd" && worktree=true
unquoted "$cmd" | grep -qE 'commit([[:space:]][^;&|]*)?[[:space:]](-[a-zA-Z]*a[a-zA-Z]*|--all)([[:space:]]|$)' && worktree=true
diff_base=HEAD
git rev-parse --verify -q HEAD >/dev/null 2>&1 || diff_base=$(git hash-object -t tree /dev/null 2>/dev/null)
commit_diff() {
  git diff --no-color --cached "$@" 2>/dev/null
  $worktree || return 0
  git diff --no-color "$diff_base" "$@" 2>/dev/null
  (cd "$root" 2>/dev/null && git ls-files -z --others --exclude-standard 2>/dev/null | while IFS= read -r -d '' f; do
    if [ "$1" = "--name-only" ]; then printf '%s\n' "$f"; else git diff --no-color --no-index "$@" -- /dev/null "$f" 2>/dev/null; fi
  done)
}

# --- secrets ---------------------------------------------------------------
# The built-in scanner is the default: it was tuned against real commit history.
# Set "secretScanner": "gitleaks" in harness.json to use gitleaks instead.
if gate_on secrets; then
  if [ "$(config_value '.secretScanner')" = "gitleaks" ] && command -v gitleaks >/dev/null 2>&1 && ! $worktree; then
    out=$(gitleaks protect --staged --no-banner --redact 2>&1)
    # Block only when gitleaks reports leaks; any other failure is let through.
    if printf '%s' "$out" | grep -qE 'leaks found: [1-9]'; then
      printf '%s\n' "$out" | tail -20 >&2
      block "gitleaks found secrets in the staged changes. Remove them (or mark a false positive with \`gitleaks:allow\`)."
    fi
  else
    hits=$(commit_diff --unified=0 | bash "$(dirname "$0")/secret-scan.sh")
    if [ $? -eq 1 ]; then
      printf '%s\n' "$hits" >&2
      block "These added lines look like real credentials. Move them to env vars (or mark a false positive with \`gitleaks:allow\`)."
    fi
  fi
fi

# --- typecheck -------------------------------------------------------------
# Blocks only on real compiler errors (`error TS1234`). A crash, an
# out-of-memory kill or a missing toolchain is reported and let through.
if gate_on typecheck && commit_diff --name-only | grep -qE '\.(ts|tsx)$'; then
  cd "$root" || exit 0
  runner=""
  if [ -f package.json ] && jq -e '.scripts.typecheck' package.json >/dev/null 2>&1; then
    if { [ -f bun.lock ] || [ -f bun.lockb ]; } && command -v bun >/dev/null 2>&1; then runner="bun run --silent typecheck"; else runner="npm run --silent typecheck"; fi
  elif [ -f tsconfig.json ] && [ -x node_modules/.bin/tsc ]; then
    runner="node_modules/.bin/tsc --noEmit"
  fi
  if [ -n "$runner" ]; then
    out=$($runner 2>&1); rc=$?
    # Strip colour escapes: `tsc --pretty` puts them between `error` and `TS2322`.
    esc=$(printf '\033')
    out=$(printf '%s' "$out" | sed "s/${esc}\[[0-9;]*[A-Za-z]//g")
    if [ $rc -ne 0 ]; then
      if printf '%s' "$out" | grep -qE 'error TS[0-9]+'; then
        printf '%s\n' "$out" | grep -E 'error TS[0-9]+' | head -30 >&2
        block "TypeScript errors — fix them before committing."
      fi
      echo "⚠️  typecheck could not complete (exit $rc, no compiler errors reported) — not blocking. CI is the evidence." >&2
    fi
  fi
fi
exit 0
