#!/usr/bin/env bash
# Stop: list decisions still waiting on a human.
. "$(dirname "$0")/lib.sh"
require_opt_in
root=$(repo_root)
gate_on sounds && command -v afplay >/dev/null 2>&1 && (afplay -v 0.5 /System/Library/Sounds/Glass.aiff >/dev/null 2>&1 &)
files=$(grep -rl 'Status.*PENDING' "$root/specs/decisions" "$root/docs/decisions" 2>/dev/null)
[ -z "$files" ] && exit 0
echo "⏳ PENDING decisions need human input:"
printf '%s\n' "$files" | while read -r f; do echo "  - $(head -1 "$f" | sed 's/^# //') (${f#$root/})"; done
exit 0
