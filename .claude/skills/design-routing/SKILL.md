---
name: design-routing
description: "Design skill routing guide — which design skills to load for common tasks. Always consider design-philosophy for strategic direction on greenfield work. Load visual-design + ui-patterns as tactical baseline. Add interaction-motion for animation, design-system for component architecture, svg-animation for SMIL/SVG visuals, design-craft for emotional polish, and design-taste-frontend for opinionated anti-AI-slop rules on premium/greenfield UI. Pick an aesthetic mode when one applies — design-minimalist for editorial/Notion-style, design-brutalist for industrial/terminal — and load design-redesign when auditing/upgrading an existing project. Read this skill first when doing any UI work to know which skills to combine."
version: 2.2.0
---

# Design Skills — Routing Guide

> How to decide which skill(s) to load for a given task.

---

## The Skills

| Skill                     | What It Covers                                                                                                                                                                                                                                                                                  |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **design-philosophy**     | Strategic design thinking. Why design drives revenue, constraint-driven identity, SaaS archetypes, sacred vs. innovatable patterns, density strategy. _"What should this feel like and why?"_                                                                                                   |
| **visual-design**         | Gestalt principles, hierarchy, typography (2025 stacks), perceptually uniform color, spacing, layout, density, iconography. _"Are the values right?"_                                                                                                                                           |
| **ui-patterns**           | Heuristics, progressive disclosure architecture, IA, forms, tables, modals, feedback states, responsive, accessibility, onboarding, AI-native interfaces, dashboards. _"Does it work?"_                                                                                                         |
| **interaction-motion**    | Motion principles (Disney-derived), spring physics, timing/easing, micro-interactions, perceived performance, page transitions, data viz, motion accessibility. _"Does it feel right?"_                                                                                                         |
| **design-system**         | Token architecture (3-tier), component API patterns (variant/size/composition), state management, platform conventions, governance. _"Is it maintainable?"_                                                                                                                                     |
| **svg-animation**         | SMIL animation patterns, concept-driven SVG visuals, particle paths, pulsing nodes, dashed flows, choreography. _"Does the visual tell the story?"_                                                                                                                                             |
| **design-craft**          | Empty state quality ladders, loading psychology, micro-interactions, illustrations, emotional design, dark mode as a system, celebrations, mobile delight. _"Does it delight?"_                                                                                                                 |
| **design-taste-frontend** | Opinionated taste layer. Variance/motion/density dials, anti-AI-slop bans (Inter, purple glows, h-screen, 3-col cards, Unsplash, generic names), Bento 2.0 motion engine, RSC/Client boundary rules for motion. _"Does it look default or intentional?"_                                        |
| **design-minimalist**     | Aesthetic mode: editorial warm-monochrome minimalism (Notion/Linear/Vercel-editorial). Warm bone backgrounds, muted pastel accents, `1px solid #EAEAEA` borders, bento cards, SF Pro/Geist/Lyon Text. _"Does it feel quiet and premium?"_                                                       |
| **design-brutalist**      | Aesthetic mode: industrial/tactical — Swiss print OR CRT terminal (pick one, don't mix). Rigid grids, monolithic/monospace type, hazard red accent, ASCII framing, scanlines/halftones, zero border-radius. _"Does it feel mechanical and raw?"_                                                |
| **design-redesign**       | Workflow: audit and upgrade an existing project. Scan → diagnose generic AI patterns → apply targeted fixes without rewriting. Typography/color/layout/states/content/component/icon audit checklists with prioritized fix order. _"What's wrong and how do I fix it without breaking things?"_ |

---

## Routing Rules

### Start with `design-philosophy` when:

This skill sets the strategic frame. Load it FIRST for:

- Any greenfield product or major feature
- Establishing or revising a design system
- Questions about design direction, identity, or differentiation
- Decisions about density, whitespace strategy, or visual identity
- Evaluating whether current design is "too generic" or "too default"
- Choosing a design archetype (Precision, Warmth, Sophistication, Boldness)

You don't need it for: incremental updates to existing pages, bug fixes, or work where the design direction is already established.

### Always load `visual-design` + `ui-patterns` together

These two are the tactical baseline for any UI work. Visual-design gives you the correct values (type scale, color, spacing, Gestalt principles). UI-patterns gives you the correct structure (which component, how it behaves, accessibility, progressive disclosure).

### Add `interaction-motion` when:

- Task involves animations or transitions
- Building interactive components (drag-drop, accordions, tabs with animation)
- Implementing loading states, skeleton screens, or optimistic updates
- Working on page transitions or navigation choreography
- Building dashboards with charts
- Any mention of "polish," "feel," or "micro-interactions"
- Perceived performance is a concern

### Add `design-system` when:

- Creating reusable components or a component library
- Defining or extending design tokens (3-tier architecture)
- Establishing component API conventions (props, variants, sizes)
- Building for multiple platforms (desktop + mobile adaptation)
- Discussing system governance (when to add, deprecation, versioning)

### Add `svg-animation` when:

- Creating concept-driven SVG illustrations
- Building animated backgrounds or visual metaphors
- Working with SMIL animations (particles, paths, pulses)
- Slide decks or presentations with visual storytelling
- Any SVG-based motion or illustration work

### Add `design-craft` when:

- Polishing empty states, loading states, error states
- Adding emotional design elements (celebrations, personality in copy)
- Implementing dark mode as a design system
- Adding illustrations or imagery to the app
- Final polish pass before shipping
- Making an interface feel "loved" rather than just "functional"

### Add `design-taste-frontend` when:

- User says "make it premium", "less AI-looking", "Vercel-style", "high-end"
- Building greenfield marketing/landing pages, SaaS dashboards, or hero sections
- Constructing Bento grids or perpetual-motion feature sections
- The output needs opinion/taste beyond structural correctness
- Current UI looks generic and needs anti-slop rules applied

Skip for: bug fixes to existing UI, pure a11y passes, work that must match an existing tightly-scoped design system.

### Add `design-minimalist` when:

- User says "editorial", "Notion-style", "Linear-style", "document-style", "warm monochrome", "minimal but refined"
- Building workspace/productivity app UIs, SaaS landing pages, or editorial marketing sites
- The target aesthetic is quiet and premium rather than flashy, dense, or motion-rich
- Pick this as the aesthetic mode alongside `design-taste-frontend`'s anti-slop rules

Skip for: dense data dashboards (prefer `design-taste-frontend` alone), gaming/entertainment UIs, brutalist/industrial projects.

### Add `design-brutalist` when:

- User says "brutalist", "industrial", "Swiss print", "terminal", "tactical", "CRT", "utilitarian"
- Building data-heavy dashboards, portfolios, editorial sites, or statement/experimental UIs
- The target aesthetic is raw, mechanical, deliberately anti-consumer
- Pick ONE substrate (Swiss light OR Tactical dark) and commit — never mix

Skip for: standard consumer SaaS, e-commerce, social/community apps, accessibility-critical flows where density harms comprehension.

### Add `design-redesign` when:

- User says "redesign", "upgrade this UI", "make this look better", "this looks too AI-generated", "audit the design"
- Inheriting a codebase that needs visual polish
- Cleaning up a quickly-prototyped UI before shipping
- Workflow skill — pair with an aesthetic mode (`design-minimalist` / `design-brutalist` / `design-taste-frontend`) for the target direction

Skip for: greenfield design work (use `design-philosophy` + `design-taste-frontend` instead), pure a11y audits, backend-only refactors.

---

## Skill Relationships

```
design-philosophy (strategic frame — WHY)
    ↓
visual-design + ui-patterns (tactical baseline — WHAT)
    ↓
interaction-motion | design-system | svg-animation (specialized — HOW)
    ↓
design-craft (emotional polish — FEEL)
```

- **`design-philosophy`** → Strategic correctness. _What should this feel like and why?_
- **`visual-design`** → Structural correctness of visual decisions. _Are the values right?_
- **`ui-patterns`** → Structural correctness of interaction decisions. _Does it work?_
- **`interaction-motion`** → Animation and advanced interaction quality. _Does it feel right?_
- **`design-system`** → Architecture and reusability. _Is it maintainable?_
- **`svg-animation`** → Concept-driven SVG visuals. _Does the visual tell the story?_
- **`design-craft`** → Emotional design and polish. _Does it delight?_
- **`design-taste-frontend`** → Opinionated taste layer. _Does it look default or intentional?_
- **`design-minimalist`** → Aesthetic mode: editorial warm-monochrome. _Does it feel quiet and premium?_
- **`design-brutalist`** → Aesthetic mode: industrial/tactical. _Does it feel mechanical and raw?_
- **`design-redesign`** → Workflow: audit and upgrade existing UI. _What's wrong and how do I fix it without breaking things?_

---

## Common Task → Skill Combos

| Task                             | Skills to Load                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| Greenfield product UI            | `design-philosophy` + `visual-design` + `ui-patterns`                                  |
| Establish design system / tokens | `design-philosophy` + `visual-design` + `design-system`                                |
| Build a new page/view            | `visual-design` + `ui-patterns`                                                        |
| Build a dashboard                | `visual-design` + `ui-patterns` + `interaction-motion`                                 |
| Build onboarding flow            | `ui-patterns` + `interaction-motion` + `design-craft`                                  |
| AI-native interface              | `ui-patterns` + `interaction-motion` + `design-philosophy`                             |
| Add animation/polish to existing | `interaction-motion` + `design-craft`                                                  |
| Create a reusable component      | `visual-design` + `ui-patterns` + `design-system`                                      |
| Design a form                    | `visual-design` + `ui-patterns`                                                        |
| Set up design tokens             | `design-philosophy` + `visual-design` + `design-system`                                |
| Implement drag-and-drop          | `interaction-motion`                                                                   |
| Review/audit existing UI         | `visual-design` + `ui-patterns` (+ `interaction-motion` if motion)                     |
| Build a data table               | `visual-design` + `ui-patterns`                                                        |
| Landing page                     | `design-philosophy` + `visual-design` + `interaction-motion` + `design-craft`          |
| SVG illustrations / visual story | `svg-animation`                                                                        |
| Slide deck with animated visuals | `svg-animation` + `interaction-motion`                                                 |
| Final polish pass                | `design-craft` + `interaction-motion`                                                  |
| Empty/loading/error state design | `ui-patterns` + `design-craft`                                                         |
| Dark mode implementation         | `visual-design` + `design-craft`                                                       |
| "This looks too generic" fix     | `design-philosophy` + `design-taste-frontend` + `design-craft`                         |
| "Make it premium / Vercel-style" | `design-taste-frontend` + `visual-design` + `interaction-motion`                       |
| Bento grid / SaaS feature grid   | `design-taste-frontend` + `interaction-motion` + `visual-design`                       |
| Hero / marketing landing         | `design-philosophy` + `design-taste-frontend` + `visual-design` + `interaction-motion` |
| Agent/approval queue UI          | `ui-patterns` + `interaction-motion` + `design-philosophy`                             |
| Editorial / Notion-style app     | `design-minimalist` + `design-taste-frontend` + `visual-design`                        |
| Brutalist / industrial site      | `design-brutalist` + `visual-design` + `ui-patterns`                                   |
| Terminal / tactical dashboard    | `design-brutalist` + `ui-patterns` + `visual-design`                                   |
| Redesign / upgrade existing UI   | `design-redesign` + `design-taste-frontend` + `visual-design`                          |
| Audit AI-slop in a legacy UI     | `design-redesign` + `design-taste-frontend`                                            |
