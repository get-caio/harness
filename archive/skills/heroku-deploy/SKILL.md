---
name: heroku-deploy
description: Patterns for deploying Bun apps to Heroku — Procfile, config vars, Redis addon, PlanetScale connection, review apps, and deploy pipeline. Use this skill when deploying to Heroku, configuring Heroku addons, setting up CI/CD with Heroku, or managing production infrastructure. Trigger on Heroku, Procfile, config vars, Heroku Redis, deploy pipeline, or production deployment.
---

# Heroku Deployment

Deploying Bun + Hono applications to Heroku. Non-obvious patterns only — standard Procfile structure and PORT binding are well-known.

---

## Bun-Specific Setup

### Buildpack

```bash
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-bun -a sided-api
```

Heroku has no official Bun buildpack. This community buildpack is the correct one. Do not use Node.js buildpack with Bun.

### Procfile with Release Phase

```
web: bun run src/index.ts
worker: bun run src/jobs/worker.ts
release: bun run db:migrate
```

The `release` phase runs automatically on every deploy before new dynos start. This is the correct place for migrations — never run migrations manually in production.

---

## PlanetScale Connection Pooling

```typescript
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }, // PlanetScale requires SSL
  waitForConnections: true,
  connectionLimit: 10, // Heroku standard-2x supports ~20 connections
});
```

PlanetScale requires SSL — `rejectUnauthorized: true` is not optional. Heroku dynos restart frequently; connection pooling (not single connections) recovers gracefully.

---

## Review Apps Pipeline

```bash
heroku pipelines:create sided -a sided-api-staging --stage staging
heroku pipelines:add sided -a sided-api --stage production
heroku pipelines:setup sided  # enables review apps (ephemeral app per PR)
```

```
PR Branch → Review App (auto-created, auto-destroyed)
main      → Staging (auto-deploy on push)
           → Production (manual promote)
```

Review apps inherit staging config vars. Ensure any secrets needed for PR testing are set on the pipeline, not just the staging app.

---

## Redis Addon

```bash
heroku addons:create heroku-redis:mini -a sided-api
# Provides REDIS_URL automatically — do not set this manually
```

`REDIS_URL` is injected by the addon. If you set it manually via `config:set`, it will be overwritten when the addon rotates credentials.

---

## Common Mistakes

1. **Always bind to `process.env.PORT`** — Heroku assigns this dynamically; hardcoding 3000 works locally but fails on Heroku
2. **Use `release` phase for migrations** — never run migrations manually in production
3. **Do not set `REDIS_URL` manually** — the addon manages it
4. **PlanetScale requires SSL** — `ssl: { rejectUnauthorized: true }` is required, not optional
5. **Use connection pooling** — Heroku dynos restart; pools recover gracefully, single connections do not
