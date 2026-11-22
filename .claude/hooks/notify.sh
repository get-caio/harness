#!/usr/bin/env bash
# Notification (permission prompt): audible cue, macOS only.
. "$(dirname "$0")/lib.sh"
require_opt_in
gate_on sounds && command -v afplay >/dev/null 2>&1 && (afplay -v 0.5 /System/Library/Sounds/Funk.aiff >/dev/null 2>&1 &)
exit 0
