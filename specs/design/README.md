# Design Specs

This directory contains design specifications, brand guidelines, and visual assets.

## Structure

```
design/
├── DESIGN.md           # Design system & brand guidelines
├── FIGMA.md            # Links to Figma files, export notes
├── assets/
│   ├── logo.svg        # Primary logo
│   ├── logo-dark.svg   # Dark mode variant
│   ├── icon.png        # App icon (1024x1024)
│   ├── favicon.ico     # Favicon
│   └── og-image.png    # Social sharing image
└── components/         # Component specs (optional)
    └── *.png           # Component screenshots/specs
```

## What Goes Here

### DESIGN.md
- Brand colors (hex, RGB, HSL)
- Typography (fonts, sizes, weights)
- Spacing scale
- Border radii
- Shadows
- Component patterns
- Do's and don'ts

### FIGMA.md
- Links to Figma files (view-only or edit)
- Export instructions
- Version notes
- Component library location

### assets/
- Logo files (SVG preferred, PNG fallback)
- App icons (all required sizes)
- Favicons
- OG/social images
- Any other brand assets

## Usage by Agent

The agent should:
1. Read DESIGN.md before implementing any UI
2. Reference assets/ for logo and icon paths
3. Follow brand guidelines for colors, typography, spacing
4. Check FIGMA.md for component designs before building

## Asset Formats

| Asset | Preferred Format | Fallback |
|-------|------------------|----------|
| Logo | SVG | PNG (2x) |
| App Icon | PNG 1024x1024 | - |
| Favicon | ICO + PNG | ICO only |
| OG Image | PNG 1200x630 | JPG |
| Icons | SVG | PNG (2x) |

## Updating Design

When design changes:
1. Update DESIGN.md with new specs
2. Replace assets in assets/
3. Note changes in FIGMA.md
4. Agent will pick up changes on next relevant ticket
