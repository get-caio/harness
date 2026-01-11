# Clarify Requirements

Refine vague requirements into concrete, implementable specs through structured questioning.

## Usage

```
/clarify [topic or requirement]
/clarify                          # Interactive mode
/clarify --ticket T-XXX           # Refine a specific ticket
```

## Examples

```
/clarify "add filtering to the dashboard"
/clarify "user wants to export data"
/clarify --ticket T-042
```

## Process

### 1. Receive Input

Accept whatever context is provided:
- A feature request
- A ticket ID to refine
- A vague user need
- A section of SPEC.md to clarify

### 2. Invoke Interviewer Agent

```
Interviewer agent:
- Parses the input
- Identifies what's unclear
- Begins structured questioning
```

### 3. Question Loop

```
While clarity < 85%:
  1. Ask targeted questions (max 3 at a time)
  2. Wait for answers
  3. Update understanding
  4. Assess clarity percentage
  5. Repeat until clear
```

### 4. Confirm Understanding

Before producing output:

```
**Clarity: [X]%**

Here's what I understand:
- [Summary point 1]
- [Summary point 2]
- [Summary point 3]

In scope: [List]
Out of scope: [List]

Is this right? Any adjustments?
```

### 5. Produce Output

Based on context, output one of:

**For tickets (--ticket flag):**
```
Update specs/TICKETS.md with:
- Clear description
- Acceptance criteria
- Scope boundaries
- Edge cases
```

**For features:**
```
Update specs/SPEC.md section with:
- User story
- Requirements
- Acceptance criteria
- Out of scope list
```

**For decisions:**
```
Create docs/decisions/NNN-topic.md with:
- Context
- Options
- Recommendation
```

## Output Locations

| Input Type | Output |
|------------|--------|
| `--ticket PN-TXXX` | Updates `specs/phases/PHASE-N-*.md` |
| Feature request | Updates `specs/SPEC.md` (if allowed) or creates spec decision |
| Decision needed | Creates `specs/decisions/NNN-*.md` (spec) or `docs/decisions/NNN-*.md` (arch) |
| General topic | Creates `progress/clarifications/[topic].md` |

**Note:** SPEC.md is typically read-only. If clarification reveals a spec gap, create a spec decision document instead of modifying SPEC.md directly.

## Question Frameworks

The interviewer agent uses:

- **5 Whys** — Dig to root cause
- **User Story Extraction** — As a [who], I want [what], so that [why]
- **INVEST Criteria** — Independent, Negotiable, Valuable, Estimable, Small, Testable
- **Acceptance Criteria** — Given/When/Then format
- **Edge Case Probing** — Zero results, max load, permissions, errors
- **Scope Boxing** — In/Out/Future

## Output Templates

### Refined Ticket

```markdown
## T-XXX: [Feature Name]

**Context:** [Why this exists]

**User Story:**
As a [user], I want [action], so that [outcome].

**Scope:**
✅ In: [List]
❌ Out: [List]

**Acceptance Criteria:**
1. Given [X], When [Y], Then [Z]
2. Given [X], When [Y], Then [Z]

**Edge Cases:**
- [Scenario]: [Behavior]

---
*Clarified via /clarify on [Date]*
```

### Clarification Log

```markdown
# Clarification: [Topic]

**Date:** [Date]
**Triggered by:** [What prompted this]
**Clarity reached:** [X]%

## Summary
[What we clarified]

## Key Decisions
- [Decision 1]
- [Decision 2]

## Scope
✅ In: [List]
❌ Out: [List]

## Acceptance Criteria
1. [Criterion]
2. [Criterion]

## Open Items
- [Item if any]

## Outputs
- [What was created/updated]
```

## Example Session

```
> /clarify "add filtering to the dashboard"

Interviewer: I need to clarify the filtering feature. A few questions:

1. What data is being filtered? (Users, plans, workouts?)
2. What filter criteria are needed? (Date range, status, type?)
3. Should filters persist across sessions?

> User: Plans. Filter by status (active/completed/draft) and date range.
> Filters should reset on page refresh.

Interviewer: Got it. A couple more:

1. Multiple status selection, or single?
2. Is there a default filter state?
3. Should there be a "clear all" option?

> User: Single status. Default to "active". Yes, clear all button.

Interviewer: 

**Clarity: 90%**

Here's what I understand:
- Filter training plans on dashboard
- Filter by: status (single select), date range
- Default: status = "active"
- Filters reset on page refresh
- Include "clear all" button

In scope: Status filter, date range filter, clear all
Out of scope: Multi-select, filter persistence, saved filters

Is this right?

> User: Perfect.

✅ Updated specs/TICKETS.md with clarified T-042
```

## Tips

1. **Start vague, get specific** — It's okay to begin with "I think we need filtering"
2. **Examples help** — "Walk me through a scenario" clarifies faster than abstract discussion
3. **Scope early** — Defining what's OUT prevents creep
4. **Write it down** — Clarification without documentation is wasted
5. **Link back** — Always connect to the ticket/spec that needed clarity
