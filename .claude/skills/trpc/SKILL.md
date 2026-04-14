---
name: trpc
description: Type-safe API patterns using tRPC with Next.js — router setup, procedures, client integration, and superjson transformer.
version: 1.0.0
---

# tRPC Skill

Type-safe API patterns using tRPC with Next.js. Reference this when building API routes and client-side data fetching.

## Setup

### Router Structure

```
src/
├── server/
│   ├── trpc.ts           # tRPC initialization
│   ├── context.ts        # Request context
│   └── routers/
│       ├── index.ts      # Root router (merges all)
│       ├── user.ts       # User procedures
│       ├── plan.ts       # Training plan procedures
│       └── workout.ts    # Workout procedures
├── app/
│   └── api/
│       └── trpc/
│           └── [trpc]/
│               └── route.ts  # tRPC HTTP handler
└── lib/
    └── trpc.ts           # Client-side tRPC hooks
```

### Server Setup

```typescript
// src/server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceAuth);

// Middleware to enforce authentication
function enforceAuth({ ctx, next }) {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session, // Now typed as non-null
    },
  });
}
```

### Context

```typescript
// src/server/context.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function createContext(opts: { req: Request }) {
  const session = await auth();

  return {
    db,
    session,
    req: opts.req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### Root Router

```typescript
// src/server/routers/index.ts
import { router } from "../trpc";
import { userRouter } from "./user";
import { planRouter } from "./plan";
import { workoutRouter } from "./workout";

export const appRouter = router({
  user: userRouter,
  plan: planRouter,
  workout: workoutRouter,
});

export type AppRouter = typeof appRouter;
```

---

## Router Patterns

### Basic CRUD Router

```typescript
// src/server/routers/plan.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const planRouter = router({
  // Get all plans for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.trainingPlan.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get single plan by ID
  byId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const plan = await ctx.db.trainingPlan.findUnique({
        where: { id: input.id },
        include: { workouts: true },
      });

      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Authorization check
      if (plan.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return plan;
    }),

  // Create new plan
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        sport: z.enum([
          "SWIMMING",
          "RUNNING",
          "CYCLING",
          "TRIATHLON",
          "CLIMBING",
        ]),
        eventDate: z.date().optional(),
        durationWeeks: z.number().int().min(4).max(52),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.trainingPlan.create({
        data: {
          ...input,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Update plan
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        status: z.enum(["ACTIVE", "PAUSED", "COMPLETED"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify ownership
      const plan = await ctx.db.trainingPlan.findUnique({ where: { id } });
      if (!plan || plan.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.trainingPlan.update({
        where: { id },
        data,
      });
    }),

  // Delete plan
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db.trainingPlan.findUnique({
        where: { id: input.id },
      });
      if (!plan || plan.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.trainingPlan.delete({ where: { id: input.id } });
    }),
});
```

---

## Client Usage

### Setup Client

```typescript
// src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers";

export const trpc = createTRPCReact<AppRouter>();
```

### Provider Setup

```typescript
// src/app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from '@/lib/trpc'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  )
}
```

### Using in Components

```typescript
// Query
function PlanList() {
  const { data: plans, isLoading } = trpc.plan.list.useQuery()

  if (isLoading) return <Spinner />

  return (
    <ul>
      {plans?.map(plan => (
        <li key={plan.id}>{plan.name}</li>
      ))}
    </ul>
  )
}

// Mutation
function CreatePlanButton() {
  const utils = trpc.useUtils()

  const createPlan = trpc.plan.create.useMutation({
    onSuccess: () => {
      // Invalidate list to refetch
      utils.plan.list.invalidate()
    },
  })

  return (
    <button
      onClick={() => createPlan.mutate({
        name: 'My Plan',
        sport: 'RUNNING',
        durationWeeks: 12,
      })}
      disabled={createPlan.isPending}
    >
      {createPlan.isPending ? 'Creating...' : 'Create Plan'}
    </button>
  )
}

// Query with parameters
function PlanDetail({ planId }: { planId: string }) {
  const { data: plan } = trpc.plan.byId.useQuery({ id: planId })

  if (!plan) return null

  return <div>{plan.name}</div>
}
```

---

## Error Handling

### Standard Error Codes

| Code                    | HTTP Status | Use Case               |
| ----------------------- | ----------- | ---------------------- |
| `UNAUTHORIZED`          | 401         | Not logged in          |
| `FORBIDDEN`             | 403         | No permission          |
| `NOT_FOUND`             | 404         | Resource doesn't exist |
| `BAD_REQUEST`           | 400         | Invalid input          |
| `INTERNAL_SERVER_ERROR` | 500         | Unexpected error       |

### Custom Error Data

```typescript
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Plan limit reached",
  cause: {
    maxPlans: 5,
    currentPlans: 5,
  },
});
```

### Client-Side Error Handling

```typescript
const createPlan = trpc.plan.create.useMutation({
  onError: (error) => {
    if (error.data?.code === "FORBIDDEN") {
      toast.error("You do not have permission");
    } else {
      toast.error(error.message);
    }
  },
});
```

---

## Optimistic Updates

```typescript
const utils = trpc.useUtils();

const updatePlan = trpc.plan.update.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await utils.plan.byId.cancel({ id: newData.id });

    // Snapshot previous value
    const previous = utils.plan.byId.getData({ id: newData.id });

    // Optimistically update
    utils.plan.byId.setData({ id: newData.id }, (old) => ({
      ...old!,
      ...newData,
    }));

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    utils.plan.byId.setData({ id: newData.id }, context?.previous);
  },
  onSettled: (data, err, newData) => {
    // Always refetch after
    utils.plan.byId.invalidate({ id: newData.id });
  },
});
```

---

## Testing

```typescript
// tests/routers/plan.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory } from "@trpc/server";
import { appRouter } from "@/server/routers";
import { createTestContext } from "@/tests/helpers";

const createCaller = createCallerFactory(appRouter);

describe("plan router", () => {
  let caller: ReturnType<typeof createCaller>;
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser();
    const ctx = await createTestContext({ userId: testUser.id });
    caller = createCaller(ctx);
  });

  it("creates a plan for authenticated user", async () => {
    const plan = await caller.plan.create({
      name: "Marathon Prep",
      sport: "RUNNING",
      durationWeeks: 16,
    });

    expect(plan.name).toBe("Marathon Prep");
    expect(plan.userId).toBe(testUser.id);
  });

  it("throws UNAUTHORIZED for unauthenticated user", async () => {
    const ctx = await createTestContext({ userId: null });
    const unauthCaller = createCaller(ctx);

    await expect(unauthCaller.plan.list()).rejects.toThrow("UNAUTHORIZED");
  });
});
```

---

## Best Practices

1. **Always validate input** with Zod schemas
2. **Always check authorization** before accessing resources
3. **Use `protectedProcedure`** for authenticated routes
4. **Keep routers focused** — one domain per router
5. **Use transactions** for multi-step mutations
6. **Invalidate queries** after mutations
7. **Handle errors gracefully** with proper codes
