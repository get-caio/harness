---
description: "The one CI shape for CAIO repos: a self-hosted Linux runner, a cheap gate tier on every PR push, a full tier on main / nightly / label, preview deploys behind a label. Read before creating or changing anything under .github/. Not for local dev tooling."
---

# CI/CD Skill — GitHub Actions on a self-hosted runner

## Rules first

The rules in `HARNESS.md` → **CI and Process Changes** govern every edit under `.github/`. In short: state the cost and wait for approval before changing CI; a green run on the commit is the evidence; keep PRs fast; cheap checks first, expensive jobs gated on them; remove or merge checks before adding one. Read that section before this file.

Every workflow uses `runs-on: self-hosted`. GitHub-hosted runners (`ubuntu-latest`, `macos-*`, `windows-*`) are never used: the org's Actions spending limit is $0, so a hosted job queues forever. The runner is Linux with Docker, so service containers, `apt-get`, `sudo`, and `docker build` all work as they did on `ubuntu-latest`.

## The shape

Two tiers in one `ci.yml`:

| Tier     | Runs on                                                                    | Contents                                                      | Budget                      |
| -------- | -------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------- |
| `gate`   | every PR push, every push to `main`                                        | lint, typecheck, build, unit tests, secret scan               | ≤ 5 min wall-clock on a PR  |
| `full`   | push to `main`, nightly schedule, `workflow_dispatch`, PR labeled `ci:full` | browser / e2e, integration against a database, benchmarks, Lighthouse, long rehearsals | whatever it needs, `needs: gate` |

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
    - cron: '17 6 * * *' # nightly full tier; the odd minute avoids the top-of-hour pile-up
  workflow_dispatch:

# A new push to a PR cancels the in-flight run for that PR. Main runs are never cancelled.
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  gate:
    name: Gate
    runs-on: self-hosted
    timeout-minutes: 15
    outputs:
      # True on main, nightly, manual, and PRs labeled ci:full. Every full-tier job keys its `if` on this.
      # (A job-level `if` cannot read `env`, so it is an output.)
      full: ${{ github.event_name != 'pull_request' || contains(github.event.pull_request.labels.*.name, 'ci:full') }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun test
      - run: bun run build

  e2e:
    name: Browser tests
    needs: gate
    if: ${{ needs.gate.result == 'success' && needs.gate.outputs.full == 'true' }}
    runs-on: self-hosted
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps chromium
      - run: bun run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  integration:
    name: Database integration
    needs: gate
    if: ${{ needs.gate.result == 'success' && needs.gate.outputs.full == 'true' }}
    runs-on: self-hosted
    timeout-minutes: 20
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: app_test
          POSTGRES_PASSWORD: integration-only
          POSTGRES_DB: app_test
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U app_test" --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql://app_test:integration-only@127.0.0.1:5432/app_test
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx prisma migrate deploy
      - run: bun run test:integration

  preview:
    name: Preview deploy
    needs: gate
    if: ${{ needs.gate.result == 'success' && github.event_name == 'pull_request' && contains(github.event.pull_request.labels.*.name, 'preview') }}
    runs-on: self-hosted
    timeout-minutes: 20
    concurrency:
      group: preview-${{ github.event.pull_request.number }}
      cancel-in-progress: false
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - uses: amondnet/vercel-action@v25
        id: deploy
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      - uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `Preview: ${{ steps.deploy.outputs.preview-url }}`
            })
```

### Required check

If branch protection requires a single named check, add an aggregator that treats skipped full-tier jobs as success on a PR, so an unlabeled PR can go green:

```yaml
  ci:
    name: CI
    if: always()
    needs: [gate, e2e, integration]
    runs-on: self-hosted
    timeout-minutes: 2
    steps:
      - env:
          RESULTS: ${{ toJSON(needs) }}
        run: |
          node -e '
            const needs = JSON.parse(process.env.RESULTS);
            const bad = Object.entries(needs).filter(([n, j]) => !["success", "skipped"].includes(j.result) || (n === "gate" && j.result !== "success"));
            bad.forEach(([n, j]) => console.error(`${n}: ${j.result}`));
            process.exit(bad.length ? 1 : 0);
          '
```

Make `CI` the only required check. Do not require individual full-tier jobs.

### Multi-app repos

Run only the jobs for what changed. Use `dorny/paths-filter` in a tiny first job and `needs` + `if` on its outputs, or `paths:` filters on separate workflows. A docs-only PR should run nothing but lint.

## On the self-hosted runner

- `runs-on: self-hosted` on every job. A second label (for example `self-hosted, linux`) is fine; `ubuntu-latest` is not.
- The runner keeps its working directory between runs. Caches from `actions/setup-node` / `setup-bun` still work and are warm after the first run.
- One runner handles one job at a time. Several runner instances on the same machine give parallelism; the harness default is two.
- Write temp files to `$RUNNER_TEMP`, never to `/usr/local/bin` or other shared paths. Tools downloaded in a job go in `$RUNNER_TEMP/bin` and onto `$GITHUB_PATH`.
- Service containers, `docker build`, `sudo apt-get`, and `sudo tee /etc/hosts` work because the runner is a Linux box with Docker and passwordless sudo.
- A job that needs the hosted runner's 16 GB (a large Angular/Next build with `NODE_OPTIONS=--max-old-space-size=...`) needs the runner VM sized to match. Check `free -g` on the runner before raising a heap limit.

## Production deploys

Deploys to production are triggered by a human (`workflow_dispatch` or a push to a protected `prod` branch), never automatically from `main`. The deploy job has `environment: production` with a required reviewer. The harness `deployer` agent runs its pre-deploy checklist first; see `HARNESS.md` → Notes for Agents, rule 29.

```yaml
  deploy:
    name: Deploy production
    if: github.event_name == 'workflow_dispatch'
    needs: gate
    runs-on: self-hosted
    timeout-minutes: 15
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      - name: Health check
        run: |
          for i in {1..10}; do
            curl -sf "$DEPLOY_URL/api/health" && exit 0
            sleep 5
          done
          exit 1
        env:
          DEPLOY_URL: ${{ vars.PRODUCTION_URL }}
```

## Secrets

- Vendor tokens (`VERCEL_TOKEN`, `CLOUDFLARE_API_TOKEN`, `NEON_API_KEY`) go on the step that calls the vendor, never on the job or workflow, and never on a dependency-install step.
- `DATABASE_URL` for tests points at the job's service container, not a real database.
- The gate tier runs a secret scan (gitleaks or an equivalent) so a committed key fails before anything else runs.

## Before you change a workflow

Write, in the PR description, before anything else:

1. Wall-clock minutes per PR run, before and after.
2. Runner minutes per run, before and after.
3. Any new step a person must take (a label to add, a secret to set, a runner to register).

Then wait for approval. If a job is slow, ask first whether it belongs on PRs, not how many more minutes to give it.
