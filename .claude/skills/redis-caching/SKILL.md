---
name: redis-caching
description: Patterns for Redis caching — cache-aside, TTL strategies, rate limiting with INCR, frequency capping, pub/sub, session storage, and fail-open patterns. Use this skill when implementing caching, rate limiting, session management, frequency capping, or any Redis operations. Trigger on Redis, caching, rate limit, frequency cap, session store, TTL, or cache invalidation.
---

# Redis Caching

Redis for caching, rate limiting, frequency capping, and session storage. Uses fail-open patterns for resilience.

## When to Read This

- Implementing cache-aside pattern for API responses
- Building rate limiters for embed and auth endpoints
- Implementing campaign frequency capping
- Storing sessions
- Setting up pub/sub for real-time events

## Client Setup

```typescript
import { createClient } from "redis";

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err));
await redis.connect();

export { redis };
```

## Cache-Aside Pattern

```typescript
async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch {
    // Fail open — cache miss, fetch from DB
  }

  const data = await fetcher();

  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch {
    // Fail open — write failure is not fatal
  }

  return data;
}

// Usage
const poll = await getCached(
  `poll:${pollId}`,
  () =>
    db.query.polls.findFirst({
      where: eq(polls.id, pollId),
      with: { options: true },
    }),
  600, // 10 minute TTL
);
```

## Cache Key Patterns

```typescript
// Consistent key naming
const KEYS = {
  poll: (id: string) => `poll:${id}`,
  placement: (id: string) => `placement:${id}`,
  orgPolls: (orgId: string, page: number) => `org:${orgId}:polls:page:${page}`,
  searchResult: (queryHash: string) => `search:${queryHash}`,
  synthesis: (queryHash: string) => `synthesis:${queryHash}`,
  rateLimit: (ip: string, endpoint: string) => `rl:${endpoint}:${ip}`,
  freqCap: (profileId: string, campaignId: string) =>
    `fc:${campaignId}:${profileId}`,
  session: (sessionId: string) => `session:${sessionId}`,
};
```

## Rate Limiting

```typescript
async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch {
    // Fail open — if Redis is down, allow the request
    return { allowed: true, remaining: limit };
  }
}

// Middleware
export const rateLimiter = (limit: number, windowSeconds: number) =>
  createMiddleware(async (c, next) => {
    const ip = c.req.header("x-forwarded-for") ?? "unknown";
    const key = KEYS.rateLimit(ip, c.req.path);
    const { allowed, remaining } = await checkRateLimit(
      key,
      limit,
      windowSeconds,
    );

    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(remaining));

    if (!allowed) return c.json({ error: "Rate limit exceeded" }, 429);
    await next();
  });
```

## Frequency Capping

```typescript
// Campaign-level: default 3/day, range 1-20/day
async function checkFrequencyCap(
  profileId: string,
  campaignId: string,
  dailyLimit: number = 3,
): Promise<boolean> {
  const key = KEYS.freqCap(profileId, campaignId);

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      // Set expiry to end of day UTC
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setUTCHours(23, 59, 59, 999);
      const ttl = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000);
      await redis.expire(key, ttl);
    }
    return count <= dailyLimit;
  } catch {
    // Fail open — show the campaign if Redis is down
    return true;
  }
}
```

## Cache Invalidation

```typescript
// Invalidate on write
async function updatePoll(pollId: string, data: Partial<Poll>) {
  await db.update(polls).set(data).where(eq(polls.id, pollId));

  // Invalidate specific poll cache
  await redis.del(KEYS.poll(pollId));

  // Invalidate list caches for this org (pattern delete via SCAN)
  for await (const key of redis.scanIterator({
    MATCH: `org:${data.organizationId}:polls:*`,
    COUNT: 100,
  })) {
    await redis.del(key);
  }
}

// Invalidate search cache when polls change
async function invalidateSearchCache(pollId: string) {
  // Can't easily know which search queries included this poll
  // Option 1: Short TTL (5 min) so cache expires naturally
  // Option 2: Tag-based invalidation (more complex)
}
```

## TTL Strategy

| Data Type           | TTL        | Reason                   |
| ------------------- | ---------- | ------------------------ |
| Poll data           | 10 min     | Moderate write frequency |
| Placement config    | 30 min     | Rarely changes           |
| Search results      | 5 min      | Freshness matters        |
| AI synthesis        | 1 hour     | Expensive to compute     |
| Rate limit counters | 1-5 min    | Window-based             |
| Frequency caps      | End of day | Daily budget             |
| Sessions            | 7 days     | Auth sessions            |

## Common Mistakes

1. **Always fail open** — if Redis is down, serve from DB, don't error
2. **Don't cache user-specific data with shared keys** — include userId/orgId in key
3. **Set TTL on everything** — orphaned keys waste memory
4. **Don't use `KEYS` in production** — it scans all keys. Use `SCAN` for pattern matching.
5. **Watch memory** — know your instance limits. Monitor with `INFO memory`
6. **Serialize consistently** — always `JSON.stringify`/`JSON.parse`, don't mix formats
