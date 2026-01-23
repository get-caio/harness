# Context Engineering

Foundational principles for managing the language model's context window effectively.

## When to Use

- Starting long coding sessions
- Context window approaching limits (70%+ utilization)
- Agent performance degrading mid-session
- Designing new agent workflows or skills
- Debugging unexpected agent behavior

## Core Concept

Context is **everything** available to the model at inference time:

- System prompts
- Tool definitions
- Retrieved documents
- Message history
- Tool outputs (often 80%+ of total tokens)

The context window is not just a size limit—it's an **attention budget** that depletes as context grows. Models exhibit predictable degradation: the "lost-in-the-middle" phenomenon where information in the middle of context gets less attention than beginning/end.

## Progressive Disclosure

Load information only when needed, not upfront.

**Bad:** Load all skill content at session start
**Good:** Load skill names/descriptions; full content loads on activation

**Bad:** Dump entire file contents into context
**Good:** Load file metadata first, then specific sections as needed

This mirrors human cognition—we don't memorize entire codebases, we use indexes to retrieve relevant information on demand.

## Context Budget Allocation

Design with explicit budgets:

| Component        | Typical % | Notes                     |
| ---------------- | --------- | ------------------------- |
| System prompt    | 5-10%     | Stable, loads once        |
| Tool definitions | 10-15%    | Stable across session     |
| Retrieved docs   | 20-30%    | Dynamic, load on demand   |
| Message history  | 30-40%    | Grows over session        |
| Tool outputs     | Variable  | Can dominate if unchecked |
| Reserved buffer  | 10%       | Always keep headroom      |

## Optimization Triggers

Monitor and act when:

- **70% utilization**: Consider compaction
- **80% utilization**: Actively compress
- **90% utilization**: Critical—summarize aggressively

## Compaction Strategies

When approaching limits, compress in this priority order:

1. **Tool outputs** - Summarize findings/metrics, remove raw data
2. **Old conversation turns** - Distill to decisions and commitments
3. **Retrieved documents** - Extract key facts only
4. **NEVER compress** - System prompts, active task context

### Observation Masking

Tool outputs served their purpose once the decision was made. Replace verbose outputs with compact references:

```
[Obs:ref_123 elided. Key: 15 files found, 3 with errors]
```

**Never mask:**

- Critical observations
- Recent turn observations (last 2-3 turns)
- Active reasoning chains

**Always mask:**

- Repeated outputs
- Boilerplate headers/footers
- Already-summarized content

## Attention-Favored Positions

Place critical information where attention is strongest:

```
[BEGINNING - High attention]
  System prompt
  Current task/goal
  Critical constraints

[MIDDLE - Lower attention]
  Historical context
  Supporting documents
  Old tool outputs

[END - High attention]
  Recent conversation
  Current tool outputs
  Immediate next steps
```

## File-System as Extended Memory

Use the filesystem for context overflow:

```
progress/
  build-log.md      # Session history
  decisions/        # Key decisions made
  context-cache/    # Temporary context storage
```

Before summarizing away context, write it to a file. Reference the file path instead of keeping content in context.

## Quality Over Quantity

The goal is **the smallest possible set of high-signal tokens** that achieves the desired outcome.

**Bad indicators:**

- Including "just in case" information
- Keeping full stack traces when summary suffices
- Retaining all conversation history verbatim

**Good indicators:**

- Every token serves the current task
- Context is curated, not accumulated
- Information can be retrieved on demand

## Integration with Harness

The harness already implements several context-engineering patterns:

- **Skills system**: Progressive disclosure of capability knowledge
- **Phase-based development**: Limits scope to manageable chunks
- **Ticket system**: Focused task context per work item
- **Build log**: Offloads historical context to filesystem

## Guidelines

1. Treat context as finite with diminishing returns
2. Place critical information at beginning and end
3. Use progressive disclosure—defer loading until needed
4. Monitor utilization and trigger compaction at 70-80%
5. Prefer smaller high-signal context over larger low-signal
6. Design for graceful degradation, not avoidance
7. Use filesystem to extend effective memory
8. Summarize tool outputs once their decision is made

## References

- [Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering)
- Anthropic's context window research
- "Lost in the Middle" attention mechanics studies
