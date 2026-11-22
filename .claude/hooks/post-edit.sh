#!/usr/bin/env bash
# PostToolUse (Write|Edit): format the file, then run its sibling unit test.
# A failing test exits 2 so the failure reaches the model. No nag when a file
# has no test — the Testing Policy decides which test a change needs.
. "$(dirname "$0")/lib.sh"
require_opt_in
file=$(hook_field '.tool_input.file_path // .tool_input.path')
[ -n "$file" ] && [ -f "$file" ] || exit 0
root=$(repo_root) || exit 0

if gate_on format; then
  if printf '%s' "$file" | grep -qE '\.(ts|tsx|js|jsx|json|md)$' && [ -x "$root/node_modules/.bin/prettier" ]; then
    "$root/node_modules/.bin/prettier" --write "$file" >/dev/null 2>&1 || true
  fi
  if printf '%s' "$file" | grep -qE '\.(ts|tsx|js|jsx)$' && [ -x "$root/node_modules/.bin/eslint" ]; then
    "$root/node_modules/.bin/eslint" --fix "$file" >/dev/null 2>&1 || true
  fi
fi

gate_on testOnEdit || exit 0
command -v bun >/dev/null 2>&1 || exit 0
printf '%s' "$file" | grep -qE '\.(ts|tsx|js|jsx)$' || exit 0
# Matched against the file name alone: a directory called `setup-projects` or
# `config/` above the file must not switch the test run off for everything in it.
dir=$(dirname "$file"); base=$(basename "$file"); ext="${base##*.}"; name="${base%.*}"
printf '%s' "$base" | grep -qE '(\.spec\.|\.d\.ts$|config|setup)' && exit 0

if printf '%s' "$base" | grep -qE '\.test\.'; then
  test_file="$file"
else
  test_file=""
  for candidate in "$dir/$name.test.$ext" "$dir/__tests__/$name.test.$ext" "$dir/$name.test.ts" "$dir/__tests__/$name.test.ts"; do
    [ -f "$candidate" ] && { test_file="$candidate"; break; }
  done
fi
[ -n "$test_file" ] || exit 0
case "$test_file" in /*|./*) ;; *) test_file="./$test_file" ;; esac

out=$(bun test "$test_file" 2>&1); rc=$?
if [ $rc -ne 0 ] && printf '%s' "$out" | grep -qE '(^|[[:space:]])[1-9][0-9]* fail|\(fail\)'; then
  { echo "❌ Test failed after this edit: $test_file"; printf '%s\n' "$out" | tail -30; } >&2
  exit 2
fi
exit 0
