---
name: design-routing
description: "Design skill routing guide — which design skills to load for common tasks. Always consider design-philosophy for strategic direction on greenfield work. Load visual-design + ui-patterns as tactical baseline. Add interaction-motion for animation, design-system for component architecture, svg-animation for SMIL/SVG visuals, and design-craft for emotional polish. Read this skill first when doing any UI work to know which skills to combine."
version: 2.0.0
---

# Design Skills — Routing Guide

> How to decide which skill(s) to load for a given task.

---

## The Skills

| Skill                  | What It Covers                                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **design-philosophy**  | Strategic design thinking. Why design drives revenue, constraint-driven identity, SaaS archetypes, sacred vs. innovatable patterns, density strategy. _"What should this feel like and why?"_ |
| **visual-design**      | Gestalt principles, hierarchy, typography (2025 stacks), perceptually uniform color, spacing, layout, density, iconography. _"Are the values right?"_              |
| **ui-patterns**        | Heuristics, progressive disclosure architecture, IA, forms, tables, modals, feedback states, responsive, accessibility, onboarding, AI-native interfaces, dashboards. _"Does it work?"_ |
| **interaction-motion** | Motion principles (Disney-derived), spring physics, timing/easing, micro-interactions, perceived performance, page transitions, data viz, motion accessibility. _"Does it feel right?"_ |
| **design-system**      | Token architecture (3-tier), component API patterns (variant/size/composition), state management, platform conventions, governance. _"Is it maintainable?"_        |
| **svg-animation**      | SMIL animation patterns, concept-driven SVG visuals, particle paths, pulsing nodes, dashed flows, choreography. _"Does the visual tell the story?"_                |
| **design-craft**       | Empty state quality ladders, loading psychology, micro-interactions, illustrations, emotional design, dark mode as a system, celebrations, mobile delight. _"Does it delight?"_ |

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

---

## Common Task → Skill Combos

| Task                             | Skills to Load                                                          |
| -------------------------------- | ----------------------------------------------------------------------- |
| Greenfield product UI            | `design-philosophy` + `visual-design` + `ui-patterns`                   |
| Establish design system / tokens | `design-philosophy` + `visual-design` + `design-system`                 |
| Build a new page/view            | `visual-design` + `ui-patterns`                                         |
| Build a dashboard                | `visual-design` + `ui-patterns` + `interaction-motion`                  |
| Build onboarding flow            | `ui-patterns` + `interaction-motion` + `design-craft`                   |
| AI-native interface              | `ui-patterns` + `interaction-motion` + `design-philosophy`              |
| Add animation/polish to existing | `interaction-motion` + `design-craft`                                   |
| Create a reusable component      | `visual-design` + `ui-patterns` + `design-system`                       |
| Design a form                    | `visual-design` + `ui-patterns`                                         |
| Set up design tokens             | `design-philosophy` + `visual-design` + `design-system`                 |
| Implement drag-and-drop          | `interaction-motion`                                                    |
| Review/audit existing UI         | `visual-design` + `ui-patterns` (+ `interaction-motion` if motion)      |
| Build a data table               | `visual-design` + `ui-patterns`                                         |
| Landing page                     | `design-philosophy` + `visual-design` + `interaction-motion` + `design-craft` |
| SVG illustrations / visual story | `svg-animation`                                                         |
| Slide deck with animated visuals | `svg-animation` + `interaction-motion`                                  |
| Final polish pass                | `design-craft` + `interaction-motion`                                   |
| Empty/loading/error state design | `ui-patterns` + `design-craft`                                          |
| Dark mode implementation         | `visual-design` + `design-craft`                                        |
| "This looks too generic" fix     | `design-philosophy` + `visual-design` + `design-craft`                  |
| Agent/approval queue UI          | `ui-patterns` + `interaction-motion` + `design-philosophy`              |
