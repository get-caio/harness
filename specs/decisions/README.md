# Spec Decisions

This directory contains decision documents for ambiguities in the product specification (SPEC.md).

## Purpose

When the agent encounters something unclear in SPEC.md, it creates a decision document here instead of guessing. The human then resolves the decision before work can proceed.

## Naming Convention

`{NNN}-{short-name}.md`

Examples:
- `001-auth-provider.md`
- `002-vector-database.md`
- `003-trial-period-length.md`

## Decision Statuses

| Status | Meaning |
|--------|---------|
| PENDING | Needs human input |
| DECIDED | Human has made a choice |

## Workflow

1. Agent encounters ambiguity in SPEC.md
2. Agent creates decision document with status: PENDING
3. Agent marks affected tickets as BLOCKED
4. Human reviews decision options
5. Human fills in "Decision" and "Rationale" sections
6. Human changes status to DECIDED
7. Agent unblocks affected tickets
8. Work continues

## Not for Technical Decisions

Technical/implementation decisions go in `docs/decisions/`, not here.

This directory is specifically for **product specification** clarifications:
- Business rules
- Feature scope
- Technology choices specified (or not) in the spec
- User experience questions
- Pricing/limits questions
