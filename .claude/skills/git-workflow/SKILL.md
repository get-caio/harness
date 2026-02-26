# Git Workflow Skill — Multi-Engineer Branch Strategy

## When to Use

Reference this skill when:

- Setting up git workflow for a team of 2+ engineers
- Creating branches for features, fixes, or releases
- Resolving merge conflicts
- Managing PRs and code review flow
- Coordinating parallel work across engineers

## Branch Strategy

### Branch Types

```
main          — Stable, deployable, all tests pass
prod          — Production (human-only deploys)
feature/*     — Feature branches (from main)
fix/*         — Bug fix branches (from main)
phase-N/*     — Phase work branches (optional grouping)
```

### Naming Convention

```
feature/P1-T001-user-auth
feature/P2-T008-training-plan-form
fix/P1-T003-login-redirect
phase-1/foundation
```

### Flow

```
main ──────────────────────────────────────────── main
  │                                                 ▲
  ├── feature/P1-T001-auth ──── PR ─── review ────┤
  │                                                 │
  ├── feature/P1-T002-schema ── PR ─── review ────┤
  │                                                 │
  └── feature/P1-T003-ui ───── PR ─── review ─────┘
```

## Multi-Engineer Coordination

### File Ownership

When multiple engineers work in parallel, avoid conflicts by owning distinct areas:

```
Engineer A: src/components/auth/*, src/lib/auth.ts, src/actions/auth.ts
Engineer B: src/components/dashboard/*, src/lib/dashboard.ts
Engineer C: prisma/schema.prisma, src/lib/db.ts, migrations/
Engineer D: tests/e2e/*, src/components/ui/*
```

### Shared Files Protocol

For files everyone touches (package.json, config files, schema.prisma):

1. **Communicate** before modifying shared files
2. **Rebase frequently** — `git pull --rebase origin main`
3. **Keep changes small** — one concern per commit in shared files
4. **Schema changes** — one engineer owns schema per phase

### Daily Workflow

```bash
# Start of day: sync with main
git checkout main
git pull origin main
git checkout feature/my-branch
git rebase main

# Work on feature
# ... implement, test, commit ...

# Before PR: rebase again
git fetch origin
git rebase origin/main

# Create PR
gh pr create --title "[P1-T001] Add user auth" --base main
```

## PR Conventions

### PR Title Format

```
[PN-TXXX] Brief description

Examples:
[P1-T001] Add user authentication with BetterAuth
[P2-T008] Implement training plan creation form
[P1-T003] Fix login redirect after OAuth callback
```

### PR Description Template

```markdown
## Summary

- What this PR does (1-3 bullet points)

## Ticket

[P1-T001] — Link to ticket in phase file

## Changes

- List of key changes

## Test Plan

- [ ] Unit tests added/updated
- [ ] E2E tests if applicable
- [ ] Manual testing steps

## Screenshots

(if UI changes)
```

### PR Size Guidelines

| Size   | Files | Lines   | Review Time       |
| ------ | ----- | ------- | ----------------- |
| Small  | 1-5   | < 200   | < 30 min          |
| Medium | 5-15  | 200-500 | 30-60 min         |
| Large  | 15+   | 500+    | Split if possible |

**Rule: If a PR exceeds 500 lines, consider splitting it.**

## Merge Conflict Resolution

### Prevention

1. **Small, frequent PRs** — easier to merge
2. **Rebase daily** — stay close to main
3. **Own distinct files** — avoid overlapping work
4. **Communicate** — Slack/standup when touching shared code

### Resolution Process

```bash
# When conflicts arise during rebase
git rebase main
# CONFLICT in src/lib/db.ts

# 1. Check what both sides changed
git diff --merge

# 2. Resolve conflicts
# - Keep both changes if they're additive
# - If conflicting logic, discuss with the other engineer
# - Test after resolving

# 3. Continue rebase
git add src/lib/db.ts
git rebase --continue

# 4. Verify
bun test
bun typecheck
```

### Common Conflict Patterns

| Pattern                     | Resolution                          |
| --------------------------- | ----------------------------------- |
| Both added imports          | Keep both, alphabetize              |
| Both modified same function | Discuss, merge logic manually       |
| Schema conflicts            | One engineer owns schema per sprint |
| Package.json conflicts      | `bun install` after manual merge    |
| Config file conflicts       | Take latest, verify settings        |

## Code Review Flow

```
1. Engineer creates PR with [PN-TXXX] prefix
2. Agent reviewer runs automatically (via /review-pr)
3. Agent posts review comments
4. Human reviewer reviews (focuses on architecture, not lint)
5. Engineer addresses feedback
6. Human approves
7. Engineer merges to main (squash merge preferred)
```

### Review Assignments

```
For a team of 4:
- Each PR needs 1 human reviewer
- Rotate reviewers to spread knowledge
- Security-sensitive PRs need 2 reviewers
- Schema migration PRs need team lead review
```

## Git Hooks (Local)

These are configured in `.claude/settings.json` but also set up locally:

```bash
# Pre-commit: lint staged files
bunx lint-staged

# Pre-push: run tests and build
bun test && bun build
```

## Release Process

```
1. All phase tickets DONE
2. Run /audit — fix any issues
3. Create release branch: release/v1.0.0
4. Run /pre-ship checklist
5. Human reviews and merges to prod
6. Tag: git tag v1.0.0
7. Deploy (human-triggered)
```

## Key Principles

1. **main is always deployable** — never merge broken code
2. **Small PRs** — easier to review, less conflict risk
3. **Squash merge** — clean history on main
4. **Rebase, don't merge** — linear history on feature branches
5. **Own your area** — reduce conflicts by owning distinct files
6. **Communicate** — talk before touching shared code
