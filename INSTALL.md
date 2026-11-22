# CAIO Build Harness — Install and Migrate

The harness is a Claude Code plugin. There is one supported way to use it: install the plugin, then opt each repo in. Nothing from this repo is copied into a product repo.

## Install (once per engineer)

```bash
claude plugin marketplace add get-caio/harness
```

```bash
claude plugin install caio-build-harness@caio-build-harness-marketplace
```

## Turn it on in a repo

The plugin's hooks do nothing until the repo opts in. Commit this file:

```bash
mkdir -p .claude && echo '{}' > .claude/harness.json
```

Then create the working directories the rules refer to:

```bash
mkdir -p specs/phases specs/decisions specs/design/assets docs/decisions progress
```

```bash
for f in build-log dead-ends conventions; do [ -f progress/$f.md ] || echo "# ${f}" > progress/$f.md; done
```

Copy `AGENTS.md` from this repo and fill in the product's stack and paths. Keep the repo's own `CLAUDE.md` short and product-specific; a new session is pointed at the plugin's `HARNESS.md` automatically.

### `.claude/harness.json`

```json
{
  "prodBranch": "prod",
  "secretScanner": "builtin",
  "gates": {
    "typecheck": true,
    "secrets": true,
    "mergedPr": true,
    "prod": true,
    "bunOnly": true,
    "protectedFiles": true,
    "testOnEdit": true,
    "format": true,
    "codexReview": true,
    "sounds": true
  }
}
```

Every gate defaults to on; list only the ones you turn off. `"secretScanner": "gitleaks"` swaps the built-in scanner for gitleaks where it is installed. In a monorepo where a full typecheck takes minutes or runs out of memory, set `"typecheck": false` and let CI carry it. `HARNESS.md` → Gates describes each one.

### Verify

In the opted-in repo, start a session and ask it to run `git push --dry-run origin prod`. The command must be refused with `BLOCKED: Cannot push to 'prod'`. Keep `--dry-run`: if the hooks are not loaded the command runs, and a dry run pushes nothing. If it does run, the plugin's hooks are not loaded: check `claude plugin list` and that `.claude/harness.json` is committed on the branch you are on.

## Migrating a repo from 3.x

Before 4.0, repos held copies of the harness: hooks in `.claude/settings.json`, agents, skills, commands, and a forked harness `CLAUDE.md`. Those copies are where the old non-blocking gates still run, and they shadow the plugin. Remove them in one PR per repo:

1. **Hooks.** Delete the `hooks` block from `.claude/settings.json` and any `.claude/hooks/*.sh` the harness put there. Delete the copied typecheck, test, e2e, lint and build hooks outright: the plugin's `typecheck` gate and the repo's CI replace them. Do **not** simply change their `exit 1` to `exit 2`. In the transcripts reviewed, about two thirds of their "TypeScript errors" hits were `tsc` running out of memory, so a literal flip would block every commit. Confirm the repo has CI on pull requests before removing the test hooks. A hook the product wrote for itself may stay; if it is meant to block, it must exit 2 and only when its check ran and failed. Also delete `model`, `customInstructions` and `env.CLAUDE_CODE_SUBAGENT_MODEL`.
2. **Agents.** Delete `.claude/agents/` files that came from the harness. A local `implementer.md` or `feature.md` wins over the plugin's and keeps the old Sonnet pin and skill preloads.
3. **Skills, commands, workflows.** Delete copied `.claude/skills/<name>/`, `.claude/commands/` and `.claude/workflows/` entries that exist in the plugin. Keep product-specific ones.
4. **`CLAUDE.md`.** Replace the forked harness text with the product's own notes. Anything general belongs in a PR to this repo.
5. **Cursor.** Delete `.cursor/agents`, `.cursor/skills/workflow` and the harness `.cursor/hooks*` if the repo is no longer driven from Cursor.
6. **Opt in.** Add `.claude/harness.json`, then run the Verify step.

If a repo vendored the harness as a `.harness` submodule or symlinked `.claude`, remove the submodule or symlink first.

## Updating

Three things must line up before an installed machine sees a new version:

1. The change is merged to `main`; the marketplace tracks `main`.
2. `version` is bumped to the same value in `.claude/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
3. The engineer pulls it: `/plugin marketplace update caio-build-harness-marketplace`, then `/reload-plugins`. Auto-update is off by default for third-party marketplaces.

## What is included

| Piece     | Contents                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------- |
| Gates     | `hooks/hooks.json` and scripts: prod, merged PR, secrets, typecheck, bun-only, protected files |
| Rules     | `HARNESS.md`                                                                                   |
| Agents    | `implementer`, `feature`, `refactorer`, `reviewer`, `auditor`, `product-critic`, `doc-writer`  |
| Workflows | `review-ticket`, `codex-review-loop`, `phase-gate`, `design-review`                            |
| Commands  | `/codex-review`, `/decision`, `/audit`, `/design-review`                                       |
| Skills    | 51 domain skills                                                                               |

Hooks are not a substitute for CI.
