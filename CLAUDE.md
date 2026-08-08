# CLAUDE.md — Compatibility Shim

This project uses the **CAIO Build Harness**.

## Read this first

1. **`HARNESS.md`** — full operating system (phases, tickets, decisions, gates, model routing).
2. **`AGENTS.md`** — product map (stack, APIs, repo-specific patterns). Fill in per project.
3. **`progress/conventions.md`** — established code patterns for this repo.

Follow `HARNESS.md` for the entire session. Do not invent `DECIDED` decisions; create `PENDING` files and wait for humans.

## Runtime

| Runtime                             | Parent model  | Specialists                                               | Workflows                                          |
| ----------------------------------- | ------------- | --------------------------------------------------------- | -------------------------------------------------- |
| **Cursor (preferred daily driver)** | Grok 4.5      | `.cursor/agents/*` (routine→Grok; Opus/Sol for hard jobs) | `.cursor/skills/workflow/` (`/work`, `/status`, …) |
| **Claude Code**                     | as configured | `.claude/agents/*`                                        | `.claude/commands/`                                |

Cursor loads this file for compat; always-on harness rules also live in `.cursor/rules/harness.mdc`. Domain skills remain under `.claude/skills/` (do not duplicate into `.cursor/skills/`).
