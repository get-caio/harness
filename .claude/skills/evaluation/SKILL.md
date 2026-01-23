# Agent Evaluation

Systematic evaluation of agent systems for quality assurance and continuous improvement.

## When to Use

- Setting up quality gates for agent deployments
- Measuring agent performance after changes
- Building test frameworks for agent behavior
- Debugging inconsistent agent results
- Comparing different agent configurations
- Establishing baselines before optimization

## Core Challenge

Agent evaluation differs fundamentally from standard software testing:

1. **Non-determinism** - Agents may reach identical goals through different paths
2. **Context dependency** - Failures emerge subtly based on conversation history
3. **No single correct answer** - Multiple valid responses exist for most tasks
4. **Composite quality** - Performance isn't unidimensional

## The 95% Finding

Research on agent evaluation identified three factors explaining performance variance:

| Factor              | Variance Explained |
| ------------------- | ------------------ |
| Token usage         | ~80%               |
| Tool call frequency | ~10%               |
| Model selection     | ~5%                |

**Key insight:** Context budgets matter more than architectural choices early in development. Optimize token usage before changing models or architectures.

## Multi-Dimensional Rubric Framework

Don't reduce quality to a single score. Assess multiple dimensions:

### Recommended Dimensions

| Dimension            | What It Measures                                      |
| -------------------- | ----------------------------------------------------- |
| **Factual Accuracy** | Claims match ground truth                             |
| **Completeness**     | Output covers all requested aspects                   |
| **Efficiency**       | Reasonable tool usage, no unnecessary steps           |
| **Process Quality**  | Followed best practices, clean execution              |
| **Code Quality**     | If code: passes tests, follows patterns, maintainable |
| **Safety**           | No security issues, respects constraints              |

### Scoring Levels

For each dimension, define clear levels:

```
Excellent (1.0): Exceeds requirements, no issues
Good (0.8): Meets requirements, minor issues
Acceptable (0.6): Mostly meets requirements, some gaps
Poor (0.4): Significant gaps, partial completion
Failed (0.0): Did not meet requirements
```

Weight dimensions based on your use case. Safety might be pass/fail while completeness is graded.

## Evaluation Methods

### 1. LLM-as-Judge

Use another LLM to evaluate agent outputs. Scales to large test sets.

**Prompt structure:**

```markdown
## Task Description

{original_task}

## Ground Truth (if available)

{expected_outcome}

## Agent Output

{agent_response}

## Evaluation Criteria

- Factual accuracy: Are claims correct?
- Completeness: Are all aspects addressed?
- Process quality: Was execution clean?

Rate each dimension 0.0-1.0 with brief justification.
```

**Limitations:**

- Can miss subtle hallucinations
- May not catch domain-specific errors
- Supplement with human review for critical systems

### 2. Human Evaluation

Essential for catching what automation misses:

- Unusual hallucination patterns
- System-level failures
- Subtle biases
- UX issues in agent responses

**When to use:**

- Production sampling (random % of interactions)
- New capability launches
- After significant changes
- Edge cases and failures

### 3. End-State Evaluation

For state-mutating agents (file edits, deployments), focus on final state:

```python
# Instead of evaluating execution steps:
assert agent.steps == expected_steps  # Brittle

# Evaluate the outcome:
assert file_exists("output.ts")
assert tests_pass("output.ts")
assert no_lint_errors("output.ts")
```

### 4. Regression Testing

Track metrics over time to catch degradation:

```yaml
baseline:
  accuracy: 0.92
  completeness: 0.88
  efficiency: 0.85

current:
  accuracy: 0.89 # -3% - investigate
  completeness: 0.90 # +2% - good
  efficiency: 0.82 # -3% - acceptable variance
```

## Test Set Design

### Stratify by Complexity

| Level      | Characteristics                | % of Set |
| ---------- | ------------------------------ | -------- |
| Simple     | Single tool, clear goal        | 30%      |
| Medium     | Multiple tools, some ambiguity | 40%      |
| Complex    | Many tools, requires planning  | 20%      |
| Edge cases | Known failure modes            | 10%      |

### Source Test Cases From

- Real user interactions (anonymized)
- Known edge cases and failure modes
- Adversarial examples
- Regression cases (previous failures)

### Sample Size Guidelines

- **Development:** Small samples (10-20) - changes show large effects
- **Pre-release:** Medium samples (50-100) - statistical significance
- **Production monitoring:** Continuous random sampling (1-5%)

## Context Engineering Validation

Test how agents perform under different context conditions:

```yaml
tests:
  - name: "Fresh context"
    context_size: 10%
    expected_accuracy: 0.95

  - name: "Moderate context"
    context_size: 50%
    expected_accuracy: 0.90

  - name: "Near limit"
    context_size: 80%
    expected_accuracy: 0.80 # Identify degradation cliff
```

## Harness Integration

### Per-Ticket Evaluation

After each ticket completion:

```markdown
## Ticket Evaluation: P1-T003

### Dimensions

- Accuracy: 1.0 - All requirements met
- Completeness: 0.8 - Missing edge case handling
- Efficiency: 0.9 - Clean execution, minimal retries
- Test Coverage: 1.0 - All paths tested
- Code Quality: 0.9 - Follows patterns, minor style issue

### Overall: PASS (0.92 weighted average)
```

### Phase Gate Evaluation

Before moving to next phase:

```markdown
## Phase 1 Evaluation Summary

Tickets completed: 12/12
Average accuracy: 0.91
Average completeness: 0.88
Test coverage: 94%
Security issues: 0
Blocking issues: 0

### Decision: PROCEED to Phase 2
```

### Production Monitoring

Continuous evaluation of deployed agent:

```yaml
alerts:
  - metric: accuracy
    threshold: 0.85
    action: page_on_call

  - metric: error_rate
    threshold: 0.05
    action: create_incident

dashboards:
  - daily_quality_scores
  - weekly_trend_analysis
  - failure_categorization
```

## Common Pitfalls

| Pitfall                        | Solution                         |
| ------------------------------ | -------------------------------- |
| Overfitting to execution paths | Evaluate outcomes, not steps     |
| Single-metric obsession        | Use multi-dimensional rubrics    |
| Ignoring edge cases            | Stratify test sets by complexity |
| Skipping human review          | Sample production for human eval |
| No baseline                    | Establish metrics before changes |
| Evaluating only successes      | Include failure analysis         |

## Implementation Guidelines

1. **Define quality dimensions** relevant to your use case
2. **Create rubrics** with actionable level descriptions
3. **Build test sets** from real patterns plus edge cases
4. **Establish baselines** before making changes
5. **Automate evaluation pipelines** for consistency
6. **Supplement with human review** for critical paths
7. **Track metrics longitudinally** for trend detection
8. **Set quality gates** that block bad deployments
9. **Categorize failures** to identify patterns
10. **Iterate on rubrics** as you learn more

## References

- [Agent-Skills-for-Context-Engineering: Evaluation](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering/blob/main/skills/evaluation/SKILL.md)
- BrowseComp benchmark methodology
- LLM-as-Judge research papers
