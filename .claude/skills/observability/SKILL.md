---
description: "Patterns for structured logging with Pino, request tracing with correlation IDs, Sentry error capture, health check endpoints, and alerting thresholds. Use when setting up production monitoring infrastructure — not for debugging a specific active incident."
---

# Observability Skill

Production monitoring, logging, and debugging infrastructure for CAIO projects. **If you can't see it, you can't fix it.**

## Why This Matters

Without observability:

- Bugs discovered by users, not by you
- Debugging takes hours instead of minutes
- No data for post-mortems
- Can't answer "what happened at 3am?"

## Core Components

### 1. Structured Logging

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    env: process.env.NODE_ENV,
    service: "your-app",
  },
});

// Usage
logger.info({ userId, action: "login" }, "User logged in");
logger.error({ err, requestId }, "Payment failed");
```

### 2. Request Tracing

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || randomUUID();

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  return response;
}
```

### 3. Error Boundaries with Reporting

```typescript
// components/ErrorBoundary.tsx
"use client";

import { Component, ReactNode } from "react";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
      "React error boundary caught error",
    );

    // Send to error tracking service
    // Sentry.captureException(error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
```

### 4. API Route Instrumentation

```typescript
// lib/api-wrapper.ts
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

type Handler = (req: NextRequest) => Promise<NextResponse>;

export function withLogging(handler: Handler): Handler {
  return async (req: NextRequest) => {
    const start = Date.now();
    const requestId = req.headers.get("x-request-id") || "unknown";

    logger.info(
      {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
      },
      "Request started",
    );

    try {
      const response = await handler(req);

      logger.info(
        {
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          status: response.status,
          duration: Date.now() - start,
        },
        "Request completed",
      );

      return response;
    } catch (error) {
      logger.error(
        {
          requestId,
          method: req.method,
          path: req.nextUrl.pathname,
          error: error instanceof Error ? error.message : "Unknown error",
          duration: Date.now() - start,
        },
        "Request failed",
      );

      throw error;
    }
  };
}
```

### 5. Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const checks = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: "unknown",
      memory: "unknown",
    },
  };

  // Database check
  try {
    await db.$queryRaw`SELECT 1`;
    checks.checks.database = "healthy";
  } catch {
    checks.checks.database = "unhealthy";
    checks.status = "degraded";
  }

  // Memory check
  const used = process.memoryUsage();
  const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
  checks.checks.memory = heapUsedMB < 512 ? "healthy" : "warning";

  return NextResponse.json(checks, {
    status: checks.status === "healthy" ? 200 : 503,
  });
}
```

---

## Integration Points

### Vercel (Recommended for CAIO)

```typescript
// Use Vercel's built-in logging
// Logs automatically captured from console.log, console.error

// For structured logging, use:
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### Sentry (Error Tracking)

```bash
bun add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```

### Axiom (Log Aggregation)

```bash
bun add @axiomhq/nextjs
```

```typescript
// next.config.js
const { withAxiom } = require("@axiomhq/nextjs");

module.exports = withAxiom({
  // your config
});
```

---

## What to Log

### Always Log

- User authentication events (login, logout, failed attempts)
- Authorization failures (403s)
- Payment events (success, failure, amounts)
- Data mutations (create, update, delete)
- External API calls (request, response, latency)
- Errors with full context

### Never Log

- Passwords or secrets
- Full credit card numbers
- Personal health information
- Session tokens (log hash only)
- Full request bodies with PII

### Log Levels

| Level   | Use For                                                  |
| ------- | -------------------------------------------------------- |
| `error` | Exceptions, failed operations, things that need alerts   |
| `warn`  | Degraded service, approaching limits, recoverable issues |
| `info`  | Business events, request lifecycle, audit trail          |
| `debug` | Detailed debugging, only in development                  |

---

## Alerts to Configure

| Alert                   | Threshold       | Severity |
| ----------------------- | --------------- | -------- |
| Error rate spike        | >1% of requests | Critical |
| Response time p95       | >2s             | Warning  |
| Health check failing    | 3 consecutive   | Critical |
| Memory usage            | >80%            | Warning  |
| Failed payments         | Any             | Critical |
| Failed logins (same IP) | >10/minute      | Warning  |

---

## Debugging Production Issues

### 1. Start with Health Check

```bash
curl https://your-app.vercel.app/api/health | jq
```

### 2. Check Recent Logs

- Vercel Dashboard → Logs
- Filter by request ID from error report

### 3. Reproduce Locally

```bash
# Get the request that failed
curl -v -X POST https://your-app.vercel.app/api/problematic-endpoint \
  -H "Content-Type: application/json" \
  -d '{"same": "payload"}'
```

### 4. Check External Dependencies

- Database: Connection pool exhaustion?
- External APIs: Rate limited? Down?
- Payment provider: Webhook failures?

---

## Checklist Before Production

- [ ] Health check endpoint exists and returns meaningful data
- [ ] Structured logging configured (not just console.log)
- [ ] Error boundary wraps all pages
- [ ] Sentry or equivalent configured
- [ ] All payment events logged
- [ ] All auth events logged
- [ ] Log rotation/retention configured
- [ ] Alert thresholds defined
- [ ] Runbook for common issues exists
