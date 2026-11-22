# Workflow skills (slash-only)

These are Cursor ports of harness commands. Each has `disable-model-invocation: true` so they run only when you type `/work`, `/status`, etc.

| Skill | Claude Code equivalent |
| ----- | ---------------------- |
| `/work` | `.claude/commands/work.md` |
| `/check-decisions` | `.claude/commands/check-decisions.md` |
| `/init-phase` | `.claude/commands/init-phase.md` |
| `/status` | `.claude/commands/status.md` |
| `/pre-ship` | `.claude/commands/pre-ship.md` |

Domain skills stay in `.claude/skills/` — do not copy them here.
