---
name: design-routing
description: "Design skill routing guide — which design skills to load for common tasks. Always load visual-design + ui-patterns as baseline. Add interaction-motion for animation work, design-system for component architecture, svg-animation for SMIL/SVG visuals, and design-craft for emotional polish. Read this skill first when doing any UI work to know which skills to combine."
version: 1.0.0
---

# Design Skills — Routing Guide

> How to decide which skill(s) to load for a given task.

---

## The Skills

| Skill                  | What It Covers                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **visual-design**      | Hierarchy, typography, color, spacing, layout, density, iconography. _"Are the values right?"_                                                      |
| **ui-patterns**        | Heuristics, IA, forms, tables, modals, feedback/loading/error/empty states, responsive, accessibility, applied patterns. _"Does it work?"_          |
| **interaction-motion** | Motion principles, timing/easing, micro-interactions, page transitions, drag-drop, data viz, optimistic UI, undo. _"Does it feel right?"_           |
| **design-system**      | Token architecture, component API patterns (variant/size/composition), state management, platform conventions, governance. _"Is it maintainable?"_  |
| **svg-animation**      | SMIL animation patterns, concept-driven SVG visuals, particle paths, pulsing nodes, dashed flows, choreography. _"Does the visual tell the story?"_ |
| **design-craft**       | Empty states, loading states, micro-interactions, illustrations, emotional design, dark mode polish. _"Does it delight?"_                           |

---

## Routing Rules

### Always load `visual-design` + `ui-patterns` together

These two are the baseline for any UI work. Visual-design gives you the correct values (type scale, color, spacing). UI-patterns gives you the correct structure (which component, how it behaves, accessibility).

### Add `interaction-motion` when:

- Task involves animations or transitions
- Building interactive components (drag-drop, accordions, tabs with animation)
- Implementing loading states, skeleton screens, or optimistic updates
- Working on page transitions or navigation choreography
- Building dashboards with charts
- Any mention of "polish," "feel," or "micro-interactions"

### Add `design-system` when:

- Creating reusable components or a component library
- Defining or extending design tokens
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
- Implementing dark mode
- Adding illustrations or imagery to the app
- Final polish pass before shipping

### Relationship between skills

- **`visual-design`** → Structural correctness of visual decisions. _Are the values right?_
- **`ui-patterns`** → Structural correctness of interaction decisions. _Does it work?_
- **`interaction-motion`** → Animation and advanced interaction quality. _Does it feel right?_
- **`design-system`** → Architecture and reusability. _Is it maintainable?_
- **`svg-animation`** → Concept-driven SVG visuals. _Does the visual tell the story?_
- **`design-craft`** → Emotional design and polish. _Does it delight?_

---

## Common Task → Skill Combos

| Task                             | Skills to Load                                                     |
| -------------------------------- | ------------------------------------------------------------------ |
| Build a new page/view            | `visual-design` + `ui-patterns`                                    |
| Build a dashboard                | `visual-design` + `ui-patterns` + `interaction-motion`             |
| Add animation/polish to existing | `interaction-motion` + `design-craft`                              |
| Create a reusable component      | `visual-design` + `ui-patterns` + `design-system`                  |
| Design a form                    | `visual-design` + `ui-patterns`                                    |
| Build onboarding flow            | `visual-design` + `ui-patterns` + `interaction-motion`             |
| Set up design tokens             | `visual-design` + `design-system`                                  |
| Implement drag-and-drop          | `interaction-motion`                                               |
| Review/audit existing UI         | `visual-design` + `ui-patterns` (+ `interaction-motion` if motion) |
| Build a data table               | `visual-design` + `ui-patterns`                                    |
| Landing page                     | `visual-design` + `interaction-motion` + `design-craft`            |
| SVG illustrations / visual story | `svg-animation`                                                    |
| Slide deck with animated visuals | `svg-animation` + `interaction-motion`                             |
| Final polish pass                | `design-craft` + `interaction-motion`                              |
| Empty/loading/error state design | `ui-patterns` + `design-craft`                                     |
