# CAIO Build Harness

A Claude Code plugin for building CAIO projects with agents: safety gates that actually block, a fixed model for who does what across sessions, review workflows, and domain skills.

## What it does

- **Gates.** Hooks that stop a commit or push when it would touch prod, add to a merged PR, include a credential, or break the type check. They block with exit 2, and let the command through when the check itself cannot run.
- **Sessions and delegation.** A Fable orchestrator talks to the stakeholder and advises Opus sub-sessions; sub-sessions spawn Opus or Sonnet subagents by complexity. Questions flow up to the orchestrator, which answers the low-impact ones and logs every answer.
- **Decisions.** Spec and architecture questions are files with a status, so nothing gets guessed and nothing gets lost.
- **Review.** `review-ticket`, the Codex review loop on every PR, `phase-gate` at phase boundaries, `design-review` after UI work.
- **Skills.** 51 domain skills, loaded on demand.

The full rules are in [`.claude/HARNESS.md`](.claude/HARNESS.md).

## Install

```
/plugin install caio-build-harness --marketplace get-caio/harness
```

See [`INSTALL.md`](INSTALL.md) for the full steps. In short: install the plugin once per machine, then commit `.claude/harness.json` in each repo that should use it. Repos set up before 4.0 need the migration in that file; until they do it, their old copied hooks keep running and still do not block.

## Layout

```
.claude/                    # the plugin
├── .claude-plugin/plugin.json
├── HARNESS.md              # operating rules
├── hooks/                  # hooks.json + gate scripts
├── agents/                 # 7 agents
├── workflows/              # 4 deterministic workflows
├── commands/               # 4 slash commands
└── skills/                 # domain skills
.claude-plugin/marketplace.json
AGENTS.md                   # product-map template for product repos
archive/                    # retired commands, agents, workflows, skills, Cursor mirror
evals/                      # skill retrieval / absorption / quality evals
tests/                      # hook and workflow tests
docs/, specs/, progress/    # scaffold examples
```

## Developing

```bash
bun install
```

```bash
bun test
```

```bash
bun run typecheck
```

Bump the version in both manifests on every release. Retire things into `archive/` with their eval cases.

## What changed in 4.0

A usage review of four months of sessions across five repos found that the phase-loop commands were never typed, several agents and workflows were never run, and every "BLOCKED" hook exited 1, which does not block. 4.0 fixes the gates, moves them into the plugin, replaces the Cursor-first model routing with the orchestrator model, and archives what was not used. Three skills with no use and no measured effect were archived; the other unused skills stayed because the last eval baseline still showed them helping when loaded.

## License

Internal CAIO use only.
