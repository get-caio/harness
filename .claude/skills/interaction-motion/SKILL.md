---
name: interaction-motion
description: "Interaction design and motion patterns. Load this skill when implementing animations, transitions, micro-interactions, drag-and-drop, data visualization interactions, or advanced UI patterns like optimistic updates and undo flows. Covers motion principles, timing/easing curves, choreography, button/hover/scroll states, page transitions, chart interactions, dashboard patterns, and the optimistic UI / infinite scroll / undo pattern trio. Use alongside visual-design (foundations) and ui-patterns (structural patterns)."
version: 1.0.0
---

# Interaction & Motion Design

> Making interfaces feel alive and communicative without being distracting.

---

## 1. Motion Design Principles

### Purpose of Motion

Motion in UI serves exactly four purposes. If an animation doesn't serve one of these, remove it.

**1. Orientation:** Help users understand where they are in the spatial model.

- Page transitions that slide left/right communicate hierarchy (deeper → right, back → left)
- Modals that scale up from the trigger element show origin
- Tab content that slides in from the direction of the tab communicates position

**2. Feedback:** Confirm that the system received input and is responding.

- Button press states (scale down slightly)
- Toggle switches that animate between states
- Loading indicators after user action
- Checkmarks that draw themselves on success

**3. Relationship:** Show how elements are connected or how state changes relate.

- An element that expands to reveal more content (accordion) shows the content was "inside"
- Items that animate into a list show they're joining the group
- Drag-and-drop with a gap animation shows where the item will land

**4. Delight (sparingly):** Small moments that create personality.

- Confetti on a milestone completion
- A subtle bounce on an empty state illustration
- Hover effects that reveal personality
- Loading animations with character

**The hierarchy of motion importance:**
Feedback > Orientation > Relationship >>> Delight

Never sacrifice the first three for the fourth. Delight without function is distraction.

### Timing & Easing

**Duration ranges by interaction type:**

- Micro-interactions (button states, toggles): 100-200ms
- Small transitions (dropdowns, tooltips, reveals): 200-300ms
- Medium transitions (modals, panels, page sections): 300-400ms
- Large transitions (page transitions, full-screen): 400-600ms
- Complex choreography (multi-element sequences): 600-1000ms total, staggered

**Easing curves (the most under-appreciated detail):**

- **ease-out (deceleration):** Use for elements entering the screen. Fast start → gentle stop. Feels natural because objects in the real world slow down due to friction. `cubic-bezier(0.0, 0.0, 0.2, 1)`
- **ease-in (acceleration):** Use for elements leaving the screen. Slow start → fast exit. The element "falls away." `cubic-bezier(0.4, 0.0, 1, 1)`
- **ease-in-out:** Use for elements that stay on screen but change state (moving, resizing). Smooth start and stop. `cubic-bezier(0.4, 0.0, 0.2, 1)`
- **Linear:** Almost never use in UI. Feels mechanical. Only appropriate for continuous loops (progress bars, loading spinners).
- **Spring/bounce:** Use very sparingly. Good for playful UI, toggle switches, notifications popping in. Overuse makes the interface feel toy-like. `cubic-bezier(0.68, -0.55, 0.265, 1.55)` or use spring physics.

**The cardinal sin:** Using the same duration and easing for everything. A dropdown opening in 300ms ease-in-out and a button state changing in 300ms ease-in-out will feel wrong — the button is too slow, the dropdown's easing doesn't communicate directionality.

### Choreography & Staggering

When multiple elements animate simultaneously:

- **Stagger:** Each element starts slightly after the previous one. 30-60ms stagger between items. Creates a "cascade" effect that guides the eye.
- **Shared motion:** Elements that belong together should move together (a card and its shadow, a button and its label).
- **Hierarchy in animation:** Primary content animates first, secondary after. The most important element leads the choreography.
- **Keep total duration under 1000ms.** A staggered list of 20 items with 50ms stagger = 1000ms for the last item. That's the ceiling. For longer lists, batch the animation (first 8 items stagger, the rest appear instantly).

**Entrance choreography pattern:**

1. Background/container fades in first (100ms)
2. Primary content slides up + fades in (200ms, starting at 50ms)
3. Secondary content follows (200ms, starting at 100ms)
4. Interactive elements appear last (150ms, starting at 200ms)
   Total: ~400ms. Feels intentional without feeling slow.

---

## 2. Micro-Interactions

The small, often unconscious interactions that make an interface feel polished.

### Button States

A well-designed button has 6 states:

1. **Default:** The resting state
2. **Hover:** Subtle change — slight background shift, shadow increase, or border change. 150ms transition.
3. **Focus:** Visible focus ring for keyboard navigation. Must meet 3:1 contrast.
4. **Active/pressed:** Scale down to 0.97-0.98, slight darkening. 100ms. Simulates physical press.
5. **Loading:** Replace label with spinner or loading dots. Keep button width stable (don't let it resize).
6. **Disabled:** Reduced opacity (0.5) or muted colors. `cursor: not-allowed`. Never remove the button entirely — show it disabled with context for why.

### Hover Effects (Desktop)

- **Cards:** Subtle lift (translateY -2px + shadow increase) or border highlight. 200ms ease.
- **List items:** Background tint. 150ms ease.
- **Links:** Color change + underline transition (not abrupt on/off — animate the underline).
- **Images:** Slight scale (1.02-1.05) with overflow hidden on container. 300ms ease.
- **Icon buttons:** Background circle/rounded-rect appears. 150ms.

Never rely on hover for essential information — hover doesn't exist on touch devices.

### Scroll Interactions

- **Sticky headers:** Shrink on scroll (full header → compact header). Elevation/shadow increases when sticky.
- **Scroll progress:** Thin bar at top for long articles/pages. Subtle, not dominant.
- **Reveal on scroll:** Fade-in + slide-up as elements enter viewport. 20-40px translate, 300ms duration. Trigger at 10-20% visibility. Do not re-animate on scroll back up (animate once, then stay visible).
- **Parallax:** Use sparingly and subtly (0.05-0.15 speed ratio). Respect `prefers-reduced-motion`. Never on mobile.
- **Pull to refresh:** Mobile pattern. Show spinner at threshold, snap back after release.

### Drag and Drop

- **Grab cursor** on hover over draggable
- **Ghost/preview** follows cursor (slightly transparent, 0.7 opacity)
- **Gap animation** in target list shows where item will land
- **Drop zone highlight** when dragging over valid targets
- **Snap animation** on drop — item animates from drop position to final position
- **Cancel animation** if dropped outside valid zone — item returns to origin
- **Keyboard alternative required** for accessibility (up/down to move, enter to place)

### Transitions Between States

- **Accordion expand:** Height animates from 0 to auto (use max-height trick or FLIP). Content fades in as container expands. 250-300ms ease-out.
- **Tab switch:** Cross-fade (outgoing fades out while incoming fades in) or slide in direction of tab. 200ms.
- **Toggle switch:** Thumb translates to opposite side, background color transitions. 200ms ease. The physical metaphor matters — the thumb should lead the color change slightly.
- **Skeleton → content:** Skeleton shimmer stops, content fades in over skeleton. 300ms.
- **Search results update:** Outgoing results fade out (100ms), new results fade in (200ms). Or: use layout animation (items rearrange smoothly to new positions).

---

## 3. Page Transitions & Navigation

### SPA Navigation Patterns

- **Cross-fade:** Default for same-level navigation (tab to tab, page to page). 200-300ms. Simple, works everywhere.
- **Slide:** For hierarchical navigation. List → detail slides right. Detail → list slides left. Communicates depth. 300-400ms ease-out.
- **Scale + fade:** For modals and overlays. Scale from 0.95 → 1 + opacity 0 → 1. 250ms ease-out.
- **Shared element transition:** An element from the current page animates to its position on the next page (a card expanding into a detail view). The most sophisticated pattern. Requires FLIP technique or View Transitions API.

### View Transitions API (Modern)

The browser-native approach:

```css
::view-transition-old(root) {
  animation: fade-out 200ms ease-in;
}
::view-transition-new(root) {
  animation: fade-in 200ms ease-out;
}
```

Progressively enhance — detect support and fall back to instant transitions.

---

## 4. Data Visualization Interaction

### Chart Interactions

- **Hover/tooltip:** Show exact values on hover. Tooltip follows cursor or snaps to nearest data point. Vertical guideline across the chart at the hovered x-position.
- **Brushing:** Click-and-drag to select a range. Zoom into the selected range. Double-click to reset.
- **Legend interaction:** Click legend item to toggle that series. Hover legend item to highlight that series and dim others.
- **Transitions:** Animate between datasets. Bars grow from baseline, lines draw themselves, pie slices expand from center. 500-800ms ease-out.
- **Responsive:** Simplify axis labels, reduce data points, hide legend on mobile. Never just scale down a desktop chart.

### Dashboard Patterns

- **Cards as units:** Each metric/chart in a card. Cards have a consistent structure: title → metric → trend → chart.
- **Comparison is the point.** Design for comparison — align baselines, use consistent scales, show change over time. A number without context ("Revenue: $47,000") is useless. A number with comparison ("Revenue: $47,000 ↑ 12% vs last month") tells a story.
- **KPIs at the top, details below.** Executives read top-down. Lead with the 3-5 numbers that matter most.
- **Drill-down:** Click a metric to see the breakdown. Breadcrumb trail back to overview.
- **Real-time indicators:** Subtle pulse or "live" badge for real-time data. Don't animate the number changing — it's distracting. Update the number and optionally flash the card border briefly.

---

## 5. Advanced Interaction Patterns

### Optimistic UI

Show the result of an action before the server confirms. Revert if it fails.

When to use:

- Actions that almost always succeed (>99%)
- Actions that are easily reversible
- When perceived speed matters more than certainty

When NOT to use:

- Financial transactions
- Destructive operations
- Actions with complex server-side validation
- Anything involving money or legal commitments

Pattern:

1. User clicks action
2. UI immediately shows the expected result
3. Request fires in background
4. On success: no change needed (already showing the right state)
5. On failure: revert the change, show error toast, queue for retry or user re-action

### Infinite Scroll vs Pagination

**Infinite scroll when:**

- Content is a feed (social, activity logs, news)
- Users browse without a specific target
- Content is relatively homogeneous (same card types)
- Position within the list doesn't matter

**Pagination when:**

- Users need to reference "page 3" or "results 21-40"
- Data has a meaningful order (alphabetical, ranked)
- Users need to jump to a specific position
- Total count matters to the user
- Content is heterogeneous (different row types)

**Cursor-based pagination > offset pagination** for real-time data (new items don't shift pages).

### Undo Pattern

Better than "Are you sure?" in most cases:

1. User deletes item
2. Item disappears immediately
3. Toast appears: "Contact deleted. [Undo]"
4. Toast auto-dismisses in 5-8 seconds
5. If undo clicked: item reappears, deletion cancelled
6. If dismissed/expired: deletion completes

Implementation: soft delete immediately, hard delete after undo window expires. Or: delay the actual deletion by the toast duration.

This pattern is better because it doesn't interrupt the user's flow with a decision dialog, and it handles the "oops" case more gracefully than forcing a preemptive confirmation.

---

## Self-Review Checklist

```
□ Every animation serves a purpose (feedback, orientation, relationship, or delight)
□ Timing matches interaction type (100-200ms micro, 200-400ms transitions, 400-600ms page)
□ Easing matches direction (ease-out entering, ease-in leaving, ease-in-out state change)
□ Stagger total duration under 1000ms
□ prefers-reduced-motion respected (disable or simplify all motion)
□ Button has all 6 states (default, hover, focus, active, loading, disabled)
□ Hover effects don't gate essential information (touch fallback exists)
□ Drag-and-drop has keyboard alternative
□ Charts have hover tooltips, legend interaction, and responsive simplification
□ Dashboard metrics have comparison context (not raw numbers alone)
□ Optimistic UI only used for reversible, high-success-rate actions
□ Destructive actions use undo pattern over confirmation dialog
```
