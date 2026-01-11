# Next.js + Bun + Prisma Skill

Standard stack conventions for CAIO incubator projects.

## Stack Overview

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 14.x (App Router) |
| Runtime | Bun | Latest |
| ORM | Prisma | 5.x |
| Database | PostgreSQL | Via Supabase |
| Styling | Tailwind CSS + shadcn/ui | Latest |

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Routes requiring authentication
│   │   ├── dashboard/
│   │   ├── plans/
│   │   └── settings/
│   ├── (public)/            # Public routes
│   │   ├── page.tsx         # Landing page
│   │   └── pricing/
│   ├── api/                 # API routes (webhooks only)
│   │   └── webhooks/
│   │       └── stripe/
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles
│   └── providers.tsx        # Client providers wrapper
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── [feature]/           # Feature-specific components
├── lib/
│   ├── db.ts               # Prisma client singleton
│   ├── auth.ts             # NextAuth configuration
│   ├── stripe.ts           # Stripe client
│   ├── utils.ts            # Utility functions
│   └── validations/        # Zod schemas
├── actions/                 # Server actions
│   ├── auth.ts
│   ├── plans.ts
│   └── workouts.ts
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript types
└── constants/               # App constants
```

## Data Fetching Patterns

### Server Components (Default)

```typescript
// app/plans/page.tsx
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

export default async function PlansPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  
  const plans = await db.trainingPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  
  return <PlanList plans={plans} />
}
```

### Server Actions (Mutations)

```typescript
// actions/plans.ts
'use server'

import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { planSchema } from '@/lib/validations/plan'

export async function createPlan(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const validated = planSchema.parse({
    name: formData.get('name'),
    goal: formData.get('goal'),
    weeks: Number(formData.get('weeks')),
  })
  
  const plan = await db.trainingPlan.create({
    data: {
      ...validated,
      userId: session.user.id,
    },
  })
  
  revalidatePath('/plans')
  return plan
}
```

### API Routes (Webhooks Only)

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!
  
  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response('Webhook error', { status: 400 })
  }
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful payment
      break
    // ... other events
  }
  
  return new Response('OK', { status: 200 })
}
```

## Database Patterns

### Prisma Client Singleton

```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### Transactions

```typescript
// For multi-step operations
const result = await db.$transaction(async (tx) => {
  const plan = await tx.trainingPlan.create({ data: planData })
  
  const weeks = await Promise.all(
    weekData.map(week => 
      tx.week.create({ data: { ...week, planId: plan.id } })
    )
  )
  
  return { plan, weeks }
})
```

### Query Patterns

```typescript
// Avoid N+1 - use include
const plans = await db.trainingPlan.findMany({
  where: { userId },
  include: {
    weeks: {
      include: { workouts: true },
      orderBy: { number: 'asc' },
    },
  },
})

// Pagination
const plans = await db.trainingPlan.findMany({
  where: { userId },
  take: 10,
  skip: (page - 1) * 10,
  orderBy: { createdAt: 'desc' },
})

// Count for pagination
const total = await db.trainingPlan.count({ where: { userId } })
```

## Component Patterns

### Server Component with Client Interactivity

```typescript
// components/plans/PlanCard.tsx (Server)
import { Plan } from '@prisma/client'
import { PlanActions } from './PlanActions'

export function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{plan.name}</h3>
      <p className="text-muted-foreground">{plan.goal}</p>
      <PlanActions planId={plan.id} /> {/* Client component */}
    </div>
  )
}

// components/plans/PlanActions.tsx (Client)
'use client'

import { useTransition } from 'react'
import { deletePlan } from '@/actions/plans'
import { Button } from '@/components/ui/button'

export function PlanActions({ planId }: { planId: string }) {
  const [isPending, startTransition] = useTransition()
  
  return (
    <Button
      variant="destructive"
      disabled={isPending}
      onClick={() => startTransition(() => deletePlan(planId))}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </Button>
  )
}
```

### Form with Server Action

```typescript
'use client'

import { useFormStatus } from 'react-dom'
import { createPlan } from '@/actions/plans'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Plan'}
    </Button>
  )
}

export function CreatePlanForm() {
  return (
    <form action={createPlan}>
      <Input name="name" placeholder="Plan name" required />
      <Select name="goal">
        <option value="marathon">Marathon</option>
        <option value="5k">5K</option>
      </Select>
      <SubmitButton />
    </form>
  )
}
```

## Authentication Pattern

```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: { ...session.user, id: user.id },
    }),
  },
})
```

## Validation Pattern

```typescript
// lib/validations/plan.ts
import { z } from 'zod'

export const planSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  goal: z.enum(['marathon', '5k', '10k', 'half_marathon', 'general']),
  weeks: z.number().min(1).max(52),
  hoursPerWeek: z.number().min(1).max(40).optional(),
})

export type PlanInput = z.infer<typeof planSchema>
```

## Error Handling Pattern

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 'NOT_FOUND', 404)
  }
}

// Usage in server actions
export async function getPlan(id: string) {
  const session = await auth()
  if (!session?.user) throw new UnauthorizedError()
  
  const plan = await db.trainingPlan.findUnique({ where: { id } })
  if (!plan) throw new NotFoundError('Plan not found')
  if (plan.userId !== session.user.id) throw new UnauthorizedError()
  
  return plan
}
```

## Commands Reference

```bash
# Development
bun dev                 # Start dev server (localhost:3000)
bun build              # Production build
bun start              # Start production server

# Database
bun db:generate        # Generate Prisma client
bun db:push            # Push schema to database
bun db:migrate dev     # Create migration
bun db:studio          # Open Prisma Studio

# Testing
bun test               # Run tests
bun test:watch         # Watch mode
bun test:coverage      # With coverage

# Code Quality
bun lint               # ESLint
bun lint:fix           # ESLint with auto-fix
bun typecheck          # TypeScript check
bun format             # Prettier
```
