---
name: ui-patterns
description: "UI/UX design patterns and structural correctness. Load this skill when building app interfaces with interactive components — forms, tables, modals, navigation, settings pages, onboarding flows, dashboards, or any CRUD surface. Covers Nielsen's heuristics, information architecture, data display patterns, feedback/loading/error/empty states, responsive design, accessibility, and applied pattern reference (search, settings, onboarding, pricing). Use alongside visual-design (foundations) and interaction-motion (animation/transitions)."
version: 1.0.0
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
- Progressive disclosure — show basics first, details on demand
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

## 2. Information Architecture

### Navigation Patterns

**Global navigation (persistent):** Present on every page. Contains top-level sections. Sidebar (desktop) or bottom bar (mobile). 5-7 items max before cognitive load increases. Group related items under sections.

**Local navigation (contextual):** Tabs, breadcrumbs, section headers within a page. Shows where you are within a section. Changes based on which global section you're in.

**Utility navigation:** Account, settings, help, notifications. Top-right corner convention. Not part of the primary task flow but always accessible.

**Navigation depth rule:** Users should reach any content within 3 clicks from the global nav. Deep nesting (4+ levels) signals an IA problem. If your breadcrumb has 5 items, restructure.

### Content Organization Patterns

- **Alphabetical:** Only for known-item lookup (contacts, countries). Terrible for browsing.
- **Chronological:** Activity feeds, messages, history. Most recent first unless showing a narrative.
- **Priority/importance:** Dashboards, task lists, alerts. Most critical at top.
- **Category/type:** Product catalogs, settings pages. Group by domain.
- **Task-based:** Organize by what users want to DO, not by what things ARE. "Send an email" not "Email module."
- **Audience-based:** Different views/dashboards for different roles. Admin sees everything, member sees their scope.

### URL Structure

Clean, predictable, human-readable:

- `/settings/team` not `/settings?tab=team`
- `/contacts/abc123` not `/contacts?id=abc123`
- Breadcrumb should map directly to URL segments
- URL should be shareable and bookmarkable — avoid client-side-only state in URLs

---

## 3. Data Display & Input Patterns

### Forms

**Layout:**

- One column for most forms. Two columns only for clearly related short fields (first/last name, city/state).
- Labels above inputs (not to the left) on mobile. Left-aligned labels on desktop are acceptable for dense forms.
- Group related fields with visible sections and labels.
- Required fields should be the default — mark optional fields, not required ones (when most fields are required).

**Validation:**

- Inline validation on blur (not on every keystroke — that's annoying). Show error when user leaves the field.
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
- Pagination or infinite scroll (not both) — pagination for data people need to reference by page, infinite scroll for feeds
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
- Anything that requires scrolling within the modal on a regular basis

Dialog sizing:

- Small (400px): Confirmations, simple inputs
- Medium (600px): Forms, short content
- Large (800px): Complex forms, preview content
- Full-screen: Mobile, or truly immersive tasks

Always:

- Close on Escape key
- Close on backdrop click (unless data would be lost)
- Trap focus within the dialog (accessibility)
- Return focus to trigger element on close

### Command Palette (Cmd+K)

Now a table-stakes pattern for productivity tools:

- Fuzzy search across navigation, actions, and recent items
- Keyboard-navigable results
- Show keyboard shortcuts for actions
- Recent/frequent items at top
- Categories/sections in results
- Works from anywhere in the app

---

## 4. Feedback & Communication

### Loading States

- **< 100ms:** Instant. No indicator needed.
- **100ms - 1s:** Subtle indicator. Button state change, progress bar start, skeleton screen.
- **1s - 10s:** Explicit loading. Spinner, skeleton screen, progress bar. Show what's loading.
- **10s+:** Background task. "Processing... we'll email you when it's ready." Don't block the UI.

**Skeleton screens > spinners** for content loading. Skeletons communicate the shape of what's coming and feel faster (perceived performance). Use them for cards, lists, text blocks.

**Optimistic updates** for actions likely to succeed (liking a post, toggling a setting). Show the result immediately, revert if the server rejects. Makes the UI feel instant.

### Success & Error States

**Success:**

- Toast notification (auto-dismiss after 3-5 seconds) for non-critical confirmations
- Inline success state for form submissions (the form shows "Saved" or transitions to a success view)
- Don't over-celebrate. A checkmark and "Saved" is better than "Congratulations! Your changes have been saved successfully!" for routine operations

**Errors:**

- Inline for form/field errors (next to the field)
- Toast for transient errors ("Connection lost — retrying...")
- Full-page for fatal errors (500, offline, auth expired)
- Error messages: what happened + what to do about it. "Payment failed. Your card was declined. Try a different card or contact your bank."

**Empty states:**

- Primary message: what this area is for
- Secondary message: why it's empty
- CTA: how to populate it
- Optional: illustration (tasteful, not clipart)
- Never just blank space with no explanation

### Notifications

- **In-app notifications:** Bell icon with unread count. Notification center panel. Mark as read individually and in bulk.
- **Push/email notifications:** User-configurable per event type. Default to less, let users opt into more. Never auto-enroll in marketing emails from transactional signups.
- **Notification fatigue is real.** Batch low-priority notifications into digests. Let users snooze or mute categories.

---

## 5. Responsive & Adaptive Design

### Breakpoint Strategy

Standard breakpoints (Tailwind-style):

- `sm`: 640px (large phones)
- `md`: 768px (tablets)
- `lg`: 1024px (small laptops)
- `xl`: 1280px (desktops)
- `2xl`: 1536px (large screens)

**Design for the content, not the device.** Breakpoints should trigger where the layout breaks, not at arbitrary device widths.

### Responsive Patterns

**Navigation:**

- Desktop: Persistent sidebar (collapsible to icons)
- Tablet: Collapsed sidebar (hamburger to expand) or top bar
- Mobile: Bottom bar (3-5 items) with "More" for additional sections

**Content layout:**

- Desktop: Multi-column (sidebar + main, or grid)
- Tablet: Reduced columns (2-col becomes single, sidebar becomes overlay)
- Mobile: Single column, full-width

**Tables:**

- Desktop: Full table
- Tablet: Horizontal scroll, sticky first column
- Mobile: Card-based list view (each row becomes a card), or prioritized columns (hide low-priority columns)

**Forms:**

- Desktop: Can be multi-column for related fields
- Tablet/Mobile: Single column always

**Touch targets:**

- Minimum 44×44px on touch devices (WCAG)
- 48×48px recommended by Google Material
- Spacing between interactive elements: minimum 8px to prevent mis-taps

---

## 6. Accessibility (Not Optional)

Accessibility isn't a feature. It's a quality requirement.

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

- Respect `prefers-reduced-motion` media query
- Provide mechanism to pause/stop auto-playing content
- Avoid parallax scrolling or provide alternative
- Don't use flashing content (3 flashes/second threshold)

---

## 7. Applied Pattern Reference

Quick-reference for common UI patterns.

### Search

- Expandable search icon → full search bar on click
- Debounce input: 200-300ms before firing search
- Show results in dropdown for small result sets, full page for large
- Highlight matching text in results
- Show recent searches and suggested queries
- "No results" state with suggestions and alternative actions
- Filter chips for active filters (removable individually, "Clear all")
- Results count: "47 results for 'widget'" — don't leave users guessing

### Settings Pages

- Group settings by category (General, Notifications, Billing, Team, Integrations)
- Left sidebar navigation for categories on desktop, top tabs on mobile
- Inline editing with auto-save + confirmation, OR explicit save button per section
- Show current value alongside the control (toggle shows on/off label)
- Dangerous settings (delete account, export data) in a separate "Danger Zone" section at bottom, visually separated

### Onboarding

- Show total steps and current position
- Allow skipping non-essential steps
- Pre-fill any data you already have
- Show the product in the background (don't completely gate it behind onboarding)
- Each step should have a clear value proposition ("Connect your email to send sequences directly from Go")
- Celebrate completion, then get out of the way
- Make it revisitable — don't lock settings behind onboarding that can only be set once

### Status & Progress

- Use consistent status colors across the system (green=success, amber=warning, red=error, blue=info, gray=neutral)
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
- Payment form: card number, expiry, CVC. Auto-format card number with spaces. Show card brand icon.

---

## Self-Review Checklist

```
□ All interactive states designed (hover, focus, loading, error, empty, disabled)
□ Loading states appropriate to duration (<1s subtle, 1-10s explicit, 10s+ background)
□ Error messages are specific and actionable
□ Empty states have clear next action
□ Forms validate on blur with inline errors
□ Tables have sticky headers, sort indicators, and loading skeletons
□ Navigation depth ≤ 3 clicks from global nav
□ Touch targets ≥ 44px on mobile
□ All interactive elements keyboard-accessible
□ Semantic HTML used (button, nav, main, label, fieldset)
□ Focus management correct for modals/overlays
□ Screen reader path makes sense (landmarks, headings, alt text)
□ prefers-reduced-motion respected
```
