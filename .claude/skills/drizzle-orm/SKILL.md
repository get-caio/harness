---
name: drizzle-orm
description: Patterns and best practices for Drizzle ORM with MySQL. Use this skill whenever defining database schemas, writing queries, creating migrations, setting up relations, or working with any database operations using Drizzle. Also trigger when the user mentions tables, schemas, ORM, database models, migrations, or query building — even if they don't say "Drizzle" explicitly.
---

# Drizzle ORM (MySQL)

Drizzle is a type-safe, performant ORM that generates SQL. It uses a schema-as-code approach where TypeScript definitions are the source of truth.

## When to Read This

- Defining new tables or modifying schemas
- Writing queries (select, insert, update, delete)
- Setting up relations between tables
- Running migrations with `drizzle-kit`
- Optimizing query performance

## Schema Definition

### Table Pattern

```typescript
// db/schema/polls.ts
import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  mysqlEnum,
  json,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { createId } from '@paralleldrive/cuid2';

export const polls = mysqlTable('polls', {
  // Always use CUID2 for primary keys
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),

  // Foreign keys reference the varchar id
  organizationId: varchar('organization_id', { length: 128 }).notNull(),
  authorId: varchar('author_id', { length: 128 }),

  // Content
  question: text('question').notNull(),
  format: mysqlEnum('format', ['standard', 'slider', 'ranked', 'image', 'open_ended']).notNull().default('standard'),
  status: mysqlEnum('status', ['draft', 'active', 'paused', 'archived']).notNull().default('draft'),

  // JSON columns for flexible data
  settings: json('settings').$type<PollSettings>(),

  // Counters (denormalized for read performance)
  voteCount: int('vote_count').notNull().default(0),
  commentCount: int('comment_count').notNull().default(0),

  // Flags
  isFeatured: boolean('is_featured').notNull().default(false),

  // Timestamps — always include both
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [
  // Indexes defined inline
  index('idx_polls_org').on(table.organizationId),
  index('idx_polls_status').on(table.status),
  index('idx_polls_created').on(table.createdAt),
  uniqueIndex('idx_polls_org_slug').on(table.organizationId, table.id),
]);

// Export inferred types
export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;
```

### Relations

```typescript
// db/schema/relations.ts
import { relations } from 'drizzle-orm';
import { polls } from './polls';
import { pollOptions } from './poll-options';
import { organizations } from './organizations';
import { users } from './users';

export const pollsRelations = relations(polls, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [polls.organizationId],
    references: [organizations.id],
  }),
  author: one(users, {
    fields: [polls.authorId],
    references: [users.id],
  }),
  options: many(pollOptions),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
}));
```

### Schema Index File

```typescript
// db/schema/index.ts
export * from './polls';
export * from './poll-options';
export * from './organizations';
export * from './users';
export * from './campaigns';
export * from './relations';
```

## Database Client Setup

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
});

export const db = drizzle(pool, { schema, mode: 'default' });
export type DB = typeof db;
```

## Query Patterns

### Select with Filtering

```typescript
import { eq, and, gte, desc, like, sql } from 'drizzle-orm';

// Simple select
const poll = await db.query.polls.findFirst({
  where: eq(polls.id, pollId),
  with: { options: true, author: true },
});

// Paginated list with filters
async function listPolls(params: {
  orgId: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const { orgId, status, page, limit } = params;
  const offset = (page - 1) * limit;

  const conditions = [eq(polls.organizationId, orgId)];
  if (status) conditions.push(eq(polls.status, status as any));

  const [data, countResult] = await Promise.all([
    db.select()
      .from(polls)
      .where(and(...conditions))
      .orderBy(desc(polls.createdAt))
      .limit(limit)
      .offset(offset),

    db.select({ count: sql<number>`count(*)` })
      .from(polls)
      .where(and(...conditions)),
  ]);

  return { data, total: countResult[0].count };
}
```

### Insert

```typescript
// Single insert
const [newPoll] = await db.insert(polls).values({
  organizationId: orgId,
  authorId: userId,
  question: 'What do you think about AI?',
  format: 'standard',
}).$returningId();

// Batch insert
await db.insert(pollOptions).values(
  options.map((text, i) => ({
    pollId: newPoll.id,
    text,
    position: i,
  }))
);
```

### Update

```typescript
await db.update(polls)
  .set({
    status: 'active',
    updatedAt: new Date(),
  })
  .where(and(
    eq(polls.id, pollId),
    eq(polls.organizationId, orgId), // Always scope to org
  ));
```

### Increment Counters

```typescript
await db.update(polls)
  .set({
    voteCount: sql`${polls.voteCount} + 1`,
  })
  .where(eq(polls.id, pollId));
```

### Transaction

```typescript
await db.transaction(async (tx) => {
  const [poll] = await tx.insert(polls).values(pollData).$returningId();

  await tx.insert(pollOptions).values(
    options.map((opt, i) => ({
      pollId: poll.id,
      text: opt,
      position: i,
    }))
  );

  return poll;
});
```

## Migration Workflow

```bash
# Generate migration from schema changes
bunx drizzle-kit generate

# Apply migration to database
bunx drizzle-kit migrate

# Push schema directly (development only — skips migration files)
bunx drizzle-kit push

# Introspect existing database
bunx drizzle-kit introspect
```

### drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema/index.ts',
  out: './db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Naming Conventions

- Tables: `snake_case` plural (`polls`, `poll_options`, `campaign_segments`)
- Columns: `snake_case` (`organization_id`, `created_at`, `vote_count`)
- Indexes: `idx_{table}_{columns}` (`idx_polls_org`, `idx_polls_status`)
- Unique indexes: `uniq_{table}_{columns}`
- Foreign keys: `{referenced_table_singular}_id` (`organization_id`, `author_id`)

## Common Mistakes

1. **Don't forget org scoping** — every query in a multi-tenant app must filter by `organizationId`
2. **Don't use raw SQL for simple queries** — Drizzle's query builder handles 95% of cases type-safely
3. **Always include `createdAt` and `updatedAt`** on every table
4. **Use `$returningId()`** after inserts to get the generated ID
5. **Don't skip indexes** — add them during schema definition, not as an afterthought
6. **Use transactions** for multi-table writes that must be atomic
7. **PlanetScale note**: PlanetScale doesn't support foreign key constraints — enforce referential integrity at the application level
