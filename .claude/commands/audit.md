---
name: audit
description: Run security and code quality audit. Use after completing phases, before shipping, or on new codebases.
---

# /audit Command

Run a codebase security and quality audit using the `code-audit` skill.

## Usage

```
/audit              # Quick scan (5-10 min)
/audit full         # Full audit (30-60 min)
/audit cold         # Cold assessment for new codebase (60-90 min)
```

## Execution

### 1. Read the Skill

```
Read .claude/skills/code-audit/SKILL.md
```

### 2. Determine Mode

| Argument | Mode | When to Use |
|----------|------|-------------|
| (none) | Quick | After completing a phase |
| `full` | Full | Before shipping, pre-PR |
| `cold` | Cold | First look at new/acquired codebase |

### 3. Execute Phases

**Quick Scan:** Phases 1, 2, 3 (partial)
**Full Audit:** Phases 1-6
**Cold Assessment:** Phases 1-6 + architecture mapping

### 4. Run the Commands

Execute the bash commands from each phase in the skill file. Collect output.

### 5. Generate Report

**Quick Scan Output:**
```markdown
# Quick Audit: [Project Name]
Date: [timestamp]
Mode: Quick Scan

## Status: [PASS / FAIL]

### Blockers (must fix)
- [list or "None"]

### Warnings (should fix)
- [list or "None"]
```

**Full Audit Output:**
```markdown
# Full Audit Report: [Project Name]
Date: [timestamp]

## Executive Summary
- Overall Health: [1-10]
- Security Posture: [Strong/Adequate/Weak/Critical]
- Code Quality: [High/Medium/Low]
- Recommendation: [Ship/Fix then ship/Major rework needed]

## Critical Issues
[table of issues]

## High Priority Issues
[table of issues]

## Metrics Summary
[metrics table]
```

### 6. Save Report

Save report to `progress/audit-[date].md`

### 7. Decision Gate

| Result | Action |
|--------|--------|
| Critical issues found | Block. Do not proceed. |
| High issues found | Flag for human review before proceeding. |
| Medium/Low only | Log and continue. |

## Integration with Phases

This command is automatically suggested:
- After `/init-phase` completes all tickets
- Before creating a PR for human review
- When running `/work` and completing final ticket in a phase

## Example Output

```
🔍 Running quick audit...

Phase 1: Recon
✓ Stack: Next.js + Prisma + Bun
✓ Size: 45 files, 3,200 LOC
✓ Contributors: 2 (adam 78%, brad 22%)

Phase 2: Dependencies
✓ Vulnerabilities: 0 critical, 0 high, 3 moderate
⚠️ Outdated: 5 packages behind latest

Phase 3: Security (partial)
✓ No secrets in git history
✓ No hardcoded secrets found
⚠️ any count: 12

## Status: PASS (with warnings)

### Warnings
- 5 outdated packages (run `npm update`)
- 12 `any` types (consider tightening)

Report saved to progress/audit-2025-01-09.md
```
