---
description: "Patterns for BetterAuth/NextAuth session setup, OAuth providers (Google, GitHub), magic-link email, Prisma adapter, JWT callbacks, and protected server actions. Use when adding login, sessions, or providers — not for authorization/permission checks."
---

# Authentication Skill

Patterns for implementing authentication in CAIO incubator projects.

> **IMPORTANT:** Check `CLAUDE.md` and `specs/SPEC.md` for the project's chosen auth provider. The default CAIO stack specifies **BetterAuth**, but some projects use NextAuth.js v5. If the spec says BetterAuth, use BetterAuth patterns (see https://www.better-auth.com/docs). The NextAuth patterns below are a fallback reference — do NOT use them if the spec specifies BetterAuth.

## Stack (NextAuth.js — use only if spec confirms NextAuth)

- **NextAuth.js v5** (Auth.js) — Authentication framework
- **Prisma Adapter** — Database session storage
- **Providers** — Google, Email (magic link), or credentials

## Setup

### 1. Install Dependencies

```bash
bun add next-auth@beta @auth/prisma-adapter
```

### 2. Prisma Schema

```prisma
// prisma/schema.prisma

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]

  // App-specific fields
  trainingPlans TrainingPlan[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 3. Auth Configuration

```typescript
// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: "noreply@trainingplan.ai",
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    // Add user ID to session
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),

    // Control who can sign in
    signIn: async ({ user, account, profile }) => {
      // Add any sign-in restrictions here
      return true;
    },
  },

  events: {
    createUser: async ({ user }) => {
      // Handle new user creation (e.g., send welcome email)
      console.log("New user created:", user.email);
    },
  },
});

// Type augmentation for session
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
```

### 4. API Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

### 5. Middleware

```typescript
// middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  const isProtectedPage =
    req.nextUrl.pathname.startsWith("/dashboard") ||
    req.nextUrl.pathname.startsWith("/plans") ||
    req.nextUrl.pathname.startsWith("/settings");

  // Redirect logged-in users away from auth pages
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login
  if (isProtectedPage && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## Usage Patterns

### Check Auth in Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
    </div>
  )
}
```

### Check Auth in Server Actions

```typescript
// actions/plans.ts
"use server";

import { auth } from "@/lib/auth";

export async function createPlan(formData: FormData) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // User is authenticated, proceed
  const plan = await db.trainingPlan.create({
    data: {
      name: formData.get("name") as string,
      userId: session.user.id,
    },
  });

  return plan;
}
```

### Client-Side Auth State

```typescript
// components/UserMenu.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    return <Button href="/login">Sign In</Button>
  }

  return (
    <div>
      <span>{session.user.name}</span>
      <Button onClick={() => signOut()}>Sign Out</Button>
    </div>
  )
}
```

### Session Provider

```typescript
// app/providers.tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Login Page

```typescript
// app/login/page.tsx
import { auth, signIn } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function LoginPage() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>

        {/* Google Sign In */}
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/dashboard' })
          }}
        >
          <Button type="submit" className="w-full">
            Continue with Google
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        {/* Email Sign In */}
        <form
          action={async (formData) => {
            'use server'
            await signIn('resend', {
              email: formData.get('email'),
              redirectTo: '/dashboard',
            })
          }}
        >
          <Input
            name="email"
            type="email"
            placeholder="email@example.com"
            required
          />
          <Button type="submit" className="w-full mt-4">
            Sign in with Email
          </Button>
        </form>
      </div>
    </div>
  )
}
```

## Authorization Helpers

```typescript
// lib/auth-helpers.ts
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Get authenticated user or throw
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

/**
 * Check if user owns a resource
 */
export async function requireOwnership(resourceUserId: string) {
  const user = await requireAuth();

  if (user.id !== resourceUserId) {
    throw new Error("Forbidden");
  }

  return user;
}

/**
 * Get a plan with ownership check
 */
export async function getPlanWithAuth(planId: string) {
  const user = await requireAuth();

  const plan = await db.trainingPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Not found");
  }

  if (plan.userId !== user.id) {
    throw new Error("Forbidden");
  }

  return plan;
}
```

## Environment Variables

```bash
# .env.local

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Resend (for magic links)
RESEND_API_KEY=your-resend-api-key
```

## Security Checklist

- [ ] NEXTAUTH_SECRET is set and secure
- [ ] OAuth redirect URIs are properly configured
- [ ] CSRF protection is enabled (default in NextAuth)
- [ ] Session cookies are secure in production
- [ ] User data is validated before use
- [ ] Authorization checks on all protected resources
