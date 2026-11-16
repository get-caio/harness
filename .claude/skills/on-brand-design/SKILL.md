---
name: on-brand-design
description: "Make a deck, slides, presentation, one-pager, PDF, case study, web or landing page, email, social image or product UI that matches a brand: the user's, their company's, or a CAIO workspace's. Fetches the design brief from the Go connector (brand_kit.brief), uses Mobbin for layout references when available, drafts, checks against the brief's checklist, delivers. TRIGGER when: 'on brand', 'in our brand', 'match our brand', 'use our brand kit', or any deliverable for a named brand or CAIO workspace. SKIP: building a product's own design system or tokens (design-system), generic UI with no brand kit (design-routing)."
version: 1.0.0
---

# On-Brand Design

> Make something on brand: fetch the brief from Go, pull layout references from Mobbin when available, draft, check the draft against the brief, deliver.

Same flow as Go's `design_on_brand` MCP prompt (Brand Kit 3, get-caio/go#1162). Worked examples: [references/examples.md](references/examples.md).

**Tool names.** Go's tools are `brand_kit.brief` and `brand_kit.formats.list`. In the client they may carry a connector prefix (and `.` may show as `_`), so look for tools whose names end in these.

**No Go connector?** Ask the user to connect it, or to paste a brief: the Go admin's Brand page has a **Copy design brief** button. Don't design from memory or from the brand's website.

## Medium

Pick one: `deck`, `pdf`, `html`, `docx`, `email`, `social`, `product`.

| Medium    | Notes                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `deck`    | If asked for PowerPoint, make a .pptx with the substitute fonts the brief names; otherwise ask whether they want .pptx, PDF or HTML slides. |
| `pdf`     | A PDF document. `tokens.hex` leads; the format's canvas sets the page size.                                                                 |
| `html`    | A web page. Paste `tokens.css` or `tokens.tailwind` and follow `uiKit`.                                                                     |
| `docx`    | A Word document, with the brief's Word font substitutes.                                                                                    |
| `email`   | Inline styles, hex colours and the email font substitutes; 600px wide.                                                                      |
| `social`  | An image at the format's canvas size; keep the logo safe area; no body type below 24px.                                                     |
| `product` | Product UI, following `uiKit` and the format's slots and variants.                                                                          |

## Work in this order

1. **Brief.**
   - If the request may match one of the brand's own formats (a poll, a recipe card, a sales deck), call `brand_kit.formats.list` first and pick its `key`.
   - Call `brand_kit.brief` with `{ medium, format_key? }`. Pass `tenant_slug` if the user can see several workspaces.
   - Read `markdown` in full.
   - Colour, type and logos come only from the brief: `tokens.hex`, `tokens.css` or `tokens.tailwind`; `typeScale`; `fonts`, with each font's `substitute` for the medium; and `logos`, which give an `svgUrl` or `rasterUrl` per `background`.
   - Values marked "suggested" (listed in `inferred`) are guidance, not rules.
2. **Content.** Fill the format's required `slots` first, within their `limits`. Use the brand's voice. Never invent numbers, quotes or customer logos; ask, or leave a clearly marked gap.
3. **References (optional).** If you have Mobbin tools (`search_screens`, `search_sections`, `search_flows`, `list_collections`, `get_collection_contents`):
   - when the brief's `referenceLinks` names a Mobbin collection, read it;
   - otherwise search for screens or sections that fit the format's `purpose`.

   Use references for layout and pacing only, never for colour, type or logos. Without Mobbin, skip this step.

4. **Draft.**
   - Build it with the format's `canvas` and `layouts`. Use `format.templateUrl` when there is one.
   - Download the logo files and place the variant meant for each background. Never redraw or recolour a logo.
   - For the file itself, defer to the `pptx`, `pdf` or `docx` skills when they're present.
   - A .pptx uses the substitute fonts unless the brand fonts can be embedded (`fontFiles`).
5. **Check.** Go through `checklist` item by item against the draft. Fix anything that fails and check again.
6. **Deliver.** Hand over the file. Say which suggested values you used, and list the sections `coverage` marks `missing` so the brand kit can be filled in.

## Never

- A colour that isn't in `tokens.hex`, or a size or weight outside `typeScale`.
- A recoloured, redrawn, stretched or effects-laden logo, or the wrong variant for its background.
- Colour, type or logos taken from a Mobbin reference.
- Lorem ipsum, invented stats, made-up quotes or customer logos the user didn't supply.
