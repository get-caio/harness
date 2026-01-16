# /design-review — Visual Polish Audit

Check UI against design standards before shipping. Complements `/audit` (code) with visual quality verification.

## Usage

```
/design-review                    # Full visual review
/design-review --component Card   # Review specific component
/design-review --page /dashboard  # Review specific page
```

---

## The Review Process

### 1. Read Design System

```
Read specs/design/DESIGN.md
Read .claude/skills/design-craft/SKILL.md
```

### 2. Component Audit

For each component, verify:

#### Spacing Consistency

```bash
# Find spacing classes
grep -rn "p-\|m-\|gap-\|space-" --include="*.tsx" src/components/ | head -50

# Check for magic numbers (non-standard spacing)
grep -rn "p-[357911]" --include="*.tsx" src/
```

#### Color Usage

```bash
# Check for hardcoded colors (should use theme)
grep -rn "#[0-9a-fA-F]\{3,6\}" --include="*.tsx" src/
grep -rn "rgb\|rgba\|hsl" --include="*.tsx" src/

# Verify semantic colors
grep -rn "text-gray\|bg-gray" --include="*.tsx" src/
```

#### Typography

```bash
# Find text styling
grep -rn "text-\|font-" --include="*.tsx" src/components/ | head -30

# Check for proper heading hierarchy
grep -rn "<h[1-6]" --include="*.tsx" src/
```

### 3. State Coverage

| State    | Check                                          | Pass Criteria                 |
| -------- | ---------------------------------------------- | ----------------------------- |
| Empty    | `grep -rn "length === 0\|!data\|isEmpty" src/` | Has designed empty state      |
| Loading  | `grep -rn "isLoading\|loading\|Skeleton" src/` | Skeleton or meaningful loader |
| Error    | `grep -rn "isError\|error\|Error" src/`        | Helpful, not scary            |
| Success  | `grep -rn "toast\|success\|onSuccess" src/`    | Feedback present              |
| Hover    | Manual inspection                              | All clickables have hover     |
| Focus    | Tab through UI                                 | Visible focus ring            |
| Disabled | `grep -rn "disabled\|isDisabled" src/`         | Clear visual distinction      |

### 4. Accessibility Quick Check

```bash
# Alt text on images
grep -rn "<img" --include="*.tsx" src/ | grep -v "alt="

# Button labels
grep -rn "<button\|<Button" --include="*.tsx" src/ | head -20

# Form labels
grep -rn "<input\|<Input" --include="*.tsx" src/ | head -20
```

### 5. Animation Review

```bash
# Find animation usage
grep -rn "motion\|animate\|transition" --include="*.tsx" src/

# Check reduced motion support
grep -rn "prefers-reduced-motion\|useReducedMotion" src/
```

### 6. Visual Inspection (Manual)

Open the app and verify:

#### The Squint Test

1. Squint at each major screen
2. Can you identify: Main purpose? Primary action? Where to look first?
3. If not → hierarchy needs work

#### Responsive Check

```bash
# Viewport sizes to test
# 320px - Small phone
# 375px - iPhone SE
# 768px - Tablet
# 1024px - Small laptop
# 1440px - Desktop
```

#### Dark Mode (if applicable)

- [ ] Not just inverted colors
- [ ] Proper contrast maintained
- [ ] Images/illustrations work
- [ ] No pure black/white

---

## Output Report

```markdown
# Design Review: [Project Name]

**Date:** YYYY-MM-DD
**Reviewer:** [agent/human]
**Pages Reviewed:** [list]

## Summary

| Category      | Status   | Issues  |
| ------------- | -------- | ------- |
| Spacing       | ✅/⚠️/❌ | [count] |
| Colors        | ✅/⚠️/❌ | [count] |
| Typography    | ✅/⚠️/❌ | [count] |
| States        | ✅/⚠️/❌ | [count] |
| Accessibility | ✅/⚠️/❌ | [count] |
| Animations    | ✅/⚠️/❌ | [count] |

## Issues Found

### Critical (Blocks Ship)

- [ ] [Issue description + location]

### High (Fix Before Ship)

- [ ] [Issue description + location]

### Medium (Fix Soon)

- [ ] [Issue description + location]

### Low (Nice to Have)

- [ ] [Issue description + location]

## Delight Opportunities

Areas where we could add polish:

1. [Opportunity - e.g., "Empty state on /dashboard could use illustration"]
2. [Opportunity - e.g., "Add confetti on goal completion"]

## Screenshots

[Include screenshots of any issues found]
```

---

## Common Issues & Fixes

### Spacing

| Issue                | Fix                                |
| -------------------- | ---------------------------------- |
| Inconsistent padding | Standardize to `p-4`, `p-6`, `p-8` |
| Cramped elements     | Add `gap-4` or `space-y-4`         |
| Too much whitespace  | Reduce section padding             |

### Colors

| Issue                | Fix                                  |
| -------------------- | ------------------------------------ |
| Hardcoded hex values | Use `text-primary`, `bg-muted` etc.  |
| Low contrast         | Use darker text, lighter backgrounds |
| Inconsistent grays   | Stick to design system grays         |

### States

| Issue                | Fix                                 |
| -------------------- | ----------------------------------- |
| Missing empty state  | Add illustration + CTA              |
| Generic "Loading..." | Use skeleton matching content shape |
| Scary error message  | Rewrite with empathy + action       |

### Animations

| Issue                | Fix                                 |
| -------------------- | ----------------------------------- |
| No feedback on click | Add `active:scale-95`               |
| Jarring transitions  | Add `transition-all duration-200`   |
| No reduced motion    | Add `motion-reduce:transition-none` |

---

## Integration with Build

Run `/design-review` at:

| Phase              | When                             |
| ------------------ | -------------------------------- |
| Phase 2 complete   | After core UI built              |
| Before PR          | Every feature PR with UI changes |
| Before `/pre-ship` | Final visual polish check        |

---

## When to Skip

Skip `/design-review` for:

- Backend-only changes
- Pure refactoring with no UI changes
- Hotfixes (do review in follow-up)
