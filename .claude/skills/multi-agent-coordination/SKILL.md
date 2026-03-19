---
description: "Patterns for supervisor/orchestrator topology, context isolation via subagents, token economics (15x multiplier), the telephone-game problem with paraphrase loss, worktree-based parallel agents, and file ownership rules to prevent merge conflicts."
---

# Multi-Agent Coordination

Patterns for coordinating multiple agents effectively.

## When to Use

- Designing systems with multiple specialized agents
- Spawning subagents for complex tasks
- Debugging coordination failures between agents
- Optimizing token usage in multi-agent workflows
- Deciding between single-agent and multi-agent approaches

## Core Principle

> Sub-agents exist primarily to **isolate context**, not to anthropomorphize role division.

Multi-agent architectures distribute work across multiple LLM instances, each with its own context window. The primary benefit is overcoming single-agent context limitations—not mimicking human team structures.

## Token Economics Reality

Multi-agent systems consume significantly more tokens:

| Configuration        | Token Multiplier |
| -------------------- | ---------------- |
| Single agent (chat)  | 1x baseline      |
| Single agent + tools | ~4x baseline     |
| Multi-agent system   | ~15x baseline    |

**Key insight:** Token usage explains ~80% of performance variance. Before adding agents, consider whether upgrading the model or increasing token budget for a single agent would be more effective.

## Three Dominant Patterns

### 1. Supervisor/Orchestrator

A central agent delegates to specialists and synthesizes results.

```
         [Supervisor]
        /     |      \
   [Agent A] [Agent B] [Agent C]
```

**Best for:** Complex tasks with clear decomposition

**Critical Issue - Telephone Game Problem:**
Supervisors paraphrase sub-agent responses, causing ~50% initial performance loss.

**Solution:** Implement `forward_message` tool enabling sub-agents to respond directly to users when appropriate, bypassing supervisor summarization.

### 2. Peer-to-Peer/Swarm

Agents communicate directly via explicit handoff mechanisms.

```
   [Agent A] <---> [Agent B]
       ^              ^
       |              |
       v              v
   [Agent C] <---> [Agent D]
```

**Best for:** Flexible exploration, emergent problem-solving

**Advantage:** No single point of failure; slightly outperforms supervisors with proper implementation.

### 3. Hierarchical

Organizes agents into strategy, planning, and execution layers.

```
      [Strategy Layer]
            |
      [Planning Layer]
       /    |    \
   [Exec] [Exec] [Exec]
```

**Best for:** Large-scale projects mirroring organizational structures

## Context Isolation Strategies

### Full Context Delegation

Pass complete context for complex, ambiguous tasks requiring deep understanding.

### Instruction Passing

Pass only necessary guidance for well-defined subtasks. Keeps sub-agent context lean.

### File System Memory

Use persistent storage to share state without bloating context. Sub-agents read/write to shared files.

```
shared/
  task-state.json    # Current progress
  findings.md        # Accumulated results
  decisions.md       # Choices made
```

## Consensus & Coordination

### The Voting Problem

Simple majority voting treats hallucinations equally with valid responses.

**Better approaches:**

1. **Weighted Voting** - Weight by confidence scores or domain expertise
2. **Debate Protocol** - Require adversarial critique over multiple rounds
3. **Trigger-Based Intervention** - Monitor for stalls, loops, or sycophancy

### Coordination Overhead

Minimize inter-agent communication. Batch results where possible. Every message between agents consumes tokens.

## Failure Modes & Mitigations

| Failure               | Mitigation                                                 |
| --------------------- | ---------------------------------------------------------- |
| Supervisor bottleneck | Output schema constraints, checkpointing                   |
| Coordination overhead | Minimize communication, batch results                      |
| Divergence            | Clear objective boundaries, convergence checks, TTL limits |
| Error propagation     | Validate outputs, implement retries, idempotent operations |
| Infinite loops        | Time-to-live limits, maximum turn counts                   |

## Harness Integration

The harness uses multi-agent patterns via the Task tool:

```yaml
Subagent Types:
  - Explore: Codebase exploration (isolated context)
  - Plan: Architecture design (focused planning context)
  - feature: Large feature implementation (dedicated feature context)
  - implementer: Code implementation (ticket-focused context)
  - reviewer: PR review (review-specific context)
  - tester: Test writing (testing-focused context)
```

### When to Spawn Subagents

**Use subagent (Task tool):**

- Feature takes 3+ hours or spans multiple files
- Task benefits from isolated, focused context
- Exploration that may require many searches
- Parallel work on independent tasks

**Stay in main loop:**

- Quick fixes (< 1 hour)
- Single-file changes
- Tasks requiring full conversation context

## Implementation Guidelines

1. **Design for context isolation** as the primary benefit
2. **Choose architecture based on coordination needs**, not metaphor
3. **Implement explicit handoff protocols** with state passing
4. **Use weighted voting or debate** for consensus decisions
5. **Monitor supervisor bottlenecks** with checkpointing
6. **Validate outputs** before passing between agents
7. **Set TTL limits** preventing infinite loops
8. **Test failure scenarios** explicitly
9. **Prefer fewer, more capable agents** over many specialized ones
10. **Consider token cost** before adding agents

## Decision Framework

```
Is the task decomposable into independent subtasks?
├── No → Single agent
└── Yes → Do subtasks need to share state frequently?
    ├── Yes → Single agent with tools, or supervisor pattern
    └── No → Can subtasks run in parallel?
        ├── Yes → Parallel subagents (Task tool)
        └── No → Sequential subagents with file-based handoff
```

## References

- [Agent-Skills-for-Context-Engineering: Multi-Agent Patterns](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/blob/main/skills/multi-agent-patterns/SKILL.md)
- LangGraph, AutoGen, CrewAI framework patterns
- "Telephone game problem" research on supervisor architectures
