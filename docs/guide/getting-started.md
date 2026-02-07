---
title: Getting Started
description: Local development setup and workflow
---

# Getting Started

::: info
This page is auto-updated as the project evolves. Last updated during initial scaffolding.
:::

## Prerequisites

- Node.js 18+
- Bun runtime
- PostgreSQL

## Setup

```bash
# Clone the repo
git clone <repo-url>
cd <project>

# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Run database migrations
bunx prisma migrate dev

# Start development server
bun dev
```

## Environment Variables

| Variable       | Required | Description           |
| -------------- | -------- | --------------------- |
| `DATABASE_URL` | Yes      | PostgreSQL connection |

::: tip
More variables will be documented here as features are added.
:::

## Development Workflow

1. Pick a ticket from the current phase
2. Write failing tests first (TDD)
3. Implement the feature
4. Ensure all quality gates pass
5. Commit with `[PN-TXXX]` prefix

## Testing

```bash
bun test              # Run unit tests
bun test --coverage   # With coverage report
bun run test:e2e      # Playwright e2e tests
```

## Documentation

```bash
bun run docs:dev      # Local docs at localhost:5173
bun run docs:build    # Build static docs site
```
