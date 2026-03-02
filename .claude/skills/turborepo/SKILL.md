---
name: turborepo
description: Patterns for Turborepo monorepo build orchestration with Bun workspaces. Use this skill whenever configuring build pipelines, task dependencies, caching, or CI for a monorepo. Also trigger when the user mentions turbo, monorepo builds, workspace task orchestration, build caching, or parallel task execution.
---

# Turborepo

Turborepo orchestrates tasks across monorepo workspaces with intelligent caching and parallel execution.

## When to Read This

- Setting up `turbo.json` for a new monorepo
- Configuring task pipelines and dependencies
- Setting up CI caching
- Adding new workspace packages
- Debugging build order issues

## Configuration

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "env": ["DATABASE_URL", "NEXT_PUBLIC_*"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:contract": {
      "dependsOn": ["^build"],
      "outputs": [],
      "env": ["API_BASE_URL"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

### Key Concepts

- `^build` means "run build in all dependencies first"
- `dependsOn: ["^build"]` creates a topological build order
- `outputs` tells Turbo what to cache
- `cache: false` for tasks with side effects (dev servers, migrations)
- `persistent: true` for long-running tasks (dev servers)

## Running Tasks

```bash
# Run across all workspaces
bun turbo build
bun turbo test
bun turbo lint

# Run for specific workspace
bun turbo build --filter=@sided/api
bun turbo dev --filter=@sided/admin

# Run for workspace and its dependencies
bun turbo build --filter=@sided/api...

# Run for all workspaces that changed since main
bun turbo build --filter=...[main]

# Run multiple tasks
bun turbo build test lint
```

## Root package.json Scripts

```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:contract": "turbo test:contract --filter=@sided/api",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "db:generate": "turbo db:generate --filter=@sided/db",
    "db:migrate": "turbo db:migrate --filter=@sided/db"
  }
}
```

## Workspace Structure

```
sided/
├── turbo.json
├── package.json
├── packages/
│   ├── db/
│   │   └── package.json    # @sided/db
│   ├── shared/
│   │   └── package.json    # @sided/shared
│   └── config/
│       └── package.json    # @sided/config
├── apps/
│   ├── api/
│   │   └── package.json    # @sided/api — depends on @sided/db, @sided/shared
│   ├── admin/
│   │   └── package.json    # @sided/admin — depends on @sided/shared
│   └── marketing/
│       └── package.json    # @sided/marketing — depends on @sided/shared
└── tools/
    └── mcp-server/
        └── package.json    # @sided/mcp-server — depends on @sided/db
```

## CI Configuration

### GitHub Actions

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - run: bun install --frozen-lockfile

      # Turbo cache
      - uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-${{ runner.os }}-${{ hashFiles('**/bun.lock') }}

      - run: bun turbo build test lint typecheck

      # Contract tests only for API changes
      - run: bun turbo test:contract --filter=@sided/api
        if: contains(github.event.pull_request.labels.*.name, 'api')
```

## Remote Caching

```bash
# Login to Vercel (Turbo's remote cache provider)
bunx turbo login

# Link to your Vercel team
bunx turbo link

# Now builds are cached across CI and local
```

## Adding a New Package

1. Create the directory and `package.json`:

```json
// packages/new-package/package.json
{
  "name": "@sided/new-package",
  "version": "0.0.0",
  "private": true,
  "main": "index.ts",
  "types": "index.ts"
}
```

2. Add it as a dependency where needed:

```bash
cd apps/api
bun add @sided/new-package@workspace:*
```

3. Re-run `bun install` from root.

## Common Mistakes

1. **Don't forget `^` prefix** — `dependsOn: ["build"]` means "my own build", `["^build"]` means "my dependencies' build"
2. **Don't cache side effects** — dev servers, migrations, and deploys should use `cache: false`
3. **Declare env vars** — Turbo needs to know which env vars affect outputs for correct caching
4. **Don't run `bun install` in subdirectories** — always install from root
5. **Use `--filter`** — don't rebuild everything when you only changed one package
