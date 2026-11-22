# CLAUDE.md

This repo is the **CAIO Build Harness**: a Claude Code plugin whose source is `.claude/`.

## Read this first

1. **`.claude/HARNESS.md`** — the operating rules the plugin ships (sessions and delegation, decisions, gates, testing, PRs, CI).
2. **`AGENTS.md`** — the product-map template that each product repo fills in.
3. **`progress/conventions.md`** — established patterns for this repo.

Do not write `DECIDED` on a decision for the stakeholder; create it `PENDING` and raise it.

## Working on the harness itself

- Hooks live in `.claude/hooks/` and are covered by `tests/hooks.test.ts`. A gate blocks with exit 2 and nothing else; it must exit 0 when its check cannot run.
- Bump `version` in both `.claude/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` on every release.
- Retired pieces go to `archive/`, with their eval cases, not to the bin.
- `bun test` and `bun run typecheck` must pass before a PR.
