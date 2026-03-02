---
name: gdpr-consent
description: Patterns for GDPR/CCPA consent management — consent collection, granular preferences, data deletion, retention policies, and non-blocking consent banners. Use this skill when implementing privacy compliance, consent management, data deletion workflows, cookie consent, or privacy-safe data handling. Trigger on GDPR, CCPA, consent, privacy, data deletion, retention policy, cookie banner, or right to erasure.
---

# GDPR & Privacy Consent

Privacy-safe data handling patterns for publisher networks where consent varies by jurisdiction, CMP presence, and user choice.

## When to Read This

- Implementing consent collection and storage
- Building data deletion (right to erasure) workflows
- Designing non-blocking consent banners
- Handling mixed consent states across publisher sites
- Setting data retention policies

## Consent Tiers

```
┌─────────────────────────────────────────────────┐
│ Publisher has CMP → Read CMP consent             │
│   ├── Full consent → Tier-2 identity + analytics │
│   ├── Partial → Tier-1 identity + limited        │
│   └── Rejected → Session-only, no persistence    │
│                                                  │
│ Publisher has NO CMP                             │
│   ├── EU/UK visitor → Treat as no consent        │
│   └── US visitor → Implied consent (Tier-1)      │
└─────────────────────────────────────────────────┘
```

## Consent Storage

```typescript
// db/schema/consent.ts
export const userConsent = mysqlTable('user_consent', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  profileId: varchar('profile_id', { length: 128 }).notNull(),
  propertyId: varchar('property_id', { length: 128 }).notNull(),

  // Granular consent flags
  essential: boolean('essential').notNull().default(true),     // Always true
  analytics: boolean('analytics').notNull().default(false),
  targeting: boolean('targeting').notNull().default(false),
  crossSite: boolean('cross_site').notNull().default(false),   // Tier-2 identity

  // Metadata
  consentSource: mysqlEnum('consent_source', ['cmp', 'banner', 'implied', 'none']).notNull(),
  cmpVendor: varchar('cmp_vendor', { length: 100 }),
  ipCountry: varchar('ip_country', { length: 2 }),
  consentString: text('consent_string'),  // TCF consent string if available

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index('idx_consent_profile').on(table.profileId),
  uniqueIndex('idx_consent_profile_property').on(table.profileId, table.propertyId),
]);
```

## Non-Blocking Banner

The consent banner never blocks the poll experience:

```typescript
// Embed widget consent flow
function initConsent(config: { cmpDetected: boolean; country: string }) {
  if (config.cmpDetected) {
    // Read CMP consent — don't show our own banner
    const consent = readCMPConsent();
    return applyConsent(consent);
  }

  if (isEUCountry(config.country)) {
    // Show non-blocking banner at bottom of widget
    // User can interact with poll while banner is visible
    showConsentBanner({
      onAccept: () => applyConsent({ analytics: true, targeting: true }),
      onReject: () => applyConsent({ analytics: false, targeting: false }),
      onDismiss: () => applyConsent({ analytics: false, targeting: false }),
    });
    // Default: session-only until user acts
    return applyConsent({ analytics: false, targeting: false });
  }

  // US/non-regulated: implied consent for Tier-1
  return applyConsent({ analytics: true, targeting: false });
}
```

## Data Deletion (Right to Erasure)

```typescript
async function deleteUserData(profileId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Anonymize votes (keep aggregates, remove identity)
    await tx.update(votes)
      .set({ profileId: 'DELETED', ipAddress: null, userAgent: null })
      .where(eq(votes.profileId, profileId));

    // 2. Delete personal data
    await tx.delete(userConsent).where(eq(userConsent.profileId, profileId));
    await tx.delete(userProfiles).where(eq(userProfiles.id, profileId));
    await tx.delete(formResponses).where(eq(formResponses.profileId, profileId));

    // 3. Remove from Pinecone (if profile had indexed data)
    // Not typically needed — polls are org data, not personal data

    // 4. Log the deletion (for compliance audit)
    await tx.insert(dataDeleteLog).values({
      profileId,
      deletedAt: new Date(),
      tablesAffected: ['votes', 'user_consent', 'user_profiles', 'form_responses'],
    });
  });

  // 5. Invalidate cached data
  await redis.del(`profile:${profileId}`);
}
```

## Retention Policies

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| Vote records | 2 years | Anonymize (keep aggregates) |
| User profiles | 2 years from last activity | Hard delete |
| Consent records | 2 years | Hard delete |
| Form responses | 1 year | Hard delete |
| Analytics events | 90 days (raw), aggregated indefinitely | S3 lifecycle policy |
| Search logs | 90 days | Automated purge |
| Audit logs | 7 years | Immutable, never delete |

### Automated Purge Job

```typescript
// jobs/data-retention.ts — runs nightly
async function enforceRetention() {
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  // Anonymize old votes
  await db.update(votes)
    .set({ profileId: 'ANONYMIZED', ipAddress: null, userAgent: null })
    .where(and(
      lt(votes.createdAt, twoYearsAgo),
      ne(votes.profileId, 'ANONYMIZED'),
    ));

  // Delete old profiles with no recent activity
  await db.delete(userProfiles)
    .where(lt(userProfiles.lastSeenAt, twoYearsAgo));

  console.log(`Retention enforcement complete: ${new Date().toISOString()}`);
}
```

## Common Mistakes

1. **Never block the UI** on consent — show polls immediately, collect consent in parallel
2. **Don't assume consent** — EU/UK visitors with no CMP = no consent = session only
3. **Anonymize, don't delete votes** — aggregates are valuable, PII is not
4. **Log all deletions** — you need an audit trail to prove compliance
5. **Consent is per-property** — a user may consent on one publisher and not another
6. **TCF consent strings expire** — recheck on every session, don't cache indefinitely
