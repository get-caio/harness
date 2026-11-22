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
# Matched on unquoted text: a commit message or PR body that mentions
# `npm install` is prose, not a command.
# The lockfile is looked for in the directory the command runs in and at the
# repo root: `cd src && npm ci` is still an npm install in a bun project.
bun_root=$(repo_root)
if gate_on bunOnly && { [ -f bun.lock ] || [ -f bun.lockb ] || [ -f "$bun_root/bun.lock" ] || [ -f "$bun_root/bun.lockb" ]; } &&
  unquoted "$cmd" | grep -qE '(^|[;&|(]|[[:space:]])npm +(install|i|add|ci)([[:space:]]|$)'; then
  block "This project uses bun. Use \`bun install\` / \`bun add\`."
fi

$commit || $push || exit 0
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

# --- production is human-only ---------------------------------------------
if gate_on prod; then
  prod=$(config_value '.prodBranch'); prod=${prod:-prod}
  [ "$branch" = "$prod" ] && block "You are on '$prod'. Production is human-only — switch to a feature branch."
  # Matches `prod`, `HEAD:prod`, `+prod` and `refs/heads/prod` as a push target,
  # quoted or not (`git push origin "HEAD:prod"` is the same push). GIT_RE
  # (lib.sh) skips git's global options between `git` and `push`.
  if $push && push_args "$cmd" | grep -qE "$GIT_RE +push([[:space:]][^;&|]*)?([[:space:]:+]|refs/heads/)$prod([[:space:]]|\$|[;&|])"; then
    block "Cannot push to '$prod'. Production deploys are human-only."
  fi
  # A bulk push sends '$prod' without naming it. --all / --branches push every
  # local branch, so they are blocked while a local '$prod' exists. --mirror
  # also deletes remote refs that have no local counterpart, so it is blocked
  # outright.
  if $push; then
    bulk=$(push_bulk_mode "$cmd")
    if [ "$bulk" = "mirror" ]; then
      block "\`git push --mirror\` rewrites every remote ref, '$prod' included. Push the branch by name."
    elif [ "$bulk" = "all" ] && git show-ref --verify --quiet "refs/heads/$prod"; then
      block "\`git push --all\` would push the local '$prod' branch. Push the branch by name."
    fi
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

# `git commit -a`, `--only` / `--include` and `git commit <pathspec>` commit
# working-tree content that is not in the index yet, so those forms are checked
# against HEAD as well as the index. The flag can sit anywhere in the arguments
# (`commit -m msg -a`). The index is always included: the worktree test also
# fires on an unquoted message word, and that commit still takes the index.
worktree=false
commit_reads_worktree "$cmd" && worktree=true
# This hook runs before any part of the command does. In
# `git add key.ts && git commit -m x` the index is still empty here, so a
# staging command in the same call widens the scan to the working tree and to
# untracked files, which is where the content to be committed still sits.
# `git add -f` can stage an ignored file, which the untracked listing leaves
# out, so that one form has to be split across two calls.
untracked=false
if stages_in_call "$cmd"; then
  worktree=true; untracked=true
  force_adds_in_call "$cmd" &&
    block "\`git add -f\` and \`git commit\` in one command: the force-added files cannot be scanned before they are staged. Stage first, then commit in a separate command."
fi
# Untracked, non-ignored files of the whole repo, NUL-separated, repo-relative.
untracked_files() { (cd "$(repo_root)" 2>/dev/null && git ls-files -z --others --exclude-standard 2>/dev/null); }
commit_diff() {
  git diff --cached "$@" 2>/dev/null
  if $worktree; then git diff HEAD "$@" 2>/dev/null; fi
  if $untracked; then
    if [ "$1" = "--name-only" ]; then
      untracked_files | tr '\0' '\n'
    else
      (cd "$(repo_root)" 2>/dev/null && untracked_files | while IFS= read -r -d '' f; do
        git diff --no-index "$@" -- /dev/null "$f" 2>/dev/null
      done)
    fi
  fi
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
  root=$(repo_root); cd "$root" || exit 0
  runner=""
  if [ -f package.json ] && jq -e '.scripts.typecheck' package.json >/dev/null 2>&1; then
    if { [ -f bun.lock ] || [ -f bun.lockb ]; } && command -v bun >/dev/null 2>&1; then runner="bun run --silent typecheck"; else runner="npm run --silent typecheck"; fi
  elif [ -f tsconfig.json ] && [ -x node_modules/.bin/tsc ]; then
    runner="node_modules/.bin/tsc --noEmit"
  fi
  if [ -n "$runner" ]; then
    out=$($runner 2>&1); rc=$?
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
