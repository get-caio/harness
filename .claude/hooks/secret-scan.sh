#!/usr/bin/env bash
# Reads a unified diff on stdin; prints added lines that look like real
# credentials. Exit 0 = clean, 1 = findings. Matches literal high-entropy
# values and well-known key formats only — never a bare `token:` or
# `password =` (the old pattern, which fired on ordinary code).
# Test, fixture, mock and seed files are skipped (fake values live there), as is
# any line marked `gitleaks:allow`.
added=$(awk '
  /^\+\+\+ / { skip = ($0 ~ /(\.(test|spec)\.|__tests__|__mocks__|\/tests?\/|\/e2e\/|fixtures?|mocks?\/|seed|\.example|\.md$|\.lock$|\.snap$)/); next }
  /^\+/ && !skip { print }
' | grep -vE '^\+\s*(//|#|\*)' | grep -v 'gitleaks:allow' || true)
[ -z "$added" ] && exit 0

known='(sk_live_[A-Za-z0-9]{20,}|rk_live_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{24,}|sk-ant-[A-Za-z0-9_-]{24,}|sk-proj-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,}|AIza[0-9A-Za-z_-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'
assigned='(api[_-]?key|secret|token|passwd|password|credential|private[_-]?key)["'"'"']?[[:space:]]*[:=][[:space:]]*["'"'"'][A-Za-z0-9_/+=.-]{24,}["'"'"']'
dburl='(postgres(ql)?|mysql|mongodb(\+srv)?|redis)://[^:/@[:space:]$<{]+:[^@[:space:]$<{]{8,}@'
placeholder='(example|placeholder|changeme|your[_-]|xxxx|<[a-z_-]+>|\$\{|process\.env|test[_-]?(key|secret|token)|dummy|fake|sample|localhost|127\.0\.0\.1|user:pass|["'"'"'][a-z]+(-[a-z]+){2,}["'"'"'])'

hits=$(printf '%s\n' "$added" | grep -iE "$known|$assigned|$dburl" | grep -ivE "$placeholder" || true)
[ -z "$hits" ] && exit 0
printf '%s\n' "$hits" | cut -c1-160 | head -10
exit 1
