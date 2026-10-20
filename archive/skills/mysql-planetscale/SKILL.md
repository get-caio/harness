---
name: mysql-planetscale
description: Patterns for MySQL on PlanetScale — branching workflow, connection pooling, safe migrations without FK constraints, read replicas, and query optimization. Use this skill when working with PlanetScale, MySQL database operations, migration safety, connection pooling, query performance, or database branching. Trigger on PlanetScale, MySQL, database migration, connection pool, read replica, or query optimization.
---

# MySQL on PlanetScale

PlanetScale is serverless MySQL with branching, non-blocking migrations, and automatic connection pooling. Key difference from vanilla MySQL: no foreign key constraints (enforced at application level).

## When to Read This

- Setting up PlanetScale connection with Drizzle
- Running safe schema migrations
- Optimizing query performance
- Using branching for development workflow
- Understanding PlanetScale-specific constraints

## Connection Setup

```typescript
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true }, // PlanetScale requires SSL
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 5,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export const db = drizzle(pool, { schema, mode: 'default' });
```

## No Foreign Keys

PlanetScale uses Vitess under the hood, which doesn't support FK constraints. Enforce referential integrity in application code:

```typescript
// DON'T rely on CASCADE DELETE — do it manually
async function deleteOrganization(orgId: string) {
  await db.transaction(async (tx) => {
    // Delete children first
    await tx.delete(polls).where(eq(polls.organizationId, orgId));
    await tx.delete(campaigns).where(eq(campaigns.organizationId, orgId));
    await tx.delete(orgMembers).where(eq(orgMembers.organizationId, orgId));
    // Then parent
    await tx.delete(organizations).where(eq(organizations.id, orgId));
  });
}

// Schema: define columns but skip .references()
organizationId: varchar('organization_id', { length: 128 }).notNull(),
// NOT: .references(() => organizations.id, { onDelete: 'cascade' })
// Drizzle relations still work for type-safe joins — they're not FK constraints
```

## Branching Workflow

```bash
# Create branch for new feature
pscale branch create sided-db add-ask-tables

# Connect to branch for development
pscale connect sided-db add-ask-tables --port 3309
# DATABASE_URL=mysql://root@127.0.0.1:3309/sided-db

# Create deploy request (like a PR for schema changes)
pscale deploy-request create sided-db add-ask-tables

# Deploy (non-blocking — no table locks)
pscale deploy-request deploy sided-db 42
```

## Migration Safety

PlanetScale migrations are non-blocking (online DDL). Safe operations:

```sql
-- ✅ SAFE (non-blocking)
ALTER TABLE polls ADD COLUMN sentiment_score FLOAT;
ALTER TABLE polls ADD INDEX idx_polls_sentiment (sentiment_score);
CREATE TABLE ask_quotes (...);

-- ⚠️ REQUIRES CARE
ALTER TABLE polls MODIFY question TEXT NOT NULL;  -- Type change
ALTER TABLE polls DROP COLUMN old_field;          -- Column removal

-- ❌ NOT SUPPORTED
ALTER TABLE polls ADD FOREIGN KEY (org_id) REFERENCES organizations(id);
```

### Migration Checklist

1. Create a branch
2. Apply schema changes to branch
3. Test with application code against branch
4. Create deploy request
5. Review diff in PlanetScale dashboard
6. Deploy (zero-downtime)

## Query Optimization

### Indexing Strategy

```typescript
// Composite indexes for common query patterns
mysqlTable('polls', {
  // ... columns
}, (table) => [
  // Most common query: list polls by org, ordered by creation
  index('idx_polls_org_created').on(table.organizationId, table.createdAt),
  // Filter by status within org
  index('idx_polls_org_status').on(table.organizationId, table.status),
  // Campaign targeting queries
  index('idx_polls_format_status').on(table.format, table.status),
]);
```

### EXPLAIN Your Queries

```typescript
// Development helper: check query plans
const result = await db.execute(sql`
  EXPLAIN SELECT * FROM polls
  WHERE organization_id = ${orgId}
  AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 20
`);
console.table(result);
// Look for: type=ref or range (good), type=ALL (bad — full table scan)
```

### Read Replicas

```typescript
// PlanetScale provides read-only connection strings
const readPool = mysql.createPool({
  uri: process.env.DATABASE_READ_URL, // Read replica URL
  ssl: { rejectUnauthorized: true },
  connectionLimit: 20, // Higher limit for reads
});

const readDb = drizzle(readPool, { schema, mode: 'default' });

// Use readDb for analytics, dashboards, search
// Use db (primary) for writes
```

## Connection Limits

| PlanetScale Plan | Max Connections | Recommended Pool Size |
|------------------|-----------------|----------------------|
| Hobby            | 1,000           | 5-10 per dyno        |
| Scaler           | 10,000          | 10-20 per dyno       |
| Enterprise       | Unlimited       | 20-50 per dyno       |

## Common Mistakes

1. **Don't use FK constraints** — PlanetScale will reject them
2. **Always use SSL** — `ssl: { rejectUnauthorized: true }` is required
3. **Don't over-connect** — each Heroku dyno should use 5-20 connections, not 100
4. **Use deploy requests** for schema changes — never run DDL directly on production
5. **Index before you query** — missing indexes on a 10M row table = multi-second queries
6. **Batch large deletes** — `DELETE FROM table WHERE ... LIMIT 10000` in a loop, not one massive DELETE
