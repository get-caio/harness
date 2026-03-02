---
name: shadcn-tailwind
description: Patterns for shadcn/ui component library with Tailwind CSS — component installation, theming, dark mode, design tokens, and custom variants. Use this skill when building UI with shadcn/ui, configuring Tailwind themes, implementing dark mode, creating design token pipelines, or styling React components. Trigger on shadcn, Tailwind, design system, theme provider, dark mode, UI components, or CSS tokens.
---

# shadcn/ui + Tailwind CSS

shadcn/ui provides copy-paste React components built on Radix UI primitives, styled with Tailwind CSS. Components live in your codebase — you own them.

## When to Read This

- Installing and customizing shadcn/ui components
- Setting up the design token pipeline
- Implementing light/dark theme switching
- Building consistent UI patterns across the admin panel
- Creating custom component variants

## Setup

```bash
bunx shadcn@latest init
# Select: New York style, Zinc base color, CSS variables: yes
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        // Sided brand colors
        sided: {
          blue: 'hsl(var(--sided-blue))',
          'blue-light': 'hsl(var(--sided-blue-light))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
```

### CSS Variables (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --border: 240 5.9% 90%;
    --radius: 0.5rem;
    --sided-blue: 217 91% 60%;
    --sided-blue-light: 217 91% 95%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --border: 240 3.7% 15.9%;
  }
}
```

## Theme Provider

```typescript
// components/theme-provider.tsx
'use client';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemeProvider>
  );
}

// Force dark theme on specific routes (e.g., /ask)
export function DarkThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider attribute="class" forcedTheme="dark">
      {children}
    </NextThemeProvider>
  );
}
```

## Installing Components

```bash
bunx shadcn@latest add button card dialog table input
bunx shadcn@latest add dropdown-menu sheet tabs toast
```

Components install to `components/ui/`. You own the code — customize freely.

## Common Patterns

### Data Table with Pagination

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

function PollsTable({ polls, pagination, onPageChange }) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Votes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {polls.map((poll) => (
            <TableRow key={poll.id}>
              <TableCell className="font-medium">{poll.question}</TableCell>
              <TableCell>
                <Badge variant={poll.status === 'active' ? 'default' : 'secondary'}>
                  {poll.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{poll.voteCount.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between px-2 py-4">
        <p className="text-sm text-muted-foreground">
          {pagination.total} total polls
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={pagination.page === 1}
            onClick={() => onPageChange(pagination.page - 1)}>Previous</Button>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages}
            onClick={() => onPageChange(pagination.page + 1)}>Next</Button>
        </div>
      </div>
    </>
  );
}
```

### Stat Card

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function StatCard({ title, value, change, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

## Common Mistakes

1. **Don't use arbitrary Tailwind values** when a design token exists — use `text-muted-foreground` not `text-gray-500`
2. **Don't modify `components/ui/` unless intentional** — updates overwrite changes
3. **Always use `cn()` utility** for conditional classes: `cn('base', condition && 'active')`
4. **Don't skip the CSS variables layer** — direct color values break theme switching
5. **Use `variant` prop** not custom classes for component states
