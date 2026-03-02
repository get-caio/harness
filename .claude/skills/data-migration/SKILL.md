---
name: data-migration
description: Patterns for large-scale data migration — schema mapping, batch processing, dual-write patterns, validation, rollback, and zero-downtime cutover. Use this skill when migrating databases, transforming schemas between V1 and V2, running bulk data operations, or planning zero-downtime database cutovers. Trigger on data migration, schema migration, V1 to V2, database cutover, ETL, bulk import, or data transformation.
---

# Data Migration

Patterns for large-scale data migration between database versions with entity renames, schema changes, and zero-downtime cutover.

## When to Read This

- Planning V1→V2 schema migration
- Writing batch data transformation scripts
- Implementing dual-write for zero-downtime cutover
- Validating migrated data
- Rolling back failed migrations

## Entity Rename Mapping

When renaming tables/columns between versions, maintain an explicit mapping:

```typescript
// V1 → V2 entity mapping (customize per project)
const ENTITY_MAP = {
  // Tables
  old_table_name: "new_table_name",
  legacy_users: "users",
  user_groups: "organizations",
  items: "products",

  // Columns
  groupId: "organizationId",
  itemId: "productId",
  legacyStatus: "status",
} as const;
```

## Migration Script Pattern

```typescript
// tools/migration/migrate-products.ts
import { db as v1db } from "./v1-connection";
import { db as v2db } from "./v2-connection";

const BATCH_SIZE = 1000;

async function migrateProducts() {
  let offset = 0;
  let totalMigrated = 0;
  let errors: Array<{ id: string; error: string }> = [];

  console.log("Starting product migration...");

  while (true) {
    // Read batch from V1
    const v1Records = await v1db.execute(sql`
      SELECT * FROM items
      WHERE is_deleted = 0
      ORDER BY id
      LIMIT ${BATCH_SIZE} OFFSET ${offset}
    `);

    if (v1Records.length === 0) break;

    // Transform and write to V2
    for (const v1Record of v1Records) {
      try {
        await v2db
          .insert(products)
          .values({
            id: v1Record.id, // Preserve IDs
            organizationId: v1Record.groupId, // Rename column
            createdBy: v1Record.userId,
            name: v1Record.title,
            type: mapType(v1Record.category), // Transform enum
            status: mapStatus(v1Record.status, v1Record.isActive),
            viewCount: v1Record.viewCount ?? 0,
            settings: transformSettings(v1Record), // Consolidate fields
            createdAt: v1Record.createdAt,
            updatedAt: v1Record.updatedAt ?? v1Record.createdAt,
          })
          .onDuplicateKeyUpdate({
            set: { updatedAt: v1Record.updatedAt }, // Idempotent — safe to rerun
          });

        totalMigrated++;
      } catch (err) {
        errors.push({ id: v1Record.id, error: String(err) });
      }
    }

    offset += BATCH_SIZE;
    console.log(`Migrated ${totalMigrated} products (${errors.length} errors)`);
  }

  // Write error report
  if (errors.length > 0) {
    await Bun.write(
      "migration-errors-products.json",
      JSON.stringify(errors, null, 2),
    );
  }

  console.log(
    `Migration complete: ${totalMigrated} products, ${errors.length} errors`,
  );
}

// Transform helpers — customize per project
function mapType(v1Category: string): string {
  const map: Record<string, string> = {
    basic: "standard",
    premium: "featured",
    bundle: "collection",
  };
  return map[v1Category] ?? "standard";
}

function mapStatus(v1Status: string, isActive: boolean): string {
  if (!isActive) return "archived";
  const map: Record<string, string> = {
    published: "active",
    draft: "draft",
    paused: "paused",
    deleted: "archived",
  };
  return map[v1Status] ?? "draft";
}
```

## Validation

```typescript
// Run after migration to verify data integrity
async function validateMigration() {
  const checks = [
    {
      name: "Record count matches",
      check: async () => {
        const [v1] = await v1db.execute(
          sql`SELECT COUNT(*) as c FROM items WHERE is_deleted = 0`,
        );
        const [v2] = await v2db.execute(
          sql`SELECT COUNT(*) as c FROM products`,
        );
        return { v1: v1.c, v2: v2.c, match: v1.c === v2.c };
      },
    },
    {
      name: "Aggregate totals match",
      check: async () => {
        const [v1] = await v1db.execute(
          sql`SELECT SUM(view_count) as c FROM items`,
        );
        const [v2] = await v2db.execute(
          sql`SELECT SUM(view_count) as c FROM products`,
        );
        return { v1: v1.c, v2: v2.c, match: v1.c === v2.c };
      },
    },
    {
      name: "All orgs have at least one member",
      check: async () => {
        const orphans = await v2db.execute(sql`
          SELECT o.id FROM organizations o
          LEFT JOIN org_members m ON o.id = m.organization_id
          WHERE m.id IS NULL
        `);
        return { orphans: orphans.length, match: orphans.length === 0 };
      },
    },
    {
      name: "No null required fields",
      check: async () => {
        const nullNames = await v2db.execute(sql`
          SELECT COUNT(*) as c FROM products WHERE name IS NULL OR name = ''
        `);
        return { nulls: nullNames[0].c, match: nullNames[0].c === 0 };
      },
    },
  ];

  for (const { name, check } of checks) {
    const result = await check();
    console.log(`${result.match ? "PASS" : "FAIL"} ${name}:`, result);
  }
}
```

## Dual-Write Pattern

During cutover, write to both databases:

```typescript
async function dualWrite(newData: NewRecord) {
  // Write to V2 (primary)
  const result = await v2db.insert(records).values(newData);

  // Write to V1 (legacy — for rollback safety)
  try {
    await v1db.execute(sql`
      INSERT INTO legacy_records (item_id, user_id, created_at)
      VALUES (${newData.productId}, ${newData.userId}, NOW())
    `);
  } catch {
    // V1 write failure is non-fatal during migration
    console.warn("V1 dual-write failed for record:", newData.productId);
  }

  return result;
}
```

## Migration Ordering

Run in dependency order (parents before children):

```
1. organizations (parent tables first)
2. users
3. org_members (join tables)
4. products (main entities)
5. product_variants (child entities)
6. orders
7. order_items
8. analytics (last — largest tables)
```

## Common Mistakes

1. **Always use `onDuplicateKeyUpdate`** — makes scripts idempotent and safe to rerun
2. **Preserve original IDs** — changing IDs breaks all foreign references
3. **Migrate in dependency order** — parent tables first, children second
4. **Validate after every batch** — don't wait until the end to find data issues
5. **Keep V1 running** for 30 days after cutover — rollback insurance
6. **Log everything** — errors, counts, timing. You'll need this for debugging.
7. **Test on a copy first** — never run migration scripts against production without a dry run
