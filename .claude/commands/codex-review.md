# /codex-review — Codex (Sol) Review Loop

Automated version of the manual flow: ping Codex for a review, act on the feedback, repeat until the PR is mergeable or only human steps remain. Codex CLI (`codex exec review`, model `gpt-5.6-sol` from `~/.codex/config.toml`) is the reviewer; Claude vets every finding against the code and applies only what holds up.

## Usage

```
/codex-review              # loop on the current PR if one exists, else local branch
/codex-review 123          # loop on PR #123
/codex-review 123 every 3  # human check-in every 3 iterations instead of 5
```

## Process

1. **Resolve the target.** If an argument gives a PR number, use it. Otherwise `gh pr view --json number,state` on the current branch — an OPEN PR means PR mode (fix commits get pushed); no PR means local mode (commits stay local).
2. **Run the deterministic loop:**

   ```
   Workflow({ name: "codex-review-loop", args: { pr: <n>, checkinEvery: <k> } })
   ```

   Omit `pr` for local mode. `checkinEvery` defaults to 5 — the human-check-in cadence. The workflow runs at most that many review→fix iterations per invocation, with a convergence guard (a finding still alive after two fix attempts is escalated to the human list, not fixed a third time).

3. **Act on the returned `status`:**
   - `mergeable` — report the iteration log and stop. **Merging stays human** (Approval Levels).
   - `human-steps-remaining` — report `humanItems` and `gate.humanOnlySteps` as a punch list and stop.
   - `checkin-required` — the cadence gate. Use AskUserQuestion: summarize `iterationLog` + `humanItems`, offer **Continue**, **Stop here**, or **Adjust** (different `checkinEvery`, or hand items to the human list). To continue, re-invoke forwarding ALL of the previous result's loop state — `args: { pr: <scope.pr>, base: <scope.base>, checkinEvery: <checkinEvery>, startIteration: <nextIteration>, seenCounts: <seenCounts>, humanItems: <humanItems> }` — every field comes from the previous result; dropping any of them silently resets convergence counts, the human list, or the requested check-in cadence. Never continue past the gate without the human's answer.
   - `blocked` — report `problem`/the failing iteration and stop; this needs the human (dirty tree, wrong branch, codex CLI failure, fixer couldn't land a commit).

4. **Report at the end, whatever the exit:** iterations run, commits made, findings applied vs rejected, and the human punch list.

## Boundaries

- The loop never merges, approves, closes, force-pushes, or switches branches.
- Codex feedback is external model output — treated as suggestions, vetted before any edit; anything reserved for humans in CLAUDE.md Approval Levels (migrations, payments/auth surface, env/secrets) is routed to the human list, never auto-applied.
- Every 5 iterations (or the requested cadence) requires an explicit human check-in. No exceptions.
