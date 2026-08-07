# Cursor + Grok Daily Driver

How to run the CAIO Build Harness as a **Cursor daily driver**: Grok conducts; Opus / Fable / Sol are specialists.

The OS (`HARNESS.md`), product map (`AGENTS.md`), and dual-runtime layout are unchanged — this page is the **day-in-the-life playbook**.

---

## Setup (once per product repo)

1. Copy harness surfaces: `.claude/`, `.cursor/`, `HARNESS.md`, `AGENTS.md`, `CLAUDE.md`, `specs/`, `progress/`, `docs/` (see `INSTALL.md`).
2. Fill **`AGENTS.md`** (stack, paths, skill allowlist overrides).
3. In Cursor Agent, set parent model to **Grok 4.5**.
4. Confirm slash skills: `/status`, `/check-decisions`, `/work`, `/init-phase`, `/pre-ship`.

Do **not** set Opus, Fable, or Sol as the parent default.

---

## Morning

```
Grok parent
  → /status          # phase, TODO/BLOCKED counts, health
  → /check-decisions # or confirm no PENDING for current phase
  → Human: resolve any PENDING → DECIDED
  → Ready tickets only
```

If `/check-decisions` creates new PENDING files, **stop coding** those tickets. Unblock first.

---

## Workday loop

| Move                                | How                                                                           |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| Grind tickets                       | `/work` or “implement next TODO”                                              |
| Single clear ticket (M)             | Spawn `implementer` (`inherit` → Grok)                                        |
| Large / multi-file (L/XL)           | Spawn `feature` (`inherit`); use `/coordinate`/worktree when isolation needed |
| Ambiguous design / schema / tenancy | Spawn `architect` (Opus; Fable if allowed) → PENDING decision if needed       |
| Requirements mushy                  | Spawn `interviewer` (Opus)                                                    |
| 3+ independent TODOs                | `/coordinate` (prefer workflow over hand-rolled `coordinator`)                |
| Docs after a ticket                 | Spawn `doc-writer` (`inherit`)                                                |

### Hard rules while working

- Never invent a `DECIDED` decision.
- Commit with `[PN-TXXX]` after each ticket; pick up the next TODO immediately.
- Skill diet: allowlist first (`testing`, `security`, …). See `HARNESS.md` → Available Skills.
- Quality gate before commit: tests that assert acceptance criteria, lint, typecheck.

---

## Before a PR

```
Grok parent
  → bun test / lint / typecheck
  → Spawn reviewer (Sol, readonly)
  → Spawn verifier (Sol, readonly) — acceptance criteria vs diff/tests
  → Open/update PR
  → Run Codex/Sol review loop to a terminal state when available
```

Humans still merge to `main`. Agents never push/merge to `prod` (hook-enforced).

---

## Overnight / Cloud babysit

1. Start a **Cloud Agent** on the feature branch with parent **Grok**.
2. Prompt: `/work` (or “continue the phase until blocked”).
3. `.cursor/environment.json` runs `bun install`.
4. `.cursor/hooks.json` `stop` hook can nudge continuation while TODO tickets remain (`loop_limit: 5`).
5. Morning: `/status` — review commits, PENDING decisions, CI.

Cloud agents are for long loops, not for inventing product decisions.

---

## Model cheat sheet

| Role                                                                | Model                        | Notes                                  |
| ------------------------------------------------------------------- | ---------------------------- | -------------------------------------- |
| Parent                                                              | Grok 4.5                     | Conductor only                         |
| implementer / feature / tester / deployer / refactorer / doc-writer | `inherit`                    | Follows Grok                           |
| architect / interviewer / coordinator / auditor / product-critic    | `claude-opus-5[effort=high]` | Fable optional via `claude-fable-5`    |
| reviewer / verifier                                                 | `gpt-5.6-sol`                | Independent opinion; verifier readonly |

---

## Where things live

| Concern                     | Path                            |
| --------------------------- | ------------------------------- |
| OS (phases, tickets, gates) | `HARNESS.md`                    |
| Product map                 | `AGENTS.md`                     |
| Always-on rules             | `.cursor/rules/harness.mdc`     |
| Specialists                 | `.cursor/agents/`               |
| Slash workflows             | `.cursor/skills/workflow/`      |
| Domain skills               | `.claude/skills/` (do not copy) |
| Hooks                       | `.cursor/hooks.json`            |
| Cloud install               | `.cursor/environment.json`      |
| Claude Code shim            | `CLAUDE.md` → `HARNESS.md`      |

---

## Human stays in the loop for

| Gate                          | Who                      |
| ----------------------------- | ------------------------ |
| PENDING → DECIDED             | Human                    |
| Merge to `main`               | Human                    |
| Anything to `prod`            | Human only (never agent) |
| Payment / auth / schema / env | Human review / approval  |
| Phase plan sign-off           | Human                    |

### Team Rules (outside this repo)

Configure in the **Cursor team dashboard** (not committed here):

- Never merge to `prod`
- Secrets / `.env` policy
- Optional: require human for payment/auth paths

Repo hooks reinforce prod-push and `.env` protection; dashboard rules cover org-wide policy.

---

## Anti-patterns

- Pinning Opus/Fable/Sol as the parent model for ticket grind
- Copying all `.claude/skills` into `.cursor/skills`
- Dumping full `HARNESS.md` into always-on rules
- Auto-loading Shopify/WordPress/SEO/Heroku skills on a standard CAIO app
- Letting Grok mark decisions `DECIDED`
- Treating hooks as a replacement for GitHub Actions CI
