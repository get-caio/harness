# AGENTS.md — Product Map

> **Fill this in per product repo.** The harness OS lives in `HARNESS.md`. This file is the thin product-specific map so agents don't guess stack or layout.

## Product

| Field | Value |
| ----- | ----- |
| Name | _(e.g. Shed)_ |
| One-liner | _What it does_ |
| Primary users | _Who_ |

## Stack (override HARNESS defaults if needed)

| Layer | Choice | Notes |
| ----- | ------ | ----- |
| Framework | | |
| Runtime | Bun | |
| Database | | |
| ORM | Prisma / Drizzle | |
| API | tRPC / REST | |
| Auth | | |
| Payments | | |
| Deploy | | |

## Repo map

| Path | Purpose |
| ---- | ------- |
| `app/` or `src/` | |
| `lib/` | Domain modules + canonical types |
| `specs/` | SPEC, phases, decisions |
| `docs/` | VitePress living docs |
| `progress/` | build-log, conventions, dead-ends |

## Critical APIs / surfaces

List the routes, packages, or services agents touch most often:

- …

## Patterns to prefer

- …

## Patterns to avoid

- …

## Skill allowlist (suggested)

Prefer loading these from `.claude/skills/` when relevant; do not auto-load the full marketplace:

- `testing`, `security`, `database-migrations`, `git-workflow`
- `payments` (or stripe rules in HARNESS compressed skills)
- `design-routing` (+ visual/ui skills as directed)
- `drizzle-orm` or `nextjs-bun-prisma` as applicable
- `trpc`, `ci-cd` when touching those layers

## Local rules

Product-specific Cursor rules (e.g. `**/engine/**`, `**/api/**`) belong in `.cursor/rules/*.mdc` in the **product** repo — not in the harness template.
