---
description: "The one CI shape for CAIO repos: a self-hosted Linux runner, a cheap gate tier on every PR push, a full tier on main / nightly / label, preview deploys behind a label. Read before creating or changing anything under .github/. Not for local dev tooling."
---

# CI/CD Skill — GitHub Actions on a self-hosted runner

## Rules first

The rules in the harness `HARNESS.md` (`../../HARNESS.md` from this skill's base directory) → **CI and Process Changes** govern every edit under `.github/`. In short: state the cost and wait for approval before changing CI; a green run on the commit is the evidence; keep PRs fast; cheap checks first, expensive jobs gated on them; remove or merge checks before adding one. Read that section before this file.

Every workflow uses `runs-on: self-hosted`. GitHub-hosted runners (`ubuntu-latest`, `macos-*`, `windows-*`) are never used: the org's Actions spending limit is $0, so a hosted job queues forever. The runner is Linux with Docker, so service containers, `apt-get`, `sudo`, and `docker build` all work as they did on `ubuntu-latest`.

## The shape

Two tiers in one `ci.yml`:

| Tier   | Runs on                                                                     | Contents                                                                               | Budget                           |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------- |
| `gate` | every PR push, every push to `main`                                         | lint, typecheck, build, unit tests, secret scan                                        | ≤ 5 min wall-clock on a PR       |
| `full` | push to `main`, nightly schedule, `workflow_dispatch`, PR labeled `ci:full` | browser / e2e, integration against a database, benchmarks, Lighthouse, long rehearsals | whatever it needs, `needs: gate` |

Preview deploys are their own job, `needs: gate`, and run only on a PR labeled `preview`. Adding the label triggers the run (`labeled` is in the `pull_request` types), so a person never pushes an empty commit to get one.

What goes in `gate` is what an engineer would run before pushing. If it needs a browser, a database, a deployed URL, or more than five minutes, it is `full`.

### `ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize, reopened, labeled]
  schedule:
    - cron: "17 6 * * *" # nightly full tier; the odd minute avoids the top-of-hour pile-up
  workflow_dispatch:

# One run per branch: a newer push cancels the older run, on main too. The newest commit's run tests every
# commit before it; one run per merge piled up hours of queue on shared runners.
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
