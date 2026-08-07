# Cursor + Grok Daily Driver

The harness is **dual-runtime**: Cursor (Grok conductor + pinned specialists) and Claude Code (compat via thin `CLAUDE.md`).

## Quick start (Cursor)

1. Set the Agent parent model to **Grok 4.5**.
2. Ensure the project has `specs/`, `progress/`, `HARNESS.md`, `AGENTS.md`, `.cursor/`, and `.claude/skills/`.
3. Fill in `AGENTS.md` for your product.
4. Run `/status` → `/check-decisions` → resolve PENDING decisions → `/work`.

## Model routing

| Role                                  | Model                                                      |
| ------------------------------------- | ---------------------------------------------------------- |
| Parent                                | Grok 4.5                                                   |
| implementer / feature / tester / docs | `inherit`                                                  |
| architect / coordinator / auditor / … | Claude Opus (`claude-opus-5[effort=high]`; Fable optional) |
| reviewer / verifier                   | OpenAI Sol (`gpt-5.6-sol`)                                 |

Never pin Opus/Fable/Sol as the parent default. Details: `HARNESS.md` → Agent & Model Strategy.

## Where things live

| Concern                     | Path                                    |
| --------------------------- | --------------------------------------- |
| OS (phases, tickets, gates) | `HARNESS.md`                            |
| Product map                 | `AGENTS.md`                             |
| Always-on rules             | `.cursor/rules/harness.mdc`             |
| Specialists                 | `.cursor/agents/`                       |
| Slash workflows             | `.cursor/skills/workflow/`              |
| Domain skills               | `.claude/skills/` (shared; do not copy) |
| Hooks                       | `.cursor/hooks.json`                    |
| Cloud install               | `.cursor/environment.json`              |

## Human stays in the loop for

- PENDING → DECIDED decisions
- Merge to `main` / anything touching `prod`
- Payment, auth, schema, and env approvals
