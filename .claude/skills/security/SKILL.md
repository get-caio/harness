# Security Skill

Secure coding practices for CAIO incubator projects. Reference this before implementing any feature that handles user data, authentication, or external input.

## Core Principles

1. **Never Trust Input** — All external data is hostile until validated
2. **Least Privilege** — Grant minimum permissions needed
3. **Defense in Depth** — Multiple layers of protection
4. **Fail Secure** — Errors should deny access, not grant it
5. **Audit Everything** — Log security-relevant events

---

## Input Validation

### Always Validate with Zod

```typescript
// ✅ Validate all inputs at the boundary
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).trim(),
  age: z.number().int().min(13).max(150).optional(),
});

export async function createUser(input: unknown) {
  const data = CreateUserSchema.parse(input); // Throws on invalid
  // Now `data` is typed and validated
}
```

### Sanitize HTML Output

```typescript
// ✅ Use DOMPurify for any user-generated HTML
import DOMPurify from 'isomorphic-dompurify'

function renderUserContent(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p'],
    ALLOWED_ATTR: ['href'],
  })
}

// ❌ Never render raw HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### File Upload Validation

```typescript
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateUpload(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File too large");
  }
  // Also validate magic bytes, not just extension
}
```

---

## Authentication

### Session Handling

```typescript
// ✅ Use NextAuth with secure defaults
import NextAuth from "next-auth";

export const { auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
});
```

### Auth Checks in Server Actions

```typescript
// ✅ Always verify auth at the start
export async function sensitiveAction(input: ActionInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // Continue with authenticated user
}
```

---

## Authorization

### Resource-Level Checks

```typescript
// ✅ Always verify ownership/permission
export async function updatePlan(planId: string, data: PlanData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const plan = await db.plan.findUnique({ where: { id: planId } });

  if (!plan) {
    throw new Error("Not found");
  }

  // Check ownership
  if (plan.userId !== session.user.id) {
    throw new Error("Forbidden");
  }

  // Now safe to update
  return db.plan.update({ where: { id: planId }, data });
}
```

### Role-Based Access

```typescript
// ✅ Define roles clearly
type Role = "user" | "admin" | "super_admin";

const PERMISSIONS: Record<Role, string[]> = {
  user: ["read:own", "write:own"],
  admin: ["read:all", "write:own", "delete:own"],
  super_admin: ["read:all", "write:all", "delete:all"],
};

function hasPermission(role: Role, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
```

---

## Database Security

### Parameterized Queries Only

```typescript
// ✅ Prisma handles parameterization
const users = await db.user.findMany({
  where: { email: userInput }, // Safe
});

// ❌ NEVER interpolate user input into raw queries
const users = await db.$queryRaw`
  SELECT * FROM users WHERE email = '${userInput}'  // SQL INJECTION!
`;

// ✅ If you must use raw SQL, use parameters
const users = await db.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}  // Safe with Prisma
`;
```

### Sensitive Data Handling

```typescript
// ✅ Never store passwords in plain text
import { hash, compare } from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return compare(password, hash);
}

// ✅ Never log sensitive data
console.log("User:", { ...user, password: "[REDACTED]" });
```

---

## API Security

### Rate Limiting

```typescript
// ✅ Rate limit sensitive endpoints
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }

  // Process request
}
```

### CORS Configuration

```typescript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.ALLOWED_ORIGIN,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};
```

### Webhook Verification

```typescript
// ✅ Always verify webhook signatures
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  // Process verified event
}
```

---

## Environment & Secrets

### Never Commit Secrets

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
```

### Environment Validation

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
});

export const env = envSchema.parse(process.env);
```

### Secret Rotation

- Use short-lived tokens where possible
- Rotate API keys periodically
- Use environment-specific secrets (dev ≠ prod)

---

## Common Vulnerabilities Checklist

Before any PR, verify:

### Injection

- [ ] All user input validated with Zod
- [ ] No string interpolation in SQL
- [ ] HTML output sanitized

### Authentication

- [ ] Auth check at start of every protected action
- [ ] Session tokens are httpOnly, secure, sameSite
- [ ] Password requirements enforced

### Authorization

- [ ] Resource ownership verified before access
- [ ] Role checks where applicable
- [ ] No IDOR (Insecure Direct Object Reference)

### Data Exposure

- [ ] No sensitive data in logs
- [ ] No secrets in client bundles
- [ ] Error messages don't leak internals

### Configuration

- [ ] Security headers set (CSP, HSTS, etc.)
- [ ] CORS properly configured
- [ ] Rate limiting on sensitive endpoints

---

## Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
];
```

---

## SSRF Protection

Any feature that fetches a user-provided URL (webhooks, link previews, imports, OAuth callbacks) must validate the target to prevent Server-Side Request Forgery.

### URL Validation

```typescript
import { URL } from "url";
import dns from "dns/promises";
import { isIP } from "net";

const BLOCKED_HOSTS = ["metadata.google.internal", "169.254.169.254"];
const PRIVATE_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_RANGES.some((range) => range.test(ip));
}

export async function validateExternalURL(input: string): Promise<URL> {
  const url = new URL(input);

  // Block non-HTTP protocols
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  // Block known metadata endpoints
  if (BLOCKED_HOSTS.includes(url.hostname)) {
    throw new Error("Blocked host");
  }

  // Resolve DNS and check for private IPs (prevent DNS rebinding)
  const hostname = url.hostname;
  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error("Private IP addresses are not allowed");
    }
  } else {
    const addresses = await dns.resolve4(hostname).catch(() => []);
    const addresses6 = await dns.resolve6(hostname).catch(() => []);
    const allAddresses = [...addresses, ...addresses6];

    if (allAddresses.some(isPrivateIP)) {
      throw new Error("URL resolves to a private IP address");
    }
  }

  return url;
}
```

### Safe Fetch Wrapper

```typescript
// ✅ Use this for any user-provided URL
export async function safeFetch(url: string, options?: RequestInit) {
  const validated = await validateExternalURL(url);

  return fetch(validated.toString(), {
    ...options,
    redirect: "manual", // Prevent redirect to internal URLs
    signal: AbortSignal.timeout(10_000), // 10s timeout
  });
}

// ❌ Never fetch user-provided URLs directly
const response = await fetch(userProvidedUrl); // SSRF!
```

---

## When to Escalate

Create a decision document for:

- Any auth/authz architecture changes
- Adding new third-party services with data access
- Changing encryption or hashing strategies
- Handling PII or financial data
- Compliance requirements (GDPR, SOC2, HIPAA)
