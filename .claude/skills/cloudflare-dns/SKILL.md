---
name: cloudflare-dns
description: Patterns for Cloudflare DNS management, custom domain CNAME verification, SSL certificates, traffic splitting via Workers, and DDoS protection. Use this skill when managing DNS records, setting up custom publisher domains, configuring Cloudflare Workers for traffic routing, or handling SSL/TLS. Trigger on Cloudflare, DNS, CNAME, SSL, CDN, DDoS, or custom domain setup.
---

# Cloudflare DNS & CDN

Cloudflare provides DNS, CDN, SSL, DDoS protection, and edge compute (Workers) for routing traffic between services.

## When to Read This

- Setting up DNS for application subdomains
- Configuring customer custom domains (CNAME)
- Building Cloudflare Workers for traffic splitting (canary rollouts)
- Managing SSL certificates
- Setting up DDoS protection rules

## DNS Record Setup

### Application Domains

```
# A/CNAME records for core domains
example.com          A       → Vercel IP (marketing site)
admin.example.com    CNAME   → myapp-admin.herokuapp.com (admin panel)
api.example.com      CNAME   → myapp-api.herokuapp.com (API)
docs.example.com     CNAME   → myapp-docs.pages.dev (Cloudflare Pages)
cdn.example.com      CNAME   → cdn-origin.example.com (CDN)
```

### Customer Custom Domains

Customers CNAME their subdomain to your app:

```
# Customer DNS (they configure this)
widgets.customer.com  CNAME  → custom.example.com

# Your Cloudflare (you configure this)
custom.example.com    CNAME  → myapp-api.herokuapp.com
```

### CNAME Verification Flow

```typescript
async function verifyCustomDomain(
  domain: string,
  expectedTarget: string,
): Promise<boolean> {
  // 1. Customer adds CNAME pointing to custom.example.com
  // 2. Verify by DNS lookup
  const records = await Bun.dns.resolve(domain, "CNAME");
  const verified = records.some((r) => r.endsWith(expectedTarget));

  if (verified) {
    // 3. Add domain to hosting provider
    await addCustomDomain(domain);
    // 4. Provision SSL (e.g., Heroku ACM, Cloudflare)
    await db
      .update(properties)
      .set({ customDomain: domain, domainVerified: true })
      .where(eq(properties.id, propertyId));
  }

  return verified;
}
```

## Cloudflare Worker — Traffic Splitting

```javascript
// workers/traffic-split.js
// Used for canary rollout during API migration
export default {
  async fetch(request, env) {
    const splitPct = parseInt(env.TRAFFIC_SPLIT_PCT || "0");
    const url = new URL(request.url);

    // Split traffic for specific endpoints (e.g., public-facing routes)
    if (isSplitEndpoint(url.pathname)) {
      const useNew = Math.random() * 100 < splitPct;
      const origin = useNew ? env.NEW_API_ORIGIN : env.OLD_API_ORIGIN;

      const response = await fetch(
        new Request(origin + url.pathname + url.search, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        }),
      );

      // Add header for debugging
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("X-Backend", useNew ? "new" : "legacy");
      return newResponse;
    }

    // Non-split traffic goes to new API
    return fetch(
      new Request(env.NEW_API_ORIGIN + url.pathname + url.search, request),
    );
  },
};

function isSplitEndpoint(path) {
  // Customize: list public-facing or high-risk endpoints for gradual rollout
  return (
    path.startsWith("/api/v1/") ||
    path.startsWith("/embed/") ||
    path.startsWith("/webhook/")
  );
}
```

## SSL Configuration

- **Full (Strict)** SSL mode for all application domains
- Hosting provider (e.g., Heroku ACM) provides automatic SSL for custom domains
- Cloudflare edge certificates handle wildcard subdomains
- Set minimum TLS version to 1.2

## Page Rules / Cache Rules

```
# Cache static assets aggressively
cdn.example.com/*      → Cache Level: Cache Everything, Edge TTL: 1 month

# Don't cache API responses
api.example.com/*      → Cache Level: Bypass

# Cache marketing pages with revalidation
example.com/*          → Cache Level: Standard, Browser TTL: 4 hours
```

## Common Mistakes

1. **Proxy status matters** — orange cloud (proxied) for CDN/DDoS, gray cloud (DNS only) for Heroku custom domains
2. **Don't proxy CNAME to Heroku** — use DNS-only mode, Heroku needs direct connection for SSL
3. **Set TTL to 60s during migrations** — allows fast DNS rollback
4. **Wildcard SSL** only covers one level — `*.example.com` covers `api.example.com` but not `sub.api.example.com`
5. **Always verify CNAME ownership** — don't trust user input, resolve DNS programmatically
