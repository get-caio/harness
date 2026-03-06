---
name: interaction-motion
description: "Interaction design and motion patterns. Load this skill when implementing animations, transitions, micro-interactions, drag-and-drop, data visualization interactions, or advanced UI patterns like optimistic updates and undo flows. Covers motion principles (Disney-derived), spring physics as default, timing/easing curves, choreography, perceived performance, page transitions, chart interactions, dashboard patterns, motion accessibility (no-motion-first), and the optimistic UI / infinite scroll / undo pattern trio. Use alongside visual-design (foundations) and ui-patterns (structural patterns)."
version: 2.0.0
---

# Interaction & Motion Design

> Making interfaces feel alive and communicative without being distracting.

---

## 1. Motion Design Principles

### Purpose of Motion

Motion in UI serves exactly four purposes. If an animation doesn't serve one of these, remove it.

**1. Feedback:** Confirm that the system received input and is responding.

- Button press states (scale down slightly)
- Toggle switches that animate between states
- Loading indicators after user action
- Checkmarks that draw themselves on success

**2. Orientation:** Help users understand where they are in the spatial model.

- Page transitions that slide left/right communicate hierarchy (deeper → right, back → left)
- Modals that scale up from the trigger element show origin
- Tab content that slides in from the direction of the tab communicates position

**3. Relationship:** Show how elements are connected or how state changes relate.

- An element that expands to reveal more content (accordion) shows the content was "inside"
- Items that animate into a list show they're joining the group
- Drag-and-drop with a gap animation shows where the item will land

**4. Delight (sparingly):** Small moments that create personality.

- Confetti on a milestone completion
- A subtle bounce on an empty state illustration
- Hover effects that reveal personality

**The hierarchy of motion importance:**
Feedback > Orientation > Relationship >>> Delight

Never sacrifice the first three for the fourth. Delight without function is distraction.

### Disney Principles in UI

The 12 principles from *The Illusion of Life* (1981) map directly onto interface motion:

- **Squash & Stretch** → button press states compress on tap (scale 0.95-0.98)
- **Anticipation** → hover states signal interactivity before click
- **Staging** → dimmed backdrops when modals appear, clearing visual noise
- **Follow Through** → staggered element arrivals, content settling after transition
- **Slow In / Slow Out** → the most critical principle. Objects must accelerate and decelerate naturally. Never move at constant speed. Linear easing feels mechanical and wrong.
- **Secondary Action** → shadow moves with card, icon rotates as panel expands
- **Timing** → see duration guidelines below. Speed communicates weight and importance.

Apple's HIG distills it: "Don't add motion for the sake of adding motion." Every animation should serve at least one functional purpose.

### Timing & Easing

**Duration ranges by interaction type:**

- Micro-feedback (button press, toggle): 50-100ms
- Standard transitions (dropdowns, tooltips, reveals): 150-200ms
- Medium transitions (modals, panels, page sections): 200-300ms
- Large transitions (page transitions, full-screen): 300-500ms
- Complex choreography (multi-element sequences): 500-1000ms total, staggered

**The Doherty Threshold:** Responses should stay under **400ms** to maintain attention and flow. If an interaction takes longer, the user's mental model breaks. This is a design constraint, not a performance target.

**Spring Physics as Default**

Spring-based animations should be the **default** for interactive elements, not a special effect. They handle interruptions gracefully (a user can click again mid-animation and the spring adjusts), and they feel more natural than timing-based alternatives because real objects have mass, friction, and momentum.

Specify physical properties (stiffness, damping, mass) and let duration emerge from physics:
- **Snappy interactive elements:** high stiffness (300-500), medium damping (20-30)
- **Smooth panels/modals:** medium stiffness (150-250), higher damping (25-35)
- **Bouncy celebrations:** lower stiffness (100-200), low damping (8-15)

Reserve timing-based (non-spring) animations for:
- Loading indicators and spinners (continuous loops need predictable timing)
- Progress bars
- CSS-only animations where spring physics aren't available
- Opacity-only fades where physics adds no value

**Easing curves (when not using springs):**

- **ease-out (deceleration):** Use for elements entering the screen. Fast start → gentle stop. `cubic-bezier(0.0, 0.0, 0.2, 1)`
- **ease-in (acceleration):** Use for elements leaving the screen. Slow start → fast exit. `cubic-bezier(0.4, 0.0, 1, 1)`
- **ease-in-out:** Use for elements that stay on screen but change state (moving, resizing). `cubic-bezier(0.4, 0.0, 0.2, 1)`
- **Linear:** Almost never use in UI. Feels mechanical. Only for continuous loops (progress bars, spinners).

**The cardinal sin:** Using the same duration and easing for everything. A dropdown opening in 300ms ease-in-out and a button state changing in 300ms ease-in-out will feel wrong — the button is too slow, the dropdown's easing doesn't communicate directionality.

### Choreography & Staggering

When multiple elements animate simultaneously:

- **Stagger:** Each element starts slightly after the previous one. 30-60ms stagger between items. Creates a "cascade" effect that guides the eye.
- **Shared motion:** Elements that belong together should move together (a card and its shadow, a button and its label). Gestalt common fate principle.
- **Hierarchy in animation:** Primary content animates first, secondary after. The most important element leads the choreography.
- **Keep total duration under 1000ms.** A staggered list of 20 items with 50ms stagger = 1000ms for the last item. That's the ceiling. For longer lists, batch the animation (first 8 items stagger, the rest appear instantly).

**Entrance choreography pattern:**

1. Background/container fades in first (100ms)
2. Primary content slides up + fades in (200ms, starting at 50ms)
3. Secondary content follows (200ms, starting at 100ms)
4. Interactive elements appear last (150ms, starting at 200ms)

Total: ~400ms. Feels intentional without feeling slow.

---

## 2. Perceived Performance

Users judge speed by feel, not by measurement. Perceived performance often matters more than actual performance.

### Nielsen's Thresholds

- **0.1 seconds** — feels instantaneous. No indicator needed.
- **1 second** — maintains flow. Visual feedback (button state change, skeleton) needed.
- **10 seconds** — loses attention. Background task pattern ("we'll email you when it's ready").

### Techniques

**Skeleton screens feel ~20% faster than spinners** for identical wait times. Generic loading spinners are now a UX anti-pattern. Skeletons communicate the shape of what's coming.

**Optimistic UI shows results immediately.** Instagram shows comments as posted before backend confirmation. Makes actions feel instant.

**Progress bars with slight acceleration at the end feel faster** than consistent ones. The visual acceleration creates a sense of finishing.

**Strategic "meaningful delays"** can increase perceived value. Slight pauses during security scans or payment processing suggest thoroughness. A 0ms loading screen for a "deep analysis" feels fake. 800ms with a meaningful animation feels like the system is actually working.

**A 0.1-second improvement in mobile speed can increase conversion by up to 8.4%.** Performance is a design decision, not just an engineering concern.

---

## 3. Micro-Interactions

The small, often unconscious interactions that make an interface feel polished.

### Button States

A well-designed button has 6 states:

1. **Default:** The resting state
2. **Hover:** Subtle change — slight background shift, shadow increase, or border change. 150ms transition.
3. **Focus:** Visible focus ring for keyboard navigation. Must meet 3:1 contrast.
4. **Active/pressed:** Scale down to 0.95-0.98 (squash & stretch principle), slight darkening. 50-100ms. Simulates physical press.
5. **Loading:** Replace label with spinner or loading dots. Keep button width stable (don't let it resize).
6. **Disabled:** Reduced opacity (0.5) or muted colors. `cursor: not-allowed`. Never remove the button entirely — show it disabled with context for why.

### Hover Effects (Desktop)

- **Cards:** Subtle lift (translateY -2px + shadow increase) or border highlight. 200ms ease-out.
- **List items:** Background tint. 150ms ease.
- **Links:** Color change + underline transition (animate the underline, not abrupt on/off).
- **Images:** Slight scale (1.02-1.05) with overflow hidden on container. 300ms ease-out.
- **Icon buttons:** Background circle/rounded-rect appears. 150ms.

Never rely on hover for essential information — hover doesn't exist on touch devices.

### Scroll Interactions

- **Sticky headers:** Shrink on scroll (full header → compact header). Elevation increases when sticky.
- **Scroll progress:** Thin bar at top for long articles/pages. Subtle, not dominant.
- **Reveal on scroll:** Fade-in + slide-up as elements enter viewport. 20-40px translate, 300ms duration. Trigger at 10-20% visibility. Animate once, then stay visible — do not re-animate on scroll back up.
- **Parallax:** Use sparingly and subtly (0.05-0.15 speed ratio). Respect `prefers-reduced-motion`. Never on mobile. Parallax can trigger vestibular issues.
- **Pull to refresh:** Mobile pattern. Show spinner at threshold, snap back after release.

### Drag and Drop

- **Grab cursor** on hover over draggable
- **Ghost/preview** follows cursor (slightly transparent, 0.7 opacity)
- **Gap animation** in target list shows where item will land
- **Drop zone highlight** when dragging over valid targets
- **Snap animation** on drop — item animates from drop position to final position using spring physics
- **Cancel animation** if dropped outside valid zone — item returns to origin
- **Keyboard alternative required** for accessibility (up/down to move, enter to place)

### Transitions Between States

- **Accordion expand:** Height animates from 0 to auto (use max-height trick or FLIP). Content fades in as container expands. 250-300ms ease-out.
- **Tab switch:** Cross-fade (outgoing fades out while incoming fades in) or slide in direction of tab. 200ms.
- **Toggle switch:** Thumb translates to opposite side, background color transitions. 200ms spring. Slight overshoot on the thumb adds physicality.
- **Skeleton → content:** Skeleton shimmer stops, content fades in over skeleton. 300ms.
- **Search results update:** Outgoing results fade out (100ms), new results fade in (200ms). Or: use layout animation (items rearrange smoothly to new positions).

---

## 4. Page Transitions & Navigation

### SPA Navigation Patterns

- **Cross-fade:** Default for same-level navigation (tab to tab, page to page). 200-300ms.
- **Slide:** For hierarchical navigation. List → detail slides right. Detail → list slides left. Communicates depth. 300-400ms ease-out.
- **Scale + fade:** For modals and overlays. Scale from 0.95 → 1 + opacity 0 → 1. 250ms ease-out.
- **Shared element transition:** An element from the current page animates to its position on the next page (a card expanding into a detail view). The most sophisticated pattern. Requires FLIP technique or View Transitions API.

### View Transitions API

Now Baseline in Chrome, Edge, Safari 18+, and Firefox 144+. The browser-native approach to page transitions:

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

## 5. Data Visualization Interaction

### Chart Interactions

- **Hover/tooltip:** Show exact values on hover. Tooltip follows cursor or snaps to nearest data point. Vertical guideline across the chart at the hovered x-position.
- **Brushing:** Click-and-drag to select a range. Zoom into the selected range. Double-click to reset.
- **Legend interaction:** Click legend item to toggle that series. Hover legend item to highlight that series and dim others.
- **Transitions:** Animate between datasets. Bars grow from baseline, lines draw themselves, pie slices expand from center. 500-800ms ease-out.
- **Responsive:** Simplify axis labels, reduce data points, hide legend on mobile. Never just scale down a desktop chart.

### Dashboard Patterns

- **Cards as units:** Each metric/chart in a card. Cards have a consistent structure: title → metric → trend → chart.
- **Comparison is the point.** A number without context ("Revenue: $47,000") is useless. A number with comparison ("Revenue: $47,000 ↑ 12% vs last month") tells a story. Every metric needs a reference frame.
- **KPIs at the top, details below.** Lead with the 3-5 numbers that matter most.
- **Drill-down:** Click a metric to see the breakdown. Breadcrumb trail back to overview.
- **Real-time indicators:** Subtle pulse or "live" badge for real-time data. Don't animate the number changing — it's distracting. Update the number and optionally flash the card border briefly.
- **Cross-visual filtering:** Use charts themselves as filters (click a bar segment to filter the whole dashboard). Reduces control clutter while adding insight.

---

## 6. Advanced Interaction Patterns

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
5. On failure: revert the change, show error toast, queue for retry

### Infinite Scroll vs Pagination

**Infinite scroll when:**
- Content is a feed (social, activity logs, news)
- Users browse without a specific target
- Content is relatively homogeneous
- Position within the list doesn't matter

**Pagination when:**
- Users need to reference "page 3" or "results 21-40"
- Data has a meaningful order (alphabetical, ranked)
- Users need to jump to a specific position
- Total count matters to the user

**Cursor-based pagination > offset pagination** for real-time data (new items don't shift pages).

### Undo Pattern

Better than "Are you sure?" in most cases:

1. User deletes item
2. Item disappears immediately
3. Toast appears: "Contact deleted. [Undo]"
4. Toast auto-dismisses in 5-8 seconds
5. If undo clicked: item reappears, deletion cancelled
6. If dismissed/expired: deletion completes

Implementation: soft delete immediately, hard delete after undo window expires. This pattern is better because it doesn't interrupt the user's flow, and it handles the "oops" case more gracefully than preemptive confirmation dialogs.

---

## 7. Motion Accessibility

### The Scale of the Problem

Over **35% of adults by age 40** have experienced vestibular dysfunction — 70 million people globally. Parallax scrolling, rapid scaling, and spinning elements can trigger dizziness, nausea, and migraines. This is not an edge case.

### No-Motion-First Approach

The traditional approach: build animations, then disable them for `prefers-reduced-motion` users. The more inclusive approach (Tatiana Mac): **default to no animation**, then add motion only for users who haven't indicated a preference.

```css
/* No-motion-first: animation only for those who want it */
@media (prefers-reduced-motion: no-preference) {
  .card { transition: transform 200ms ease-out; }
  .card:hover { transform: translateY(-2px); }
}

/* Traditional: disable for those who don't */
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
}
```

The no-motion-first approach is the more inclusive starting point.

### What to Keep vs. Remove for Reduced Motion

**Keep (functional motion):**
- Opacity fades (feedback and orientation)
- Color transitions (state changes)
- Simple, short fades for content appearing/disappearing

**Remove or replace:**
- Parallax scrolling
- Rapid scaling or zooming
- Spinning and rotating elements
- Staggered entrance animations
- Complex choreographed sequences
- Auto-playing animations

Replace problematic animations with simple fades. Don't nuke all motion — orientation and feedback animations matter for usability even for users with vestibular sensitivity.

### WCAG Requirements

WCAG 2.1 requires that motion animation triggered by interaction can be disabled. Provide a mechanism to pause/stop auto-playing content. Don't use flashing content (3 flashes/second threshold).

---

## 8. Tool Reference

**Framer Motion ("Motion")** — the React standard. Declarative API, `AnimatePresence` for enter/exit, `layoutId` for shared element transitions, built-in spring physics. ~30-50KB bundle. 60FPS default. Used by Stripe, Notion, Framer.

**CSS animations** — handle more than most realize. Modern capabilities:
- `animation-timeline: scroll()` for scroll-driven animations
- `linear()` easing function for spring-like curves natively
- `@starting-style` for entry animations
- View Transitions API (Baseline 2024+)
- Only animate `transform` and `opacity` for GPU-accelerated performance

**GSAP** — excels for complex multi-element timelines, ScrollTrigger for parallax, SVG morphing. Framework-agnostic.

**Lottie** — JSON-based animations from After Effects. ~600% smaller than equivalent GIFs. Vector-based and programmatically controllable. Use dotLottie format for 90% smaller files.

**Rule of thumb:** Framer Motion for React UI transitions. GSAP for complex timelines and marketing scroll experiences. CSS for everything it can handle natively. Lottie for illustrations and complex pre-built animations.

---

## Self-Review Checklist

```
□ Every animation serves a purpose (feedback, orientation, relationship, or delight)
□ Spring physics used as default for interactive elements
□ Timing matches interaction type (50-100ms micro, 150-300ms transitions, 300-500ms page)
□ Easing matches direction (ease-out entering, ease-in leaving, springs for interaction)
□ Stagger total duration under 1000ms
□ Doherty threshold respected (all interactions under 400ms)
□ Skeleton screens used instead of spinners for content loading
□ No-motion-first approach implemented (or at minimum prefers-reduced-motion respected)
□ Parallax disabled on mobile and for reduced-motion users
□ Button has all 6 states (default, hover, focus, active, loading, disabled)
□ Hover effects don't gate essential information (touch fallback exists)
□ Drag-and-drop has keyboard alternative
□ Charts have hover tooltips, legend interaction, and responsive simplification
□ Dashboard metrics have comparison context (not raw numbers alone)
□ Optimistic UI only used for reversible, high-success-rate actions
□ Destructive actions use undo pattern over confirmation dialog
```
