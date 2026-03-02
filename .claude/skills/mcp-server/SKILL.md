---
name: mcp-server
description: Patterns for building Model Context Protocol (MCP) servers that expose tools and resources to AI agents. Use this skill whenever creating MCP tools, defining MCP resources, implementing MCP authentication, or building AI-agent-friendly APIs. Also trigger when the user mentions MCP, model context protocol, AI agent API, tool definitions, or agent-friendly endpoints.
---

# MCP Server Development

The Model Context Protocol (MCP) enables AI agents to discover and use tools programmatically. An MCP server exposes tools (actions) and resources (data) that agents can call.

## When to Read This

- Building an MCP server from scratch
- Defining tools for AI agent consumption
- Implementing OAuth 2.0 authentication for MCP
- Exposing search, CRUD, or analytics as MCP tools
- Testing MCP tools locally

## Server Setup

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({
  name: 'sided',
  version: '1.0.0',
});

// Register tools
server.tool(
  'search_polls',
  'Search polls by topic or keyword. Returns matching polls with vote counts and options.',
  {
    query: { type: 'string', description: 'Search query (e.g., "remote work opinions")' },
    limit: { type: 'number', description: 'Max results (default 10, max 50)', optional: true },
  },
  async ({ query, limit = 10 }) => {
    const results = await searchService.search(query, { topK: Math.min(limit, 50) });
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(results, null, 2),
      }],
    };
  }
);

server.tool(
  'create_poll',
  'Create a new poll question with options. Returns the created poll.',
  {
    question: { type: 'string', description: 'The poll question' },
    options: { type: 'array', items: { type: 'string' }, description: 'Answer options (2-10)' },
    format: {
      type: 'string',
      enum: ['standard', 'slider', 'ranked'],
      description: 'Poll format',
      optional: true,
    },
  },
  async ({ question, options, format = 'standard' }) => {
    const poll = await pollService.create({ question, options, format });
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(poll, null, 2),
      }],
    };
  }
);

server.tool(
  'synthesize_opinions',
  'Get an AI-synthesized summary of public opinion on a topic based on poll data.',
  {
    topic: { type: 'string', description: 'Topic to analyze (e.g., "electric vehicles")' },
  },
  async ({ topic }) => {
    const synthesis = await searchService.synthesize(topic);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(synthesis, null, 2),
      }],
    };
  }
);

// Resources — read-only data endpoints
server.resource(
  'poll',
  'polls/{pollId}',
  async (uri) => {
    const pollId = uri.pathname.split('/').pop();
    const poll = await pollService.getById(pollId);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(poll),
      }],
    };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Tool Design Principles

1. **Name clearly** — `search_polls` not `query` or `find`
2. **Describe thoroughly** — agents read descriptions to decide which tool to use
3. **Validate inputs** — use Zod or the built-in schema to enforce types
4. **Return structured data** — JSON that agents can parse, not prose
5. **Include examples in descriptions** — helps agents construct correct calls
6. **Limit scope** — one tool per action, don't overload

## Authentication

### OAuth 2.0 (Primary)

```typescript
import { OAuthProvider } from '@modelcontextprotocol/sdk/server/auth.js';

const oauthProvider: OAuthProvider = {
  authorize: async (clientId, redirectUri, scope) => {
    // Validate client, return auth code
    return { code: authCode };
  },
  token: async (code, clientId, clientSecret) => {
    // Exchange code for access token
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
    };
  },
  verify: async (token) => {
    // Validate token, return user/org context
    return { userId, orgId, scopes };
  },
};
```

### API Key (Secondary)

```typescript
server.tool(
  'authenticated_tool',
  'Requires API key',
  { apiKey: { type: 'string', description: 'Your Sided API key' } },
  async ({ apiKey }, context) => {
    const org = await validateApiKey(apiKey);
    if (!org) throw new Error('Invalid API key');
    // ... proceed with org context
  }
);
```

## HTTP Transport (for web deployment)

```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Mount as Hono route
app.all('/mcp', async (c) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
});
```

## Testing

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';

describe('MCP Tools', () => {
  let client: Client;

  beforeEach(async () => {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    client = new Client({ name: 'test', version: '1.0.0' });
    await client.connect(clientTransport);
  });

  it('search_polls returns results', async () => {
    const result = await client.callTool('search_polls', { query: 'AI' });
    const data = JSON.parse(result.content[0].text);
    expect(data).toBeInstanceOf(Array);
  });
});
```

## Common Mistakes

1. **Don't return HTML** — agents need JSON, not formatted text
2. **Don't skip descriptions** — tool descriptions are how agents know what to call
3. **Don't require auth for read-only public data** — make public search unauthenticated
4. **Handle errors gracefully** — return error messages, don't throw unhandled exceptions
5. **Version your protocol** — include version in handshake for forward compatibility
