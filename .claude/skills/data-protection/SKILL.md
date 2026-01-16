# Data Protection Skill

Legal compliance and data handling for CAIO projects. Getting this wrong means lawsuits, fines, and career-ending incidents.

## Why This Matters

- **GDPR fines:** Up to 4% of annual revenue or €20M
- **CCPA fines:** $2,500-$7,500 per violation
- **Reputational damage:** Users don't trust companies that mishandle data
- **Personal liability:** In some jurisdictions, officers can be held personally liable

---

## Core Principles

### 1. Data Minimization

Only collect what you need. If you don't have it, you can't lose it.

### 2. Purpose Limitation

Use data only for the stated purpose. No "we might need this later."

### 3. Storage Limitation

Don't keep data forever. Define retention periods.

### 4. Integrity & Confidentiality

Protect data from unauthorized access, loss, or destruction.

---

## Implementation Checklist

### User Registration

```typescript
// ✅ Collect minimum required data
const registrationSchema = z.object({
  email: z.string().email(), // Required for auth
  name: z.string().optional(), // Only if needed for personalization
  // ❌ DON'T collect: DOB, address, phone unless required
});

// ✅ Clear consent mechanism
interface ConsentRecord {
  userId: string;
  consentType: "terms" | "privacy" | "marketing";
  consentGiven: boolean;
  timestamp: Date;
  ipAddress: string; // For audit trail
  version: string; // Which policy version they agreed to
}
```

### Data Storage

```prisma
// schema.prisma

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?

  // Soft delete - NEVER hard delete user data
  deletedAt DateTime?

  // Audit trail
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Consent tracking
  consents  Consent[]
}

model Consent {
  id          String   @id @default(cuid())
  userId      String
  type        String   // 'terms', 'privacy', 'marketing'
  given       Boolean
  version     String   // Policy version
  ipAddress   String
  timestamp   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}
```

### Data Access Logging

```typescript
// lib/audit-log.ts
import { logger } from "./logger";

type DataAccessEvent = {
  userId: string;
  action: "view" | "export" | "modify" | "delete";
  dataType: string;
  targetId?: string;
  reason?: string;
};

export function logDataAccess(event: DataAccessEvent) {
  logger.info(
    {
      type: "data_access",
      ...event,
      timestamp: new Date().toISOString(),
    },
    `Data access: ${event.action} ${event.dataType}`,
  );
}

// Usage
logDataAccess({
  userId: session.user.id,
  action: "view",
  dataType: "user_profile",
  targetId: targetUserId,
});
```

---

## Required Features

### 1. Privacy Policy

Every app needs:

- What data you collect
- Why you collect it
- How long you keep it
- Who you share it with
- User rights (access, deletion, portability)

**Location:** `/privacy` or footer link

### 2. Cookie Consent (If EU Users)

```typescript
// components/CookieBanner.tsx
'use client'

import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) setShowBanner(true)
  }, [])

  const accept = (level: 'essential' | 'all') => {
    localStorage.setItem('cookie-consent', JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
    }))
    setShowBanner(false)

    if (level === 'all') {
      // Enable analytics, marketing cookies
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 w-full bg-white border-t p-4">
      <p>We use cookies to improve your experience.</p>
      <div className="flex gap-2 mt-2">
        <button onClick={() => accept('essential')}>
          Essential Only
        </button>
        <button onClick={() => accept('all')}>
          Accept All
        </button>
      </div>
    </div>
  )
}
```

### 3. Data Export (GDPR Article 20)

```typescript
// app/api/user/export/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gather all user data
  const userData = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      posts: true,
      comments: true,
      consents: true,
      // Include all related data
    },
  });

  // Log the export
  logDataAccess({
    userId: session.user.id,
    action: "export",
    dataType: "full_profile",
  });

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      data: userData,
    },
    {
      headers: {
        "Content-Disposition": `attachment; filename="user-data-${session.user.id}.json"`,
      },
    },
  );
}
```

### 4. Account Deletion (GDPR Article 17)

```typescript
// app/api/user/delete/route.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Soft delete - preserve for audit trail
  await db.user.update({
    where: { id: session.user.id },
    data: {
      deletedAt: new Date(),
      // Anonymize PII
      email: `deleted-${session.user.id}@anonymized.local`,
      name: null,
    },
  });

  // Log the deletion
  logDataAccess({
    userId: session.user.id,
    action: "delete",
    dataType: "account",
    reason: "user_request",
  });

  // Clear session
  // signOut()

  return NextResponse.json({ success: true });
}
```

### 5. Data Retention

```typescript
// scripts/cleanup-old-data.ts
// Run as cron job

import { db } from "@/lib/db";

const RETENTION_PERIODS = {
  deletedUsers: 90, // Days after soft delete
  sessions: 30, // Inactive sessions
  auditLogs: 365, // Keep audit logs for 1 year
  analytics: 180, // Anonymized analytics
};

async function cleanupOldData() {
  const now = new Date();

  // Remove permanently deleted users after retention period
  const deleteThreshold = new Date(
    now.getTime() - RETENTION_PERIODS.deletedUsers * 24 * 60 * 60 * 1000,
  );

  await db.user.deleteMany({
    where: {
      deletedAt: {
        lt: deleteThreshold,
      },
    },
  });

  // Clean up old sessions
  const sessionThreshold = new Date(
    now.getTime() - RETENTION_PERIODS.sessions * 24 * 60 * 60 * 1000,
  );

  await db.session.deleteMany({
    where: {
      updatedAt: {
        lt: sessionThreshold,
      },
    },
  });

  console.log("Data cleanup completed");
}
```

---

## What NOT to Do

### Never Log PII Directly

```typescript
// ❌ BAD
logger.info({ email: user.email, name: user.name }, "User logged in");

// ✅ GOOD
logger.info({ userId: user.id }, "User logged in");
```

### Never Store Passwords in Plain Text

```typescript
// ❌ BAD
await db.user.create({
  data: { password: req.body.password },
});

// ✅ GOOD
import { hash } from "bcrypt";
await db.user.create({
  data: { passwordHash: await hash(req.body.password, 12) },
});
```

### Never Share Data Without Consent

```typescript
// ❌ BAD - Sending to analytics without consent
trackEvent("signup", { email: user.email });

// ✅ GOOD - Check consent first
if (hasConsent(user.id, "analytics")) {
  trackEvent("signup", { userId: user.id });
}
```

### Never Expose Internal IDs in URLs

```typescript
// ❌ BAD - Sequential IDs leak data
/api/users/1
/api/users/2

// ✅ GOOD - UUIDs don't reveal count
/api/users/550e8400-e29b-41d4-a716-446655440000
```

---

## Compliance Checklist

### GDPR (If EU Users)

- [ ] Privacy policy explains data processing
- [ ] Cookie consent banner implemented
- [ ] User can export their data
- [ ] User can delete their account
- [ ] Data retention periods defined
- [ ] Data processing agreements with vendors
- [ ] Breach notification procedure documented

### CCPA (If California Users)

- [ ] Privacy policy includes CCPA disclosures
- [ ] "Do Not Sell My Info" link (if applicable)
- [ ] User can request data deletion
- [ ] User can opt out of data sale

### PCI-DSS (If Handling Payments)

- [ ] Never store full card numbers
- [ ] Use tokenization (Stripe handles this)
- [ ] Log access to payment data
- [ ] Encrypt payment data in transit

---

## Vendor Checklist

Before using any third-party service:

1. **Do they have a DPA?** (Data Processing Agreement)
2. **Where is data stored?** (EU adequacy for GDPR)
3. **What's their security posture?** (SOC 2, ISO 27001)
4. **Can you delete data?** (For right to erasure)

| Common Vendors | GDPR DPA | Data Location |
| -------------- | -------- | ------------- |
| Vercel         | Yes      | US/EU option  |
| Supabase       | Yes      | US/EU option  |
| Stripe         | Yes      | US/EU         |
| Sentry         | Yes      | US/EU option  |
| PostHog        | Yes      | US/EU option  |

---

## Incident: Data Breach Response

If user data is exposed:

1. **Contain** - Stop the leak immediately
2. **Assess** - What data, how many users
3. **Notify** - GDPR requires 72-hour notification to authorities
4. **Inform** - Affected users must be notified
5. **Document** - Full incident report
6. **Remediate** - Fix the vulnerability

**GDPR breach notification template:**

```
To: [Data Protection Authority]
Subject: Data Breach Notification - [Company Name]

Date of breach: [Date]
Date discovered: [Date]
Nature of breach: [Description]
Categories of data: [What was exposed]
Approximate number of users: [Count]
Likely consequences: [Impact assessment]
Measures taken: [Response actions]
Contact: [DPO or responsible person]
```

---

## Quick Reference

| Requirement      | Implementation   | Location           |
| ---------------- | ---------------- | ------------------ |
| Privacy policy   | Static page      | `/privacy`         |
| Cookie consent   | Banner component | Layout             |
| Data export      | API endpoint     | `/api/user/export` |
| Account deletion | API endpoint     | `/api/user/delete` |
| Soft delete      | Prisma schema    | `deletedAt` field  |
| Audit logging    | Logger wrapper   | `logDataAccess()`  |
| Consent tracking | Database table   | `Consent` model    |
