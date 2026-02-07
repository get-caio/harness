---
title: Auth Flow
description: Authentication and authorization architecture
---

# Auth Flow

::: info
Auto-updated when authentication changes are committed.
:::

## Overview

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as Auth API
    participant DB as Database

    U->>C: Enter credentials
    C->>A: POST /api/auth/login
    A->>DB: Verify credentials
    DB-->>A: User record
    A-->>C: Session token
    C->>C: Store token
```

## Auth Provider

To be determined — see spec decisions.

## Protected Routes

| Route Pattern | Auth Required | Role Required |
| ------------- | ------------- | ------------- |
| —             | —             | —             |

## Middleware

Authentication middleware will be documented here once implemented.
