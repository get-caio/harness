# Specs Directory

This directory contains the product specification and derived work items.

## Structure

```
specs/
├── SPEC.md              # Master product specification (provided by human)
├── CURRENT_PHASE        # Contains current phase number (e.g., "1")
├── PHASE_PROPOSAL.md    # Phase breakdown proposal (after /plan-phases)
├── design/
│   ├── DESIGN.md        # Design system & brand guidelines
│   ├── FIGMA.md         # Links to Figma files, export notes
│   └── assets/          # Logo, icons, brand assets
│       ├── logo.svg
│       ├── icon.png
│       └── ...
├── phases/
│   ├── PHASE-1-foundation.md
│   ├── PHASE-2-core-web.md
│   └── ...
└── decisions/
    ├── 001-auth-provider.md
    ├── 002-vector-database.md
    └── ...
```

## Files

### SPEC.md

The master product specification. This file is:
- Provided by the human
- Read-only for the agent
- The source of truth for product requirements

### CURRENT_PHASE

A simple file containing just the current phase number:
```
1
```

Updated when moving to a new phase.

### PHASE_PROPOSAL.md

Created by `/plan-phases` command. Contains:
- Proposed phase breakdown
- Scope for each phase
- Estimated ticket counts
- Dependencies between phases

Deleted or archived after human approval.

### design/

Contains design specifications and brand assets:

- `DESIGN.md` — Design system (colors, typography, spacing, components)
- `FIGMA.md` — Links to Figma files, export instructions
- `assets/` — Logo files, app icons, brand assets

The agent reads DESIGN.md before implementing UI and uses assets for logo/icon paths.

### phases/

Contains ticket files for each phase:
- `PHASE-1-foundation.md`
- `PHASE-2-core-web.md`
- etc.

Each file contains:
- Phase goal and scope
- Ticket table with statuses
- Detailed ticket descriptions

### decisions/

Contains spec decision documents for ambiguities in SPEC.md:
- `001-auth-provider.md`
- `002-vector-database.md`
- etc.

Each decision has status: PENDING or DECIDED

---

## Workflow

1. Human provides `SPEC.md`
2. Agent runs `/plan-phases` → creates `PHASE_PROPOSAL.md`
3. Human approves/adjusts phases
4. Agent runs `/init-phase 1` → creates `phases/PHASE-1-*.md`
5. Agent runs `/check-decisions` → creates any needed `decisions/*.md`
6. Human resolves PENDING decisions
7. Agent runs `/work` → executes tickets
8. Repeat for each phase
