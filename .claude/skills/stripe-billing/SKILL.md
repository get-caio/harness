---
name: stripe-billing
description: Patterns for Stripe integration — Checkout sessions, subscriptions, credit packs, customer portal, metered billing, webhook verification, and Connect for publisher payouts. Use this skill when implementing any payment, billing, subscription, or payout functionality with Stripe. Trigger on Stripe, payments, subscriptions, billing, checkout, invoices, credit packs, or publisher payouts.
---

# Stripe Billing

Comprehensive Stripe integration patterns covering subscriptions, one-time payments, credit-based billing, and multi-party payouts.

## When to Read This

- Implementing Stripe Checkout for subscriptions or one-time purchases
- Building credit pack purchasing for Ask primitives
- Setting up Stripe Customer Portal for self-service billing
- Handling webhooks for payment events
- Implementing publisher payouts via Stripe Connect

## Client Setup

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});
```

## Checkout Session

```typescript
// Create checkout for subscription
async function createSubscriptionCheckout(orgId: string, priceId: string) {
  const org = await getOrg(orgId);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: org.stripeCustomerId ?? undefined,
    customer_email: !org.stripeCustomerId ? org.billingEmail : undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.ADMIN_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.ADMIN_URL}/settings/billing?canceled=true`,
    metadata: { orgId },
    subscription_data: {
      metadata: { orgId },
    },
  });

  return session.url;
}

// Create checkout for credit pack (one-time)
async function createCreditPackCheckout(orgId: string, credits: number) {
  const priceMap: Record<number, number> = {
    10: 4500,   // $45
    50: 20000,  // $200
    200: 60000, // $600
  };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: org.stripeCustomerId,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: { name: `${credits} Ask Credits` },
        unit_amount: priceMap[credits],
      },
      quantity: 1,
    }],
    success_url: `${process.env.ADMIN_URL}/billing?credits_added=${credits}`,
    cancel_url: `${process.env.ADMIN_URL}/billing`,
    metadata: { orgId, credits: String(credits), type: 'credit_pack' },
  });

  return session.url;
}
```

## Customer Portal

```typescript
async function createPortalSession(orgId: string) {
  const org = await getOrg(orgId);

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId!,
    return_url: `${process.env.ADMIN_URL}/settings/billing`,
  });

  return session.url;
}
```

## Webhook Handling

```typescript
// routes/webhooks/stripe.ts
import { Hono } from 'hono';

const stripeWebhooks = new Hono();

stripeWebhooks.post('/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  const body = await c.req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return c.json({ error: 'Invalid signature' }, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;

      if (session.metadata?.type === 'credit_pack') {
        await addCredits(orgId!, parseInt(session.metadata.credits));
      } else {
        await activateSubscription(orgId!, session.subscription as string);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await updateSubscriptionStatus(sub.metadata.orgId, sub.status);
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await cancelSubscription(sub.metadata.orgId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailure(invoice);
      break;
    }
  }

  return c.json({ received: true });
});
```

## Stripe Connect (Publisher Payouts)

```typescript
// Create connected account for publisher
async function createPublisherAccount(publisherId: string, email: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
    },
    metadata: { publisherId },
  });

  // Generate onboarding link
  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.ADMIN_URL}/settings/payouts`,
    return_url: `${process.env.ADMIN_URL}/settings/payouts?setup=complete`,
    type: 'account_onboarding',
  });

  return { accountId: account.id, onboardingUrl: link.url };
}

// Transfer earnings to publisher
async function payPublisher(publisherStripeId: string, amount: number) {
  await stripe.transfers.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    destination: publisherStripeId,
    description: `Sided publisher earnings - ${new Date().toISOString().slice(0, 7)}`,
  });
}
```

## Common Mistakes

1. **Always verify webhook signatures** — never trust raw POST bodies
2. **Use `metadata`** to link Stripe objects back to your database entities
3. **Handle idempotency** — webhooks can fire multiple times; use `event.id` for dedup
4. **Test with Stripe CLI** — `stripe listen --forward-to localhost:3000/webhooks/stripe`
5. **Don't store card details** — Stripe Checkout handles PCI compliance
6. **Check subscription status** — `active`, `past_due`, `canceled` all mean different things
7. **Use test mode keys** in development — `sk_test_*` keys are free and safe
