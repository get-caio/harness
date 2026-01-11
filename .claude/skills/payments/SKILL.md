# Payments Skill

Patterns for implementing Stripe payments in CAIO incubator projects.

## Stack

- **Stripe** — Payment processing
- **stripe-node** — Server-side SDK
- **@stripe/stripe-js** — Client-side SDK
- **Webhooks** — Event handling

## Setup

### 1. Install Dependencies

```bash
bun add stripe @stripe/stripe-js
```

### 2. Environment Variables

```bash
# .env.local

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Product/Price IDs (set after creating in Stripe Dashboard)
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
```

### 3. Stripe Client

```typescript
// lib/stripe.ts
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
})
```

### 4. Prisma Schema Extensions

```prisma
// prisma/schema.prisma

model User {
  id               String    @id @default(cuid())
  email            String?   @unique
  name             String?
  
  // Stripe fields
  stripeCustomerId String?   @unique
  subscription     Subscription?
  
  // ... other fields
}

model Subscription {
  id                   String   @id @default(cuid())
  userId               String   @unique
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  stripeSubscriptionId String   @unique
  stripePriceId        String
  stripeCurrentPeriodEnd DateTime
  status               SubscriptionStatus
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

enum SubscriptionStatus {
  active
  canceled
  past_due
  trialing
  incomplete
}
```

## Checkout Flow

### 1. Create Checkout Session

```typescript
// actions/stripe.ts
'use server'

import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function createCheckoutSession(priceId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
  })
  
  // Get or create Stripe customer
  let customerId = user?.stripeCustomerId
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      metadata: { userId: session.user.id },
    })
    
    await db.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: customer.id },
    })
    
    customerId = customer.id
  }
  
  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
    metadata: { userId: session.user.id },
  })
  
  return { url: checkoutSession.url }
}
```

### 2. Checkout Button Component

```typescript
// components/CheckoutButton.tsx
'use client'

import { useState } from 'react'
import { createCheckoutSession } from '@/actions/stripe'
import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
  priceId: string
  children: React.ReactNode
}

export function CheckoutButton({ priceId, children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  
  async function handleCheckout() {
    setLoading(true)
    try {
      const { url } = await createCheckoutSession(priceId)
      if (url) window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Loading...' : children}
    </Button>
  )
}
```

## Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
  
  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) throw new Error('No userId in session metadata')
  
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  
  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: 'active',
    },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: 'active',
    },
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const dbSubscription = await db.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })
  
  if (!dbSubscription) {
    console.log('Subscription not found in database:', subscription.id)
    return
  }
  
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      stripePriceId: subscription.items.data[0].price.id,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: subscription.status as any,
    },
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.subscription.delete({
    where: { stripeSubscriptionId: subscription.id },
  }).catch(() => {
    // Already deleted, ignore
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Send notification or update status
  console.log('Payment failed for invoice:', invoice.id)
}
```

## Customer Portal

```typescript
// actions/stripe.ts
export async function createPortalSession() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })
  
  if (!user?.stripeCustomerId) {
    throw new Error('No Stripe customer found')
  }
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/settings`,
  })
  
  return { url: portalSession.url }
}
```

## Subscription Checks

```typescript
// lib/subscription.ts
import { db } from '@/lib/db'

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await db.subscription.findUnique({
    where: { userId },
  })
  
  if (!subscription) return false
  
  return (
    subscription.status === 'active' &&
    subscription.stripeCurrentPeriodEnd > new Date()
  )
}

export async function requireSubscription(userId: string) {
  const hasSubscription = await hasActiveSubscription(userId)
  
  if (!hasSubscription) {
    throw new Error('Subscription required')
  }
}
```

## Usage in Server Actions

```typescript
// actions/plans.ts
import { requireSubscription } from '@/lib/subscription'

export async function generateAdvancedPlan(data: PlanData) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  
  // Check subscription for premium features
  await requireSubscription(session.user.id)
  
  // Premium feature logic
  return generatePlan(data, { advanced: true })
}
```

## Pricing Page Component

```typescript
// app/pricing/page.tsx
import { CheckoutButton } from '@/components/CheckoutButton'

const plans = [
  {
    name: 'Monthly',
    price: '$9.99/mo',
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    features: ['Unlimited plans', 'Progress tracking', 'Email support'],
  },
  {
    name: 'Yearly',
    price: '$99/yr',
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    features: ['Everything in Monthly', 'Save 17%', 'Priority support'],
    popular: true,
  },
]

export default function PricingPage() {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto p-8">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`rounded-lg border p-6 ${plan.popular ? 'border-primary ring-2 ring-primary' : ''}`}
        >
          <h3 className="text-xl font-bold">{plan.name}</h3>
          <p className="text-3xl font-bold mt-4">{plan.price}</p>
          <ul className="mt-6 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <span className="mr-2">✓</span>
                {feature}
              </li>
            ))}
          </ul>
          <CheckoutButton priceId={plan.priceId} className="w-full mt-6">
            Get Started
          </CheckoutButton>
        </div>
      ))}
    </div>
  )
}
```

## Testing Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test specific events
stripe trigger checkout.session.completed
```

## Security Checklist

- [ ] Webhook signature verification
- [ ] Customer ID stored securely
- [ ] Subscription status checked server-side
- [ ] No price manipulation possible client-side
- [ ] Portal session created server-side only
- [ ] Proper error handling for payment failures
