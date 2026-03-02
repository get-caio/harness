---
name: heroku-deploy
description: Patterns for deploying Bun apps to Heroku — Procfile, config vars, Redis addon, PlanetScale connection, review apps, and deploy pipeline. Use this skill when deploying to Heroku, configuring Heroku addons, setting up CI/CD with Heroku, or managing production infrastructure. Trigger on Heroku, Procfile, config vars, Heroku Redis, deploy pipeline, or production deployment.
---

# Heroku Deployment

Deploying Bun + Hono applications to Heroku with Redis, PlanetScale MySQL, and CI/CD pipelines.

## When to Read This

- Deploying a Bun app to Heroku for the first time
- Configuring addons (Redis, logging)
- Setting up CI/CD and review apps
- Managing environment variables
- Scaling and monitoring

## Procfile

```
web: bun run src/index.ts
worker: bun run src/jobs/worker.ts
release: bun run db:migrate
```

The `release` phase runs migrations automatically on every deploy.

## Buildpack

```bash
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-bun -a sided-api
```

## Config Vars

```bash
# Database
heroku config:set DATABASE_URL="mysql://..." -a sided-api

# Redis
# Auto-set when you add the addon:
heroku addons:create heroku-redis:mini -a sided-api
# Provides REDIS_URL automatically

# Auth
heroku config:set BETTER_AUTH_SECRET="..." -a sided-api
heroku config:set GOOGLE_CLIENT_ID="..." -a sided-api
heroku config:set GOOGLE_CLIENT_SECRET="..." -a sided-api

# External services
heroku config:set PINECONE_API_KEY="..." -a sided-api
heroku config:set OPENAI_API_KEY="..." -a sided-api
heroku config:set ANTHROPIC_API_KEY="..." -a sided-api
heroku config:set STRIPE_SECRET_KEY="..." -a sided-api
heroku config:set RESEND_API_KEY="..." -a sided-api

# App config
heroku config:set NODE_ENV=production -a sided-api
heroku config:set PORT=3000 -a sided-api
heroku config:set API_BASE_URL=https://api.sided.ai -a sided-api
heroku config:set ADMIN_URL=https://admin.sided.ai -a sided-api

# Feature flags
heroku config:set TRAFFIC_SPLIT_PCT=0 -a sided-api
heroku config:set IDENTITY_SYSTEM=fingerprint -a sided-api
heroku config:set AUCTION_ENGINE=legacy -a sided-api
```

## Pipeline Setup

```bash
heroku pipelines:create sided -a sided-api-staging --stage staging
heroku pipelines:add sided -a sided-api --stage production

# Enable review apps (creates ephemeral apps per PR)
heroku pipelines:setup sided
```

### Pipeline Stages

```
PR Branch → Review App (auto-created, auto-destroyed)
main      → Staging (auto-deploy on push)
           → Production (manual promote)
```

## Hono Server Configuration

```typescript
// src/index.ts
import { Hono } from 'hono';
import { serve } from 'bun';

const app = new Hono();
// ... routes and middleware ...

const port = parseInt(process.env.PORT || '3000');
console.log(`Starting server on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
```

Heroku assigns `PORT` dynamically — always read from env.

## Health Check

```typescript
// routes/health.ts
health.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }));

health.get('/ready', async (c) => {
  try {
    await db.execute(sql`SELECT 1`);  // DB check
    return c.json({ status: 'ready', db: 'ok' });
  } catch (e) {
    return c.json({ status: 'not ready', db: 'error' }, 503);
  }
});
```

## Scaling

```bash
# Scale web dynos
heroku ps:scale web=2:standard-2x -a sided-api

# Scale worker
heroku ps:scale worker=1:standard-1x -a sided-api

# Check current
heroku ps -a sided-api
```

## Logging

```bash
heroku logs --tail -a sided-api
heroku logs --tail --dyno=web -a sided-api

# Add Papertrail for log retention
heroku addons:create papertrail:choklad -a sided-api
```

## Database Connection (PlanetScale)

```typescript
// PlanetScale requires SSL
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10, // Heroku standard-2x supports ~20 connections
});
```

## Common Mistakes

1. **Always bind to `process.env.PORT`** — Heroku assigns this dynamically
2. **Don't store secrets in code** — use `heroku config:set` exclusively
3. **Use connection pooling** — Heroku dynos restart, connection pools recover gracefully
4. **Set `NODE_ENV=production`** — affects framework behavior and performance
5. **Monitor dyno memory** — Bun is efficient but watch for memory leaks with `heroku logs`
6. **Rotate API keys every 90 days** — set a calendar reminder
7. **Use `release` phase** for migrations — never run migrations manually in production
