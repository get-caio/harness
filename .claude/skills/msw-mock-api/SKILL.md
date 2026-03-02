---
name: msw-mock-api
description: Patterns for Mock Service Worker (MSW) to build frontend UIs ahead of backend APIs. Use this skill whenever creating mock API handlers, seed data factories, decoupling frontend from backend development, or switching between mock and real APIs. Trigger when the user mentions MSW, mock API, mock service worker, test doubles, API mocking, or building frontend before backend is ready.
---

# MSW Mock API Layer

MSW intercepts network requests at the service worker level, returning realistic mock responses. This enables building the frontend ahead of the backend using exact API contract shapes.

## When to Read This

- Setting up MSW for a Next.js admin panel
- Creating mock handlers that match API contracts
- Building seed data factories for realistic test data
- Switching between mock and real API
- Testing components against mock responses

## Setup

```bash
bun add -d msw
bunx msw init public/ --save  # Generates mockServiceWorker.js
```

### Browser Worker

```typescript
// mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### Enable in Development

```typescript
// app/providers.tsx
'use client';

import { useEffect, useState } from 'react';

export function MockProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING === 'true') {
      import('../mocks/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' }).then(() => setReady(true));
      });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
```

## Handler Patterns

### CRUD Handlers

```typescript
// mocks/handlers/polls.ts
import { http, HttpResponse, delay } from 'msw';
import { pollFactory } from '../data/factories';

let polls = pollFactory.buildList(25);

export const pollHandlers = [
  // List
  http.get('/admin/api/polls', async ({ request }) => {
    await delay(150);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const start = (page - 1) * limit;

    return HttpResponse.json({
      data: polls.slice(start, start + limit),
      pagination: { total: polls.length, page, limit, pages: Math.ceil(polls.length / limit) },
    });
  }),

  // Get by ID
  http.get('/admin/api/polls/:id', async ({ params }) => {
    await delay(100);
    const poll = polls.find(p => p.id === params.id);
    if (!poll) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(poll);
  }),

  // Create
  http.post('/admin/api/polls', async ({ request }) => {
    await delay(200);
    const body = await request.json();
    const newPoll = pollFactory.build(body);
    polls.unshift(newPoll);
    return HttpResponse.json(newPoll, { status: 201 });
  }),

  // Update
  http.patch('/admin/api/polls/:id', async ({ params, request }) => {
    await delay(150);
    const body = await request.json();
    const idx = polls.findIndex(p => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    polls[idx] = { ...polls[idx], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json(polls[idx]);
  }),

  // Delete
  http.delete('/admin/api/polls/:id', async ({ params }) => {
    await delay(100);
    polls = polls.filter(p => p.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
```

### Auth Handlers

```typescript
// mocks/handlers/auth.ts
export const authHandlers = [
  http.post('/auth/login/magic-link', async ({ request }) => {
    await delay(300);
    const { email } = await request.json();
    return HttpResponse.json({ message: `Magic link sent to ${email}` });
  }),

  http.get('/admin/api/me', async () => {
    await delay(100);
    return HttpResponse.json({
      id: 'user_1',
      email: 'adam@sided.ai',
      name: 'Adam',
      role: 'owner',
      orgId: 'org_1',
    });
  }),
];
```

### Combine All Handlers

```typescript
// mocks/handlers/index.ts
import { pollHandlers } from './polls';
import { campaignHandlers } from './campaigns';
import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';

export const handlers = [
  ...authHandlers,
  ...pollHandlers,
  ...campaignHandlers,
  ...dashboardHandlers,
];
```

## Data Factories

```typescript
// mocks/data/factories.ts
import { createId } from '@paralleldrive/cuid2';

function factory<T>(defaults: () => T) {
  return {
    build: (overrides?: Partial<T>): T => ({ ...defaults(), ...overrides }),
    buildList: (count: number, overrides?: Partial<T>): T[] =>
      Array.from({ length: count }, () => factory(defaults).build(overrides)),
  };
}

export const pollFactory = factory(() => ({
  id: createId(),
  question: randomQuestion(),
  format: 'standard' as const,
  status: randomChoice(['active', 'draft', 'paused']),
  options: [
    { id: createId(), text: 'Yes', voteCount: randomInt(10, 500) },
    { id: createId(), text: 'No', voteCount: randomInt(10, 500) },
  ],
  voteCount: randomInt(50, 5000),
  createdAt: randomDate(30).toISOString(),
  updatedAt: new Date().toISOString(),
}));
```

## Mock → Real API Switch

```env
# .env.development
NEXT_PUBLIC_API_MOCKING=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# .env.production
NEXT_PUBLIC_API_MOCKING=false
NEXT_PUBLIC_API_BASE_URL=https://api.sided.ai
```

The API client reads from the same base URL either way — MSW intercepts in dev, real API responds in prod:

```typescript
// lib/api-client.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

## Common Mistakes

1. **Don't skip `delay()`** — realistic latency catches loading state bugs
2. **Match exact API contract shapes** — mock responses should be identical to the real spec
3. **Use `onUnhandledRequest: 'bypass'`** — let non-mocked requests through (images, scripts)
4. **Seed realistic data** — edge cases like empty states, long text, special characters
5. **Reset state between tests** — use `server.resetHandlers()` in test setup
