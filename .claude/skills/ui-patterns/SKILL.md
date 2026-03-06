---
name: ui-patterns
description: "UI/UX design patterns and structural correctness. Load this skill when building app interfaces with interactive components — forms, tables, modals, navigation, settings pages, onboarding flows, dashboards, AI interfaces, or any CRUD surface. Covers Nielsen's heuristics, progressive disclosure architecture, information architecture, data display patterns, feedback/loading/error/empty states, responsive design, accessibility, AI-native interface patterns, onboarding, dashboard data storytelling, and applied pattern reference (search, settings, pricing). Use alongside visual-design (foundations) and interaction-motion (animation/transitions)."
version: 2.0.0
---

# UI/UX Design Patterns

> The structural thinking that makes interfaces work. Diagnostic tools, not decoration.

---

## 1. Core Heuristics (Nielsen's 10 + Modern Additions)

Use them to evaluate, not to design by committee.

**1. Visibility of system status.** The system should always keep users informed about what is going on, through appropriate feedback within reasonable time.

- Loading indicators for anything >1 second
- Progress bars for multi-step processes
- Save confirmation (not just absence of error)
- Online/offline status
- "Last synced 2 minutes ago" is more useful than a green dot

**2. Match between system and real world.** Speak the users' language, with words, phrases, and concepts familiar to them.

- A trash can icon, not "mark for deletion"
- "Your order" not "order #A7X9B2" (show both, lead with human language)
- Date formats matching locale
- Currency and measurement units matching context

**3. User control and freedom.** Users often perform actions by mistake. They need a clearly marked "emergency exit."

- Undo for destructive actions (don't just confirm — let them undo after)
- Back button works as expected
- Escape closes modals
- Clear way to deselect, cancel, abandon a flow
- "Undo" toast > "Are you sure?" dialog in most cases

**4. Consistency and standards.** Users should not have to wonder whether different words, situations, or actions mean the same thing.

- Same action = same label everywhere
- Same pattern for similar tasks (don't use a modal for deleting contacts but an inline confirm for deleting companies)
- Follow platform conventions (don't put Close on the left on web — that's macOS native)
- Internal consistency trumps external consistency when they conflict

**5. Error prevention.** Eliminate error-prone conditions or present users with a confirmation option before they commit to the action.

- Inline validation as you type (not on every keystroke — that's annoying). Show error when user leaves the field.
- Disable submit buttons when form is invalid (with explanation)
- Constraints > instructions (a date picker prevents invalid dates; a text field with "Please enter a valid date" doesn't)
- Format hints in placeholder text or labels ("YYYY-MM-DD")
- Typeahead/autocomplete to prevent typos

**6. Recognition rather than recall.** Minimize the user's memory load by making elements, actions, and options visible or easily retrievable.

- Show recent items
- Prefill forms with last-used values
- Dropdown over free-text when options are finite
- Breadcrumbs for deep navigation
- Search suggestions showing what's available

**7. Flexibility and efficiency of use.** Accelerators — unseen by the novice user — may speed up interaction for the expert user.

- Keyboard shortcuts (display them in tooltips)
- Command palette (Cmd+K pattern)
- Bulk operations for power users
- Drag-and-drop as shortcut for ordered actions (also offer explicit controls)
- API/webhook access for automation-minded users

**8. Aesthetic and minimalist design.** Every extra unit of information in a dialogue competes with the relevant units of information.

- Remove elements that don't help the current task
- Progressive disclosure — show basics first, details on demand (see Section 2)
- Labels that work without help text are better than short labels with help text
- Empty states with clear next action, not just "No data found"

**9. Help users recognize, diagnose, and recover from errors.** Error messages should be expressed in plain language, indicate the problem, and suggest a solution.

- "Email is already registered. Try signing in or use a different email." not "Error 409: Conflict"
- Highlight the field with the error, not just a banner at the top
- Don't clear the form on error
- Offer a direct fix action when possible ("Click here to reset your password")

**10. Help and documentation.** Even though it is better if the system can be used without documentation, it may be necessary to provide help.

- Contextual help (tooltip/popover) at point of need
- Searchable help, not just an FAQ
- Onboarding that teaches by doing, not by reading
- Empty states as teaching moments

**Modern additions:**

**11. Forgiveness and recoverability.** Beyond undo — the system should protect users from catastrophic, irreversible actions.

- Soft deletes over hard deletes
- Archive > delete as default
- 30-day recovery windows
- Version history for important content
- "This action cannot be undone" only when truly irreversible

**12. Spatial consistency.** Same types of elements should appear in the same screen locations across the entire application.

- Primary actions always in the same position (bottom-right for dialogs, top-right for page headers)
- Navigation always in the same place
- Filters/search always at the top of lists
- Destructive actions always in the same visual position relative to their context

---

## 2. Progressive Disclosure Architecture

The #1 pattern for managing SaaS complexity. Jakob Nielsen introduced it in 1995: show users only the most important options initially, reveal specialized options on request. Research shows it improves learnability, efficiency, and error rates simultaneously.

### Three Implementation Tiers

**Tier 1: Visual disclosure**
Show basics, reveal detail on hover, expand, or click. Accordions, expandable cards, "Show more" toggles.

Critical rule: **limit to a single secondary level per disclosure instance.** Multiple nested layers (accordion inside accordion, dropdown inside dropdown) confuse users. If you need that much depth, restructure the information architecture.

**Tier 2: Command palette (Cmd+K)**
Table stakes for productivity tools. A single keyboard shortcut surfaces all available commands in a searchable interface. It doesn't clutter the UI, scales to hundreds of features, and serves both beginners (browsing categories) and power users (typing commands directly).

Linear, Figma, GitHub, VS Code, Notion, and Raycast all use this pattern. If your product has more than ~20 features, implement a command palette.

Requirements:
- Fuzzy search across navigation, actions, and recent items
- Keyboard-navigable results (arrow keys + enter)
- Show keyboard shortcuts for actions in results
- Recent/frequent items at top
- Categories/sections in results
- Works from anywhere in the app (global hotkey)

**Tier 3: Layered feature architecture**
The Figma model for managing complexity across expertise levels:

- **Beginners:** Core features visible and immediately usable (simple shapes, text, basic frames)
- **Intermediate:** Discoverable through exploration and tooltips (Auto Layout, components, styles)
- **Advanced:** Behind menus, command palette, or keyboard shortcuts (variables, variants, complex prototyping, plugins)

Each layer feels natural once the previous one is mastered. The key: each revealed capability motivates further exploration ("aha moment" chains).

### Anti-Patterns

- Long forced tooltip tours that block the interface
- Separate tutorial pages disconnected from the actual product
- One-size-fits-all flows that ignore user segmentation
- Hiding essential features behind too many layers
- Progressive disclosure that creates dead ends (user can't find their way back)

### Cognitive Science Foundation

**Miller's Law:** Working memory holds ~7±2 chunks. The designer's job is to help users form meaningful chunks, not simply limit items to seven.

**Hick's Law:** Decision time increases logarithmically with choices. Too many items to remember plus too many choices to evaluate equals cognitive paralysis.

**Cognitive load types (Sweller):**
- Intrinsic (task complexity) — manage through chunking and progressive disclosure
- Extraneous (poor design adding effort) — minimize through clear hierarchy
- Germane (productive learning) — support through intuitive patterns

Products managing complexity well: Notion uses "/" commands as a power-user accelerator beginners can ignore. Linear uses Cmd+K. Figma provides basic operations immediately, with advanced features discoverable through exploration.

---

## 3. Information Architecture

### Navigation Patterns

**Global navigation (persistent):** Present on every page. Contains top-level sections. Sidebar (desktop) or bottom bar (mobile). 5-7 items max before cognitive load increases. Group related items under sections.

**Local navigation (contextual):** Tabs, breadcrumbs, section headers within a page. Shows where you are within a section. Changes based on which global section you're in.

**Utility navigation:** Account, settings, help, notifications. Top-right corner convention. Not part of the primary task flow but always accessible.

**Navigation depth rule:** Users should reach any content within 3 clicks from the global nav. Deep nesting (4+ levels) signals an IA problem. If your breadcrumb has 5 items, restructure.

### Content Organization

**Object-Oriented UX (OOUX)** is the most practical framework for SaaS information architecture: structure your IA around the mental models users already have. For a CRM, that's Contacts, Companies, Deals, Activities. Define relationships between objects, and navigation reveals itself.

Organization patterns:
- **Alphabetical:** Only for known-item lookup (contacts, countries). Terrible for browsing.
- **Chronological:** Activity feeds, messages, history. Most recent first unless showing a narrative.
- **Priority/importance:** Dashboards, task lists, alerts. Most critical at top.
- **Category/type:** Product catalogs, settings pages. Group by domain.
- **Task-based:** Organize by what users want to DO, not by what things ARE. "Send an email" not "Email module."
- **Audience-based:** Different views for different roles. Admin sees everything, member sees their scope.

### URL Structure

Clean, predictable, human-readable:
- `/settings/team` not `/settings?tab=team`
- `/contacts/abc123` not `/contacts?id=abc123`
- Breadcrumb should map directly to URL segments
- URL should be shareable and bookmarkable — persist state in the URL so share, refresh, Back/Forward work (Vercel's Web Interface Guidelines emphasize this)

---

## 4. Data Display & Input Patterns

### Forms

**Layout:**
- One column for most forms. Two columns only for clearly related short fields (first/last name, city/state).
- Labels above inputs (not to the left) on mobile. Left-aligned labels on desktop are acceptable for dense forms.
- Group related fields with visible sections and labels.
- Required fields should be the default — mark optional fields, not required ones (when most fields are required).

**Validation:**
- Inline validation on blur (not on every keystroke). Show error when user leaves the field.
- Success states too — green check when a field passes validation gives positive feedback.
- Error messages below the field they relate to, in red/error color, with specific guidance.
- Don't disable the submit button silently — show it disabled with a tooltip explaining what's missing, or keep it enabled and validate on submit with scroll-to-first-error.

**Progressive disclosure in forms:**
- Show conditional fields only when relevant (selecting "Other" reveals a text field)
- Multi-step forms for complex processes (with step indicator and ability to go back)
- Show/hide advanced options with a toggle, collapsed by default

### Tables & Lists

**Tables (structured, comparable data):**
- Sticky header on scroll
- Sortable columns (with sort indicator)
- Resizable columns for data-dense contexts
- Row hover state for scannability
- Checkbox column for bulk actions (sticky to left)
- Right-align numeric data for easy comparison
- Pagination or infinite scroll (not both)
- Empty state: "No contacts match these filters" with clear action, not blank space
- Loading skeleton matching table structure, not a centered spinner

**Lists (sequential, scannable):**
- Clear visual separation between items (border or spacing, not both)
- Key info visible without expanding (name, status, date — the "glanceable" fields)
- Expandable rows or click-to-detail for more info
- Virtualization for 100+ items (render only visible items)

### Selection Patterns

- **Single select from few options (<5):** Radio buttons (all visible)
- **Single select from many options (5-15):** Dropdown/select
- **Single select from very many (15+):** Searchable dropdown or combobox
- **Multi-select from few (<8):** Checkboxes (all visible)
- **Multi-select from many (8+):** Multi-select dropdown with search and chips
- **Binary choice:** Toggle switch (immediate effect) or checkbox (applied on save)
- **Range:** Slider for approximate values, number input for precise values

### Modal & Dialog Patterns

When to use modals:
- Confirming destructive actions
- Focused data entry that doesn't need full-page context
- Quick actions that shouldn't navigate away (compose email, add a note)
- Content that requires a decision before proceeding

When NOT to use modals:
- Complex multi-step flows (use a full page or wizard)
- Displaying lots of data (use a panel or page)
- Information that the user might need to reference while doing other things
- Anything that requires scrolling within the modal regularly

Dialog sizing:
- Small (400px): Confirmations, simple inputs
- Medium (600px): Forms, short content
- Large (800px): Complex forms, preview content
- Full-screen: Mobile, or truly immersive tasks

Always: close on Escape, close on backdrop click (unless data would be lost), trap focus within the dialog, return focus to trigger element on close.

---

## 5. Feedback & Communication

### Loading States

- **< 100ms:** Instant. No indicator needed.
- **100ms - 1s:** Subtle indicator. Button state change, progress bar start, skeleton screen.
- **1s - 10s:** Explicit loading. Skeleton screen (not spinner), progress bar. Show what's loading.
- **10s+:** Background task. "Processing... we'll email you when it's ready." Don't block the UI.

**Skeleton screens > spinners** for content loading. Skeletons communicate the shape of what's coming and feel ~20% faster than spinners for identical wait times.

**Optimistic updates** for actions likely to succeed (liking a post, toggling a setting). Show the result immediately, revert if the server rejects.

### Success & Error States

**Success:**
- Toast notification (auto-dismiss after 3-5 seconds) for non-critical confirmations
- Inline success state for form submissions
- Don't over-celebrate routine operations. A checkmark and "Saved" beats "Congratulations!"

**Errors:**
- Inline for form/field errors (next to the field)
- Toast for transient errors ("Connection lost — retrying...")
- Full-page for fatal errors (500, offline, auth expired)
- Error messages: what happened + what to do about it. "Payment failed. Your card was declined. Try a different card or contact your bank."

**Empty states:**
- Primary message: what this area is for
- Secondary message: why it's empty
- CTA: how to populate it
- Optional: illustration (personality, not clipart)
- Never just blank space with no explanation
- Pre-load demo data instead of showing empty states wherever possible

### Notifications

- **In-app notifications:** Bell icon with unread count. Notification center panel. Mark as read individually and in bulk.
- **Push/email notifications:** User-configurable per event type. Default to less, let users opt into more. Never auto-enroll in marketing emails from transactional signups.
- **Notification fatigue is real.** Batch low-priority notifications into digests. Let users snooze or mute categories.

---

## 6. Onboarding Architecture

Every extra minute in time-to-value lowers conversion approximately 3%. Each additional signup field costs ~7% conversion. 63% of customers consider onboarding a deciding factor when subscribing. 8 out of 10 users abandon apps because they don't know how to use them.

### What Works

**Cut signup to 3 fields max.** Name, email, password (or magic link with just email). Everything else can be collected during onboarding.

**Personalized flows.** Ask role and intent early, then tailor the workspace. Guru increased activation by 71% with persona-based onboarding. HubSpot asks role and intent, then customizes the dashboard.

**Interactive tutorials over passive tours.** Canva embeds education into pre-built design files. Users learn by doing, not by reading tooltip carousels.

**Pre-loaded demo/sample data.** Users should never face empty graphs or blank dashboards on first login. Show what the product looks like with real data so they can see the value before investing effort.

**Onboarding checklists.** Exploit the Zeigarnik effect — people feel compelled to complete incomplete tasks. Show 3-5 setup steps with progress. LinkedIn's profile completion bar is the canonical example.

**Micro-celebrations.** Asana's flying unicorn on task completion. Confetti on completing onboarding. Small moments that reinforce positive behavior.

### What's Annoying

- Long forced tooltip tours that block the interface
- One-size-fits-all flows ignoring user segmentation
- Separate tutorials disconnected from the actual product
- Collecting information you could infer or ask for later
- Onboarding that can't be revisited (settings gated behind one-time flows)

### Principles

- Show total steps and current position
- Allow skipping non-essential steps
- Pre-fill any data you already have
- Show the product in the background (don't completely gate it behind onboarding)
- Each step should have a clear value proposition ("Connect your email to send sequences directly from Go")
- Celebrate completion, then get out of the way
- Make it revisitable — don't lock settings behind onboarding

---

## 7. Dashboard & Data-Dense Design

### Tufte-Influenced Principles for Interactive Dashboards

Edward Tufte's core insight — maximize the ratio of data pixels to total pixels — translates directly to digital dashboards. But Tufte designed for static print. Interactive dashboards can use tooltips, hover states, drill-down, and filters to manage complexity dynamically.

**The synthesis:** Start Tufte-minimal, reveal density on interaction. Progressive disclosure in dashboards reduces error rates by 89% and cognitive load by 40%.

**Practical guidelines:**
- Remove decorative gridlines (data-ink ratio)
- Right-align numbers in tables
- Use sparklines in KPI cards (show trends without taking space)
- Small multiples > complex multi-series charts
- Annotate notable data points instead of relying solely on hover
- Apply the "shrink test" — can this chart be 50% smaller and still communicate?
- Embed data storytelling: annotations, narrative flow, contextual insights — not just raw charts

### Dashboard Structure

- **KPIs at the top, details below.** Lead with 3-5 numbers that matter most.
- **Comparison is the point.** A number without context ("Revenue: $47,000") is useless. A number with comparison ("Revenue: $47,000 ↑ 12% vs last month") tells a story. Every metric needs a reference frame.
- **Drill-down.** Click a metric to see the breakdown. Breadcrumb trail back to overview. Organizations with drill-down achieve 2x improvement in decision-making speed.
- **Cross-visual filtering.** Use charts themselves as filters (click a bar segment to filter the whole dashboard). Reduces control clutter while adding insight.
- **Cards as units.** Each metric/chart in a card with consistent structure: title → metric → trend → chart.

### Charting Libraries (Ecosystem Reference)

- **Recharts** (3.6M+ npm downloads) — pragmatic choice for most SaaS dashboards. Declarative React API.
- **Observable Plot** (by D3's creator Mike Bostock) — high-level API for quick charts.
- **Visx** (Airbnb) — low-level D3 primitives in React for maximum customization.
- **Nivo** — widest range of chart types with exceptional documentation.
- **D3.js** — bedrock for completely custom visualizations. Highest effort, maximum control.

---

## 8. AI-Native Interface Patterns

The field is stratifying beyond "add a chat widget." Three paradigms, ordered by maturity:

### 1. Chat Interfaces (Declining as Sole Paradigm)

Linear's Karri Saarinen calls chat "a very weak and generic form." Chat works for exploration and open-ended queries. It fails for structured workflows, repeated tasks, and situations where users know what they want.

Use chat when: the task is genuinely open-ended, the user doesn't know what to ask for, or conversation history matters.

Don't default to chat when: a form, command palette, or inline suggestion would be more efficient.

### 2. Inline AI Assistance (Ascending)

AI contextually embedded in existing workflows. Cursor's inline code suggestions are the reference implementation. The AI appears where the user is already working, suggests an action, and the user accepts, edits, or dismisses.

Patterns:
- **Suggestion panels** adjacent to the work area
- **Inline completions** that appear as the user works
- **"Fix this" / "Improve this" buttons** on specific content
- **AI-generated drafts** that populate form fields the user can edit

This is the dominant paradigm for productivity tools because it doesn't force a context switch.

### 3. Agent-Based UIs (Emerging Frontier)

Users orchestrate AI work rather than chatting with it. The user defines goals and constraints, agents execute, and the interface shows progress, requests approvals, and reports results.

Patterns:
- **Approval queues** — agent proposes actions, human approves/rejects/edits
- **Progress monitoring** — show what the agent is doing, what's pending, what's done
- **Confidence indicators** — color-code or label how certain the AI is about each output
- **Autonomy progression** — as the user approves patterns repeatedly, the agent handles them automatically

### Design Principles for All AI Interfaces

**Don't pretend the AI is more certain than it is.** Color-code confidence levels. Show when the AI is guessing vs. when it has high-signal data.

**Edit-before-apply with one-click rollback.** Never auto-apply AI suggestions to important data. Show the suggestion, let the user modify it, then apply. Always offer undo.

**Diff views for changes.** When AI modifies existing content, show old vs. new per field. Users need to understand what changed.

**Always provide non-AI alternatives.** Every AI-assisted flow should have a manual path. Users who don't trust the AI output (or whose use case is an edge case) need to be able to do the work themselves.

**Streaming UI for AI content.** When AI generates text, stream it token-by-token. A blank screen for 3 seconds then a wall of text feels broken. Streaming feels responsive even when total generation time is the same.

**Reference taxonomy:** shapeof.ai (Emily Campbell's "The Shape of AI") provides the most comprehensive taxonomy of AI UX patterns: Wayfinders, Inputs, Tuners, Governors, Trust Builders, and Identifiers.

---

## 9. Responsive & Adaptive Design

### Breakpoint Strategy

Standard breakpoints (Tailwind-style):
- `sm`: 640px (large phones)
- `md`: 768px (tablets)
- `lg`: 1024px (small laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large screens)

**Design for the content, not the device.** Breakpoints should trigger where the layout breaks, not at arbitrary device widths.

### Responsive Patterns

**Navigation:** Desktop: persistent sidebar (collapsible). Tablet: collapsed sidebar. Mobile: bottom bar (3-5 items) with "More."

**Content layout:** Desktop: multi-column. Tablet: reduced columns. Mobile: single column, full-width.

**Tables:** Desktop: full table. Tablet: horizontal scroll, sticky first column. Mobile: card-based list view or prioritized columns.

**Forms:** Desktop: can be multi-column for related fields. Tablet/Mobile: single column always.

**Touch targets:** Minimum 44×44px on touch (WCAG). 48×48px recommended (Google Material). Minimum 8px spacing between interactive elements.

---

## 10. Accessibility (Not Optional)

### Semantic HTML First

- Use `<button>` for actions, `<a>` for navigation. Not `<div onClick>`.
- Use heading hierarchy (`h1` → `h2` → `h3`). Don't skip levels.
- Use `<nav>`, `<main>`, `<aside>`, `<footer>` for landmarks.
- Use `<label>` for form fields, properly associated with `for`/`id`.
- Use `<fieldset>` and `<legend>` for related form groups.

### Keyboard Navigation

- All interactive elements reachable via Tab
- Logical tab order (follows visual layout)
- Focus visible (never `outline: none` without a custom focus indicator)
- Focus trap in modals/dialogs (Tab cycles within, not behind)
- Skip-to-content link for keyboard users to bypass navigation
- Enter/Space activate buttons, Enter submits forms, Escape closes overlays

### ARIA (When Semantic HTML Isn't Enough)

- `aria-label` for icon-only buttons ("Close", "Menu", "Search")
- `aria-expanded` for collapsible sections and dropdowns
- `aria-live="polite"` for dynamic content updates (toast notifications, loading states)
- `aria-describedby` for help text associated with form fields
- `role="alert"` for error messages that need immediate attention
- `aria-hidden="true"` for decorative elements

### Screen Reader Considerations

- Images: descriptive `alt` text for content, empty `alt=""` for decorative
- Form errors: associate error messages with fields via `aria-describedby`
- Dynamic content: announce changes with `aria-live` regions
- Tables: use `<th scope="col">` and `<th scope="row">` for header cells
- Single-page app navigation: announce route changes

### Motion & Vestibular

- Respect `prefers-reduced-motion` media query (or implement no-motion-first)
- Provide mechanism to pause/stop auto-playing content
- Avoid parallax scrolling or provide alternative
- Don't use flashing content (3 flashes/second threshold)

---

## 11. Applied Pattern Reference

### Search

- Expandable search icon → full search bar on click
- Debounce input: 200-300ms before firing search
- Show results in dropdown for small result sets, full page for large
- Highlight matching text in results
- Show recent searches and suggested queries
- "No results" state with suggestions and alternative actions
- Filter chips for active filters (removable individually, "Clear all")
- Results count: "47 results for 'widget'"

### Settings Pages

- Group settings by category (General, Notifications, Billing, Team, Integrations)
- Left sidebar navigation for categories on desktop, top tabs on mobile
- Inline editing with auto-save + confirmation, OR explicit save button per section
- Show current value alongside the control
- Dangerous settings (delete account, export data) in a separate "Danger Zone" section at bottom

### Status & Progress

- Consistent status colors across the system (green=success, amber=warning, red=error, blue=info, gray=neutral)
- Status badges: dot + label for inline, chip/badge for standalone
- Progress bars: show percentage AND absolute ("3 of 12 steps complete, 25%")
- Multi-step progress: stepper component with completed/active/upcoming states
- Avoid "almost done" states that persist — if it's at 99% for 30 seconds, the bar is lying

### Pricing & Checkout

- Comparison table for tiers (feature matrix with checkmarks)
- Highlight recommended tier
- Monthly/annual toggle with savings callout
- One-click upgrade from current tier
- Clear CTAs per tier ("Start free trial", "Upgrade", "Contact sales")
- Invoice preview before payment
- Payment form: auto-format card number with spaces, show card brand icon

---

## Self-Review Checklist

```
□ All interactive states designed (hover, focus, loading, error, empty, disabled)
□ Progressive disclosure used appropriately (basics visible, detail on demand)
□ Command palette implemented for products with 20+ features
□ Loading states appropriate to duration (skeleton > spinner, background for 10s+)
□ Error messages are specific and actionable
□ Empty states have clear next action (or demo data pre-loaded)
□ Forms validate on blur with inline errors
□ Tables have sticky headers, sort indicators, and loading skeletons
□ Navigation depth ≤ 3 clicks from global nav
□ Touch targets ≥ 44px on mobile
□ All interactive elements keyboard-accessible
□ Semantic HTML used (button, nav, main, label, fieldset)
□ Focus management correct for modals/overlays
□ Screen reader path makes sense (landmarks, headings, alt text)
□ prefers-reduced-motion respected
□ AI interfaces show confidence, support edit-before-apply, and offer manual alternatives
□ Onboarding: ≤3 signup fields, personalized flow, demo data, revisitable
□ Dashboard metrics have comparison context and drill-down capability
□ URL state is shareable and bookmarkable
```
