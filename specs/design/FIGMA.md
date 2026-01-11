# Figma & Design Files

## Figma Links

| File | Link | Access |
|------|------|--------|
| Main Design | [View in Figma](https://figma.com/...) | View-only |
| Component Library | [View in Figma](https://figma.com/...) | View-only |
| Mobile Designs | [View in Figma](https://figma.com/...) | View-only |

<!-- 
Replace with actual Figma links
Use view-only links for agent access
-->

---

## File Structure

```
Figma Project
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   ├── Components
│   └── Icons
├── 📱 Mobile App
│   ├── Onboarding
│   ├── Home / Schedule
│   ├── Training Plans
│   ├── Stats
│   └── AI Coach
├── 🖥️ Web App
│   ├── Landing Page
│   ├── Dashboard
│   ├── Plan Builder
│   └── Settings
└── 📧 Email Templates
```

---

## Export Instructions

### Icons

1. Select icon frame
2. Export as SVG
3. Name: `icon-name.svg` (kebab-case)
4. Place in `specs/design/assets/icons/`

### Images

1. Select frame
2. Export as PNG @2x
3. Name: `descriptive-name@2x.png`
4. Place in `specs/design/assets/`

### App Icons

Export at these sizes:
- 1024x1024 (App Store)
- 512x512 (Play Store)
- 180x180 (iOS)
- 192x192 (Android)
- 32x32 (Favicon)
- 16x16 (Favicon)

---

## Version History

| Date | Changes | Designer |
|------|---------|----------|
| YYYY-MM-DD | Initial design system | [Name] |
| YYYY-MM-DD | Added mobile screens | [Name] |

---

## Notes for Agent

When implementing UI:

1. **Check Figma first** — Match designs exactly
2. **Inspect mode** — Use Figma's inspect panel for exact values
3. **Component names** — Match Figma component names in code when sensible
4. **Spacing** — Use values from inspect, don't eyeball
5. **Responsive** — Figma shows mobile and desktop; implement both

If design is unclear:
- Create a spec decision in `specs/decisions/`
- Reference the specific Figma frame
- Ask human to clarify
