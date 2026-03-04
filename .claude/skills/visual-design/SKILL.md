---
name: visual-design
description: "Visual design foundations: hierarchy, typography, color, spacing, layout, and iconography. Load this skill when building any user-facing interface to ensure correct visual structure. Covers type scales, line height, color systems, contrast/accessibility, spacing scales, grid systems, density, and icon/image treatment. Use alongside ui-patterns (interaction patterns). See design-routing/ROUTING.md for combo guidance."
version: 1.0.0
---

# Visual Design Foundations

> What a senior visual designer knows cold. These aren't preferences — they're perceptual principles backed by how humans actually process visual information.

---

## 1. Visual Hierarchy

The single most important skill. Every screen has one job: guide the eye in the right order.

**Size establishes importance.** Larger elements are processed first. The ratio matters more than the absolute size — a 32px heading next to 14px body text creates hierarchy. A 32px heading next to 28px body text doesn't.

**Weight creates emphasis within size.** Bold vs regular within the same type size creates a secondary hierarchy without needing size changes. Semibold (600) is the workhorse weight for UI — bold (700) is for headlines, medium (500) for supporting.

**Color draws attention selectively.** A single accent color on a neutral page creates a focal point. Multiple competing colors flatten the hierarchy. The rule: one dominant color used sparingly beats three colors used evenly.

**Position signals reading order.** Top-left in LTR languages is scanned first. Elements above the fold get disproportionate attention. Primary actions belong where eyes naturally land — not buried in sidebars.

**Contrast separates layers.** Foreground vs background isn't binary. Good interfaces have 3-4 contrast layers: primary content (highest contrast), secondary content (medium), tertiary/metadata (low), and disabled/ghost states (lowest).

**Spacing creates grouping.** Gestalt proximity — items close together are perceived as related. This is more powerful than lines or boxes for creating visual groups. The space between groups should be visibly larger than the space within groups (minimum 2x ratio, 3x is better).

**Hierarchy diagnostic:** Cover the screen with your hand, then reveal it. Where does your eye go first? Second? Third? If the answer doesn't match the intended priority, the hierarchy is broken.

---

## 2. Typography

Typography is 90% of UI design. Most interfaces are text. Get type right and the rest follows.

### Type Scale

A mathematical relationship between sizes creates visual harmony. Common scales:

- **Major Third (1.25):** 12 → 15 → 18.75 → 23.4 → 29.3. Tight, good for dense UIs.
- **Perfect Fourth (1.333):** 12 → 16 → 21.3 → 28.4 → 37.9. The sweet spot for most apps.
- **Golden Ratio (1.618):** 12 → 19.4 → 31.4 → 50.8. Dramatic, good for editorial/landing pages.

Pick a scale and stick to it. Don't invent sizes. A typical app needs 5-7 sizes max:

- Caption/metadata: 11-12px
- Body small: 13-14px
- Body: 15-16px
- Subheading: 18-20px
- Heading: 24-28px
- Display: 32-48px
- Hero (rare): 56-72px+

### Line Height (Leading)

- Body text: 1.5-1.6× font size (reading comfort)
- Headings: 1.1-1.3× font size (tighter, more compact)
- Captions/labels: 1.3-1.4× font size
- Display/hero: 0.9-1.1× (very tight — large text needs less leading)

**The rule:** Line height decreases as font size increases. Large type at 1.5 leading looks loose and amateurish.

### Line Length (Measure)

- Optimal reading: 45-75 characters per line (66 is the classic ideal)
- Never exceed 80 characters — readability drops sharply
- Short columns (sidebars, cards): 30-40 characters minimum before text becomes choppy
- Use `max-width` on text containers, not on the page

### Letter Spacing (Tracking)

- Body text: 0 (use the font's default — designers already optimized it)
- All-caps labels: +0.05em to +0.1em (caps need more breathing room)
- Large display text: -0.01em to -0.03em (tight tracking at large sizes looks intentional)
- Small text (<12px): +0.01em to +0.02em (helps legibility)

### Font Pairing Principles

- **Contrast, not conflict.** Pair a serif with a sans-serif. Pair a geometric sans with a humanist serif. Two similar fonts fight each other.
- **Match x-height.** Fonts with similar x-heights (the height of lowercase letters) feel harmonious when mixed.
- **One display, one workhorse.** The display font carries personality. The body font carries content. Don't make the body font compete.
- **Same designer/foundry** is a safe pairing strategy — fonts from the same designer share DNA.
- **Maximum two families.** Three font families on one page is almost always too many. Use weight/style variants within families for variety.

### Typographic Details That Signal Quality

- **Proper quotation marks** (" " not " ") — "curly quotes" vs "straight quotes"
- **Em dashes** (—) vs hyphens (-) vs en dashes (–) used correctly
- **Hanging punctuation** on pull quotes (quotation mark hangs outside the text block)
- **Optical alignment** — visually align elements, not mathematically. A triangle pointing right needs to extend slightly past the grid line to look aligned.
- **Tabular vs proportional numerals** — use tabular (monospaced) numbers in tables and data, proportional in running text
- **Small caps** for acronyms in body text (FBI, NASA) when the font supports it
- **No orphans** — don't leave a single word on the last line of a paragraph in hero text

---

## 3. Color

### Color Systems

**HSL is the right mental model for UI.** RGB is for machines. Hex is for code. HSL (Hue, Saturation, Lightness) is how humans think about color.

Building a palette:

1. Choose a primary hue (the brand color)
2. Generate a lightness scale: 50 (lightest) → 900 (darkest) in 9-11 stops
3. Keep saturation consistent or slightly increase at mid-range (pure gray at 0% saturation, full vibrancy at 100%)
4. Add 1-2 accent/semantic hues (success green, error red, warning amber, info blue)
5. Build the same lightness scale for each semantic color

**Neutral palette is the most important palette.** 80%+ of a typical UI is neutral tones. Get the neutrals wrong and nothing else matters. Pure gray (#808080) is lifeless — add a slight warm or cool tint to all neutrals. Warm neutrals (yellow/brown undertone) feel approachable. Cool neutrals (blue undertone) feel professional.

### Contrast & Accessibility

WCAG minimum contrast ratios:

- **4.5:1** for normal text (body copy, labels)
- **3:1** for large text (18px+ regular, 14px+ bold)
- **3:1** for UI components and graphical objects (icons, borders, form controls)

**Don't rely on color alone** to convey information. Add icons, text labels, or patterns. ~8% of men have some form of color vision deficiency.

Common problem areas:

- Red/green for success/error — add checkmark/X icons
- Light gray text on white — often fails 4.5:1
- Colored text on colored backgrounds — check the specific combination
- Placeholder text — usually too low contrast and vanishes when needed most

### Color Proportion

The 60-30-10 rule:

- **60%** dominant (backgrounds, large surfaces) — neutral tones
- **30%** secondary (cards, sections, sidebars) — lighter/darker neutrals or muted primary
- **10%** accent (CTAs, active states, highlights) — primary/accent color

The accent percentage is an upper bound. Many great interfaces use accent color on less than 5% of pixels. Restraint makes the accent more powerful.

### Dark Mode

Not just "invert the colors." Specific requirements:

- **Reduce contrast slightly.** Pure white (#fff) on pure black (#000) causes halation (text glows/bleeds). Use off-white (#E8E8E8-#F0F0F0) on dark gray (#121212-#1A1A1A).
- **Adjust saturation.** Saturated colors that work on light backgrounds look neon on dark ones. Desaturate by 10-20% for dark mode.
- **Invert elevation model.** Light mode: shadows go darker. Dark mode: elevated surfaces get lighter (not shadows going lighter). A modal on dark mode is slightly lighter than the background, not shadowed.
- **Test all semantic colors.** Red error text that works on white may be unreadable on dark gray. Green success may look radioactive.

---

## 4. Spacing & Layout

### The Spacing Scale

Like type scale, spacing should follow a mathematical system. Base unit × multiplier:

**4px base (most common):**
4 → 8 → 12 → 16 → 24 → 32 → 48 → 64 → 96 → 128

**8px base (simpler, slightly more generous):**
8 → 16 → 24 → 32 → 48 → 64 → 96 → 128

Name them semantically in your system:

- `space-xs`: 4px (icon padding, tight inline spacing)
- `space-sm`: 8px (related elements, form field internal padding)
- `space-md`: 16px (standard padding, card padding)
- `space-lg`: 24px (section separation within a container)
- `space-xl`: 32px (major section separation)
- `space-2xl`: 48px (page section breaks)
- `space-3xl`: 64-96px (hero sections, page-level breathing room)

### Grid Systems

**Columns aren't the point.** The gutter and margin are the point. Columns provide alignment guides, but spacing between and around columns determines the visual rhythm.

Standard web grids:

- **12-column** is the standard. Divisible by 2, 3, 4, 6. Maximum flexibility.
- Column gutters: 16-24px (tighter for dashboards/data-dense, wider for editorial/marketing)
- Page margins: 16px (mobile), 24-32px (tablet), 48-80px (desktop)
- Max content width: 1200-1440px for most applications. Let the background fill the rest.

**Subgrid awareness:** Within a card or component, use a local spacing system aligned to the global grid. A card with 16px padding should have internal elements on 8px intervals.

### Density

Match density to the use case:

- **Compact/dense:** Data tables, admin panels, developer tools. 4-8px spacing, 28-32px row height, 12-13px text.
- **Default:** Most applications. 8-16px spacing, 36-44px row height, 14-15px text.
- **Comfortable:** Consumer apps, reading-focused interfaces. 16-24px spacing, 44-56px row height, 16-18px text.
- **Spacious:** Marketing pages, editorial, onboarding flows. 24-48px+ spacing, generous whitespace.

Density should be consistent within a context. Don't mix compact data tables with spacious card layouts on the same page unless there's a clear visual separation.

---

## 5. Iconography & Imagery

### Icon Principles

- **Consistent stroke weight** across all icons in a set. Mixing 1.5px and 2px stroke icons breaks the set.
- **Consistent style:** Don't mix filled and outlined icons randomly. Common pattern: outlined for inactive, filled for active/selected.
- **Optical sizing:** Icons at 16px need different detail levels than at 24px. Small icons should be simpler. Many icon libraries provide size variants — use them.
- **Touch targets:** Icons may be 20px visually but need 44×44px touch targets on mobile (WCAG). Invisible padding around the icon.
- **Meaningful, not decorative.** Every icon should convey information. Decorative icons add visual noise without adding comprehension.

### Image Treatment

- **Aspect ratio consistency** within a context. A grid of cards with mixed aspect ratios looks broken. Pick one (16:9, 4:3, 1:1, 3:2) and crop consistently.
- **Object-fit: cover** for photos in containers. Never stretch. Never letterbox in UI contexts.
- **Loading states:** Placeholder shimmer or blurred low-res preview (LQIP) before full image loads. No layout shift.
- **Alt text:** Descriptive for content images. Empty (`alt=""`) for decorative images. Screen readers need this.

---

## Self-Review Checklist

Before finalizing any visual output:

```
□ Visual hierarchy matches task priority (size → weight → color → position)
□ Typography follows a consistent scale (no invented sizes)
□ Line height decreases as font size increases
□ Color contrast meets WCAG AA (4.5:1 text, 3:1 UI components)
□ Neutral palette has warm or cool tint (not pure gray)
□ Accent color used sparingly (≤10% of surface)
□ Spacing follows a consistent scale (4px or 8px base)
□ Density is appropriate for the use case and consistent within context
□ Icons have consistent stroke weight and style
□ Dark mode tested if applicable (no halation, desaturated colors, inverted elevation)
```
