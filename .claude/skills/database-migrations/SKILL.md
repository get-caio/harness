---
description: "Patterns for Prisma migrate dev workflow, expand-contract zero-downtime schema changes, rollback procedures, and coordinating migrations across team members. Use for any schema change — not for query optimization or ORM setup."
---

# Database Migrations Skill — Safe Schema Changes

## When to Use

Reference this skill when:

- Creating or modifying Prisma schema
- Running database migrations
- Handling zero-downtime schema changes
- Rolling back failed migrations
- Coordinating schema changes across team members

## Prisma Migration Workflow

### Creating Migrations

```bash
# After modifying prisma/schema.prisma:
bunx prisma migrate dev --name descriptive_name

# Examples:
bunx prisma migrate dev --name add_user_table
bunx prisma migrate dev --name add_training_plan_status_field
bunx prisma migrate dev --name create_workout_log_index
```

### Migration Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name

Examples:
20240115120000_add_user_table
20240115130000_add_training_plan_relations
20240116090000_add_status_enum_to_plans
```

### Naming Rules

- Use snake_case
- Start with verb: `add_`, `create_`, `remove_`, `rename_`, `update_`
- Be specific: `add_email_to_users` not `update_users`
- Reference the table/entity affected

## Safe Migration Patterns

### Adding a Column

```prisma
// Safe: nullable column with default
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  // NEW: safe because nullable
  avatarUrl String?
}
```

### Adding a Required Column

```prisma
// Step 1: Add as nullable
model User {
  status String?
}

// Step 2: Backfill data
// In a migration SQL file:
// UPDATE "User" SET "status" = 'active' WHERE "status" IS NULL;

// Step 3: Make required (separate migration)
model User {
  status String @default("active")
}
```

### Renaming a Column

```sql
-- DANGER: Prisma doesn't detect renames — it drops and creates
-- Use raw SQL migration instead:
ALTER TABLE "User" RENAME COLUMN "name" TO "displayName";
```

### Removing a Column

```
1. Remove all code references first
2. Deploy code that doesn't use the column
3. Then remove from schema and migrate
4. Never remove column and code in same deploy
```

### Adding an Index

```prisma
// Safe: non-blocking in PostgreSQL
model WorkoutLog {
  id        String   @id @default(cuid())
  userId    String
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}
```

### Enum Changes

```prisma
// Safe: adding a new value
enum PlanStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED  // NEW: safe to add
}

// DANGEROUS: removing or renaming a value
// Must backfill existing rows first
```

## Zero-Downtime Migration Strategy

### The Expand-Contract Pattern

```
Phase 1: EXPAND (add new, keep old)
- Add new column/table
- Deploy code that writes to BOTH old and new
- Backfill new from old

Phase 2: MIGRATE (switch reads)
- Deploy code that reads from new
- Verify correctness

Phase 3: CONTRACT (remove old)
- Deploy code that only uses new
- Remove old column/table in separate migration
```

### Example: Renaming `name` to `displayName`

```
Step 1: Add displayName (nullable)
Step 2: Deploy code that writes to both name AND displayName
Step 3: Backfill: UPDATE "User" SET "displayName" = "name" WHERE "displayName" IS NULL
Step 4: Deploy code that reads from displayName
Step 5: Make displayName required
Step 6: Deploy code that stops writing to name
Step 7: Remove name column
```

## Rollback Strategy

### Before Migrating

```bash
# Always create a backup point
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use Prisma's built-in
bunx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-migrations prisma/migrations \
  --script > rollback.sql
```

### Rolling Back

```bash
# Option 1: Prisma migrate (if migration hasn't been applied to prod)
bunx prisma migrate resolve --rolled-back MIGRATION_NAME

# Option 2: Manual SQL rollback
psql $DATABASE_URL < rollback.sql

# Option 3: Full restore (nuclear option)
psql $DATABASE_URL < backup_TIMESTAMP.sql
```

### Rollback Rules

1. **Always have a rollback plan** before running migrations
2. **Test rollback** in staging before production
3. **Additive migrations are safe** — rollback = remove new column
4. **Destructive migrations need manual rollback SQL**
5. **Data migrations may not be reversible** — backup first

## Team Coordination

### Schema Ownership

```
Rule: ONE engineer owns the schema per sprint/phase.

Why: Concurrent schema changes create unmergeable migration conflicts.

How:
- Ticket schema changes are assigned to one person
- Other engineers request schema changes via ticket comments
- Schema owner batches and creates migrations
```

### Handling Migration Conflicts

```bash
# When two engineers create migrations on different branches:

# Engineer B (has conflict):
1. Delete their local migration folder
2. Pull main (gets Engineer A's migration)
3. Re-run: bunx prisma migrate dev --name their_change
4. This creates a new migration AFTER Engineer A's
```

### Migration Review Checklist

Before merging a migration PR:

- [ ] Migration is additive (no drops without expand-contract)
- [ ] Rollback SQL exists for destructive changes
- [ ] No data loss risk
- [ ] Index additions are non-blocking
- [ ] Enum changes don't remove existing values
- [ ] Large table changes have been tested for lock time
- [ ] Backfill scripts exist for required column additions

## Production Migration Checklist

```bash
# 1. Verify migration in staging first
bunx prisma migrate deploy  # on staging

# 2. Check migration status
bunx prisma migrate status

# 3. Backup production
pg_dump $DATABASE_URL > pre_migration_backup.sql

# 4. Run migration
bunx prisma migrate deploy  # on production

# 5. Verify
bunx prisma migrate status
# Test critical queries

# 6. Monitor
# Watch error rates for 15 minutes
# Check query performance
```

## Key Principles

1. **Additive first** — add before removing, expand before contracting
2. **One schema owner** — prevent migration conflicts
3. **Always have rollback** — test it before you need it
4. **Never drop in production** — use expand-contract
5. **Backup before migrate** — always, no exceptions
6. **Test in staging** — run exact migration before production
