# Upstream

This skill is vendored verbatim from Cloudflare's `security-audit-skill`.

| Field          | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Source         | https://github.com/cloudflare/security-audit-skill     |
| Path upstream  | `skills/security-audit/`                               |
| Commit         | `c1c8a8c1471069fb0e188eeaff69b8e8db6564a8` (2026-09-14) |
| Vendored       | 2026-10-21                                             |
| License        | MIT — see `LICENSE` in this directory                  |

Do not edit the upstream files in place. To update, re-copy `skills/security-audit/`
from a newer upstream commit and bump the row above, so the diff stays a clean resync.

Notes for this repo:

- The upstream text invokes the validators with `node`; `bun validate-findings.cjs ...`
  runs the same files. The root `bun test` does not discover the two `.test.cjs` files
  (bun skips dot-directories). To run them:
  `node --test .claude/skills/security-audit/*.test.cjs` from the repo root, or
  `bun test ./validate-findings.test.cjs ./validate-coverage-ledger.test.cjs` from
  inside this directory.
- Routing: `code-audit` is the quick phase-gate scan; `security-audit` is the deep,
  multi-agent vulnerability hunt with structured findings. `red-team` is live
  exploitation against a running instance.
