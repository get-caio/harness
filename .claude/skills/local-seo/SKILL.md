---
name: local-seo
description: "Local SEO mastery for service-area businesses. Google Business Profile management, map pack ranking, citation building, review strategy, competitor intelligence, DBA strategy, virtual offices, and community presence. Load alongside seo-foundations for any local business deployment (ServiceStack primary, but applicable to any CAIO client serving a geographic area)."
version: 1.0.0
---

# Local SEO

## Purpose

Non-obvious patterns for local search ranking — beyond what any developer would know from general SEO knowledge. Load seo-foundations first for keyword research and on-page basics.

---

## 1. GBP Seasonal Category Rotation

Documented ranking factor for multi-service trades. The primary GBP category should match current search demand.

```
HVAC:
  Nov-Mar → "Heating Contractor"
  Apr-Oct → "Air Conditioning Contractor"

Plumbing (if also does drain cleaning):
  Spring/Fall → "Plumber"
  Summer (pool season) → varies by market
```

Agent proposes the swap via Helm queue. Owner confirms. After two approval cycles, this earns autonomy (auto-swap with notification).

---

## 2. Grid-Based Rank Tracking

Don't track from one point. Rank varies dramatically by searcher location.

```
METHOD:
- Define service area as a geographic boundary
- Create a grid of tracking points (25-point default, 5×5)
- Query each keyword from each grid point
- Visualize as heat map overlay on actual map

DATA SOURCE: DataForSEO SERP API (Local Pack endpoint)
COST: ~$0.001-0.002 per query. 25 points × 10 keywords = $0.25-0.50/scan
FREQUENCY: Weekly

WHAT TO TRACK:
- Position (1-3 = in pack, 4-20 = local finder, not ranked)
- Which competitors appear at each point
- Week-over-week movement per grid point
- Average position across all points (headline metric)
```

---

## 3. SEO Score — Weighted 100-Point Model

Single metric for contractor SEO health surfaced in Helm.

```
FACTOR                                          WEIGHT   SOURCE
─────────────────────────────────────────────────────────────────
GBP completeness                                15 pts   Google GBP API
Review score (rating × volume × velocity ×      20 pts   GBP API + DataForSEO
  recency)
Review response rate + response time            5 pts    review-mgmt module
Photo freshness (30/60/90 day tiers)            5 pts    Google GBP API
Post activity (last 30 days)                    5 pts    Google GBP API
Q&A health (questions answered, freshness)      3 pts    Google GBP API
Citation consistency (top 50 directories)       15 pts   DataForSEO Business Data API
Website SEO score                               15 pts   DataForSEO On-Page API
Backlink profile                                10 pts   DataForSEO Backlinks API
Behavioral signals (CTR, directions, calls)     7 pts    GBP Insights API
─────────────────────────────────────────────────────────────────
TOTAL                                           100 pts
```

Score generates three highest-impact actions per week — surfaced in Helm, not a dashboard to stare at.

---

## 4. NAP Consistency — Exact Match Only

```
CRITICAL: NAP must be EXACTLY identical everywhere.
- "123 Main St" ≠ "123 Main Street" ≠ "123 Main St."
- "Suite 200" ≠ "Ste 200" ≠ "#200"
- "(704) 555-1234" ≠ "704-555-1234" ≠ "7045551234"
- "ABC Plumbing LLC" ≠ "ABC Plumbing" ≠ "A.B.C. Plumbing LLC"

Store as canonical NAP in the local-presence module.
All submissions and checks reference the canonical version.
```

NAP change propagation order: GBP first (source of truth) → website → Tier 4 aggregators (cascades) → Tier 1 manually → Tier 2-3. Run consistency scan 30 days after to verify propagation.

---

## 5. Review Routing System

Not all customers should go to Google. Route by satisfaction signal.

```
JOB COMPLETED → 2hr delay → SMS + email: "How was your experience?"

5 stars → Direct link to Google review with keyword coaching prompt
          "Tip: mentioning the service and your neighborhood helps other
          people in [area] who need similar work."

4 stars → Internal feedback form → follow up → optionally redirect to Google

1-3 stars → Internal escalation → owner alerted → NEVER routes to Google
```

AI-drafted positive responses: queue for review; after 10+ approvals → auto-publish.
Negative responses: ALWAYS require owner approval. Response within 4 hours.

---

## 6. DBA Strategy

Google's business name field directly affects ranking. "John Smith LLC" loses to "Charlotte Emergency Plumbing." A DBA lets contractors legally use a keyword-rich name.

```
SCORING: search volume × availability × natural-sounding

GOOD: "[City] [Service]" — "Charlotte Plumbing Co"
GOOD: "[Region] [Service]" — "Lake Norman Electric"

BAD: "[City] Best Cheap Emergency [Service]" — keyword stuffing
     Google's spam updates penalize keyword-stuffed names
     The DBA MUST be legally registered (not just displayed)
```

---

## 7. Virtual Office Compliance

Virtual offices expand map pack presence to new cities without opening a branch. Google requirements:

```
MUST MEET ALL:
□ Real street address (no PO boxes)
□ Staffed during stated business hours
□ Can pass Google's video verification if required

COMMON FAILURES (cause listing suspension):
✗ Regus/WeWork address used by 50 other businesses
✗ Address listed as "virtual" on the space provider's own site
✗ Hours listed but nobody actually there
```

ROI benchmark: ~$100-200/mo cost. Expected ~5 calls/month × 30% close rate × $300 avg ticket = $450/month revenue.

---

## 8. Photo Geotagging Pipeline

```
EXIF DATA INJECTED at job completion:
- GPS latitude/longitude (from job address)
- ImageDescription: "[Service] by [Company] in [City]"
- DateTimeOriginal: Job completion timestamp

Photos feed: GBP posts → service page galleries → location pages
Format: WebP, responsive sizes, descriptive alt text
```

---

## 9. Citation Tiers

Build in order — each tier takes time to propagate.

```
TIER 1 (Week 1 onboarding): GBP, Apple Maps, Bing Places, Facebook, Yelp, BBB,
  Nextdoor, Thumbtack, Angi, HomeAdvisor

TIER 2 (Month 1): Yellow Pages, Manta, Superpages, MapQuest, Foursquare

TIER 3 (Niche): Trade-specific — HVAC.com, Plumber.com, manufacturer dealer
  locators, state licensing boards, trade associations

TIER 4 (Data Aggregators): Data Axle, Neustar/Localeze, Foursquare
  Submitting here pushes NAP to hundreds of smaller directories
```

---

## Usage in Agent Harness

```
For any local business site build:
1. Load seo-foundations (base layer)
2. Load local-seo (this skill)
3. Load aeo-geo if AI visibility is in scope
4. Load seo-integrations for technical implementation
5. Load seo-agent-playbook for Helm workflow setup
```
