# /decision — Create a Decision Document

Create a decision document when encountering an ambiguity or choice that requires resolution.

## Two Types of Decisions

### Spec Decision (`specs/decisions/`)

**Use when:** The product specification is unclear or ambiguous.

Examples:
- Which auth provider should we use?
- What happens when a user cancels mid-subscription?
- Is this feature in V1 or V2?
- The spec says both X and Y — which is correct?

### Architecture Decision (`docs/decisions/`)

**Use when:** Implementation choices exist during development.

Examples:
- Should we cache this at the edge or in Redis?
- How should we structure the AI prompt system?
- Should this be a server action or API route?

---

## Process

### 1. Determine Type

Ask: "Is this a product/business question or a technical implementation question?"

- Product/business → Spec Decision
- Technical → Architecture Decision

### 2. Get Next Number

**For Spec Decisions:**
```bash
ls specs/decisions/ | wc -l  # Add 1 for next number
```

**For Architecture Decisions:**
```bash
ls docs/decisions/ | wc -l  # Add 1 for next number
```

### 3. Create Decision Document

**Spec Decision Template:**

```markdown
# [NNN] [Decision Title]

**Status:** PENDING
**Phase:** N
**Created:** YYYY-MM-DD
**Blocks:** PN-TXXX, PN-TYYY

## Question

[Clear, specific question that needs answering]

## Context

[Why this decision matters. What the spec says or doesn't say.]

**From SPEC.md (if applicable):**
> [Relevant quote]

**The ambiguity:**
[Explain what's unclear or conflicting]

## Options

### Option A: [Name]

[Description of this option]

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1
- Con 2

**If we choose this:**
- Implication 1
- Implication 2

### Option B: [Name]

[Description of this option]

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1
- Con 2

**If we choose this:**
- Implication 1
- Implication 2

### Option C: [Name] (if applicable)

[...]

## Recommendation

[Agent's recommendation with reasoning, or "Need human input — no clear winner"]

---

## Decision

<!-- HUMAN FILLS THIS IN -->
<!-- Example: "Option A: BetterAuth" -->

## Rationale

<!-- HUMAN EXPLAINS WHY -->
<!-- Example: "BetterAuth has better React Native support and we need that for Phase 4." -->
```

**Architecture Decision Template:**

Same format, but saved to `docs/decisions/` and focused on technical choices.

### 4. Update Blocked Tickets

In the relevant phase file, mark affected tickets as BLOCKED:

```markdown
| PN-TXXX | Title | BLOCKED | M | - | SD-001 |
```

### 5. Log Creation

Add to `progress/build-log.md`:

```markdown
### Decision Created: SD-001
**Date:** YYYY-MM-DD HH:MM
**Title:** Auth provider choice
**Blocks:** P1-T006, P1-T007, P1-T008
**Status:** PENDING — awaiting human input
```

---

## File Naming

**Spec Decisions:** `specs/decisions/NNN-short-name.md`
- `001-auth-provider.md`
- `002-vector-database.md`
- `003-trial-period-length.md`

**Architecture Decisions:** `docs/decisions/NNN-short-name.md`
- `001-caching-strategy.md`
- `002-prompt-architecture.md`
- `003-error-handling-approach.md`

---

## After Decision is Made

When human resolves a decision:

1. They update the document:
   - Change `Status: PENDING` → `Status: DECIDED`
   - Fill in "Decision" section
   - Fill in "Rationale" section

2. Agent detects resolved decision (on next `/work` or `/status`)

3. Agent unblocks affected tickets:
   ```markdown
   | PN-TXXX | Title | TODO | M | - | - |
   ```

4. Work continues on unblocked tickets

---

## Decision Examples

### Spec Decision: Auth Provider

```markdown
# 001 Auth Provider Choice

**Status:** PENDING
**Phase:** 1
**Created:** 2026-01-09
**Blocks:** P1-T006, P1-T007, P1-T008, P1-T009

## Question

Which authentication library should we use for this project?

## Context

The spec mentions "BetterAuth" in the tech stack (Section 4.2) but BetterAuth is less common than NextAuth/Auth.js. Need to confirm this is intentional.

**From SPEC.md:**
> Backend: ... BetterAuth (authentication) ...

## Options

### Option A: BetterAuth

BetterAuth is a newer auth library with built-in support for many providers.

**Pros:**
- Mentioned in spec
- Good React Native support
- Simple API

**Cons:**
- Smaller community
- Less documentation
- Fewer examples online

### Option B: NextAuth / Auth.js

Industry standard for Next.js authentication.

**Pros:**
- Large community
- Extensive documentation
- Many adapters available

**Cons:**
- V5 migration ongoing
- Not mentioned in spec

## Recommendation

Need human input — the spec says BetterAuth but NextAuth is more battle-tested. Depends on whether React Native support is critical.
```

### Architecture Decision: Caching Strategy

```markdown
# 001 Workout Generation Caching

**Status:** PENDING
**Phase:** 3
**Created:** 2026-01-15
**Blocks:** P3-T015

## Question

How should we cache generated workouts to reduce API costs?

## Context

Workout generation uses Claude API which costs money per call. Similar workouts for similar athlete profiles could potentially be cached.

## Options

### Option A: No Caching

Generate fresh every time.

**Pros:**
- Simplest implementation
- Always personalized

**Cons:**
- Higher API costs
- Slower response times

### Option B: Redis Cache with Key

Cache based on hashed parameters (sport, type, duration, level).

**Pros:**
- Reduces API calls significantly
- Fast subsequent requests

**Cons:**
- Less personalization
- Cache invalidation complexity

### Option C: Vector Similarity

Store generated workouts in vector DB, retrieve similar ones and adapt.

**Pros:**
- Best balance of personalization and cost
- Builds training library

**Cons:**
- More complex implementation
- Requires vector DB setup

## Recommendation

Option B for Phase 3 (simpler), upgrade to Option C in Phase 6 when vector DB is established for knowledge base.
```

---

## Best Practices

1. **Be specific** — Vague questions get vague answers
2. **Show your work** — Include relevant spec quotes
3. **Present real options** — Not just "do it" vs "don't do it"
4. **Note implications** — What does each choice unlock or prevent?
5. **Make a recommendation** — Even if uncertain, give your lean
