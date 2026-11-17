# On-Brand Design — Worked Examples

Two short runs of the flow in [SKILL.md](../SKILL.md). Tool names are shown without the connector prefix.

## 1. Sales deck in PowerPoint

**Request:** "Make a 10-slide sales deck for Acme in PowerPoint, on our brand."

1. **Brief.** "Sales deck" matches a format, so call `brand_kit.formats.list`; it returns `sales-deck` (a starter, or the workspace's own copy). Call `brand_kit.brief` with `{ medium: "deck", format_key: "sales-deck" }` and read `markdown` in full.
   - Canvas 1920×1080 (16:9). Layouts: Title, Section, Problem, Stat, Quote, Comparison and the rest the brief lists.
   - `fonts`: say display `Söhne` with substitute `Arial`, body `Inter` with substitute `Arial`. No `fontFiles`, so the .pptx uses Arial.
   - `logos`: the stacked mark for `dark`, the horizontal lockup for `light`. Download the `rasterUrl` (PNG at 2×) for each.
2. **Content.** Slots: `title` (≤ 60 chars), `slides` (6–18 items), `cta`, optional `prospect` logo. Draft ten slide headlines in the brand's voice. The Stat and Quote layouts need a real number with its source and a real attributed quote: ask the user for them, or drop those slides. Never invent either.
3. **References.** With Mobbin, `referenceLinks` names a collection "Sales decks we like": `list_collections`, then `get_collection_contents`. Take pacing (one idea per slide, where the stat slide falls) and layout; ignore their colours and type.
4. **Draft.** Load the `pptx` skill. Set the slide size from the canvas. Use only `tokens.hex` for fills and text, `typeScale` sizes converted to points, Arial throughout. Place the dark-background logo on the Title and Section slides and the light one elsewhere, unaltered.
5. **Check.** Walk `checklist`: every colour is in `tokens.hex`; contrast ≥ 4.5:1; each logo is the variant for its background; all type is from `typeScale`; substitutes used since fonts can't be embedded; accent proportions; one number per Stat slide with its source cited. Fix and recheck.
6. **Deliver.** Send `acme-sales-deck.pptx`. "I used two suggested values: the accent proportion (10%) and the voice note 'confident, not salesy'. The kit has no imagery or examples yet (`coverage`: missing); filling those in would help the next deck."

## 2. Sided poll with an offer

**Request:** "Make a Sided poll about holiday travel with a gift-card offer from Delta."

1. **Brief.** Call `brand_kit.formats.list` and find `sided-poll-cta` ("Poll with offer", medium `product`). Call `brand_kit.brief` with `{ medium: "product", format_key: "sided-poll-cta" }`, plus `tenant_slug: "sided"` if the user sees several workspaces. Canvas 400×520 px; `uiKit` is included.
2. **Content.** Slots, within limits:
   - `presented_by`: Delta's icon and name, small, above the question.
   - `question` (≤ 90 chars): "How are you getting to your holiday plans this year?"
   - `options` (2–4): "Flying", "Driving", "Train or bus", "Staying home". Short, parallel, mutually exclusive.
   - `offer` (cta): style `gift_card`, title ≤ 40 chars ("Win a $100 Delta gift card"), a one-line description and the action label ("Enter now"). Confirm the prize with the user; don't invent one.
3. **References.** Optional. A `search_sections` for poll or survey cards can inform spacing; the format's layouts already fix most of it.
4. **Draft.** Pick the variant: `card` for an article or pitch page, `inline` for a list, `email` for email. Follow the "Poll and offer" layout: options as in the single poll, then the offer card in amber under them. The offer is amber, never teal (teal belongs to the poll). Build it in HTML with `tokens.css` and the `uiKit` component library; `componentRef` (`components/ask/AskPollMockup.tsx`) is the reference implementation when working in the Sided repo.
5. **Check.** Walk `checklist`: colours from `tokens.hex`, the format's rules (questions about the reader, brand only as a small "Presented by" line, full-width answer rows), offer title ≤ 40 chars, contrast.
6. **Deliver.** Hand over the HTML (or a screenshot if asked). Name any suggested values used and any `missing` sections in `coverage`.
