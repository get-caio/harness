---
name: local-seo
description: "Local SEO mastery for service-area businesses. Google Business Profile management, map pack ranking, citation building, review strategy, competitor intelligence, DBA strategy, virtual offices, and community presence. Load alongside seo-foundations for any local business deployment (ServiceStack primary, but applicable to any CAIO client serving a geographic area)."
version: 1.0.0
---

# Local SEO

## Purpose

Everything specific to ranking in local search — map pack, GBP, citations, reviews, local link building. Builds on top of seo-foundations (load that first for keyword research, on-page, and technical SEO basics). This skill is the reference for ServiceStack's SEO modules and any CAIO client deployment targeting local customers.

---

## 1. Google Business Profile (GBP) Management

### Profile Completeness Checklist

Every field matters for ranking. Incomplete profiles lose to complete ones.

```
REQUIRED (affects ranking directly):
□ Business name (legal name — no keyword stuffing)
□ Primary category (most specific available)
□ Secondary categories (3-5 max — over-stuffing dilutes relevance)
□ Address (or service area if no storefront)
□ Phone number (local number, not toll-free)
□ Website URL
□ Hours of operation (including special hours)
□ Business description (750 chars, keyword-rich, updated quarterly)
□ Services list (map to service catalog)
□ Products section (top 5-10 services with images and pricing)
□ Attributes (veteran-owned, wheelchair accessible, etc.)

IMPORTANT (affects engagement + trust):
□ Logo and cover photo
□ Interior/exterior photos (10+ minimum)
□ Team photos
□ Work photos (before/after, job site, equipment)
□ Videos (30-60 sec, service demos or team intros)
□ Q&A section seeded with common questions (5-10)
□ Review responses (100% response rate target)
□ Weekly GBP posts (updates, offers, events)
```

### Seasonal Category Rotation

Documented ranking factor for multi-service trades. The primary category should match what people are searching for NOW.

```
HVAC:
  Nov-Mar → "Heating Contractor"
  Apr-Oct → "Air Conditioning Contractor"
  
Plumbing (if also does drain cleaning):
  Spring/Fall → "Plumber"
  Summer (pool season) → varies by market

Roofing:
  Storm season → "Roofing Contractor"
  Off-season → "Roofing Contractor" (less reason to rotate)
```

Execution: Agent proposes the swap via Helm queue. Owner confirms. After two cycles of approval, this earns autonomy (auto-swap with notification).

### GBP Description Optimizer

750 characters. Every word counts.

```
STRUCTURE:
Sentence 1: WHO you are + WHERE you serve
Sentence 2: WHAT you do (primary services)
Sentence 3: WHY choose you (differentiator — years, specialization, guarantee)
Sentence 4: HOW to engage (call, book online, free estimate)

RULES:
- Include city/service area names naturally
- Include primary service keywords
- No promotional language (Google rejects "best" or "cheapest")
- No URLs or phone numbers (Google strips them)
- Regenerate quarterly to stay fresh
```

### GBP Posts

Post weekly minimum. Google rewards active profiles.

```
POST TYPES:
- Update: General business news, team highlights, tips
- Offer: Seasonal promotions, discounts (include coupon code)
- Event: Community events, workshops, open houses
- Product: Featured service with photo and CTA

BEST PRACTICES:
- 150-300 words per post
- Always include a photo (1200×900 minimum)
- Include a CTA button (Book, Call, Learn More)
- Keyword in first sentence
- Posts expire after 7 days — weekly cadence keeps profile active
```

Sources for post content: completed job photos (via jobs module), seasonal templates (per trade config), promotional calendar (tenant-configured), GBP post templates from content skills library.

### Q&A Seeding

Seed 5-10 questions at onboarding, refresh quarterly.

```
QUESTION SOURCES:
1. Actual customer questions from call transcripts
2. Google "People Also Ask" for primary keywords
3. Common objections from sales process
4. Pricing/availability questions
5. Service area questions ("Do you serve [neighborhood]?")

ANSWER FORMAT:
- Direct answer in first sentence
- Supporting detail (1-2 sentences)
- Subtle keyword inclusion
- End with action ("Call us at..." or "Book online at...")
```

### Video Strategy

30-60 second videos. Google surfaces video in local results.

```
VIDEO TEMPLATES:
1. Service demo — "What happens during an AC tune-up" (30 sec)
2. Team intro — Owner/tech introduces themselves (30 sec)  
3. Before/after — Job transformation (15-30 sec)
4. Customer testimonial — Real customer, real location (30-60 sec)
5. FAQ answer — Visual answer to common question (30 sec)

UPLOAD SPECS:
- Upload directly to GBP (not just YouTube)
- First frame should be compelling (it's the thumbnail)
- Include business name in video title
- Geotagged with business location
```

### Multi-Location Management

For contractors with multiple service locations or virtual offices:

```
RULES:
- Each location gets its own GBP listing
- Each listing has a unique phone number
- Each listing points to a location-specific landing page
- Categories can differ per location (if services differ)
- Posts can be location-specific or shared
- Reviews are per-location
- NAP must be consistent per location across all directories
```

---

## 2. Map Pack Ranking

### How the Map Pack Works

Google's local 3-pack shows for queries with local intent. Ranking factors (in order of influence):

```
1. GBP SIGNALS (36%):
   - Primary category relevance
   - Profile completeness
   - Keyword in business name (legitimate, not stuffed)
   - Proximity to searcher

2. REVIEW SIGNALS (17%):
   - Review count
   - Review velocity (new reviews per month)
   - Review diversity (multiple platforms)
   - Average rating
   - Keyword mentions in reviews
   - Owner response rate and speed

3. ON-PAGE SIGNALS (16%):
   - NAP on website matches GBP
   - City + service keywords in title tags
   - Schema markup (LocalBusiness)
   - Location pages with unique content

4. CITATION SIGNALS (13%):
   - NAP consistency across directories
   - Citation volume
   - Citation quality (authority of directory)

5. LINK SIGNALS (11%):
   - Local links (chambers, associations, sponsors)
   - Domain authority
   - Linking domain diversity

6. BEHAVIORAL SIGNALS (7%):
   - Click-through rate from search
   - Driving directions requests
   - Click-to-call actions
   - Dwell time on GBP listing
```

### Grid-Based Rank Tracking

Don't track from one point. Rank varies dramatically by searcher location.

```
METHOD:
- Define service area as a geographic boundary
- Create a grid of tracking points (25-point default, 5×5)
- Query each keyword from each grid point
- Record rank position at each point
- Visualize as heat map overlay on actual map

FREQUENCY: Weekly scan
DATA SOURCE: DataForSEO SERP API (Local Pack endpoint)
COST: ~$0.001-0.002 per query. 25 points × 10 keywords = $0.25-0.50/scan

WHAT TO TRACK:
- Position (1-3 = in pack, 4-20 = local finder, not ranked)
- Which competitors appear at each point
- Week-over-week movement per point
- Average position across all grid points (the headline metric)
```

### SEO Score — Weighted 100-Point Model

Single metric for contractor's overall SEO health. Surfaces as Helm context card.

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

The score generates three highest-impact actions per week. Not a dashboard to stare at — actions that surface in Helm.

---

## 3. Citation Building & Management

### What Citations Are

A citation is any online mention of the business's Name, Address, Phone (NAP). Can be structured (directory listing) or unstructured (blog mention, news article).

### Citation Tiers

Build in order. Each tier takes time to propagate.

```
TIER 1 — Week 1 (onboarding):
Google Business Profile, Apple Maps, Bing Places, Facebook,
Yelp, BBB, Nextdoor, Thumbtack, Angi, HomeAdvisor

TIER 2 — Month 1:
Yellow Pages, Manta, Superpages, MapQuest, Foursquare,
DexKnows, Local.com, EZLocal

TIER 3 — Niche (trade-specific):
Per industry — HVAC.com, Plumber.com, manufacturer dealer
locators, state licensing boards, trade associations

TIER 4 — Data Aggregators:
Data Axle, Neustar/Localeze, Foursquare
Submitting here pushes NAP to hundreds of smaller directories
```

### NAP Consistency Rules

```
CRITICAL: NAP must be EXACTLY identical everywhere.
- "123 Main St" ≠ "123 Main Street" ≠ "123 Main St."
- "Suite 200" ≠ "Ste 200" ≠ "#200"
- "(704) 555-1234" ≠ "704-555-1234" ≠ "7045551234"
- "ABC Plumbing LLC" ≠ "ABC Plumbing" ≠ "A.B.C. Plumbing LLC"

PICK ONE FORMAT. USE IT EVERYWHERE.
Store as canonical NAP in the local-presence module.
All submissions and checks reference the canonical version.
```

### Duplicate Listing Detection

Run monthly scan. Duplicates confuse Google and dilute authority.

```
SCAN FOR:
- Same phone number, different business name
- Same address, slightly different name (old DBA, previous tenant)
- Multiple listings for same business at same address
- Listings with old phone numbers or addresses

ACTION:
- Merge where possible (Google Suggest an Edit)
- Request removal of clearly wrong duplicates
- Track resolution status in local-presence module
```

### NAP Change Propagation

When a contractor moves, changes phone, or updates business name:

```
1. Update GBP first (source of truth)
2. Update website (header, footer, contact page, schema)
3. Submit updates to Tier 4 aggregators (cascades to smaller dirs)
4. Update Tier 1 directories manually
5. Update Tier 2-3 directories
6. Run citation consistency scan 30 days after to verify propagation
7. Follow up on any that didn't update
```

---

## 4. Review Strategy

### The Routing System

Not all customers should be sent to Google. Route based on likely satisfaction.

```
JOB COMPLETED → 2hr delay → SMS + email: "How was your experience?"

RATING RESPONSE:
  5 stars → "Would you share that on Google?" 
            → Direct link to Google review with keyword coaching prompt
            
  4 stars → "Anything we could do better?"
            → Internal feedback form
            → Follow up to resolve
            → Then optionally redirect to Google
            
  1-3 stars → "We want to make this right."
             → Internal escalation
             → Owner alerted immediately via Slack/push
             → NEVER routes to Google
```

### Review Keyword Coaching

Not fake reviews. Prompting real customers to mention specifics.

```
TEMPLATE (after 5-star rating):
"Thanks! If you have a moment to leave a Google review, 
it really helps other homeowners find us. 

Tip: mentioning the service we did and your neighborhood 
helps other people in [area] who need similar work."

EXAMPLES OF GOOD COACHED REVIEWS:
"Great AC repair service in South Park. Tech was on time..."
"Called them for an emergency pipe burst in Dilworth..."
```

### Review Velocity Targets

```
NEW BUSINESS:    5+ reviews/month until reaching 50 total
ESTABLISHED:     3-5 reviews/month to maintain momentum
COMPETITIVE:     Match or exceed top competitor's monthly velocity

BENCHMARK: Track vs. top 3 map pack competitors
ALERT: If velocity drops >40% month-over-month → Helm flag
```

### Review Response Strategy

Respond to every review. 100% response rate. Speed matters.

```
POSITIVE (4-5 stars):
- Thank by name
- Reference specific service if mentioned
- Keep it brief (2-3 sentences)
- Include a keyword naturally
- Response within 24 hours

NEGATIVE (1-3 stars):
- Acknowledge the frustration
- Don't argue or make excuses
- Take it offline ("Please call us at...")
- Show you're addressing it
- Owner should handle these personally
- Response within 4 hours (urgency signals care)

AI-DRAFTED: All responses drafted by agent, queued for review.
After 10+ approvals of positive response pattern → auto-publish
Negative responses ALWAYS need owner approval
```

### Additional Review Channels

```
- QR codes on trucks, invoices, business cards, yard signs
- NFC tap-to-review cards (tech hands to customer)
- Review landing page with source detection
- Post-review thank-you automation (email)
- Review source attribution (which tech/job generates reviews)
```

### Cross-Platform Monitoring

Google is primary. Monitor others for reputation.

```
MONITOR (don't actively collect):
- Yelp (they penalize solicited reviews)
- Facebook page reviews
- BBB
- Nextdoor recommendations
- Trade-specific (Angi, HomeAdvisor, Thumbtack)

RESPOND TO ALL: Even on secondary platforms. Shows you care.
ALERT: Any 1-2 star review on any platform → immediate Slack notification
```

### Review Sentiment Analysis

AI analysis on every review, batch weekly summary.

```
PER-REVIEW:
- Sentiment score (-1 to +1)
- Keywords extracted (services mentioned, locations, tech names)
- Category (service quality, pricing, communication, timeliness, professionalism)

WEEKLY BATCH:
- Sentiment trend (improving/declining/stable)
- Common themes (what gets praised, what gets criticized)
- Technician performance (reviews linked to jobs → linked to techs)
- Competitive comparison (sentiment vs. top 3 competitors)
```

---

## 5. DBA Recommendation Engine

### Why DBAs Matter for SEO

Google's business name field directly affects ranking. A plumber named "John Smith LLC" is at a disadvantage vs. "Charlotte Emergency Plumbing." A DBA (Doing Business As) lets you legally use a keyword-rich name.

### Process

```
1. Analyze primary service + city
2. Research keyword volume for "[city] + [service]" combinations
3. Check DBA availability in state (SoS database lookup)
4. Check domain availability for matching .com
5. Score combinations: search volume × availability × natural-sounding
6. Recommend top 3 with search volume data
7. Provide state-specific filing instructions + cost

CAVEATS (surface in Helm):
- Google's spam updates penalize keyword-stuffed names
- The DBA MUST be legally registered (not just displayed)
- Name should sound like a real business, not a keyword string
- Frame as "make your legal name match what customers search for"
```

### DBA Name Patterns That Work

```
GOOD: "[City] [Service]" — "Charlotte Plumbing Co"
GOOD: "[Service] + [Differentiator]" — "Precision HVAC Services"
GOOD: "[Region] [Service]" — "Lake Norman Electric"

BAD: "[City] Best Cheap Emergency [Service]" — keyword stuffing
BAD: "[Service] [Service] [City] [City]" — Google will flag this
BAD: Names that don't sound like a real company
```

---

## 6. Virtual Office Strategy

### Why Virtual Offices

A GBP listing in a new city means you appear in that city's map pack. Virtual offices let contractors expand their local search footprint without opening a branch.

### Google Compliance Requirements

```
MUST MEET ALL:
□ Real street address (no PO boxes)
□ Staffed during stated business hours
□ Located in the service area you claim
□ Can receive mail and packages
□ Can pass Google's video verification if required

COMMON FAILURES:
✗ Regus/WeWork address used by 50 other businesses
✗ Address listed as "virtual" on the space provider's own site
✗ Hours listed but nobody actually there
```

### ROI Calculator

```
MONTHLY COST: Virtual office = ~$100-200/mo

EXPECTED RETURN:
  New city visibility → estimated 5 calls/month
  × 30% close rate
  × $300 average ticket
  = $450/month revenue

PAYBACK: Month 1

DECISION FACTORS:
- Market size (population, homeownership rate)
- Competition density (how many contractors in map pack)
- Service area overlap (if you already serve there, just need presence)
- Travel time from base (affects dispatch efficiency)
```

---

## 7. Competitor Intelligence

### Auto-Identification

At onboarding, auto-identify top 10 competitors from map pack results for primary keywords in the contractor's service area. Track ongoing.

### Weekly Monitoring

```
TRACK PER COMPETITOR:
- Map pack position for shared keywords
- New reviews (count, rating, velocity)
- GBP post activity (frequency, content type)
- Category changes
- New photos/videos
- Hours changes (expanding = growing)
```

### Monthly Scorecard

Automated generation. Includes:

```
METRIC                    YOU    COMP 1  COMP 2  COMP 3
──────────────────────────────────────────────────────────
Google Rating             4.8    4.6     4.9     4.3
Total Reviews             124    89      156     67
Review Velocity (30d)     8      5       12      3
Map Pack Avg Position     2.1    1.8     1.5     4.2
Organic Keywords (top 20) 34     28      41      19
Domain Authority          22     18      31      15
Citation Count            87     62      94      45
Social Followers          340    120     890     200
──────────────────────────────────────────────────────────
```

### Content Gap Analysis

Monthly scan: what service/location pages do competitors have that the contractor doesn't?

```
OUTPUT:
- Missing service pages (competitor has /ac-repair, you don't)
- Missing location pages (competitor targets [city], you don't)
- Missing city×service combos
- Blog topics competitors rank for
- FAQ topics competitors cover

PRIORITIZE BY: Search volume × difficulty gap × business relevance
Surface as Helm queue items with draft page options
```

### Backlink Gap Analysis

Monthly scan: where do competitors get links that the contractor doesn't?

```
OUTPUT:
- Directories competitor is listed in that you're not
- Local sponsorships/partnerships visible in backlinks
- Industry associations
- News/PR mentions
- Resource pages linking to competitors

PRIORITIZE BY: Domain authority of linking site × relevance
Surface as Helm queue items with outreach recommendations
```

---

## 8. Community & Social Presence

### Reddit Strategy

```
MONITOR:
- r/[City] subreddits
- r/HomeImprovement
- Trade-specific subreddits
- "Can anyone recommend a [service] in [city]?" threads

RULES:
- Authentic participation only — Reddit detects and bans shill accounts
- Owner/team can respond, not automated bot
- Disclose relationship if recommending own business
- Build karma in the community before self-promoting
- Agent monitors and alerts via Slack, human decides action
```

### Nextdoor

```
- Claim business page (free)
- Encourage customers to recommend on Nextdoor
- Post neighborhood-specific content
- Respond to recommendation requests
- Monitor competitor activity
```

### YouTube / Video SEO

```
CHANNEL SETUP:
- Business name + city in channel name
- Complete About section with keywords
- Link to website and GBP
- Consistent upload schedule (2-4/month)

VIDEO TYPES:
1. Job of the Week — 60-90 sec before/after walkthrough
2. How-To Tips — "3 signs your AC needs service" (2-3 min)
3. Team Spotlights — Meet the tech (30-60 sec)
4. YouTube Shorts — Quick tips, satisfying job clips (15-30 sec)

SEO:
- Keyword in title, description, and tags
- Custom thumbnail with text overlay
- Chapters/timestamps for longer videos
- Embed on relevant service pages
- Transcribe and add to video description
```

---

## 9. Local Link Building

### Tier 1 — Easy Wins (First 90 Days)

```
- Chamber of Commerce membership (every chamber has a directory)
- Local business associations
- Supplier/manufacturer dealer locators
- Trade association directories
- BBB accreditation
- Community sponsorships (Little League, 5K, school events)
```

### Tier 2 — Earned Links (Ongoing)

```
- Local news coverage (job of the month, community involvement)
- Neighborhood blogs and community sites
- Real estate agent resource pages
- Home inspector resource pages
- Property management company preferred vendors
- Charity/nonprofit partnerships
```

### Tier 3 — Strategic Outreach

```
- Guest posts on local business blogs
- Expert quotes for local journalists (HARO, local reporter relationships)
- Scholarship pages on .edu sites
- Resource page link building (find local resource pages, request inclusion)
- Broken link building (find broken links on local sites, offer replacement)
```

### PR Angle Templates

```
SEASONAL:
"[City] [Service] Company Warns Homeowners: [Seasonal Tip]"
"How [Weather Event] Affects Your [System] — Local Expert Weighs In"

MILESTONE:
"[Company] Completes [Number]th Service Call in [City]"
"[Company] Expands to [New City/Neighborhood]"

COMMUNITY:
"[Company] Sponsors [Local Event]"
"[Company] Provides Free [Service] for [Veteran/Elderly/Nonprofit]"

INDUSTRY:
"Local [Trade] Expert on Why [Trend] Matters for Homeowners"
"[Company] Adopts [New Technology] — First in [City]"
```

---

## 10. Photo & Image Strategy

### Photo Geotagging Pipeline

```
FLOW:
1. Technician marks job complete → prompted to upload photos
2. In-app camera or upload from phone
3. Auto-embed into EXIF: GPS coordinates, business name, date
4. Resize to WebP, generate responsive sizes
5. Generate descriptive alt text (keyword + location + service)
6. Apply lazy loading attributes
7. Photos feed: GBP posts, service page galleries, location pages

EXIF DATA INJECTED:
- GPS latitude/longitude (from job address)
- ImageDescription: "[Service] by [Company] in [City]"
- DateTimeOriginal: Job completion timestamp
- Artist: Business name
```

### Photo Quantity Targets

```
GBP PROFILE: 10+ photos minimum at launch
MONTHLY: 4+ new photos (one per week)
SERVICE PAGES: 3-5 photos per service type
LOCATION PAGES: 2-3 location-specific photos
JOB COMPLETION: Encourage 2-3 photos per job
```

---

## 11. Trade-Specific Configuration

Each trade gets a config bundle loaded during onboarding. Stored as config, not code.

### Bundle Contents

```
PER TRADE (HVAC, Plumbing, Electrical, Roofing, etc.):
- Primary/secondary GBP categories per season
- Keyword set (25-50 keywords pre-mapped)
- FAQ templates (15-20 trade-specific questions)
- Seasonal calendar (GBP post themes by month)
- Review keyword coaching targets
- Common competitor directory list
- Service page templates
- Pricing display rules per Type 1/2/3 classification
```

### Service Type Classification Tie-ins

```
TYPE 1 (Book Instantly):
  Examples: AC tune-up, drain cleaning, outlet install
  → Service page: fixed price displayed, booking widget
  → FAQ: pricing-focused questions
  → AI agent bookability: YES (future-proofing)

TYPE 2 (Qualify Then Book):
  Examples: AC repair, water heater replacement
  → Service page: price range displayed, "Call for details"
  → FAQ: diagnostic-focused questions
  → AI agent bookability: PARTIAL (needs qualification)

TYPE 3 (Estimate Required):
  Examples: Full HVAC install, bathroom remodel, rewire
  → Service page: "Free Estimate" CTA, no pricing
  → FAQ: process-focused questions
  → AI agent bookability: NO (human assessment needed)
```

---

## 12. Reporting & ROI Attribution

### SEO Dashboard (Unified View)

```
TOP ROW: SEO Score (0-100) + trend arrow + 3 action items

SECTIONS:
1. Map Pack: Grid heat map + average position + trend
2. Organic Rankings: Top keywords + movement
3. GBP Performance: Views, searches, actions, direction requests
4. Review Metrics: New reviews, avg rating, velocity, response rate
5. Citation Health: Consistency score, discrepancies count
6. Competitor Snapshot: Side-by-side vs top 3
7. AI Visibility: LLM mention count + trend
8. Call Tracking: Calls by source (organic, maps, paid, direct)
```

### ROI Attribution

```
CALL TRACKING:
- Dynamic number insertion (different number per channel)
- GBP has tracking number → calls from maps
- Website has tracking number → calls from organic
- Ads have tracking number → calls from paid

BOOKING SOURCE:
- Booking widget tracks referral source
- UTM parameters on all links
- Match bookings to SEO-driven traffic

MONTHLY REVENUE REPORT:
- Calls from organic/maps → booked jobs → revenue
- "Your SEO generated X calls, Y bookings, $Z revenue this month"
- Compare to SEO cost for ROI calculation
```

### Automated Weekly Action Items

Not a report to read. Actions to take.

```
FORMAT:
"You're ranking #2 for 'ac repair charlotte' — up from #4 last week.
Get 3 more reviews mentioning AC repair to push for #1."

"Your competitor gained 12 reviews this month. You gained 3.
Send review requests to your last 10 completed jobs."

"You haven't posted a GBP photo in 12 days.
Upload a photo from a recent job to keep your profile active."

"New competitor appeared in the map pack for 'plumber charlotte.'
Review their profile — they're at 67 reviews with 4.9 stars."
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

For content generation:
- Review section 1 (GBP) before any GBP post generation
- Review section 4 (Reviews) before any review response drafting
- Review section 8 (Community) before any social content

For audits:
- Use the SEO Score model (section 2) as the framework
- Generate competitor scorecard (section 7) as comparison
- Produce action items, not reports
```
