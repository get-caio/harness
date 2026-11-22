---
name: red-team
description: Run adversarial security testing against the running application
---

# /red-team Command

Run adversarial security testing using the `red-team` skill. Requires the application to be running locally.

## Usage

```
/red-team              # Full scan (~60-90 min)
/red-team auth         # Auth-focused only (~20-30 min)
/red-team api          # API security only (~15-20 min)
/red-team business     # Business logic only (~15-20 min)
```

## Prerequisites

```bash
# Application must be running
bun dev  # or npm run dev

# Confirm it's accessible
curl http://localhost:3000/api/health
```

## Execution

### 1. Read the Skill

```
Read .claude/skills/red-team/SKILL.md
```

### 2. Set Target URL

```bash
export TARGET_URL="http://localhost:3000"
```

### 3. Determine Scope

| Argument   | Phases to Run    |
| ---------- | ---------------- |
| (none)     | All phases (1-6) |
| `auth`     | Phase 1-2 only   |
| `api`      | Phase 5 only     |
| `business` | Phase 6 only     |

### 4. Execute Phases

Run the curl commands and test scripts from each phase in the skill file.

**Key phases:**

- Phase 1: Reconnaissance (map attack surface)
- Phase 2: Authentication Testing
- Phase 3: Authorization/IDOR Testing
- Phase 4: Injection Testing
- Phase 5: API Security Testing
- Phase 6: Business Logic Testing

### 5. Generate Report

Save report to `progress/red-team-[date].md` using the template from Phase 7.

### 6. Decision Gate

| Result               | Action                            |
| -------------------- | --------------------------------- |
| Any critical finding | **BLOCK.** Fix before proceeding. |
| High findings        | Flag for human review.            |
| Medium/Low only      | Log and continue, add to backlog. |

## When to Run

| Phase            | Red Team Requirement                          |
| ---------------- | --------------------------------------------- |
| Phase 1 complete | Run `/red-team auth` — validate auth controls |
| Phase 2 complete | Run `/red-team` — full scan of core features  |
| Before PR        | Run `/red-team` — comprehensive pre-merge     |
| Security PR      | Run `/red-team auth api` — targeted testing   |

## Comparison with /audit

| /audit               | /red-team             |
| -------------------- | --------------------- |
| Static analysis      | Dynamic testing       |
| App not running      | App must be running   |
| Pattern detection    | Exploit validation    |
| Faster               | Slower                |
| More false positives | Fewer false positives |

**Use both.** `/audit` catches code-level issues fast. `/red-team` validates they're actually exploitable.

## Example Output

```
Running red-team assessment...

Phase 1: Reconnaissance
  API Endpoints: 24 found
  Auth: BetterAuth + JWT
  Forms: 8, File uploads: 2

Phase 2: Authentication
  [PASS] Protected routes return 401 without auth
  [PASS] Malformed tokens rejected
  [WARN] No rate limiting on /api/auth/login

Phase 3: Authorization
  [PASS] IDOR tests passed
  [PASS] Role escalation blocked

Phase 4: Injection
  [PASS] SQLi payloads rejected
  [PASS] XSS payloads escaped

Phase 5: API Security
  [FAIL] Rate limiting not enforced
  [PASS] CORS properly configured
  [WARN] Missing X-Content-Type-Options header

Phase 6: Business Logic
  [PASS] Negative quantities rejected
  [N/A] No payment flows to test

## Summary: 1 FAIL, 2 WARN

### Critical Issues
1. No rate limiting on login endpoint — brute force possible

Report saved to progress/red-team-2025-01-15.md
```
