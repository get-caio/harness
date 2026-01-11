# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting significant **technical implementation** decisions made during the project.

## Spec Decisions vs Architecture Decisions

| Type | Location | Purpose |
|------|----------|---------|
| **Spec Decision** | `specs/decisions/` | Product/business clarifications (what to build) |
| **Arch Decision** | `docs/decisions/` | Technical choices (how to build it) |

**Examples of Spec Decisions:**
- Which auth provider to use?
- What should the pricing tiers be?
- Is feature X in V1 or V2?

**Examples of Arch Decisions:**
- How should we structure the AI prompt system?
- Should we cache at the edge or in Redis?
- What error handling pattern should we use?

## Format

Each ADR follows this structure:

```markdown
# [Number]. [Title]

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated | Superseded by [ADR-XXX]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?
```

## Naming Convention

Files are named: `NNN-short-title.md`

Examples:
- `001-database-choice.md`
- `002-auth-strategy.md`
- `003-api-design.md`

## When to Write an ADR

Create an ADR when:
- Choosing between multiple valid technical approaches
- Making decisions that are hard to reverse
- Selecting third-party services or libraries
- Defining architectural patterns for the project
- Making security or performance tradeoffs

## Index

| # | Title | Status | Date |
|---|-------|--------|------|
| — | No decisions recorded yet | — | — |

---

*ADRs are created by the `architect` agent and reviewed by humans.*
