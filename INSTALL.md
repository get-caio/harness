# CAIO Build Harness — Team Installation Guide

## Overview

The Build Harness is a Claude Code plugin that provides autonomous development capabilities: phased ticket execution, multi-agent coordination, safety gates, and 24 skills for full-stack development.

---

## Quick Install (Per Engineer)

### Option A: Clone the harness repo directly

```bash
# Clone the harness repo
git clone https://github.com/YOUR_ORG/harness.git

# Copy .claude/ into your project
cp -r harness/.claude/ YOUR_PROJECT/.claude/
cp harness/CLAUDE.md YOUR_PROJECT/CLAUDE.md
```

### Option B: Use as a git submodule

```bash
# Add harness as a submodule in your project
cd YOUR_PROJECT
git submodule add https://github.com/YOUR_ORG/harness.git .harness

# Symlink the .claude directory
ln -s .harness/.claude .claude
cp .harness/CLAUDE.md CLAUDE.md
```

### Option C: Private marketplace (recommended for teams)

Add the marketplace to your project's `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": [
    "https://raw.githubusercontent.com/YOUR_ORG/harness/main/marketplace.json"
  ]
}
```

Then each engineer can install via:

```bash
claude /install caio-build-harness
```

---

## Post-Install Setup

### 1. Create the project scaffold

The harness expects these directories to exist:

```bash
mkdir -p specs/phases specs/decisions specs/design/assets
mkdir -p docs/decisions docs/architecture docs/api docs/components docs/guide
mkdir -p progress

# Initialize phase tracking
echo "1" > specs/CURRENT_PHASE

# Initialize progress files
echo "# Build Log" > progress/build-log.md
echo "# Dead Ends" > progress/dead-ends.md
echo "# Conventions" > progress/conventions.md
```

### 2. Add your spec

Place your product specification at `specs/SPEC.md`. This is the master reference document that drives all development.

### 3. Verify the installation

```bash
# Check that commands are available
claude /status

# Should show: Current Phase, ticket counts, etc.
```

---

## Team Configuration

### Per-Engineer Settings

Each engineer should have their Claude Code configured for the project. The `.claude/settings.json` in the repo handles most configuration, but engineers can add personal overrides in `.claude/settings.local.json` (gitignored):

```json
{
  "model": "opus"
}
```

### Environment Variables

These are set automatically by `.claude/settings.json`:

| Variable                          | Value    | Purpose                                   |
| --------------------------------- | -------- | ----------------------------------------- |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | `70`     | Compact context at 70% (extends sessions) |
| `CLAUDE_CODE_SUBAGENT_MODEL`      | `sonnet` | Default subagent model                    |

---

## Updating the Harness

### Option A: Direct copy

```bash
cd harness && git pull
cp -r .claude/ YOUR_PROJECT/.claude/
cp CLAUDE.md YOUR_PROJECT/CLAUDE.md
```

### Option B: Submodule

```bash
cd YOUR_PROJECT
git submodule update --remote .harness
```

### Option C: Marketplace

Updates are automatic when the marketplace repo is updated. Engineers get new versions on next session start.

---

## What's Included

### 24 Skills

Full-stack development knowledge covering: Next.js/Bun/Prisma, React, Auth, tRPC, AI integration, React Native, Payments, Testing, E2E Testing, Security, Code Quality, Code Audit, Red Team, Observability, Incident Response, Data Protection, Design Craft, Context Engineering, Multi-Agent Coordination, Evaluation, VitePress, CI/CD, Git Workflow, Database Migrations.

### 11 Commands

| Command            | Purpose                                |
| ------------------ | -------------------------------------- |
| `/work`            | Execute tickets continuously           |
| `/init-phase N`    | Generate tickets for phase N           |
| `/plan-phases`     | Analyze spec, propose phases           |
| `/check-decisions` | Find spec ambiguities blocking a phase |
| `/status`          | Report current state                   |
| `/decision`        | Create a decision document             |
| `/audit`           | Security and code quality audit        |
| `/red-team`        | Adversarial security testing           |
| `/pre-ship`        | Final production checklist             |
| `/design-review`   | Visual polish audit                    |
| `/clarify`         | Clarify requirements                   |

### 8 Agents

| Agent         | Model  | Purpose                                |
| ------------- | ------ | -------------------------------------- |
| `feature`     | sonnet | Large feature implementation           |
| `implementer` | sonnet | Medium ticket implementation           |
| `architect`   | opus   | System design decisions                |
| `reviewer`    | opus   | Code review                            |
| `tester`      | sonnet | Test writing and coverage              |
| `interviewer` | opus   | Requirements refinement                |
| `coordinator` | opus   | Parallel agent orchestration           |
| `doc-writer`  | haiku  | Documentation updates (cheap and fast) |

### Safety Hooks

- Pre-commit: secrets detection, type checking, test running
- Pre-push: lint and build verification
- Protected files: `.env`, `.git/`, lockfiles blocked from agent edits
- Production guard: blocks pushes/merges to prod branch
- Security audit: auto-runs on dependency installs

---

## Workflow Summary

```
1. Human provides specs/SPEC.md
2. /plan-phases → propose phase breakdown
3. /init-phase 1 → generate tickets
4. /check-decisions → find ambiguities
5. Human resolves PENDING decisions
6. /work → agent executes tickets continuously
7. /audit → catch issues after phases
8. /pre-ship → final checklist before production
```
