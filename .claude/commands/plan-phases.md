# /plan-phases — Analyze Spec and Propose Phases

Analyze the master spec and propose a phased development breakdown.

## When to Use

- At project start, after receiving SPEC.md
- When re-scoping after major spec changes

## Process

### 1. Read and Analyze Spec

Read `specs/SPEC.md` completely. Identify:

- **Core entities** — What are the main data models?
- **Feature areas** — What distinct functional areas exist?
- **Dependencies** — What must be built before what?
- **Complexity markers** — AI features, integrations, mobile, payments
- **Risk areas** — Unclear requirements, novel technology

### 2. Identify Natural Phase Boundaries

Group features by:

1. **Foundation** — Auth, database schema, project scaffold, **test infrastructure**
   - Always Phase 1
   - No user-facing features yet
   - Gets the codebase buildable and testable
   - **MUST include Vitest setup and first test** (non-negotiable)

2. **Core Value** — The main thing the product does
   - Usually Phase 2
   - Minimum viable user flow
   - Can demo to stakeholders

3. **AI/ML Features** — Anything using Claude or other AI
   - Often Phase 3
   - Depends on core data structures
   - May need iteration

4. **Mobile** — React Native app
   - Separate phase if spec includes mobile
   - Shares API with web
   - Different deployment

5. **Integrations** — OAuth, third-party APIs, webhooks
   - Group by external dependency
   - Often has blockers (API keys, sandbox access)

6. **Polish** — Admin tools, analytics, notifications
   - Lower priority features
   - Can ship without these

### 3. Output Phase Proposal

Create a summary for human review:

```markdown
# Phase Proposal for [Project Name]

## Overview

Based on SPEC.md analysis, I propose N phases:

## Phase 1: Foundation (Est. X tickets)

**Goal:** Scaffold project, auth, core data models, and test infrastructure
**Scope:**

- Project setup with Next.js + Bun + Prisma
- **Configure Vitest and write first test** (MANDATORY)
- **Configure test coverage reporting** (MANDATORY)
- User authentication (method TBD — see decisions)
- Core database schema
- Basic layout and navigation shell

**Spec Decisions Needed:**

- [ ] Auth provider (BetterAuth vs NextAuth)
- [ ] Database hosting (Supabase vs Railway)

---

## Phase 2: [Name] (Est. X tickets)

**Goal:** [One sentence]
**Scope:**

- Feature A
- Feature B
- Feature C

**Depends on:** Phase 1
**Spec Decisions Needed:**

- [ ] [Any clarifications needed]

---

[Continue for all phases]

---

## Recommended Order

1. Phase 1 → 2 → 3... (default)

## Alternative Paths

- If mobile is highest priority: 1 → 4 → 2 → 3
- If AI is the differentiator: 1 → 2 (minimal) → 3 → 2 (complete)

## Risks & Unknowns

- [List any spec gaps that span multiple phases]
- [List any technical unknowns]
```

### 4. Wait for Approval

Output the proposal and wait for human to:

- Approve phases as proposed
- Adjust scope or ordering
- Add/remove phases
- Clarify any questions

Do not proceed to `/init-phase` until human approves.

---

## Example Phase Breakdown

For a typical SaaS with AI features:

| Phase | Name         | Tickets | Focus              |
| ----- | ------------ | ------- | ------------------ |
| 1     | Foundation   | 8-12    | Auth, DB, scaffold |
| 2     | Core Web     | 12-20   | Main user flows    |
| 3     | AI Engine    | 8-15    | AI/ML features     |
| 4     | Mobile       | 15-25   | React Native app   |
| 5     | Integrations | 8-12    | Third-party APIs   |
| 6     | Polish       | 10-15   | Admin, analytics   |

---

## Phase Sizing Guidelines

- **Small phase:** 5-10 tickets, 1-2 weeks agent time
- **Medium phase:** 10-20 tickets, 2-4 weeks agent time
- **Large phase:** 20-30 tickets, 4-6 weeks agent time

Prefer smaller phases — easier to course-correct.

---

## Output Location

Save proposal to `specs/PHASE_PROPOSAL.md` for human review.

After approval, this file can be deleted or kept for reference.
