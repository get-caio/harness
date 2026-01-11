# CAIO Build Harness

A structured harness for autonomous AI development of CAIO incubator projects.

## Overview

This harness enables Claude Code to work autonomously on a project by providing:

- **Phased development** — Large specs split into manageable phases
- **Decision gates** — Spec ambiguities resolved before building
- **Continuous execution** — Work through tickets until blocked or complete
- **Quality guardrails** — TDD, security checks, complexity limits

## Quick Start

### Prerequisites

1. GitHub repo already exists
2. Claude Code installed and configured
3. Spec document ready (`SPEC.md`)

### Initial Setup

```bash
# 1. Copy harness to your project
cp -r caio-build-harness/.claude your-project/
cp -r caio-build-harness/specs your-project/
cp -r caio-build-harness/docs your-project/
cp -r caio-build-harness/progress your-project/
cp caio-build-harness/CLAUDE.md your-project/
cp caio-build-harness/.mcp.json your-project/
cp caio-build-harness/.gitignore your-project/

# 2. Add your spec
cp your-spec.md your-project/specs/SPEC.md

# 3. Open in Claude Code
cd your-project
claude
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
├── .claude/
│   ├── commands/           # Slash commands
│   │   ├── plan-phases.md  # Analyze spec, propose phases
│   │   ├── init-phase.md   # Generate phase tickets
│   │   ├── check-decisions.md # Find spec ambiguities
│   │   ├── work.md         # Execute tickets
│   │   ├── status.md       # Report progress
│   │   ├── decision.md     # Create decision doc
│   │   └── clarify.md      # Ask clarifying questions
│   ├── agents/             # Subagent definitions
│   │   ├── architect.md
│   │   ├── feature.md
│   │   ├── implementer.md
│   │   ├── reviewer.md
│   │   ├── tester.md
│   │   └── interviewer.md
│   ├── skills/             # Domain knowledge
│   │   ├── nextjs-bun-prisma/
│   │   ├── auth/
│   │   ├── trpc/
│   │   ├── ai-integration/
│   │   ├── react-native/
│   │   ├── payments/
│   │   ├── testing/
│   │   ├── security/
│   │   └── code-quality/
│   └── settings.json       # Permissions & hooks
├── specs/
│   ├── SPEC.md             # Master spec (from human)
│   ├── CURRENT_PHASE       # Current phase number
│   ├── design/             # Design system & assets
│   │   ├── DESIGN.md       # Colors, typography, components
│   │   ├── FIGMA.md        # Figma links, export notes
│   │   └── assets/         # Logo, icons, brand files
│   ├── phases/             # Phase ticket files
│   └── decisions/          # Spec clarifications
├── docs/
│   └── decisions/          # Architecture decisions
├── progress/
│   └── build-log.md        # Session activity log
├── CLAUDE.md               # Agent instructions
└── .mcp.json               # MCP server config
```

## Commands

| Command | Purpose |
|---------|---------|
| `/plan-phases` | Analyze spec and propose phase breakdown |
| `/init-phase N` | Generate tickets for phase N |
| `/check-decisions` | Find spec ambiguities for current phase |
| `/work` | Execute tickets continuously |
| `/status` | Report current progress |
| `/decision` | Create a decision document |
| `/clarify` | Ask clarifying questions |

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

| Status | Meaning |
|--------|---------|
| `TODO` | Ready to work |
| `IN_PROGRESS` | Currently implementing |
| `BLOCKED` | Waiting on decision |
| `DONE` | Complete and committed |
| `SKIPPED` | Explicitly skipped |

## Skills Included

| Skill | Coverage |
|-------|----------|
| `nextjs-bun-prisma` | Project structure, server actions, database |
| `auth` | Authentication, OAuth, sessions |
| `trpc` | Type-safe API, routers, client |
| `ai-integration` | Claude API, prompts, tool use |
| `react-native` | Expo, offline, notifications |
| `payments` | Stripe, subscriptions, webhooks |
| `testing` | Vitest, unit tests, component tests, MSW |
| `e2e-testing` | Playwright, visual regression, accessibility |
| `security` | Validation, auth checks, secrets |
| `code-quality` | Complexity limits, refactoring |
| `code-audit` | Security scanning, dependency audit, codebase health |

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

| Action | Approval |
|--------|----------|
| Approve phase breakdown | Human |
| Resolve spec decisions | Human |
| Merge to main | Human |
| Deploy to production | Human only |
| Payment/auth changes | Human review |
| Schema migrations | Human review |

## License

Internal CAIO use only.
