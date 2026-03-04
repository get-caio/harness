---
name: design-system
description: "Design system architecture and component patterns. Load this skill when building or extending a design system, creating reusable component libraries, defining design tokens, or establishing component API conventions. Covers token architecture (global → semantic → component tiers), variant/size/composition patterns, UI state management for interactive elements, and platform-specific conventions (desktop, mobile, tablet). Use alongside visual-design (token values) and ui-patterns (where components get used)."
version: 1.0.0
---

# Design System Architecture

> How visual design, UI patterns, and interaction design are organized into a coherent, scalable system.

---

## 1. Token Architecture

Design tokens are the atomic values that define the visual language.

**Tier 1: Global tokens** (raw values)

```
color-blue-500: #3B82F6
space-4: 16px
font-size-md: 16px
radius-md: 8px
shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1)
duration-fast: 150ms
```

**Tier 2: Semantic tokens** (meaning)

```
color-primary: {color-blue-500}
color-error: {color-red-500}
space-component-padding: {space-4}
text-body: {font-size-md}
radius-card: {radius-md}
transition-hover: {duration-fast}
```

**Tier 3: Component tokens** (specific)

```
button-padding-x: {space-component-padding}
button-radius: {radius-card}
button-transition: {transition-hover}
card-shadow: {shadow-md}
input-border-color: {color-border}
```

This layering means changing the brand color (tier 1) cascades through semantic (tier 2) and component (tier 3) tokens automatically.

### Token Naming Conventions

Pattern: `{category}-{property}-{variant}-{state}`

Examples:

- `color-text-primary` — category: color, property: text, variant: primary
- `color-bg-surface-hover` — category: color, property: bg, variant: surface, state: hover
- `space-component-padding` — category: space, property: component-padding
- `radius-button-sm` — category: radius, property: button, variant: sm

### When to Create a New Token

- If a value appears 3+ times across components → extract to semantic token
- If a component has a unique value that maps to a design decision → component token
- If the value should change between themes (light/dark) → must be a token, not hardcoded
- If the value is a magic number with no relationship to the scale → reconsider the value, not the token

---

## 2. Component API Patterns

### Variant Pattern

Components expose a `variant` prop that maps to pre-defined visual treatments:

```
Button variants: primary, secondary, ghost, destructive, link
Badge variants: default, success, warning, error, info
Alert variants: info, success, warning, error
```

Variants are intentionally finite. If someone needs a variant that doesn't exist, the system should expand — not hack around it with custom styles.

### Size Pattern

Components expose a `size` prop:

```
Size scale: xs, sm, md (default), lg, xl
```

Sizes affect padding, font size, icon size, and minimum dimensions proportionally. A `sm` button isn't just shorter — it has smaller text, tighter padding, and a smaller icon.

### Composition Pattern

Complex components are composed from simpler ones:

```
Dialog = DialogOverlay + DialogContent + DialogHeader + DialogBody + DialogFooter
Card = CardHeader + CardContent + CardFooter
Table = TableHeader + TableBody + TableRow + TableCell
```

Each sub-component is usable independently. The parent provides context (via React context or CSS containment) but doesn't mandate the children.

### Slot Pattern

For components that need flexible content areas:

```
Card:
  - header slot (optional — title, actions, badge)
  - content slot (required — any content)
  - footer slot (optional — buttons, links, metadata)
```

Slots are named and typed. The component renders defaults for empty optional slots (or hides them). Required slots throw if missing.

### Controlled vs Uncontrolled

Interactive components support both:

- **Uncontrolled:** Component manages its own state. Simpler to use. Good for prototyping.
- **Controlled:** Parent passes value + onChange. Required for forms, complex state, persistence.

Convention: if `value` prop is provided, component is controlled. If not, component manages internal state. Same API surface either way.

---

## 3. State Management in UI

Every interactive element has a state model. Map it explicitly:

**Form field states:** empty → focused → filled → validating → valid/invalid → disabled
**Async operation states:** idle → loading → success/error → idle
**Selection states:** unselected → hovered → focused → selected → active
**Toggle states:** off → transitioning → on
**Expandable states:** collapsed → expanding → expanded → collapsing → collapsed

Design every state. Don't leave gaps. If a state isn't designed, it will look broken when it occurs.

### State Combinations

States aren't always independent. A form field can be:

- focused + empty
- focused + filled + invalid
- disabled + filled
- filled + valid + hover

Map the combinations that matter. Not all permutations are meaningful, but the common ones need explicit design. Priority combinations:

1. Default (most common state)
2. Hover (desktop interaction)
3. Focus (keyboard navigation)
4. Active (during interaction)
5. Error (something wrong)
6. Disabled (can't interact)
7. Loading (waiting)

### State Transitions

Define how states transition, not just what they look like:

- Which transitions are animated vs instant?
- What triggers each transition?
- Are there intermediate states (e.g., "validating" between "filled" and "valid")?
- Can a user interrupt a transition (e.g., clicking during a loading animation)?

---

## 4. Platform-Specific Conventions

### Desktop Conventions

- Right-click context menus
- Hover states are essential
- Keyboard shortcuts expected
- Multi-window/tab workflows
- Precise pointer allows small targets (but don't go below 24×24px)
- Drag and drop works well
- Tooltips on hover for additional context

### Mobile Conventions

- Bottom navigation (thumb zone)
- Swipe gestures (swipe to delete, swipe between tabs)
- Pull to refresh
- Touch targets minimum 44×44px
- No hover state — can't preview on hover
- Sheet/bottom drawer instead of dropdown
- Haptic feedback for confirmations (native)
- Long press for secondary actions

### Tablet Considerations

- Hybrid of both — may use mouse/keyboard or touch
- Split-view layouts (list + detail side by side)
- Sidebar that collapses but doesn't become a bottom bar
- Larger touch targets than desktop, smaller than phone

### Cross-Platform Component Adaptation

Components should adapt their behavior, not just their size:

| Component       | Desktop                       | Mobile                                    |
| --------------- | ----------------------------- | ----------------------------------------- |
| Select/dropdown | Native dropdown below trigger | Bottom sheet with full-width options      |
| Context menu    | Right-click popup             | Long-press popup or action sheet          |
| Tooltip         | Hover-triggered               | Tap-and-hold or info icon tap             |
| Navigation      | Sidebar                       | Bottom bar                                |
| Date picker     | Calendar popup                | Native date input or full-screen calendar |
| Search          | Inline expandable             | Full-screen overlay                       |
| Table           | Full grid with hover states   | Card list or horizontal scroll            |

---

## 5. System Governance

### When to Add to the System

Add a component/pattern to the design system when:

- It appears in 3+ distinct contexts
- It has clear, stable API requirements
- It encodes a design decision that should be consistent
- Multiple developers would otherwise implement it differently

Don't add when:

- It's used once (keep it local)
- Requirements are still changing rapidly
- It's a page-specific layout, not a reusable pattern

### Breaking Changes

- Deprecate before removing (add a console warning for 1 release cycle)
- Provide migration path (codemods if possible)
- Version the system semantically (breaking = major bump)
- Document the change and the reason

### Documentation Requirements

Every system component needs:

1. **Usage guidance** — when to use, when not to use
2. **API reference** — props, types, defaults
3. **Visual examples** — all variants, sizes, states
4. **Accessibility notes** — keyboard behavior, ARIA requirements
5. **Migration notes** — if replacing or extending an existing component

---

## Self-Review Checklist

```
□ Tokens follow 3-tier architecture (global → semantic → component)
□ No magic numbers — all values trace to the token scale
□ Component exposes variant, size, and composition props where appropriate
□ Controlled and uncontrolled modes both work
□ All states explicitly designed (empty, hover, focus, active, error, disabled, loading)
□ State transitions defined (animated vs instant, triggers, interruptibility)
□ Platform adaptation planned (desktop hover → mobile tap, dropdown → bottom sheet)
□ Component appears in 3+ contexts before adding to system
□ Documentation covers usage, API, examples, accessibility, and migration
□ Dark mode tokens defined alongside light mode
```
