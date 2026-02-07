---
title: Architecture Overview
description: System architecture and component relationships
---

# Architecture Overview

::: info
This page is auto-updated as the system evolves. Diagrams and descriptions reflect the current state of the codebase.
:::

## System Diagram

```mermaid
graph TD
    Client[Browser / Mobile] --> NextJS[Next.js App Router]
    NextJS --> tRPC[tRPC Router]
    tRPC --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL)]
    NextJS --> Auth[BetterAuth]
    Auth --> DB
```

## Tech Stack

| Layer      | Technology                   |
| ---------- | ---------------------------- |
| Framework  | Next.js 14+ (App Router)     |
| Runtime    | Bun                          |
| Database   | PostgreSQL                   |
| ORM        | Prisma                       |
| API        | tRPC                         |
| Auth       | BetterAuth (or as specified) |
| Styling    | Tailwind CSS + shadcn/ui     |
| Testing    | Vitest + Playwright          |
| Deployment | Vercel                       |

## Request Flow

```mermaid
flowchart LR
    A[Client] -->|HTTP Request| B[Next.js Middleware]
    B -->|Auth Check| C{Authenticated?}
    C -->|No| D[Login Page]
    C -->|Yes| E[App Router]
    E -->|Server Component| F[tRPC Caller]
    E -->|Client Component| G[tRPC Client]
    F --> H[tRPC Router]
    G --> H
    H -->|Validate Input| I[Zod Schema]
    I --> J[Prisma Query]
    J --> K[(PostgreSQL)]
    K -->|Result| J
    J -->|Typed Response| H
    H -->|JSON| E
```

## Sections

- [Data Model](./data-model) — Database schema and entity relationships
- [API](./api) — API routes, tRPC procedures, and contracts
- [Auth Flow](./auth) — Authentication and authorization
