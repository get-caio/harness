---
name: visual-design
description: "Visual design foundations: hierarchy, typography, color, spacing, layout, and iconography. Load this skill when building any user-facing interface to ensure correct visual structure. Covers Gestalt principles, type scales, perceptually uniform color systems, contrast/accessibility, spacing scales, grid systems, density, and icon/image treatment. Use alongside ui-patterns (interaction patterns). See design-routing/SKILL.md for combo guidance."
version: 2.0.0
---

# Visual Design Foundations

> What a senior visual designer knows cold. These aren't preferences — they're perceptual principles backed by how humans actually process visual information.

---

## 1. Gestalt Principles

The six Gestalt principles — developed in 1920s Germany — are the scientific foundation behind why some interfaces work and others don't. Understanding them is non-negotiable.

**Proximity** is the most powerful grouping principle in UI. Elements close together are perceived as a group, even without explicit borders. Use whitespace as a separator instead of lines: group related form fields with 8px spacing and use 24–32px gaps between unrelated sections. This eliminates the heavy dividers that plague typical component library defaults.

**Similarity** creates instant learnability. Establish 2–3 distinct visual treatments (interactive, informational, structural) and apply them consistently. Users learn to parse your interface without reading a single label.

**Figure-ground** separation is what makes modals, popovers, and layered interfaces work. Rather than hard borders, use subtle background shifts, elevation via shadows or borders, or blur to separate layers — this creates sophisticated depth.

**Closure** is what makes progress bars psychologically compelling. LinkedIn's 90% profile completion triggers a drive to "close" the incomplete form. Onboarding checklists exploit this.

**Continuity** governs eye flow along navigation breadcrumbs, tab bars, and wizard steps. Elements arranged on a line or curve are perceived as related and sequential.

**Common fate** means elements that animate together are perceived as a unit. Critical for transitions — a card and its shadow, a button and its label, must move as one.

---

## 2. Visual Hierarchy

The single most important skill. Every screen has one job: guide the eye in the right order.

**Size establishes importance.** Larger elements are processed first. The ratio matters more than the absolute size — a 32px heading next to 14px body text creates hierarchy. A 32px heading next to 28px body text doesn't.

**Weight creates emphasis within size.** Bold vs regular within the same type size creates a secondary hierarchy without needing size changes. Semibold (600) is the workhorse weight for UI — bold (700) is for headlines, medium (500) for supporting.

**Color draws attention selectively.** A single accent color on a neutral page creates a focal point. Multiple competing colors flatten the hierarchy. The rule: one dominant color used sparingly beats three colors used evenly.

**Position signals reading order.** Top-left in LTR languages is scanned first. Elements above the fold get disproportionate attention. Primary actions belong where eyes naturally land — not buried in sidebars. Users scan in predictable patterns: F-pattern for text-heavy pages, Z-pattern for sparse ones.

**Whitespace creates grouping.** Gestalt proximity — items close together are perceived as related. This is more powerful than lines or boxes for creating visual groups. The space between groups should be visibly larger than the space within groups (minimum 2x ratio, 3x is better).

**The isolation effect:** Elements surrounded by whitespace are approximately 40% more memorable. Apple dedicates 70% of store square footage to empty space while generating $5,546 per square foot. Whitespace isn't wasted space — it's emphasis.

**Contrast separates layers.** Foreground vs background isn't binary. Good interfaces have 3-4 contrast layers: primary content (highest contrast), secondary content (medium), tertiary/metadata (low), and disabled/ghost states (lowest).

**Hierarchy diagnostic:** Cover the screen with your hand, then reveal it. Where does your eye go first? Second? Third? If the answer doesn't match the intended priority, the hierarchy is broken.

---

## 3. Typography

Typography is 90% of UI design. Most interfaces are text. Get type right and the rest follows.

### Type Scale

A mathematical relationship between sizes creates visual harmony. Common scales:

- **Major Third (1.25):** 12 → 15 → 18.75 → 23.4 → 29.3. Tight, good for dense UIs and dashboards.
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

### 2025 Font Stack Reference

**Sans-serif workhorses for product UI:**
- **Inter** — screen-optimized, excellent variable font support, ubiquitous. The safe choice.
- **Geist Sans** — Swiss-inspired geometric, 9 weights, free and open source. Launched October 2023 by Vercel + Basement Studios. 1.5M+ downloads.
- **Satoshi** — modernist geometric by Indian Type Foundry, free commercial use. Strong character.
- **Neue Montreal** — versatile grotesque by Pangram Pangram, popular in design-forward products.

**Monospace (use beyond code blocks):**
- **Berkeley Mono** — the most character, $75 license. Tribute to golden-age computing. v2 December 2024 with condensed variant.
- **Geist Mono** — pairs perfectly with Geist Sans for code and terminals.
- **JetBrains Mono** — free, designed specifically for code with increased letter height.

Display monospace at **85-90% of body sans-serif size** so it doesn't visually overpower surrounding text. Use monospace for: data values, IDs, timestamps, table columns with numbers, tags, and metadata — not just code blocks. Enable tabular figures: `font-feature-settings: "tnum"` for all numerical data alignment.

**The serif revival (2024-2026):**
- **PP Editorial New** — pairs beautifully with grotesque body text. Editorial warmth.
- **Fraunces** — free variable serif with personality. Google Fonts.

Serif headlines in a product UI signal distinction in a sea of geometric sans. The trend toward serifs represents a broader move toward warmth in digital products.

**Variable fonts are the standard.** One file (~405KB) replaces four separate weight files (~680KB). Use CSS `clamp()` for fluid typography. Set weights to exact intermediate values (e.g., 650) instead of jumping between named weights (600, 700).

### Font Pairing Principles

- **Contrast, not conflict.** Pair a serif with a sans-serif. Pair a geometric sans with a humanist serif. Two similar fonts fight each other.
- **Match x-height.** Fonts with similar x-heights (the height of lowercase letters) feel harmonious when mixed.
- **One display, one workhorse.** The display font carries personality. The body font carries content. Don't make the body font compete.
- **Same designer/foundry** is a safe pairing strategy — fonts from the same designer share DNA.
- **Maximum two families.** Three font families on one page is almost always too many. Use weight/style variants within families for variety.

### Typographic Details That Signal Quality

- **Proper quotation marks** (" " not " ") — curly quotes, not straight quotes. Vercel's Web Interface Guidelines specify this.
- **Em dashes** (—) vs hyphens (-) vs en dashes (–) used correctly
- **Tabular vs proportional numerals** — use tabular (monospaced) numbers in tables and data, proportional in running text. `font-feature-settings: "tnum"`.
- **Small caps** for acronyms in body text (FBI, NASA) when the font supports it
- **No orphans** — don't leave a single word on the last line of a paragraph in hero text
- **Optical alignment** — visually align elements, not mathematically. A triangle pointing right needs to extend slightly past the grid line to look aligned.

---

## 4. Color

### Perceptually Uniform Color Spaces

HSL is useful for talking about color but **not for building palettes.** Colors at the same HSL lightness don't appear equally bright to human eyes. The current standard for palette generation:

- **OKHsl / OKLab** — combines HSL's intuitive model with perceptual uniformity. Stripe migrated here from CIELAB. Created by Björn Ottosson.
- **LCH** — Linear's choice. Three variables (base color, accent color, contrast level) generate the entire theme. The contrast variable enables automatic high-contrast theme generation for accessibility.
- **Radix UI Colors** — the best open-source reference implementation. 30 color scales with 12 calibrated steps each. Specific steps guarantee contrast ratios for their intended use:
  - Steps 1-2: backgrounds
  - Steps 3-5: interactive components
  - Steps 6-7: borders
  - Steps 8-9: solid colors
  - Steps 11-12: text

Build palettes in a perceptually uniform space, export to hex/rgb for code. When step numbers differ by 500 or more, colors should conform to WCAG AA contrast ratio of 4.5:1.

**Tools:** Adobe Leonardo (contrast-ratio-targeted generation), Colorbox (Lyft's scale generator), Radix UI Colors (open-source accessible scales). The upcoming APCA (Advanced Perceptual Contrast Algorithm) in WCAG 3 more accurately predicts how human vision perceives text than WCAG 2's formula.

### Building a Palette

1. Choose a primary hue (the brand color)
2. Generate a lightness scale: 50 (lightest) → 900 (darkest) in 9-11 stops
3. Keep saturation consistent or slightly increase at mid-range
4. Add 1-2 accent/semantic hues (success green, error red, warning amber, info blue)
5. Build the same lightness scale for each semantic color
6. Use semantic naming by purpose (`surface.default`, `text.secondary`), not appearance (`gray-200`, `blue-500`)

### Neutral Palette

The neutral palette is the most important palette. 80%+ of a typical UI is neutral tones. Get neutrals wrong and nothing else matters.

**Never use pure gray.** Add a slight warm or cool tint to all neutrals. Warm neutrals (yellow/brown undertone) feel approachable. Cool neutrals (blue undertone) feel professional. Linear's grays have a blue tint. The tint direction should match your design archetype.

### Surface Hierarchy > Shadows

For technical and productivity products, prefer **surface color shifts and subtle borders** over shadow-based elevation. This is what Linear, Vercel, and Supabase do.

A card at `#fff` on `#f8fafc` already feels elevated without any shadow. Hierarchy through surface color shifts is cleaner and performs better than multi-stop box-shadows.

Reserve shadows for:
- Popovers and dropdowns (floating layers that must read as detached)
- Drag states (element needs to read as "lifted")
- Marketing/landing pages where depth adds drama

This is a position, not a rule — if your archetype is Sophistication & Trust (Stripe), layered shadows contribute to that identity. But the default should be surfaces and borders.

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

Not just "invert the colors." Dark mode is a separate design system.

**The elevation principle:** The higher a surface's elevation, the lighter its surface color. This replaces shadows, which are nearly invisible on dark backgrounds. Define 3-5 elevation levels, each slightly lighter than the previous.

**Reduce contrast.** Pure white (#fff) on pure black (#000) causes halation (text glows/bleeds). Use off-white on dark gray:
- Surfaces: #121212 or custom tinted near-blacks (never pure #000)
- High-emphasis text: 87% opacity white
- Medium-emphasis text: 60% opacity white
- Disabled text: 38% opacity white

**Adjust saturation.** Saturated colors that work on light backgrounds look neon on dark ones. Desaturate by 10-20% for dark mode. However: darker colors are highly tolerant of saturation while still reading as neutral — dark mode naturally supports richer, more opinionated color choices. This is why Linear and Raycast can use vibrant gradients against dark surfaces effectively.

**Text weight shifts.** Bright text on dark backgrounds appears heavier. Consider reducing body text weight by one step and slightly increasing letter spacing in dark mode.

**Test all semantic colors.** Red error text that works on white may be unreadable on dark gray. Green success may look radioactive.

---

## 5. Spacing & Layout

### The Spacing Scale

Like type scale, spacing should follow a mathematical system. Base unit × multiplier:

**4px base (most common for dense/productive UIs):**
4 → 8 → 12 → 16 → 24 → 32 → 48 → 64 → 96 → 128

**8px base (simpler, more generous for consumer/marketing):**
8 → 16 → 24 → 32 → 48 → 64 → 96 → 128

Name them semantically:

- `space-xs`: 4px (icon padding, tight inline spacing)
- `space-sm`: 8px (related elements, form field internal padding)
- `space-md`: 16px (standard padding, card padding)
- `space-lg`: 24px (section separation within a container)
- `space-xl`: 32px (major section separation)
- `space-2xl`: 48px (page section breaks)
- `space-3xl`: 64-96px (hero sections, page-level breathing room)

No magic numbers. Every spacing value should trace back to the scale. If a value is needed that doesn't exist in the scale, the scale might need expanding — but don't just invent a one-off.

### Grid Systems

**Columns aren't the point.** The gutter and margin are the point. Columns provide alignment guides, but spacing between and around columns determines the visual rhythm.

Three grid types:

- **Column grids** (typically 12) — divide the page into vertical columns. Best for marketing pages and editorial layouts. Maximum flexibility (divisible by 2, 3, 4, 6).
- **Modular grids** — add horizontal divisions to create a matrix. Ideal for dashboards and data-dense interfaces.
- **Hierarchical grids** — zones defined by content importance, breaking free from strict columns.

Standard web grids:
- Column gutters: 16-24px (tighter for dashboards, wider for editorial)
- Page margins: 16px (mobile), 24-32px (tablet), 48-80px (desktop)
- Max content width: 1200-1440px for most applications

**The grid should be foundation, not prison.** The most distinctive interfaces break grids deliberately for visual interest: scale breaks where one element is dramatically larger than the grid suggests (Apple does this constantly), bleeding elements that extend between columns, and negative space where entire grid modules are left empty. Linear uses an "inverted L-shape" navigation frame with content in a consistent grid.

**Subgrid awareness:** Within a card or component, use a local spacing system aligned to the global grid. A card with 16px padding should have internal elements on 8px intervals.

### Density

Match density to the use case:

- **Compact/dense:** Data tables, admin panels, developer tools. 4-8px spacing, 28-32px row height, 12-13px text.
- **Default:** Most applications. 8-16px spacing, 36-44px row height, 14-15px text.
- **Comfortable:** Consumer apps, reading-focused interfaces. 16-24px spacing, 44-56px row height, 16-18px text.
- **Spacious:** Marketing pages, editorial, onboarding flows. 24-48px+ spacing, generous whitespace.

Density should be consistent within a context. Don't mix compact data tables with spacious card layouts on the same page unless there's a clear visual separation.

---

## 6. Iconography & Imagery

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
□ Gestalt proximity used for grouping (whitespace > divider lines)
□ Visual hierarchy matches task priority (size → weight → color → position)
□ Typography follows a consistent scale (no invented sizes)
□ Line height decreases as font size increases
□ Palette built in perceptually uniform color space (OKHsl, LCH, or Radix reference)
□ Neutrals have warm or cool tint (not pure gray)
□ Color contrast meets WCAG AA (4.5:1 text, 3:1 UI components)
□ Color is not the sole indicator of state (icons/text supplement)
□ Elevation model consistent (surfaces+borders OR shadows, not mixed arbitrarily)
□ Accent color used sparingly (≤10% of surface)
□ Spacing follows a consistent scale (4px or 8px base, no magic numbers)
□ Density is appropriate for the use case and consistent within context
□ Icons have consistent stroke weight and style
□ Variable font used where available (single file, intermediate weights)
□ Tabular figures enabled for numerical data
□ Dark mode tested if applicable (no halation, elevation via surface lightness, adjusted saturation and text weight)
```
