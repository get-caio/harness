---
name: resend-email
description: Patterns for Resend transactional email — sending, templates, domain verification, batch sends, and webhook handling. Use this skill when sending emails, building email templates, handling email delivery events, or integrating Resend. Trigger on Resend, transactional email, email delivery, magic link emails, email templates, or notification emails.
---

# Resend Email

Resend is a modern email API for transactional messages — magic links, notifications, and marketing follow-ups.

## When to Read This

- Sending transactional emails (magic links, welcome, notifications)
- Building email templates with React Email
- Handling delivery webhooks (bounces, opens, clicks)
- Configuring sender domain verification

## Client Setup

```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

## Sending Email

```typescript
// Simple text email
await resend.emails.send({
  from: 'Sided <noreply@sided.ai>',
  to: email,
  subject: 'Your magic login link',
  html: `<p>Click <a href="${magicLink}">here</a> to sign in. This link expires in 15 minutes.</p>`,
});

// With React Email template
import { MagicLinkEmail } from '../emails/magic-link';
import { render } from '@react-email/render';

await resend.emails.send({
  from: 'Sided <noreply@sided.ai>',
  to: email,
  subject: 'Sign in to Sided',
  html: await render(MagicLinkEmail({ url: magicLink, email })),
});
```

## React Email Templates

```tsx
// emails/magic-link.tsx
import { Html, Head, Body, Container, Text, Link, Preview } from '@react-email/components';

export function MagicLinkEmail({ url, email }: { url: string; email: string }) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to Sided</Preview>
      <Body style={{ fontFamily: 'sans-serif', background: '#f9fafb' }}>
        <Container style={{ maxWidth: 480, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: 600 }}>Sign in to Sided</Text>
          <Text>Click the button below to sign in as {email}.</Text>
          <Link href={url} style={{
            display: 'inline-block', padding: '12px 24px',
            background: '#2563eb', color: '#fff', borderRadius: 6,
            textDecoration: 'none', fontWeight: 500,
          }}>
            Sign in
          </Link>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 24 }}>
            This link expires in 15 minutes. If you didn't request this, ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

## Batch Sends

```typescript
// Send to multiple recipients (max 100 per batch)
await resend.batch.send(
  leads.map(lead => ({
    from: 'Sided <insights@sided.ai>',
    to: lead.email,
    subject: `Your analysis: ${lead.query}`,
    html: await render(InsightEmail({ query: lead.query, synthesis: lead.synthesis })),
  }))
);
```

## Domain Verification

```bash
# Add domain in Resend dashboard, then add DNS records:
# TXT  resend._domainkey.sided.ai  → (provided by Resend)
# TXT  sided.ai                    → v=spf1 include:amazonses.com ~all
# MX   feedback.sided.ai           → (provided by Resend)
```

## Webhook Handling

```typescript
app.post('/webhooks/resend', async (c) => {
  const event = await c.req.json();

  switch (event.type) {
    case 'email.bounced':
      await markEmailBounced(event.data.to);
      break;
    case 'email.complained':
      await unsubscribeEmail(event.data.to);
      break;
    case 'email.delivered':
      await logDelivery(event.data.email_id);
      break;
  }

  return c.json({ received: true });
});
```

## Common Mistakes

1. **Always use a verified domain** — `noreply@sided.ai` not `someone@gmail.com`
2. **Include unsubscribe links** in marketing emails (CAN-SPAM compliance)
3. **Handle bounces** — remove bounced addresses to protect sender reputation
4. **Rate limits** — free tier: 100 emails/day, paid: 50,000/month
5. **Test with Resend's test mode** before sending to real addresses
