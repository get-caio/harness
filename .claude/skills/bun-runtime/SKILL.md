---
name: bun-runtime
description: Patterns for using Bun as JavaScript/TypeScript runtime, package manager, test runner, and bundler. Use this skill whenever working with Bun workspaces, bun.lock, Bun APIs, running TypeScript directly, configuring Bun for production, or deploying Bun apps. Also trigger when the user mentions Bun, bunx, bun install, bun run, or any Bun-specific runtime features.
---

# Bun Runtime

Bun is an all-in-one JavaScript runtime that replaces Node.js, npm, and Jest. It runs TypeScript natively without compilation, includes a built-in bundler, test runner, and package manager.

## When to Read This

- Setting up a new project with Bun
- Configuring workspaces for a monorepo
- Writing and running tests with Bun's test runner
- Deploying Bun apps to production (Heroku, Docker)
- Using Bun-specific APIs (file I/O, SQLite, HTTP server)

## Project Init

```bash
bun init                    # Interactive project setup
bun init -y                 # Accept defaults
```

## Package Management

```bash
bun install                 # Install all deps (reads bun.lock)
bun add hono drizzle-orm    # Add dependencies
bun add -d vitest           # Add dev dependency
bun remove express          # Remove dependency
bun update                  # Update all packages
```

Bun uses `bun.lock` (binary lockfile). Commit it to git.

## Workspace Configuration

For monorepos, define workspaces in root `package.json`:

```json
{
  "name": "sided",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*",
    "plugins/*",
    "tools/*"
  ]
}
```

### Workspace Dependencies

Reference workspace packages with `workspace:*`:

```json
// apps/api/package.json
{
  "name": "@sided/api",
  "dependencies": {
    "@sided/db": "workspace:*",
    "@sided/shared": "workspace:*",
    "hono": "^4.0.0"
  }
}
```

```bash
# Install dep in specific workspace
bun add hono --cwd apps/api

# Run script in specific workspace
bun run --cwd apps/api dev

# Run script across all workspaces
bun run --filter '*' build
```

## Running Scripts

```bash
bun run dev                 # Run "dev" script from package.json
bun run src/index.ts        # Run TypeScript directly (no tsc needed)
bun --watch src/index.ts    # Watch mode with auto-restart
bun --hot src/index.ts      # Hot reload (preserves state)
```

## Built-in Test Runner

```typescript
// polls.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';

describe('PollService', () => {
  beforeEach(() => {
    // Reset mocks
  });

  it('creates a poll with options', async () => {
    const poll = await pollService.create({
      question: 'Test?',
      options: ['Yes', 'No'],
    });
    expect(poll.id).toBeDefined();
    expect(poll.options).toHaveLength(2);
  });

  it('throws on empty question', () => {
    expect(() => pollService.create({ question: '' })).toThrow();
  });
});

// Mocking
const mockFetch = mock(() =>
  Promise.resolve(new Response(JSON.stringify({ ok: true })))
);
```

```bash
bun test                    # Run all tests
bun test --watch            # Watch mode
bun test polls.test.ts      # Run specific file
bun test --coverage         # With coverage report
bun test --timeout 10000    # Custom timeout
```

## Bun-Specific APIs

### File I/O (faster than Node fs)

```typescript
// Read
const content = await Bun.file('config.json').text();
const data = await Bun.file('data.json').json();

// Write
await Bun.write('output.txt', 'Hello');
await Bun.write('data.json', JSON.stringify(data));
```

### HTTP Server

```typescript
// Bun's native HTTP server (use Hono on top of this)
export default {
  port: process.env.PORT || 3000,
  fetch(req: Request) {
    return new Response('Hello');
  },
};
```

### Environment Variables

```typescript
// Bun auto-loads .env, .env.local, .env.production
const dbUrl = process.env.DATABASE_URL;
// or
const dbUrl = Bun.env.DATABASE_URL;
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@sided/db": ["../../packages/db/index.ts"],
      "@sided/shared": ["../../packages/shared/index.ts"]
    }
  }
}
```

## Production Deployment

### Heroku Procfile

```
web: bun run src/index.ts
worker: bun run src/jobs/worker.ts
```

### Heroku Buildpack

Use the official Bun buildpack:

```bash
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-bun
```

Or use Docker:

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

## Performance Tips

1. **Use `Bun.serve()`** under Hono for maximum HTTP performance
2. **Prefer `Bun.file()`** over `fs.readFile` — it's significantly faster
3. **Use `bun build`** to bundle for production — tree-shakes and minifies
4. **Bun's SQLite driver** is the fastest in JavaScript — use for local caching if needed
5. **`bun install --frozen-lockfile`** in CI — prevents lockfile changes

## Common Mistakes

1. **Don't use `npx`** — use `bunx` instead
2. **Don't add `ts-node` or `tsx`** — Bun runs TypeScript natively
3. **Don't use `jest`** — use `bun:test` (same API, much faster)
4. **Watch for Node.js compatibility** — most npm packages work, but some native addons may not
5. **Binary lockfile** — `bun.lock` is binary, don't try to read or merge it manually
