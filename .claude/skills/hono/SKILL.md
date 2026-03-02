---
name: hono
description: Patterns and best practices for building APIs with the Hono web framework on Bun. Use this skill whenever building HTTP routes, middleware, API endpoints, request handlers, or server-side logic with Hono. Also use when the user mentions Hono, web framework, API routes, middleware composition, or is building any backend HTTP service — even if they don't explicitly say "Hono."
---

# Hono Framework

Hono is a lightweight, ultrafast web framework designed for edge and Bun runtimes. It uses a middleware-based architecture with type-safe context passing.

## When to Read This

Read this skill when:

- Creating new API routes or endpoints
- Writing middleware (auth, logging, CORS, rate limiting)
- Structuring a Hono application with route groups
- Handling errors globally
- Working with typed context and request validation

## Project Structure

```
src/
├── index.ts              # App entry, global middleware, route mounting
├── routes/
│   ├── polls.ts          # Domain route module
│   └── campaigns.ts
├── middleware/
│   ├── auth.ts           # Auth middleware
│   ├── logger.ts         # Structured logging
│   ├── cors.ts           # CORS config
│   └── error-handler.ts  # Global error boundary
├── services/             # Business logic (no HTTP concerns)
└── types/                # Shared types
```

## App Entry Pattern

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/error-handler";
import { pollRoutes } from "./routes/polls";
import { campaignRoutes } from "./routes/campaigns";
import { healthRoutes } from "./routes/health";

// Type-safe env bindings
type Bindings = {
  DATABASE_URL: string;
  REDIS_URL: string;
};

// Type-safe context variables set by middleware
type Variables = {
  requestId: string;
  userId: string | null;
  orgId: string | null;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Global middleware — order matters
app.use("*", requestId());
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["https://admin.example.com", "https://example.com"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization", "X-Org-Id"],
    credentials: true,
  }),
);

// Error handler wraps everything
app.onError(errorHandler);

// Mount route groups
app.route("/health", healthRoutes);
app.route("/admin/api", adminRoutes);
app.route("/api/v1", apiRoutes);

export default app;
```

## Route Module Pattern

Each route file exports a Hono instance that gets mounted:

```typescript
// routes/polls.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { adminAuth } from "../middleware/admin-auth";
import { rbac } from "../middleware/rbac";

const polls = new Hono();

// Route-level middleware
polls.use("*", adminAuth());

// GET with query params
polls.get("/", rbac("viewer"), async (c) => {
  const page = Number(c.req.query("page") ?? "1");
  const limit = Number(c.req.query("limit") ?? "20");
  const orgId = c.get("orgId");

  const results = await pollService.list({ orgId, page, limit });
  return c.json(results);
});

// POST with Zod validation
const createPollSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1)).min(2).max(10),
  format: z.enum(["standard", "slider", "ranked", "image"]),
});

polls.post(
  "/",
  rbac("editor"),
  zValidator("json", createPollSchema),
  async (c) => {
    const body = c.req.valid("json");
    const userId = c.get("userId");
    const orgId = c.get("orgId");

    const poll = await pollService.create({ ...body, authorId: userId, orgId });
    return c.json(poll, 201);
  },
);

// Dynamic params
polls.get("/:id", rbac("viewer"), async (c) => {
  const id = c.req.param("id");
  const poll = await pollService.getById(id);
  if (!poll) return c.json({ error: "Not found" }, 404);
  return c.json(poll);
});

export { polls as pollRoutes };
```

## Middleware Pattern

Middleware in Hono uses `next()` to pass control:

```typescript
// middleware/admin-auth.ts
import { createMiddleware } from "hono/factory";

export const adminAuth = () =>
  createMiddleware(async (c, next) => {
    const session = c.req.header("Authorization");
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const user = await validateSession(session);
    if (!user) {
      return c.json({ error: "Invalid session" }, 401);
    }

    // Set typed context variables for downstream handlers
    c.set("userId", user.id);
    c.set("orgId", c.req.header("X-Org-Id") ?? null);

    await next();
  });
```

### Org-Scoping Middleware

```typescript
// middleware/org-scope.ts
export const orgScope = () =>
  createMiddleware(async (c, next) => {
    const orgId = c.req.header("X-Org-Id");
    if (!orgId) {
      return c.json({ error: "X-Org-Id header required" }, 400);
    }

    // Verify user belongs to this org
    const membership = await getMembership(c.get("userId"), orgId);
    if (!membership) {
      return c.json({ error: "Not a member of this organization" }, 403);
    }

    c.set("orgId", orgId);
    c.set("orgRole", membership.role);
    await next();
  });
```

## Error Handling

Use a global error handler plus typed errors:

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, message, "FORBIDDEN");
  }
}

// middleware/error-handler.ts
import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
        code: err.code,
      },
      err.statusCode as any,
    );
  }

  // Unexpected error — log full details, return generic message
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    500,
  );
};
```

## Key Patterns

### Response Helpers

```typescript
// Consistent envelope for admin API
function paginated<T>(data: T[], total: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}
```

### Rate Limiting Per Route

```typescript
import { rateLimiter } from "hono-rate-limiter";

// Different limits for different routes
apiRoutes.use(
  "*",
  rateLimiter({
    windowMs: 60_000,
    limit: 100,
    keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "unknown",
  }),
);

authRoutes.use(
  "/login",
  rateLimiter({
    windowMs: 300_000, // 5 min
    limit: 5,
    keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "unknown",
  }),
);
```

### Audit Trail Middleware

```typescript
// Append to audit log on mutations
export const audit = () =>
  createMiddleware(async (c, next) => {
    await next();

    if (["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
      await db.insert(adminAuditLog).values({
        userId: c.get("userId"),
        orgId: c.get("orgId"),
        action: `${c.req.method} ${c.req.path}`,
        statusCode: c.res.status,
        ipAddress: c.req.header("x-forwarded-for"),
        userAgent: c.req.header("user-agent"),
      });
    }
  });
```

## Common Mistakes

1. **Don't use `app.all()`** for route groups — use `app.route()` to mount sub-routers
2. **Don't mutate `c.req`** — use `c.set()` / `c.get()` for passing data through middleware
3. **Don't forget `await next()`** in middleware — it's required to continue the chain
4. **Validate at the edge** — use `zValidator` on routes, not manual parsing in handlers
5. **Keep handlers thin** — extract business logic into services, handlers only do HTTP concerns

## Testing

```typescript
// Use Hono's built-in test helper
import { app } from "../src/index";

describe("GET /admin/api/items", () => {
  it("returns paginated items", async () => {
    const res = await app.request("/admin/api/items?page=1&limit=10", {
      headers: {
        Authorization: "Bearer test-token",
        "X-Org-Id": "org_123",
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination).toBeDefined();
    expect(body.data).toBeInstanceOf(Array);
  });
});
```
