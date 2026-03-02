---
name: pinecone
description: Patterns for Pinecone vector database — indexing, embedding pipelines, semantic search, and metadata filtering. Use this skill whenever working with vector search, embeddings, semantic similarity, Pinecone indexes, or building search/recommendation features. Also trigger when the user mentions vectors, embeddings, cosine similarity, Pinecone, or semantic search.
---

# Pinecone Vector Database

Pinecone is a managed vector database for similarity search. It stores embeddings with metadata and supports fast approximate nearest neighbor queries.

## When to Read This

- Creating or managing Pinecone indexes
- Building embedding pipelines (text → vector → upsert)
- Implementing semantic search
- Batch backfilling existing data
- Filtering results with metadata

## Client Setup

```typescript
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const pollSearchIndex = pinecone.index('poll-search');
const segmentIndex = pinecone.index('audience-segments');
```

## Embedding Pipeline

### OpenAI Embeddings

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small', // 1536 dimensions
    input: text,
  });
  return response.data[0].embedding;
}

// Batch embed (more efficient — up to 2048 inputs per call)
async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.map(d => d.embedding);
}
```

### Index a Poll

```typescript
async function indexPoll(poll: Poll) {
  const text = `${poll.question} ${poll.options.map(o => o.text).join(' ')}`;
  const embedding = await embed(text);

  await pollSearchIndex.upsert([{
    id: poll.id,
    values: embedding,
    metadata: {
      question: poll.question,
      organizationId: poll.organizationId,
      format: poll.format,
      status: poll.status,
      voteCount: poll.voteCount,
      createdAt: poll.createdAt.toISOString(),
      tags: poll.tags ?? [],
    },
  }]);
}
```

## Search

### Basic Semantic Search

```typescript
async function searchPolls(query: string, options?: {
  topK?: number;
  filter?: Record<string, any>;
}): Promise<SearchResult[]> {
  const queryEmbedding = await embed(query);

  const results = await pollSearchIndex.query({
    vector: queryEmbedding,
    topK: options?.topK ?? 50,
    filter: options?.filter,
    includeMetadata: true,
  });

  return results.matches.map(m => ({
    pollId: m.id,
    score: m.score,
    metadata: m.metadata,
  }));
}
```

### Filtered Search

```typescript
// Search only active polls with >100 votes
const results = await pollSearchIndex.query({
  vector: queryEmbedding,
  topK: 20,
  filter: {
    status: { $eq: 'active' },
    voteCount: { $gte: 100 },
  },
  includeMetadata: true,
});

// Search within specific org
const results = await pollSearchIndex.query({
  vector: queryEmbedding,
  topK: 20,
  filter: {
    organizationId: { $eq: orgId },
  },
  includeMetadata: true,
});

// Filter by tags (array contains)
const results = await pollSearchIndex.query({
  vector: queryEmbedding,
  topK: 20,
  filter: {
    tags: { $in: ['politics', 'economy'] },
  },
  includeMetadata: true,
});
```

## Batch Operations

### Backfill Script

```typescript
async function backfillAllPolls() {
  const BATCH_SIZE = 100;
  let offset = 0;

  while (true) {
    const polls = await db.select()
      .from(pollsTable)
      .where(eq(pollsTable.status, 'active'))
      .limit(BATCH_SIZE)
      .offset(offset);

    if (polls.length === 0) break;

    // Batch embed
    const texts = polls.map(p =>
      `${p.question} ${p.options?.map((o: any) => o.text).join(' ') ?? ''}`
    );
    const embeddings = await embedBatch(texts);

    // Batch upsert (max 100 vectors per call)
    await pollSearchIndex.upsert(
      polls.map((poll, i) => ({
        id: poll.id,
        values: embeddings[i],
        metadata: {
          question: poll.question,
          organizationId: poll.organizationId,
          voteCount: poll.voteCount,
          createdAt: poll.createdAt.toISOString(),
        },
      }))
    );

    console.log(`Indexed ${offset + polls.length} polls`);
    offset += BATCH_SIZE;

    // Rate limit: OpenAI allows ~3000 RPM for embeddings
    await Bun.sleep(200);
  }
}
```

### Delete

```typescript
// Delete single
await pollSearchIndex.deleteOne(pollId);

// Delete by metadata filter
await pollSearchIndex.deleteMany({
  filter: { organizationId: { $eq: orgId } },
});
```

## Hybrid Ranking

Combine vector similarity with business signals:

```typescript
function hybridScore(match: {
  score: number;         // Cosine similarity from Pinecone (0-1)
  voteCount: number;
  createdAt: string;
  isActive: boolean;
}): number {
  const semanticWeight = 0.50;
  const recencyWeight = 0.25;
  const engagementWeight = 0.15;
  const activeWeight = 0.10;

  const daysSinceCreation =
    (Date.now() - new Date(match.createdAt).getTime()) / 86_400_000;
  const recencyScore = Math.exp(-daysSinceCreation / 30); // Decay over 30 days
  const engagementScore = Math.min(match.voteCount / 1000, 1);

  return (
    match.score * semanticWeight +
    recencyScore * recencyWeight +
    engagementScore * engagementWeight +
    (match.isActive ? 1 : 0) * activeWeight
  );
}
```

## Index Management

### Create Index

```typescript
await pinecone.createIndex({
  name: 'poll-search',
  dimension: 1536, // text-embedding-3-small
  metric: 'cosine',
  spec: {
    serverless: {
      cloud: 'aws',
      region: 'us-east-1',
    },
  },
});
```

### Index Stats

```typescript
const stats = await pollSearchIndex.describeIndexStats();
console.log(`Total vectors: ${stats.totalRecordCount}`);
console.log(`Namespaces:`, stats.namespaces);
```

## Common Mistakes

1. **Don't store large metadata** — keep metadata lean (strings, numbers, arrays of strings). Full content goes in MySQL.
2. **Batch upserts** — max 100 vectors per call, max 2MB per request
3. **Don't embed too much text** — focus on the query-relevant content (question + options), not entire HTML
4. **Handle API limits** — Pinecone free tier: 1 index, 100K vectors. Paid: unlimited.
5. **Use namespaces** for logical separation if needed (e.g., per-org search)
6. **Always `includeMetadata: true`** in queries — otherwise you only get IDs and scores
7. **Embedding model must match** — if you indexed with `text-embedding-3-small`, you must query with the same model
