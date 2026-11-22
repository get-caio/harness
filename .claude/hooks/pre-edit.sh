#!/usr/bin/env bash
# PreToolUse (Write|Edit): keep agents out of env files, git internals, lockfiles.
. "$(dirname "$0")/lib.sh"
require_opt_in
gate_on protectedFiles || exit 0
file=$(hook_field '.tool_input.file_path // .tool_input.path')
[ -z "$file" ] && exit 0
base=$(basename "$file")
case "$base" in
  .env.example|.env.sample|.env.template) exit 0 ;;
  .env|.env.*|package-lock.json|bun.lockb|bun.lock) block "$file is protected. Env files are human-only; lockfiles change through the package manager." ;;
esac
case "$file" in
  */.git/*) block "$file is inside .git/." ;;
esac
exit 0
