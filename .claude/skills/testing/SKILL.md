---
description: "Patterns for bun:test + Testing Library unit, component and integration tests — Bun's built-in runner, happy-dom, test factories, MSW handler setup, interaction tests with userEvent, and integration tests hitting a real DB. Use for in-process tests; for browser/E2E flows use e2e-testing instead."
---

# Testing Skill

Patterns for unit and component testing in CAIO incubator projects using Bun's built-in test runner (`bun:test`) and Testing Library. The harness standardizes on Bun's runner; do not add Vitest or Jest.

For E2E browser testing, see `.claude/skills/e2e-testing/SKILL.md`.

**Which test to write comes from the Testing Policy in `HARNESS.md`.** User-facing flows get a Playwright e2e spec first. This skill covers the rest: integration tests against a real test database for API routes and server actions, and unit tests for pure logic. Do not use component tests with mocked data layers as a substitute for an e2e spec.

## Stack

- **bun:test** — Bun's built-in runner (Jest-compatible API: `describe`, `it`, `expect`, `mock`, `spyOn`)
- **happy-dom** — DOM for component tests, registered globally through a preload
- **@testing-library/react** — React component testing
- **@testing-library/jest-dom** — DOM matchers
- **msw** (v2) — API mocking at the network boundary

## Setup

### 1. Install Dependencies

```bash
bun add -d @happy-dom/global-registrator @testing-library/react @testing-library/jest-dom @testing-library/user-event msw@2
```

Pin MSW to v2. MSW 3 (checked with 3.0.3 on Bun 1.3.5) does not intercept requests under `bun test`, so every mocked call reaches the network instead. Recheck before moving to v3.

### 2. Bun Test Configuration

```toml
# bunfig.toml
[test]
preload = ["./tests/happydom.ts", "./tests/setup.ts"]
coverageSkipTestFiles = true
```

Bun reads the `@/*` path alias from `tsconfig.json`, so no separate alias config is needed.

All test files share one process, so the happy-dom preload gives every test a DOM, server tests included. Server SDKs that refuse to load in a browser-like environment (the Anthropic SDK does) need either a module stub with `mock.module` (see `ai-integration`) or a separate `bun test` run without the DOM preload. Don't try to register happy-dom per file: the module cache is shared, so the DOM leaks into later files and Testing Library's `screen` binds to the wrong document.

### 3. Preload Files

```typescript
// tests/happydom.ts — must load before Testing Library touches the DOM
import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register();
```

```typescript
// tests/setup.ts
import { afterAll, afterEach, beforeAll, expect } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { server } from "./mocks/server";

expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// MSW setup
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// tests/matchers.d.ts — types for the jest-dom matchers on bun:test's expect
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "bun:test" {
  interface Matchers<T> extends TestingLibraryMatchers<
    typeof expect.stringContaining,
    T
  > {}
  interface AsymmetricMatchers extends TestingLibraryMatchers {}
}
```

### 4. Package.json Scripts

```json
{
  "scripts": {
    "test": "bun test ./src ./app ./lib ./tests/integration",
    "test:watch": "bun test --watch ./src ./app ./lib ./tests/integration",
    "test:coverage": "bun test --coverage ./src ./app ./lib ./tests/integration",
    "test:integration": "bun test ./tests/integration",
    "test:e2e": "playwright test"
  }
}
```

`bun test` always runs Bun's built-in runner and ignores the `test` script; `bun run test` runs the script. Either works here because the script passes the same roots.

For E2E scripts, see the `e2e-testing` skill.

## Test Structure

### File Organization

```
src/
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx        # Co-located unit tests
├── actions/
│   ├── plans.ts
│   └── plans.test.ts
tests/
├── setup.ts                    # Global test setup
├── factories/                  # Test data factories
│   ├── index.ts
│   ├── user.ts
│   └── plan.ts
├── mocks/                      # MSW mocks
│   ├── handlers.ts
│   └── server.ts
└── integration/                # Integration tests
    └── plan-flow.test.ts
```

For E2E test structure, see `.claude/skills/e2e-testing/SKILL.md`.

Run unit and integration tests with `bun test ./src ./app ./lib ./tests/integration`, not a bare `bun test`. Bun also collects `*.spec.ts` files, so a bare run would pick up the Playwright specs in `tests/e2e/` and fail on them. Run those with `bunx playwright test`. The listed roots cover colocated tests under `src/`, `app/` and `lib/` plus `tests/integration/`; roots the repo does not have are skipped, so keep the full list rather than trimming it.

## Test Patterns

### Unit Test: Pure Functions

```typescript
// lib/utils.test.ts
import { describe, it, expect } from "bun:test";
import { cn, formatDuration, calculateProgress } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "end")).toBe("base end");
  });

  it("merges tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatDuration", () => {
  it("formats minutes to readable string", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(120)).toBe("2h");
  });
});

describe("calculateProgress", () => {
  it("returns percentage of completed workouts", () => {
    expect(calculateProgress(5, 10)).toBe(50);
  });

  it("handles zero total", () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it("caps at 100%", () => {
    expect(calculateProgress(15, 10)).toBe(100);
  });
});
```

### Component Test: Rendering

```typescript
// components/PlanCard.test.tsx
import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import { PlanCard } from './PlanCard'
import { createTestPlan } from '@/tests/factories'

describe('PlanCard', () => {
  it('renders plan name and goal', () => {
    const plan = createTestPlan({ name: 'Marathon Training', goal: 'marathon' })

    render(<PlanCard plan={plan} />)

    expect(screen.getByText('Marathon Training')).toBeInTheDocument()
    expect(screen.getByText('marathon')).toBeInTheDocument()
  })

  it('shows progress bar when provided', () => {
    const plan = createTestPlan({ progress: 75 })

    render(<PlanCard plan={plan} />)

    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toHaveAttribute('aria-valuenow', '75')
  })

  it('displays "No workouts" for empty plan', () => {
    const plan = createTestPlan({ weeks: [] })

    render(<PlanCard plan={plan} />)

    expect(screen.getByText('No workouts scheduled')).toBeInTheDocument()
  })
})
```

### Component Test: Interactions

```typescript
// components/PlanEditor.test.tsx
import { describe, it, expect, mock } from 'bun:test'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlanEditor } from './PlanEditor'
import { createTestPlan } from '@/tests/factories'

describe('PlanEditor', () => {
  it('calls onSave with updated data when submitted', async () => {
    const user = userEvent.setup()
    const onSave = mock()
    const plan = createTestPlan({ name: 'Original Name' })

    render(<PlanEditor plan={plan} onSave={onSave} />)

    // Change the name
    const nameInput = screen.getByLabelText('Plan Name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Name')

    // Submit
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Name' })
    )
  })

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup()

    render(<PlanEditor plan={createTestPlan()} onSave={mock()} />)

    const nameInput = screen.getByLabelText('Plan Name')
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('disables submit while saving', async () => {
    const user = userEvent.setup()
    const onSave = mock(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<PlanEditor plan={createTestPlan()} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })
})
```

### Test Factories

```typescript
// tests/factories/plan.ts
import { faker } from "@faker-js/faker";

interface TestPlan {
  id: string;
  name: string;
  goal: string;
  weeks: TestWeek[];
  progress?: number;
  createdAt: Date;
  userId: string;
}

interface CreateTestPlanOptions {
  id?: string;
  name?: string;
  goal?: string;
  weeks?: TestWeek[];
  progress?: number;
  userId?: string;
}

export function createTestPlan(options: CreateTestPlanOptions = {}): TestPlan {
  return {
    id: options.id ?? faker.string.uuid(),
    name: options.name ?? faker.lorem.words(3),
    goal: options.goal ?? faker.helpers.arrayElement(["marathon", "5k", "10k"]),
    weeks: options.weeks ?? [createTestWeek(), createTestWeek({ number: 2 })],
    progress: options.progress,
    createdAt: new Date(),
    userId: options.userId ?? faker.string.uuid(),
  };
}

export function createTestWeek(options: Partial<TestWeek> = {}): TestWeek {
  return {
    id: options.id ?? faker.string.uuid(),
    number: options.number ?? 1,
    workouts: options.workouts ?? [createTestWorkout()],
  };
}

export function createTestWorkout(
  options: Partial<TestWorkout> = {},
): TestWorkout {
  return {
    id: options.id ?? faker.string.uuid(),
    type:
      options.type ??
      faker.helpers.arrayElement(["run", "rest", "cross-train"]),
    duration: options.duration ?? faker.number.int({ min: 20, max: 90 }),
    description: options.description ?? faker.lorem.sentence(),
  };
}
```

### Frontend-First Development with MSW

Build UI before backend by mocking API responses:

```typescript
// src/mocks/handlers.ts — Define expected API shape
import { http, HttpResponse } from "msw";

export const handlers = [
  // Define what the API WILL return (before it exists)
  http.get("/api/workouts", () => {
    return HttpResponse.json([
      { id: "1", title: "Easy Run", duration: 30, status: "scheduled" },
      { id: "2", title: "Intervals", duration: 45, status: "completed" },
    ]);
  }),
];

// src/mocks/browser.ts — For development
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// Start in development (e.g., in app entry point)
if (process.env.NODE_ENV === "development") {
  worker.start();
}
```

**Workflow:**

1. **Define types** — Shared between frontend and (future) backend
2. **Write MSW handlers** — Mock what APIs will return
3. **Build UI** — Components fetch from mocked endpoints
4. **When UI is solid** — Implement real backend
5. **Remove mocks** — Or keep for tests

This reveals what APIs actually need before building them. The mock handlers become your API contract.

---

### MSW Mocking

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/plans", () => {
    return HttpResponse.json([
      { id: "1", name: "Plan 1", goal: "marathon" },
      { id: "2", name: "Plan 2", goal: "5k" },
    ]);
  }),

  http.post("/api/plans", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: "3", ...body }, { status: 201 });
  }),

  http.delete("/api/plans/:id", ({ params }) => {
    return HttpResponse.json({ success: true });
  }),
];

// tests/mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

### Integration Tests

```typescript
// tests/integration/plan-creation.test.ts
import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import { db } from "@/lib/db";
import { createTestUser } from "../factories";

describe("Plan Creation Flow", () => {
  beforeEach(async () => {
    // Clean database
    await db.workout.deleteMany();
    await db.week.deleteMany();
    await db.trainingPlan.deleteMany();
    await db.user.deleteMany();
  });

  it("creates plan with all weeks and workouts", async () => {
    const user = await createTestUser();

    const result = await createPlanWithWorkouts({
      userId: user.id,
      name: "Test Plan",
      goal: "marathon",
      weeks: 16,
    });

    // Verify plan
    expect(result.plan.name).toBe("Test Plan");
    expect(result.plan.userId).toBe(user.id);

    // Verify weeks
    const plan = await db.trainingPlan.findUnique({
      where: { id: result.plan.id },
      include: { weeks: { include: { workouts: true } } },
    });

    expect(plan?.weeks).toHaveLength(16);
    expect(plan?.weeks.every((w) => w.workouts.length > 0)).toBe(true);
  });

  it("rolls back on failure", async () => {
    const user = await createTestUser();

    // Force failure (injecting a fault is fine; replacing the DB layer is not)
    spyOn(db.week, "create").mockRejectedValueOnce(new Error("DB error"));

    await expect(
      createPlanWithWorkouts({
        userId: user.id,
        name: "Test",
        goal: "marathon",
        weeks: 4,
      }),
    ).rejects.toThrow();

    // Nothing should be saved
    const plans = await db.trainingPlan.count();
    expect(plans).toBe(0);
  });
});
```

## Commands

```bash
# Run all unit and integration tests (never a bare `bun test` — it collects Playwright specs)
bun test ./src ./app ./lib ./tests/integration

# Watch mode
bun run test:watch

# Run one file (prefix ./ so Bun treats it as a path, not a name filter)
bun test ./src/components/Button.test.tsx

# Run tests whose name matches a pattern
bun test ./src -t "createPlan"

# With coverage
bun run test:coverage

# E2E (Playwright, separate runner)
bunx playwright test
```

## Test Requirements (MANDATORY)

**⚠️ Every ticket MUST have tests. No exceptions without human approval.**

| Requirement                    | Minimum                               |
| ------------------------------ | ------------------------------------- |
| Test files per ticket          | At least 1 test file created/modified |
| Tests per acceptance criterion | At least 1 test                       |
| Test:source ratio              | >0.3 (1 test file per 3 source files) |
| Coverage                       | Should not decrease                   |

**If you believe a ticket doesn't need tests:**

1. STOP — do not commit without tests
2. Create a spec decision in `specs/decisions/` explaining why
3. Mark the ticket BLOCKED
4. Wait for human approval

"I'll add tests later" is never acceptable. Tests are part of the implementation.

---

## Best Practices

### ✅ Do

- Write tests before code, picking the type from the HARNESS.md Testing Policy
- Test behavior, not implementation
- Use meaningful test descriptions
- Keep tests focused (one concept per test)
- Use factories for test data
- Mock third-party APIs at the network boundary (MSW); never mock the code under test or the DB layer

### ❌ Don't

- Test implementation details
- Test framework code
- Write tests that always pass
- Use magic numbers/strings
- Leave console.logs in tests
- Skip error cases
- Skip tests "to save time" — tests ARE the work
- Commit code without corresponding tests
