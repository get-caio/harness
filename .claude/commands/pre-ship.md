# /pre-ship — Final Checklist Before Production

**Purpose:** Systematic verification that nothing will get you fired after shipping.

This is the last gate before human deploys to production. Run after all phases complete, after final `/audit`, and after PR is approved.

---

## Usage

```
/pre-ship              # Full checklist
/pre-ship --quick      # Critical items only (hotfix mode)
```

---

## The Checklist

### 0. Infrastructure Verification (Deployer Agent)

**Before anything else**, spawn the `deployer` agent to verify infrastructure configuration. The deployer checks: migrations, env vars, webhook registrations, cron configs, API route GET exports, third-party service connectivity, and build health. This catches the silent failures that missed configs produce.

```
Spawn deployer agent → wait for report → fix any issues before proceeding
```

**BLOCKER:** Any deployer failure blocks ship. Do not duplicate deployer checks below — they are handled.

---

### 1. Security (Career-Ending if Failed)

```bash
# Run full audit
/audit full

# Run red-team (requires running app)
/red-team

# Manual verification
```

| Check                        | Command                                                                             | Pass Criteria    |
| ---------------------------- | ----------------------------------------------------------------------------------- | ---------------- |
| No secrets in code           | `git log -p --all \| grep -iE "(api.?key\|secret\|password).*=.*['\"][a-zA-Z0-9]"`  | Zero matches     |
| No secrets in env committed  | `git ls-files \| grep -E "\.env$" \| xargs cat 2>/dev/null`                         | File not tracked |
| Dependencies clean           | `bun audit`                                                                         | No critical/high |
| Auth on all protected routes | Manual review                                                                       | 100% coverage    |
| Input validation everywhere  | `grep -r "req.body\|request.body" --include="*.ts" \| grep -v "parse\|schema\|zod"` | Zero unvalidated |

**BLOCKER:** Any failure here blocks ship.

---

### 2. Data Protection (Legal Risk)

| Check                     | Verification         | Pass Criteria                |
| ------------------------- | -------------------- | ---------------------------- |
| No PII in logs            | Review logging calls | No names, emails, IPs logged |
| Soft delete for user data | Check Prisma schema  | `deletedAt` field exists     |
| Data export capability    | If GDPR applies      | Export endpoint works        |
| Cookie consent            | If EU users          | Banner implemented           |
| Privacy policy link       | Check footer         | Link present and works       |

**BLOCKER:** If app handles EU users and GDPR compliance missing.

---

### 3. Observability (Debugging Production)

```bash
# Check health endpoint
curl http://localhost:3000/api/health | jq

# Verify logging setup
grep -r "logger\|console.log" --include="*.ts" src/
```

| Check                         | Pass Criteria                |
| ----------------------------- | ---------------------------- |
| Health endpoint exists        | Returns JSON with status     |
| Structured logging configured | Using pino or equivalent     |
| Error boundary on all pages   | Check layout.tsx             |
| Sentry or equivalent          | DSN configured               |
| Request ID tracing            | Middleware adds x-request-id |

**WARNING:** Missing observability = blind debugging in production.

---

### 4. Performance (User Experience)

```bash
# Build and analyze
bun run build
```

| Check                  | Command                | Pass Criteria                 |
| ---------------------- | ---------------------- | ----------------------------- |
| Build succeeds         | `bun run build`        | Exit 0                        |
| No build warnings      | Check output           | Zero warnings                 |
| Bundle size reasonable | Check .next/analyze    | <500KB initial JS             |
| No N+1 queries         | Check Prisma logs      | No repeated queries           |
| Images optimized       | Check next/image usage | All external images use Image |

---

### 5. Testing (Confidence)

```bash
bun test --coverage
```

| Check                 | Pass Criteria                |
| --------------------- | ---------------------------- |
| All tests pass        | Exit 0                       |
| Coverage > 60%        | Check coverage report        |
| E2E tests pass        | `bun run test:e2e`           |
| Critical paths tested | Auth, payment, core features |
| Edge cases covered    | Error states, empty states   |

**BLOCKER:** Coverage < 40% or critical path untested.

---

### 6. Rollback Plan (Disaster Recovery)

| Check                            | Verification                       |
| -------------------------------- | ---------------------------------- |
| Previous deploy tagged           | `git tag -l "prod-*"` shows recent |
| Rollback documented              | Know how to revert on Vercel       |
| Database migration reversible    | Check for down migrations          |
| Feature flags for risky features | Can disable without deploy         |

**Document the rollback procedure:**

```markdown
## Rollback Procedure

1. Go to Vercel Dashboard → Deployments
2. Find previous production deployment
3. Click "..." → "Promote to Production"
4. If database migration:
   - Run: `bunx prisma migrate resolve --rolled-back <migration>`
   - Or restore from backup: [backup location]
```

---

### 7. Environment Configuration

```bash
# Compare env vars
diff <(grep -oE "process\.env\.[A-Z_]+" -r src/ | sort -u) \
     <(cat .env.example | grep -oE "^[A-Z_]+" | sort -u)
```

| Check                    | Pass Criteria              |
| ------------------------ | -------------------------- |
| All env vars documented  | .env.example complete      |
| Production env vars set  | Vercel env configured      |
| No development values    | DATABASE_URL is production |
| Secrets rotated recently | Within 90 days             |

---

### 8. Documentation

| Check                   | Verification                       |
| ----------------------- | ---------------------------------- |
| README updated          | Deployment instructions current    |
| API documented          | If public API, OpenAPI spec exists |
| Changelog updated       | CHANGELOG.md has this release      |
| Known issues documented | If any, listed in release notes    |

---

## Output Report

After running all checks, generate:

```markdown
# Pre-Ship Report: [Project Name]

**Date:** YYYY-MM-DD
**Version:** X.Y.Z
**Reviewer:** [agent/human]

## Summary

| Category        | Status   | Blockers |
| --------------- | -------- | -------- |
| Security        | ✅/❌    | [list]   |
| Data Protection | ✅/❌    | [list]   |
| Observability   | ✅/⚠️/❌ | [list]   |
| Performance     | ✅/⚠️/❌ | [list]   |
| Testing         | ✅/❌    | [list]   |
| Rollback Plan   | ✅/❌    | [list]   |
| Environment     | ✅/❌    | [list]   |
| Documentation   | ✅/⚠️    | [list]   |

## Decision

- [ ] **SHIP** — All green, no blockers
- [ ] **FIX THEN SHIP** — Warnings only, acceptable risk
- [ ] **DO NOT SHIP** — Blockers present, fix required

## Blockers (if any)

1. [Blocker description and remediation]

## Warnings (if any)

1. [Warning and accepted risk rationale]

## Sign-off

- [ ] Agent review complete
- [ ] Human review complete
- [ ] Stakeholder notified
```

---

## Quick Mode (--quick)

For hotfixes only. Runs critical security checks:

1. ✅ No secrets in diff
2. ✅ Tests pass
3. ✅ Build succeeds
4. ✅ Audit clean

**Does NOT check:** Performance, documentation, full observability.

Use with caution. Quick mode is for:

- Security patches
- Critical bug fixes
- Outage recovery

Not for:

- New features
- Major changes
- Anything that can wait
