---
name: shopify-remix
description: Patterns for building Shopify apps with Remix, OAuth, Admin API (GraphQL), ScriptTag injection, and App Store submission. Use this skill when building Shopify integrations, eCommerce plugins, product catalog sync, order webhooks, or Shopify app development. Trigger on any mention of Shopify, Shopify app, Shopify OAuth, ScriptTag, or eCommerce plugin.
---

# Shopify Remix App

Shopify apps use Remix as the standard framework with OAuth authentication and the Admin API (GraphQL) for store operations.

## When to Read This

- Scaffolding a new Shopify app
- Implementing Shopify OAuth flow
- Syncing product catalogs via Admin API
- Injecting scripts into merchant stores
- Handling order webhooks for attribution
- Preparing for App Store submission

## Scaffold

```bash
bun create @shopify/app --template=remix
```

## OAuth Flow

```typescript
// app/routes/auth.$.tsx
import { authenticate } from '../shopify.server';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};
```

Shopify's Remix template handles OAuth automatically via `@shopify/shopify-app-remix`. The key scopes to request:

```typescript
// shopify.server.ts
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_products', 'read_orders', 'write_script_tags'],
  appUrl: process.env.SHOPIFY_APP_URL,
  authPathPrefix: '/auth',
});
```

## Product Catalog Sync

```typescript
// GraphQL query for products
const PRODUCTS_QUERY = `
  query getProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          title
          description
          handle
          status
          images(first: 1) { edges { node { url altText } } }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price
                inventoryQuantity
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

async function syncProducts(admin: AdminApiContext) {
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    const response = await admin.graphql(PRODUCTS_QUERY, {
      variables: { first: 50, after: cursor },
    });
    const { data } = await response.json();

    for (const { node: product } of data.products.edges) {
      await upsertProduct(product); // Store in Sided DB
    }

    hasMore = data.products.pageInfo.hasNextPage;
    cursor = data.products.pageInfo.endCursor;
  }
}
```

## Script Injection

```typescript
// Inject Sided embed on all store pages
const SCRIPT_TAG_MUTATION = `
  mutation scriptTagCreate($input: ScriptTagInput!) {
    scriptTagCreate(input: $input) {
      scriptTag { id src displayScope }
      userErrors { field message }
    }
  }
`;

async function injectEmbed(admin: AdminApiContext) {
  await admin.graphql(SCRIPT_TAG_MUTATION, {
    variables: {
      input: {
        src: 'https://embed-v2.sided.co/load.min.js',
        displayScope: 'ALL',
      },
    },
  });
}
```

## Order Webhook

```typescript
// app/routes/webhooks.orders-create.tsx
import { authenticate } from '../shopify.server';

export const action = async ({ request }) => {
  const { payload, shop } = await authenticate.webhook(request);

  // Check for Sided attribution cookie
  const sidedRef = payload.note_attributes?.find(
    (a: any) => a.name === 'sided_ref'
  );

  if (sidedRef) {
    await recordAttribution({
      shopDomain: shop,
      orderId: payload.id,
      orderTotal: payload.total_price,
      sidedRef: sidedRef.value,
    });
  }

  return new Response(null, { status: 200 });
};
```

## Common Mistakes

1. **Always use Shopify's session tokens** — don't roll your own auth
2. **Respect rate limits** — Shopify GraphQL: 1000 cost points/second
3. **Paginate everything** — products, orders, collections all require cursor-based pagination
4. **Register webhooks programmatically** — use `afterAuth` hooks, not manual setup
5. **Handle refunds** — listen for `orders/updated` to reverse attributions
6. **Use bulk operations** for large catalogs (>1000 products)
