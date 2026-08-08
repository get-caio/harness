# AGENTS.md — Product Map

> **Fill this in per product repo.** The harness OS lives in `HARNESS.md`. This file is the thin product-specific map so agents don't guess stack or layout.

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

## Skill allowlist (suggested)

Prefer these from `.claude/skills/` when relevant. Full prefer / situational / do-not-auto-load tables: `HARNESS.md` → Available Skills. Playbook: `docs/guide/cursor-harness.md`.

**Allowlist:** `testing`, `security`, `database-migrations`, `git-workflow`, `payments`, `design-routing`, `nextjs-bun-prisma` / `drizzle-orm`, `trpc`, `ci-cd`, `bun-runtime`, `code-quality`, `vitepress`

**Do not auto-load** (unless this product names them below): `shopify-remix`, `woocommerce`, `wordpress-plugin`, `heroku-deploy`, `cloudflare-dns`, `mysql-planetscale`, `pinecone`, broad SEO suites.

### Product overrides

List extra skills this product should treat as allowlist (or ban):

- …

## Local rules

Product-specific Cursor rules (e.g. `**/engine/**`, `**/api/**`) belong in `.cursor/rules/*.mdc` in the **product** repo — not in the harness template.

## Daily driver

Parent model: **Grok 4.5**. Routine agents (`implementer`, `feature`, …) pin `grok-4.5[effort=high]` — not Sonnet. Morning: `/status` → `/check-decisions`. Work: `/work`. Hard design: `architect` (Opus). Before PR: `reviewer` + `verifier` (Sol). Overnight: Cloud Agent + stop-continue hook. Ensure `.cursor/agents/` is present in this repo.
