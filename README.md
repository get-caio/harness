# CAIO Build Harness

A structured harness for autonomous AI development of CAIO incubator projects.

**Daily driver:** Cursor + Grok (conductor). **Specialists:** Claude Opus / Fable and OpenAI Sol via pinned subagents. **Compat:** Claude Code still works through a thin `CLAUDE.md`.

## Overview

- **Phased development** — Large specs split into manageable phases
- **Decision gates** — Spec ambiguities resolved before building
- **Continuous execution** — Work through tickets until blocked or complete
- **Quality guardrails** — TDD, security checks, complexity limits
- **Multi-model routing** — Cheap parent (Grok); expensive models only on specialists

## Quick Start (Cursor — preferred)

### Prerequisites

1. GitHub repo already exists
2. Cursor with Agent mode
3. Spec document ready (`SPEC.md`)

### Initial Setup

```bash
# 1. Copy harness surfaces into your project
cp -r harness/.claude your-project/
cp -r harness/.cursor your-project/
cp -r harness/specs your-project/
cp -r harness/docs your-project/
cp -r harness/progress your-project/
cp harness/HARNESS.md your-project/
cp harness/AGENTS.md your-project/
cp harness/CLAUDE.md your-project/
cp harness/.mcp.json your-project/
cp harness/.gitignore your-project/

# 2. Add your spec + fill the product map
cp your-spec.md your-project/specs/SPEC.md
# Edit your-project/AGENTS.md with stack/paths

# 3. Open in Cursor, set parent model to Grok 4.5
cd your-project
# Agent: /status → /check-decisions → /work
```

### Claude Code (compat)

```bash
# Same copy as above (includes .claude/ + thin CLAUDE.md → HARNESS.md)
cd your-project && claude
```

### Development Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. /plan-phases                                            │
│     Analyze SPEC.md → Propose phase breakdown               │
│                         ↓                                    │
│  2. Human approves phases                                   │
│                         ↓                                    │
│  3. /init-phase 1                                           │
│     Generate tickets for Phase 1                            │
│                         ↓                                    │
│  4. /check-decisions                                        │
│     Identify spec ambiguities → Create PENDING decisions    │
│                         ↓                                    │
│  5. Human resolves decisions                                │
│     PENDING → DECIDED                                        │
│                         ↓                                    │
│  6. /work                                                   │
│     Execute tickets continuously until phase complete        │
│                         ↓                                    │
│  7. /init-phase 2                                           │
│     Repeat for next phase                                   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
project/
├── HARNESS.md              # Model-agnostic OS (phases, tickets, gates)
├── AGENTS.md               # Product map (stack, APIs — fill per repo)
├── CLAUDE.md               # Thin pointer → HARNESS.md (Claude Code compat)
├── .cursor/
│   ├── rules/harness.mdc   # Always-on ticket loop + model routing
│   ├── agents/             # Model-pinned specialists (Cursor wins on clash)
│   ├── skills/workflow/    # Slash-only: /work /status /check-decisions …
│   ├── hooks.json          # Prod-push block, .env protect, stop-continue
│   └── environment.json    # Cloud Agent install
├── .claude/
│   ├── commands/           # Claude Code slash commands (canon)
│   ├── agents/             # Claude Code agents (opus/sonnet/haiku aliases)
│   ├── skills/             # Domain skills (shared with Cursor — do not copy)
│   ├── workflows/          # Deterministic multi-agent scripts
│   └── settings.json       # Claude Code permissions & hooks
├── specs/                  # SPEC, phases, decisions, design
├── docs/                   # VitePress living docs
├── progress/               # build-log, conventions, dead-ends
└── .mcp.json
```

See [docs/guide/cursor-harness.md](docs/guide/cursor-harness.md) for the Cursor daily-driver playbook (morning → `/work` → PR gates → Cloud overnight). Skill diet (allowlist vs do-not-auto-load) lives in `HARNESS.md` → Available Skills.

## Model routing

| Role                                                                | Model                        |
| ------------------------------------------------------------------- | ---------------------------- |
| Parent (daily driver)                                               | Grok 4.5                     |
| implementer / feature / tester / deployer / refactorer / doc-writer | `inherit`                    |
| architect / interviewer / coordinator / auditor / product-critic    | Claude Opus (Fable optional) |
| reviewer / verifier                                                 | OpenAI Sol                   |

Never pin Opus/Fable/Sol as the parent default — see `HARNESS.md`.

## Commands

Cursor slash skills (`.cursor/skills/workflow/`) and Claude Code commands (`.claude/commands/`):

| Command            | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `/plan-phases`     | Analyze spec and propose phase breakdown |
| `/init-phase N`    | Generate tickets for phase N             |
| `/check-decisions` | Find spec ambiguities for current phase  |
| `/work`            | Execute tickets continuously             |
| `/status`          | Report current progress                  |
| `/pre-ship`        | Final production checklist               |
| `/decision`        | Create a decision document               |
| `/clarify`         | Ask clarifying questions                 |

## Decision Types

### Spec Decisions (`specs/decisions/`)

Product/business clarifications:

- Which auth provider?
- What are the pricing tiers?
- Is feature X in V1 or V2?

Created when SPEC.md is ambiguous. Human must resolve before work proceeds.

### Architecture Decisions (`docs/decisions/`)

Technical implementation choices:

- Caching strategy?
- Database schema design?
- API structure?

Created during implementation when multiple valid approaches exist.

## Ticket Statuses

| Status        | Meaning                |
| ------------- | ---------------------- |
| `TODO`        | Ready to work          |
| `IN_PROGRESS` | Currently implementing |
| `BLOCKED`     | Waiting on decision    |
| `DONE`        | Complete and committed |
| `SKIPPED`     | Explicitly skipped     |

## Skills Included

| Skill               | Coverage                                             |
| ------------------- | ---------------------------------------------------- |
| `nextjs-bun-prisma` | Project structure, server actions, database          |
| `auth`              | Authentication, OAuth, sessions                      |
| `trpc`              | Type-safe API, routers, client                       |
| `ai-integration`    | Claude API, prompts, tool use                        |
| `react-native`      | Expo, offline, notifications                         |
| `payments`          | Stripe, subscriptions, webhooks                      |
| `testing`           | Vitest, unit tests, component tests, MSW             |
| `e2e-testing`       | Playwright, visual regression, accessibility         |
| `security`          | Validation, auth checks, secrets                     |
| `code-quality`      | Complexity limits, refactoring                       |
| `code-audit`        | Security scanning, dependency audit, codebase health |

## Safety Guardrails

### Pre-commit Hooks

- Secret detection (blocks hardcoded credentials)
- Security-sensitive file warnings

### Post-commit Hooks

- Type checking
- Test execution
- Security audit on dependency install

### Blocked Actions

- Push to prod branch
- Merge to prod
- Destructive database operations (prompt confirmation)

## Human Checkpoints

| Action                  | Approval     |
| ----------------------- | ------------ |
| Approve phase breakdown | Human        |
| Resolve spec decisions  | Human        |
| Merge to main           | Human        |
| Deploy to production    | Human only   |
| Payment/auth changes    | Human review |
| Schema migrations       | Human review |

## License

Internal CAIO use only.
