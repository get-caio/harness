---
name: contract-testing
description: Patterns for API contract testing — recording production responses, diffing response shapes, CI gating, and canary rollout validation. Use this skill whenever testing API backwards compatibility, migrating APIs, validating embed endpoints, doing response shape diffing, or ensuring production parity between old and new API implementations. Trigger whenever "contract test", "response shape", "backwards compatible", "API migration", or "canary rollout" is mentioned.
---

# Contract Testing

Contract testing ensures a new API implementation returns identical response shapes to the existing one. Critical when migrating APIs that serve third-party consumers (widgets, SDKs, public endpoints) where breaking changes = production outages.

## When to Read This

- Migrating from one API framework to another (e.g., Express → Hono)
- Ensuring public endpoints return backwards-compatible responses
- Setting up CI gates that block deploys on contract violations
- Recording production request/response pairs for test fixtures
- Running canary rollouts with response comparison

## Recording Production Pairs

Capture real request/response pairs from production to use as test fixtures:

```typescript
// tools/contract-recorder/index.ts
import { writeFileSync, mkdirSync } from "fs";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/items/ITEM_ID" },
  { method: "GET", path: "/api/v1/users/USER_ID/profile" },
  { method: "GET", path: "/api/v1/config/TENANT_ID" },
  { method: "POST", path: "/api/v1/auth/token", body: { fingerprint: "test" } },
];

async function record() {
  mkdirSync("fixtures", { recursive: true });

  for (const endpoint of ENDPOINTS) {
    const url = `${process.env.PROD_API_URL}${endpoint.path}`;
    const res = await fetch(url, {
      method: endpoint.method,
      headers: { "Content-Type": "application/json" },
      body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
    });

    const body = await res.json();
    const fixture = {
      request: {
        method: endpoint.method,
        path: endpoint.path,
        body: endpoint.body,
      },
      response: {
        status: res.status,
        body,
        headers: Object.fromEntries(res.headers),
      },
      recordedAt: new Date().toISOString(),
    };

    const filename = endpoint.path.replace(/\//g, "_").replace(/^_/, "");
    writeFileSync(
      `fixtures/${filename}.json`,
      JSON.stringify(fixture, null, 2),
    );
    console.log(`Recorded: ${endpoint.method} ${endpoint.path}`);
  }
}

record();
```

## Shape Diffing

Compare response shapes (keys, types, nesting) without comparing values:

```typescript
// lib/shape-diff.ts
type Shape = Record<string, string | Shape>;

function extractShape(obj: any, path = ""): Shape {
  if (obj === null) return { [path]: "null" };
  if (Array.isArray(obj)) {
    if (obj.length === 0) return { [path]: "array<empty>" };
    return { [path]: "array", ...extractShape(obj[0], `${path}[]`) };
  }
  if (typeof obj === "object") {
    const shape: Shape = {};
    for (const key of Object.keys(obj).sort()) {
      Object.assign(
        shape,
        extractShape(obj[key], path ? `${path}.${key}` : key),
      );
    }
    return shape;
  }
  return { [path]: typeof obj };
}

function diffShapes(expected: Shape, actual: Shape): string[] {
  const errors: string[] = [];

  for (const [key, type] of Object.entries(expected)) {
    if (!(key in actual)) {
      errors.push(`MISSING: ${key} (expected ${type})`);
    } else if (actual[key] !== type) {
      errors.push(
        `TYPE_MISMATCH: ${key} (expected ${type}, got ${actual[key]})`,
      );
    }
  }

  for (const key of Object.keys(actual)) {
    if (!(key in expected)) {
      // New fields are warnings, not errors (additive changes OK)
      errors.push(`ADDED: ${key} (type ${actual[key]}) — verify intentional`);
    }
  }

  return errors;
}

export { extractShape, diffShapes };
```

## Contract Test Suite

```typescript
// tests/contract/api-endpoints.test.ts
import { describe, it, expect } from "bun:test";
import { app } from "../../src/index";
import { extractShape, diffShapes } from "../../lib/shape-diff";
import itemFixture from "../../fixtures/api_v1_items_ITEM_ID.json";
import profileFixture from "../../fixtures/api_v1_users_USER_ID_profile.json";

describe("API Contract Tests", () => {
  it("GET /api/v1/items/:id matches production shape", async () => {
    const res = await app.request(itemFixture.request.path);
    const body = await res.json();

    const expectedShape = extractShape(itemFixture.response.body);
    const actualShape = extractShape(body);
    const diffs = diffShapes(expectedShape, actualShape);

    const breakingChanges = diffs.filter((d) => !d.startsWith("ADDED:"));
    expect(breakingChanges).toEqual([]);
  });

  it("GET /api/v1/users/:id/profile matches production shape", async () => {
    const res = await app.request(profileFixture.request.path);
    const body = await res.json();

    const expectedShape = extractShape(profileFixture.response.body);
    const actualShape = extractShape(body);
    const diffs = diffShapes(expectedShape, actualShape);

    const breakingChanges = diffs.filter((d) => !d.startsWith("ADDED:"));
    expect(breakingChanges).toEqual([]);
  });

  it("response status codes match", async () => {
    const res = await app.request(itemFixture.request.path);
    expect(res.status).toBe(itemFixture.response.status);
  });
});
```

## CI Gating

```yaml
# .github/workflows/contract-test.yml
name: Contract Tests
on: [push, pull_request]

jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install --frozen-lockfile
      - name: Contract tests
        run: bun test tests/contract/
        # MUST pass before merge to main — deploy blocked on failure
```

## Shadow Traffic Testing

Run new API alongside old, compare responses in real-time:

```typescript
// middleware/shadow-compare.ts
async function shadowCompare(req: Request): Promise<void> {
  const oldRes = await fetch(`${OLD_API_URL}${new URL(req.url).pathname}`, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  const newRes = await fetch(`${NEW_API_URL}${new URL(req.url).pathname}`, {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  const [oldBody, newBody] = await Promise.all([oldRes.json(), newRes.json()]);
  const diffs = diffShapes(extractShape(oldBody), extractShape(newBody));

  if (diffs.length > 0) {
    await reportDrift({
      endpoint: new URL(req.url).pathname,
      diffs,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## Common Mistakes

1. **Compare shapes, not values** — timestamps, IDs, and counts change between requests
2. **Additive changes are OK** — new fields don't break existing consumers
3. **Removals and type changes are breaking** — these must be caught and blocked
4. **Record fresh fixtures regularly** — production responses evolve
5. **Test all HTTP methods** — GET, POST, and error responses (400, 404)
6. **Include header contracts** — some consumers depend on response headers too
