# Design System

<!-- 
FILL IN FOR YOUR PROJECT
This template provides structure — customize as needed
-->

## Brand Overview

**Product Name:** [Product Name]
**Tagline:** [One-liner]
**Voice:** [e.g., Professional but approachable, Technical but accessible]

---

## Colors

### Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Primary | #0066FF | rgb(0, 102, 255) | CTAs, links, key actions |
| Primary Dark | #0052CC | rgb(0, 82, 204) | Hover states |
| Primary Light | #E6F0FF | rgb(230, 240, 255) | Backgrounds, highlights |

### Secondary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Secondary | #10B981 | rgb(16, 185, 129) | Success, positive |
| Warning | #F59E0B | rgb(245, 158, 11) | Warnings, caution |
| Error | #EF4444 | rgb(239, 68, 68) | Errors, destructive |

### Neutral Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Gray 900 | #111827 | rgb(17, 24, 39) | Primary text |
| Gray 700 | #374151 | rgb(55, 65, 81) | Secondary text |
| Gray 500 | #6B7280 | rgb(107, 114, 128) | Muted text |
| Gray 300 | #D1D5DB | rgb(209, 213, 219) | Borders |
| Gray 100 | #F3F4F6 | rgb(243, 244, 246) | Backgrounds |
| White | #FFFFFF | rgb(255, 255, 255) | Cards, surfaces |

### Dark Mode (if applicable)

| Light Mode | Dark Mode | Usage |
|------------|-----------|-------|
| Gray 900 | Gray 100 | Primary text |
| White | Gray 900 | Backgrounds |
| Gray 100 | Gray 800 | Cards |

---

## Typography

### Font Stack

```css
/* Primary */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Monospace (code) */
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 48px / 3rem | 700 | 1.1 | Hero headlines |
| H1 | 36px / 2.25rem | 700 | 1.2 | Page titles |
| H2 | 30px / 1.875rem | 600 | 1.25 | Section headers |
| H3 | 24px / 1.5rem | 600 | 1.3 | Subsections |
| H4 | 20px / 1.25rem | 600 | 1.4 | Card titles |
| Body | 16px / 1rem | 400 | 1.5 | Paragraphs |
| Body Small | 14px / 0.875rem | 400 | 1.5 | Secondary text |
| Caption | 12px / 0.75rem | 500 | 1.4 | Labels, hints |

---

## Spacing

Using 4px base unit:

| Token | Value | Usage |
|-------|-------|-------|
| space-1 | 4px | Tight spacing |
| space-2 | 8px | Related elements |
| space-3 | 12px | Default gap |
| space-4 | 16px | Section padding |
| space-6 | 24px | Card padding |
| space-8 | 32px | Section margins |
| space-12 | 48px | Large sections |
| space-16 | 64px | Page sections |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| rounded-sm | 4px | Buttons, inputs |
| rounded-md | 8px | Cards, modals |
| rounded-lg | 12px | Large cards |
| rounded-xl | 16px | Hero sections |
| rounded-full | 9999px | Pills, avatars |

---

## Shadows

```css
/* Subtle */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Default */
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);

/* Medium */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Large */
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

/* Modal/dropdown */
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

---

## Component Patterns

### Buttons

| Variant | Background | Text | Border | Usage |
|---------|------------|------|--------|-------|
| Primary | Primary | White | None | Main CTAs |
| Secondary | White | Gray 700 | Gray 300 | Secondary actions |
| Ghost | Transparent | Primary | None | Tertiary actions |
| Destructive | Error | White | None | Delete, cancel |

**States:**
- Hover: Darken 10%
- Active: Darken 15%
- Disabled: 50% opacity
- Focus: 2px ring, Primary color

### Inputs

- Height: 40px (default), 36px (small), 48px (large)
- Border: 1px Gray 300
- Focus: 2px ring Primary
- Error: Border Error, ring Error light
- Placeholder: Gray 500

### Cards

- Background: White
- Border: 1px Gray 200 (optional)
- Radius: rounded-md (8px)
- Padding: space-4 to space-6
- Shadow: shadow-sm (hover: shadow-md)

---

## Iconography

**Icon Library:** [Lucide Icons](https://lucide.dev/) (recommended for consistency with shadcn/ui)

**Sizes:**
- Small: 16px
- Default: 20px
- Large: 24px

**Stroke:** 2px default

---

## Logo Usage

### Clear Space

Maintain minimum clear space equal to the height of the logo mark around all sides.

### Minimum Size

- Digital: 24px height minimum
- Print: 0.5 inch height minimum

### Don'ts

- Don't stretch or distort
- Don't change colors outside brand palette
- Don't add effects (shadows, gradients)
- Don't place on busy backgrounds without container

---

## Tailwind Config

```javascript
// tailwind.config.js (reference implementation)
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0066FF',
          dark: '#0052CC',
          light: '#E6F0FF',
        },
        // ... add other colors
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
}
```

---

## Resources

- **Figma:** [Link to Figma file]
- **Icon Library:** [Lucide](https://lucide.dev/)
- **Font:** [Inter](https://fonts.google.com/specimen/Inter)
