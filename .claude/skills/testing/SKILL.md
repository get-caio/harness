# Testing Skill

Patterns for unit and component testing in CAIO incubator projects using Vitest and Testing Library.

For E2E browser testing, see `.claude/skills/e2e-testing/SKILL.md`.

## Stack

- **Vitest** — Test runner (fast, ESM-native, Jest-compatible)
- **@testing-library/react** — React component testing
- **@testing-library/jest-dom** — DOM matchers
- **msw** — API mocking

## Setup

### 1. Install Dependencies

```bash
bun add -d vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event msw
```

### 2. Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3. Test Setup File

```typescript
// tests/setup.ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll } from 'vitest'
import { server } from './mocks/server'

// Clean up after each test
afterEach(() => {
  cleanup()
})

// MSW setup
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 4. Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

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

## Test Patterns

### Unit Test: Pure Functions

```typescript
// lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { cn, formatDuration, calculateProgress } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})

describe('formatDuration', () => {
  it('formats minutes to readable string', () => {
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(120)).toBe('2h')
  })
})

describe('calculateProgress', () => {
  it('returns percentage of completed workouts', () => {
    expect(calculateProgress(5, 10)).toBe(50)
  })

  it('handles zero total', () => {
    expect(calculateProgress(0, 0)).toBe(0)
  })

  it('caps at 100%', () => {
    expect(calculateProgress(15, 10)).toBe(100)
  })
})
```

### Component Test: Rendering

```typescript
// components/PlanCard.test.tsx
import { describe, it, expect } from 'vitest'
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
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlanEditor } from './PlanEditor'
import { createTestPlan } from '@/tests/factories'

describe('PlanEditor', () => {
  it('calls onSave with updated data when submitted', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
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
    
    render(<PlanEditor plan={createTestPlan()} onSave={vi.fn()} />)
    
    const nameInput = screen.getByLabelText('Plan Name')
    await user.clear(nameInput)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('disables submit while saving', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    render(<PlanEditor plan={createTestPlan()} onSave={onSave} />)
    
    await user.click(screen.getByRole('button', { name: 'Save' }))
    
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })
})
```

### Test Factories

```typescript
// tests/factories/plan.ts
import { faker } from '@faker-js/faker'

interface TestPlan {
  id: string
  name: string
  goal: string
  weeks: TestWeek[]
  progress?: number
  createdAt: Date
  userId: string
}

interface CreateTestPlanOptions {
  id?: string
  name?: string
  goal?: string
  weeks?: TestWeek[]
  progress?: number
  userId?: string
}

export function createTestPlan(options: CreateTestPlanOptions = {}): TestPlan {
  return {
    id: options.id ?? faker.string.uuid(),
    name: options.name ?? faker.lorem.words(3),
    goal: options.goal ?? faker.helpers.arrayElement(['marathon', '5k', '10k']),
    weeks: options.weeks ?? [createTestWeek(), createTestWeek({ number: 2 })],
    progress: options.progress,
    createdAt: new Date(),
    userId: options.userId ?? faker.string.uuid(),
  }
}

export function createTestWeek(options: Partial<TestWeek> = {}): TestWeek {
  return {
    id: options.id ?? faker.string.uuid(),
    number: options.number ?? 1,
    workouts: options.workouts ?? [createTestWorkout()],
  }
}

export function createTestWorkout(options: Partial<TestWorkout> = {}): TestWorkout {
  return {
    id: options.id ?? faker.string.uuid(),
    type: options.type ?? faker.helpers.arrayElement(['run', 'rest', 'cross-train']),
    duration: options.duration ?? faker.number.int({ min: 20, max: 90 }),
    description: options.description ?? faker.lorem.sentence(),
  }
}
```

### Frontend-First Development with MSW

Build UI before backend by mocking API responses:

```typescript
// src/mocks/handlers.ts — Define expected API shape
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Define what the API WILL return (before it exists)
  http.get('/api/workouts', () => {
    return HttpResponse.json([
      { id: '1', title: 'Easy Run', duration: 30, status: 'scheduled' },
      { id: '2', title: 'Intervals', duration: 45, status: 'completed' },
    ])
  }),
]

// src/mocks/browser.ts — For development
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

// Start in development (e.g., in app entry point)
if (process.env.NODE_ENV === 'development') {
  worker.start()
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
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/plans', () => {
    return HttpResponse.json([
      { id: '1', name: 'Plan 1', goal: 'marathon' },
      { id: '2', name: 'Plan 2', goal: '5k' },
    ])
  }),

  http.post('/api/plans', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: '3', ...body }, { status: 201 })
  }),

  http.delete('/api/plans/:id', ({ params }) => {
    return HttpResponse.json({ success: true })
  }),
]

// tests/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### Integration Tests

```typescript
// tests/integration/plan-creation.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { createTestUser } from '../factories'

describe('Plan Creation Flow', () => {
  beforeEach(async () => {
    // Clean database
    await db.workout.deleteMany()
    await db.week.deleteMany()
    await db.trainingPlan.deleteMany()
    await db.user.deleteMany()
  })

  it('creates plan with all weeks and workouts', async () => {
    const user = await createTestUser()
    
    const result = await createPlanWithWorkouts({
      userId: user.id,
      name: 'Test Plan',
      goal: 'marathon',
      weeks: 16,
    })
    
    // Verify plan
    expect(result.plan.name).toBe('Test Plan')
    expect(result.plan.userId).toBe(user.id)
    
    // Verify weeks
    const plan = await db.trainingPlan.findUnique({
      where: { id: result.plan.id },
      include: { weeks: { include: { workouts: true } } },
    })
    
    expect(plan?.weeks).toHaveLength(16)
    expect(plan?.weeks.every(w => w.workouts.length > 0)).toBe(true)
  })

  it('rolls back on failure', async () => {
    const user = await createTestUser()
    
    // Force failure
    vi.spyOn(db.week, 'create').mockRejectedValueOnce(new Error('DB error'))
    
    await expect(
      createPlanWithWorkouts({ userId: user.id, name: 'Test', goal: 'marathon', weeks: 4 })
    ).rejects.toThrow()
    
    // Nothing should be saved
    const plans = await db.trainingPlan.count()
    expect(plans).toBe(0)
  })
})
```

## Commands

```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# Run specific file
bun test src/components/Button.test.tsx

# Run tests matching pattern
bun test -t "createPlan"

# With coverage
bun test:coverage

# UI mode
bun test:ui
```

## Best Practices

### ✅ Do

- Write tests before code (TDD)
- Test behavior, not implementation
- Use meaningful test descriptions
- Keep tests focused (one concept per test)
- Use factories for test data
- Mock external dependencies

### ❌ Don't

- Test implementation details
- Test framework code
- Write tests that always pass
- Use magic numbers/strings
- Leave console.logs in tests
- Skip error cases
