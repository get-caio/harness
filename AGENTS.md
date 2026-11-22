# AGENTS.md — Product Map

> **Fill this in per product repo.** The operating rules live in the harness plugin's `HARNESS.md`. This file is the thin product-specific map so agents don't guess stack or layout.

## Product

| Field         | Value          |
| ------------- | -------------- |
| Name          | _(e.g. Shed)_  |
| One-liner     | _What it does_ |
| Primary users | _Who_          |

## Stack (override HARNESS defaults if needed)

| Layer     | Choice           | Notes |
| --------- | ---------------- | ----- |
| Framework |                  |       |
| Runtime   | Bun              |       |
| Database  |                  |       |
| ORM       | Prisma / Drizzle |       |
| API       | tRPC / REST      |       |
| Auth      |                  |       |
| Payments  |                  |       |
| Deploy    |                  |       |

## Repo map

| Path             | Purpose                           |
| ---------------- | --------------------------------- |
| `app/` or `src/` |                                   |
| `lib/`           | Domain modules + canonical types  |
| `specs/`         | SPEC, phases, decisions           |
| `docs/`          | VitePress living docs             |
| `progress/`      | build-log, conventions, dead-ends |

## Critical APIs / surfaces

List the routes, packages, or services agents touch most often:

- …

## Patterns to prefer

- …

## Patterns to avoid

- …

## Skills

Skills come from the harness plugin and load on demand; see `HARNESS.md` → Skills. Name the ones this product leans on, and any it should never load.

### Product overrides

List extra skills this product should treat as allowlist (or ban):

- …

## Gates

Gate switches for this repo live in `.claude/harness.json` (see the harness `INSTALL.md`). Note here any gate that is off and why.
