---
name: design-philosophy
description: "Strategic design thinking for distinctive products. Load this skill FIRST when starting greenfield product UI, establishing or revising a design system, making decisions about visual identity or density strategy, or when the output risks looking 'default shadcn.' Covers why design drives revenue, constraint-driven identity, the four SaaS archetypes, sacred vs. innovatable patterns, whitespace-density strategy, and what Linear/Stripe/Vercel actually do. Sets the strategic frame that visual-design, ui-patterns, and interaction-motion execute against."
version: 1.0.0
---

# Design Philosophy

> The strategic layer. Why certain design decisions matter commercially, and how to develop a distinctive identity instead of shipping defaults.

---

## 1. Design Is a Revenue Strategy

This isn't opinion. The research is quantitative.

**Perception forms before comprehension.** Stanford's Web Credibility Lab (4,500+ participants): users form judgments within 50ms. 75% base trust on visual appeal alone. Identical content with higher aesthetic treatment was judged as having higher credibility in 90% of cases.

**Aesthetics override usability measurement.** Tractinsky et al. found the effect of perceived aesthetics on perceived usability was stronger than the effect of actual performance. Users perceive beautiful interfaces as more functional — even when they objectively aren't.

**Design affects price expectations at the neural level.** ERP studies show aesthetic quality changes willingness-to-pay before conscious evaluation occurs. Professional typography, consistent systems, and pixel-level polish aren't luxury investments — they're conversion levers.

**The proof point:** Linear built a $400M company with $35K in marketing spend. Design-led organic adoption. Users described the product to other users because of how it felt, not because of feature superiority.

**What this means in practice:** Every visual shortcut — default shadows, uncustomized component libraries, generic color palettes — is a measurable trust penalty. The 50ms judgment happens whether you want it to or not.

---

## 2. Constraint-Driven Identity

Karl Gerstner's concept of "programmes" — systematic rule-sets that determine all aesthetic decisions — is the most practical framework for a technical founder building a design identity.

The idea: you don't make thousands of individual design decisions. You define a small set of constraints, and those constraints generate every decision. The constraints themselves become the identity.

### The Five Constraints

**1. Color palette**
- 1 primary hue
- 1 neutral set (warm-tinted or cool-tinted, never pure gray)
- 1 semantic set (success/warning/error)
- Generated in a perceptually uniform color space (OKHsl or LCH)

**2. Type scale**
- Single family (or one display + one body maximum)
- Exactly 5-6 sizes
- Weight and opacity for additional hierarchy within sizes
- Variable font preferred (one file, any intermediate weight)

**3. Spacing scale**
- 4px base unit
- Limited multipliers: 4, 8, 12, 16, 24, 32, 48, 64
- No magic numbers outside the scale

**4. Animation vocabulary**
- 2-3 transition types with consistent easing and duration
- Spring physics for interactive elements
- Simple fades for reduced-motion fallback

**5. Elevation model**
- Choose one: surface color shifts, borders, or shadows
- Apply it consistently. Don't mix strategies.

### Why Constraints Differentiate

When everyone uses the same components (shadcn has 105K+ GitHub stars and is "the default UI lib of LLMs"), distinction comes from the specific values applied to those components:

- **Border-radius** — fully rounded (Stripe) vs. sharp (Linear) vs. subtle (Vercel)
- **Shadows** — layered multi-stop for depth (Stripe) vs. borders-only (Linear) vs. none (Vercel)
- **Spacing ratios** — 4px base for dense tools vs. 8px for airy ones
- **Animation timing** — snappy 150ms for productivity vs. slow 300ms spring for consumer
- **Typography** — a distinctive typeface is the single most impactful differentiator

The opposite of picking from a component library is building a programme that makes every choice inevitable.

### Reference Implementations

**Linear:** Three variables define the entire theme — base color, accent color, contrast level. That's the programme. Everything else derives from those three inputs. Sub-50ms interactions as a foundational design decision, not a performance optimization.

**Vercel:** Pure black at `oklch(0 0 0)`, pure white at `oklch(1 0 0)`, and the confidence to let that minimal palette carry everything. Geist Sans (1.5M+ downloads) as the sole typeface. Web Interface Guidelines that specify curly quotes vs. straight quotes.

**Stripe:** "20x more time than anyone else" on polish. CEO personally wrote randomized character delays in typing animations. Context-aware docs that insert your actual API keys. "Friction logging" — team members document stream-of-consciousness experience using features, noting every confusion point.

---

## 3. The Four SaaS Design Archetypes

Before making visual decisions, pick your archetype. Each implies specific token values.

### Precision & Density
**Linear, Raycast**

Tight spacing. Monochrome or near-monochrome. Information-forward. Keyboard-first. Every pixel earns its space. Borders > shadows. Monospace used liberally for data. The product signals: "I respect your time and expertise."

Token implications: 4px base spacing, sharp corners (2-4px radius), cool-tinted neutrals, snappy 100-150ms transitions, tabular figures everywhere.

### Warmth & Approachability
**Notion, Coda**

Generous spacing. Soft shadows or no shadows. Rounded corners. Warm neutrals. Illustrations and personality in empty states. The product signals: "Anyone can use this, even if the thing it does is complex."

Token implications: 8px base spacing, generous radius (8-12px), warm-tinted neutrals, 200-300ms ease-out transitions, friendly typography (humanist sans or serif accents).

### Sophistication & Trust
**Stripe, Mercury**

Cool tones. Layered depth via gradients and glass effects. Premium typography. Restrained animation that communicates precision. The product signals: "Your money and data are safe with us."

Token implications: mixed spacing (generous on marketing, tight in product), medium radius (6-8px), multi-stop shadows, 200-250ms transitions, refined serif or geometric sans for headings.

### Boldness & Clarity
**Vercel**

High contrast. Dramatic negative space. Black and white dominant. Bold typographic choices. The product signals: "We know exactly what we are and we're not trying to be anything else."

Token implications: 8px base spacing, sharp to medium corners, monochrome palette with one accent, bold weight headings, 150-200ms transitions, no decorative elements.

---

## 4. Sacred vs. Innovatable Patterns

Jakob's Law: "Users spend most of their time on other websites, so they expect your site to work like all the other sites they know." Even a 10% better design causes 20% worth of learning overhead.

The target is **"familiar but fresh"** — innovate on value proposition and visual identity, not on basic interactions.

### Sacred (Never Break These)

- Navigation structure and position (sidebar left, actions top-right)
- Form behavior (labels, validation, submit patterns)
- Accessibility fundamentals (focus management, keyboard nav, ARIA)
- Core interaction primitives (click targets, scroll behavior, back button)
- Modal/dialog behavior (Escape to close, backdrop click, focus trap)

### Innovatable (This Is Where Distinction Lives)

- Visual style (color, typography, spacing, elevation model)
- Layout configuration (density, grid structure, content hierarchy)
- Interaction details (hover states, transitions, micro-animations)
- Visual feedback mechanisms (loading styles, success celebrations)
- Onboarding flows and progressive disclosure strategy
- Information density and keyboard shortcut vocabulary
- Empty states and personality injection

### The Test

Before implementing any novel interaction pattern, ask: "Would a user who has never seen this product before understand what to do within 3 seconds?" If no, the pattern is breaking something sacred. Move the novelty to the visual/feedback layer instead.

---

## 5. Whitespace ↔ Density Strategy

This is not a binary choice. The same product needs both.

### The Research

- Increasing whitespace around text improves comprehension by 20%
- 68% of luxury brands rank "spatial openness" as a top-three visual tactic
- BUT: minimalist lawyer websites decreased trust by 23% (Hagtvedt & Patrick)
- Bloomberg Terminal's density and steep learning curve are features signaling professional belonging

### Matt Ström's Density Framework

Density isn't just spatial. Three dimensions:

**Spatial density** — pixels per unit of information. The obvious one. More whitespace = lower spatial density.

**Temporal density** — information per unit of time. An interface that loads in 200ms is denser than one loading in 3 seconds, even with identical content. Performance is a density mechanism.

**Semantic density** — meaning per interaction. Keyboard shortcuts, command palettes, and contextual menus all increase semantic density without touching the layout.

### The Rule

**Generous whitespace for marketing and onboarding** — reduce cognitive load for first-time users. Wide margins, large type, one idea per screen.

**Craft-dense interfaces for the product itself** — respect power users' time. Compact spacing, information-rich defaults, keyboard shortcuts as temporal density.

The transition between these two modes should be gradual, not abrupt. Onboarding → first use → regular use should feel like the interface is growing with the user's expertise, not like switching products.

### Density Mechanisms Beyond Spacing

- **Command palette (Cmd+K)** — surfaces all features without cluttering the UI
- **Keyboard shortcuts** — temporal density, invisible to beginners
- **Contextual menus** — right-click or long-press for secondary actions
- **Inline editing** — click-to-edit rather than navigate-to-form
- **Progressive disclosure** — basics visible, detail on demand
- **Smart defaults** — pre-fill what you can predict

---

## 6. What the Reference Companies Actually Do

Not what they say in blog posts. What they actually do differently.

### Linear

- **Design in the app, not in Figma.** From Karri Saarinen: "We screenshot the app and design on top... Once we start building, the design is only a reference. The real design is the app."
- **Design system is deliberately simple** — colors, type, icons, basic components. No heavy process around naming layers.
- **Speed is the foundational design decision.** Sub-50ms interactions. Not a performance optimization — a design philosophy. If an interaction takes 200ms, the design is broken.
- **Rebuilt Apple's Liquid Glass from scratch** using custom SwiftUI shaders and GPU-calculated real-time lighting because stock APIs didn't provide needed control. Craft at the extreme.

### Stripe

- **"Friction logging"** — team members document stream-of-consciousness experience using features, noting every confusion point. This is a practice, not a tool.
- **20x time investment on polish.** The ratio is intentional. One hour of feature work earns 20 minutes of polish.
- **CEO-level craft involvement.** Patrick Collison personally wrote the code for randomized character delays in typing animations. The signal: craft matters from the top.
- **Context-aware everything.** Documentation inserts your actual API keys when you're logged in. The product adapts to you, not the other way around.

### Vercel

- **Published Web Interface Guidelines** covering typographic quotes (curly vs. straight), URL-as-state (persist state in the URL so share/refresh/back/forward work), and dozens of other micro-details.
- **Extreme palette restraint.** Pure black and pure white. The confidence to let minimal palette carry everything.
- **Geist as brand asset.** A custom typeface is the single most impactful design investment they made. 1.5M+ downloads. The font *is* the brand.

### Raycast

- **One input, everything.** Replaced multi-pane app launchers with a single keyboard-driven search bar. Launching, clipboard, window management, AI, integrations — all through one surface.
- **"Search → act → done"** as a UX model. Eliminates context switching. Built on the familiar Spotlight pattern but expanded into a paradigm.

---

## 7. Anti-Patterns: "Creative" Design That Fails

The six most common failures when trying to be distinctive:

1. **Novelty over usability.** Every novel element must answer: "Does this help the user accomplish their goal faster?" If not, it's decoration.

2. **Inconsistency as "creativity."** Different visual treatments for the same element type across screens. Creativity lives in the token values, not in per-screen variation.

3. **Over-animation.** Stripe built a custom minimal WebGL implementation specifically optimized for their gradient — they didn't use a heavy 3D library. Performance is part of the design, not a tradeoff against it.

4. **Custom components that break accessibility.** Root cause: visual design decisions made without engineering input. Every custom interaction must have keyboard, screen reader, and reduced-motion alternatives.

5. **"Designed for designers" syndrome.** Interfaces that win Dribbble likes but confuse actual users. The test: put it in front of someone who matches your ICP and watch silently. If they struggle, the design failed regardless of how it looks.

6. **Copying a reference wholesale.** "The exact Linear look" copied without understanding why it works for Linear's context. Copy the principles (constraint-driven identity, performance as design, progressive density). Don't copy the specific tokens.

---

## Self-Review: Strategic Design Checklist

Before committing to a design direction:

```
□ Archetype chosen (Precision/Warmth/Sophistication/Boldness)
□ Five constraints defined (color, type, spacing, animation, elevation)
□ Constraint values documented as tokens, not just applied ad-hoc
□ Whitespace strategy mapped to user journey (generous → dense)
□ Sacred patterns preserved (nav, forms, a11y, core interactions)
□ Innovation concentrated in visual/feedback layer
□ At least one distinctive element (typeface, color, density, motion)
□ Nothing copied wholesale from a reference — principles extracted, not tokens
□ "Would a new user understand this in 3 seconds?" test passed
□ Performance budget defined (sub-400ms for interactions, sub-200ms target)
```
