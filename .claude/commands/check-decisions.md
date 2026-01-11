# /check-decisions — Identify Spec Decisions Needed

Scan the current phase's tickets and SPEC.md to identify ambiguities that need human clarification before proceeding.

## When to Use

- After running `/init-phase N`
- Before starting `/work` on a new phase
- When encountering unclear requirements during work

## Process

### 1. Load Context

Read:
- `specs/CURRENT_PHASE` — Get phase number
- `specs/phases/PHASE-N-*.md` — Get tickets for current phase
- `specs/SPEC.md` — Reference specification
- `specs/decisions/*.md` — Existing decisions

### 2. Scan for Ambiguities

For each ticket in the current phase, check for:

**Technology Choices Not Specified:**
- Which library/framework to use?
- Which third-party service?
- Which API version?

**Business Logic Unclear:**
- What happens in edge case X?
- What are the validation rules?
- What are the limits/thresholds?

**Contradictions in Spec:**
- Section A says X, section B says Y
- Data model doesn't match described behavior

**Missing Information:**
- Referenced feature not defined
- External dependency not documented
- Required configuration not specified

**Scope Ambiguity:**
- Is feature X in this phase or later?
- How much of feature Y is needed now?

### 3. Create Spec Decision Documents

For each ambiguity found, create a decision document in `specs/decisions/`:

```markdown
# [NNN] [Decision Title]

**Status:** PENDING
**Phase:** N
**Created:** YYYY-MM-DD
**Blocks:** P{N}-T{XXX}, P{N}-T{YYY}

## Question

[Specific question that needs answering]

## Context

[Why this matters. What the spec says or doesn't say.]

**From SPEC.md:**
> [Relevant quote if applicable]

**The ambiguity:**
[Explain what's unclear]

## Options

### Option A: [Name]

[Description]

**Pros:**
- ...

**Cons:**
- ...

**Implications:**
- If we choose this, then...

### Option B: [Name]

[Description]

**Pros:**
- ...

**Cons:**
- ...

**Implications:**
- If we choose this, then...

## Recommendation

[Agent's recommendation if there's an obvious choice, or "Need human input" if genuinely unclear]

---

## Decision

<!-- HUMAN FILLS THIS IN -->

## Rationale

<!-- HUMAN EXPLAINS WHY -->
```

### 4. Update Blocked Tickets

For each spec decision created, mark the affected tickets as BLOCKED in the phase file:

```markdown
| P1-T006 | Implement auth setup | BLOCKED | M | - | SD-001 |
```

Add a "Blocked By" column if not present, referencing the spec decision ID.

### 5. Generate Report

Output a summary:

```markdown
# Spec Decision Check — Phase N

**Date:** YYYY-MM-DD
**Phase:** N - [Phase Name]

## Summary

- Tickets scanned: X
- Decisions created: Y
- Tickets blocked: Z

## Decisions Needing Resolution

| ID | Title | Blocks |
|----|-------|--------|
| SD-001 | Auth provider choice | P1-T006, P1-T007 |
| SD-002 | Vector database selection | P3-T015 |

## Ready to Proceed

The following tickets can proceed without decisions:
- P1-T001: Initialize Next.js project
- P1-T002: Configure Prisma
- ...

## Action Required

Please resolve the PENDING decisions in `specs/decisions/` before running `/work`.

To resolve a decision:
1. Open the decision file
2. Choose an option
3. Fill in "Decision" and "Rationale" sections
4. Change status to DECIDED
```

---

## Spec Decision Numbering

Format: `NNN-short-name.md`

- `001-auth-provider.md`
- `002-vector-database.md`
- `003-monorepo-structure.md`

Use sequential numbering across all phases.

---

## Common Spec Decision Categories

### Technology Choices
- Auth provider (BetterAuth, NextAuth, Clerk)
- Database (Supabase, Railway, PlanetScale)
- Vector DB (Pinecone, pgvector, Upstash)
- Email (Resend, SendGrid, Postmark)
- File storage (R2, S3, Uploadthing)

### Architecture
- Monorepo vs separate repos
- Shared code between web and mobile
- API structure (tRPC, REST, GraphQL)

### Business Logic
- Pricing tiers and limits
- Trial period length
- Feature flags and rollout strategy
- Data retention policies

### Integrations
- Which OAuth providers to support
- API versions for third-party services
- Webhook vs polling for data sync

---

## After Check Completes

1. Review created decisions with human
2. Human resolves PENDING → DECIDED
3. Agent unblocks affected tickets
4. Run `/work` to start execution

---

## Re-running Check

If you run `/check-decisions` again:
- Don't duplicate existing decisions
- Only create new decisions for new ambiguities
- Update report with current state
