---
name: seo-agent-playbook
description: "SEO Agent operational playbook for the Helm architecture. Defines agent workflows (triggers, checkpoints, modules, connectors), MCP tool interfaces, Helm context cards, onboarding sequences, and autonomy progression rules. Load when configuring or debugging the SEO Agent, or when building new agent workflows for local business SEO."
version: 1.0.0
---

# SEO Agent Playbook

## Purpose

The SEO Agent is a sub-agent under Helm, peer to ServiceStack's existing agents (Intake, Estimator, Scheduler, Comms, Finance, Demand). It handles everything related to the contractor's online visibility. This skill defines how it operates — what triggers it, what it does, what needs human approval, and how it earns autonomy over time.

---

## 1. Agent Architecture

```
Helm Orchestrator
  └─ SEO Agent (sub-agent)
       ├─ calls ServiceStack modules (websites, customer-mgmt, jobs, content)
       ├─ calls SEO-specific modules (local-presence, seo-intel, review-mgmt)
       └─ calls connectors (DataForSEO, Google GBP API, etc.)
            └─ connectors live in ServiceStack's integrations layer
                 └─ behind interfaces that can move to CAIO Core later
```

The SEO Agent is not a single monolith. It's a set of workflows, each with a trigger, checkpoint policy, module dependencies, and connector dependencies.

---

## 2. Agent Workflows

### 2.1 GBP Management

```
WORKFLOW                    TRIGGER                              CHECKPOINT                      MODULES                     CONNECTORS
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
GBP post generation         Weekly cadence + job completion      Queue: review before publish     content, jobs, customer-mgmt Google GBP API
                            (photo available)
GBP category seasonal swap  Seasonal trigger (per trade config)  Queue: confirmation prompt       local-presence               Google GBP API
GBP profile audit           Monthly cron                         None — Helm briefing             local-presence               Google GBP API
GBP Q&A seeding             Onboarding + quarterly refresh       Queue: review before posting     content, local-presence      Google GBP API
Photo upload reminder       7-day no-upload trigger              None — notification only         —                            Slack/Push
```

**GBP post generation** pulls from three sources: completed job photos (via jobs module), seasonal templates (via content module skills library), promotional calendar (configured per tenant). Content module applies anti-slop filter and tenant voice calibration before anything hits the queue.

**Seasonal category swap** is a documented ranking factor. HVAC: "Heating Contractor" in winter, "Air Conditioning Contractor" in summer. Agent proposes the swap; owner confirms in Helm. After two cycles of approval → earns autonomy (auto-swap with notification).

### 2.2 Review Management

```
WORKFLOW                    TRIGGER                              CHECKPOINT                      MODULES                     CONNECTORS
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Review request dispatch     Job marked complete (2hr delay)      None — autonomous after config   review-mgmt, jobs,          Twilio/Quo, Resend
                                                                                                  customer-mgmt
Review response drafting    New review webhook (any platform)    Queue: all responses reviewed    review-mgmt, content        GBP API, DataForSEO
Review escalation           1-3 star rating received             Queue: immediate owner alert     review-mgmt, customer-mgmt  Slack/Push
Review velocity monitoring  Weekly cron                          None — Helm briefing             review-mgmt, seo-intel      DataForSEO
Sentiment analysis          Per-review + weekly batch            None — flags patterns            review-mgmt                 Claude API
```

**Review request dispatch** is autonomous after initial configuration (owner confirms SMS templates during onboarding). No ongoing approval needed — this is a fire-and-forget workflow triggered by job completion.

**Review response drafting** — all responses drafted by AI, queued for review. After 10+ approvals of positive response pattern → auto-publish positive responses. Negative responses ALWAYS need owner approval.

### 2.3 Rank Tracking & Competitive Intel

```
WORKFLOW                    TRIGGER                              CHECKPOINT                      MODULES                     CONNECTORS
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Grid rank tracking scan     Weekly cron                          None — data collection           seo-intel                   DataForSEO SERP API
Organic keyword tracking    Weekly cron                          None — data collection           seo-intel                   DataForSEO SERP API
Competitor GBP monitoring   Weekly cron                          None — data collection           seo-intel                   DataForSEO Business Data
Competitor scorecard        Monthly cron                         None — autonomous report         seo-intel                   DataForSEO (multiple)
SEO score calculation       Weekly (after rank scan)             None — Helm context card         seo-intel                   DataForSEO, GBP API, GSC
Content gap detection       Monthly                             Queue: recommendations           seo-intel, content          DataForSEO Labs API
Backlink gap analysis       Monthly                             Queue: outreach recommendations  seo-intel                   DataForSEO Backlinks API
```

All data collection workflows are autonomous. They produce data, not decisions. Decisions (content gap recommendations, outreach suggestions) surface in the Helm queue for owner approval.

### 2.4 Content Generation

```
WORKFLOW                    TRIGGER                              CHECKPOINT                      MODULES                     CONNECTORS
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Service page generation     Onboarding + new service added       Queue: review before publish     content, websites           Claude API
Location page generation    Onboarding + new service area        Queue: review before publish     content, websites           Claude API
City × service combos       Onboarding (batch)                   Queue: batch review              content, websites           Claude API
llms.txt generation         Onboarding + quarterly refresh       None — autonomous                websites                    —
Schema markup generation    Page publish trigger                 None — autonomous (template)     websites                    —
Blog/article generation     Intel trigger or scheduled cadence   Queue: review before publish     content                     Claude API
```

**llms.txt and schema markup** are autonomous because they're structured data generation from known inputs. No human judgment needed.

**Content pages** always queue for review initially. After owner approves 5+ pages of a given type without edits, suggest autonomy for that page type (owner can accept or reject the autonomy rule).

### 2.5 Citation & Local Presence

```
WORKFLOW                    TRIGGER                              CHECKPOINT                      MODULES                     CONNECTORS
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Citation consistency scan   Weekly cron                          Discrepancies → Helm queue       local-presence              DataForSEO Business Data
Initial citations (Tier 1)  Onboarding                           Queue: verify NAP before submit  local-presence              BrightLocal
Citations (Tier 2-4)        Post-onboarding, phased              Queue: batch review              local-presence              BrightLocal, aggregators
NAP change propagation      Address/phone update trigger         Queue: confirm before propagate  local-presence              BrightLocal, GBP API
Duplicate listing detection Monthly scan                         Queue: merge/remove recs         local-presence              DataForSEO Business Data
```

Citation submissions always need human verification of NAP data before batch submit. After initial verification, re-submissions to additional directories use the verified canonical NAP without re-approval.

### 2.6 AI/GEO Visibility

```
WORKFLOW                    TRIGGER                              CHECKPOINT                      MODULES                     CONNECTORS
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
LLM mention monitoring      Bi-weekly cron                       None — Slack + Helm briefing     seo-intel                   DataForSEO AI Optimization
AI bot traffic monitoring   Daily log scan                       None — data collection           seo-intel, websites         Server logs / analytics
AI-optimized content check  Page publish trigger                 None — validation autonomous     content, websites           —
TL;DR block generation      Page publish trigger                 Queue: review initial, then auto content, websites           Claude API
```

### 2.7 Link Building & PR

```
WORKFLOW                    TRIGGER                              CHECKPOINT                      MODULES                     CONNECTORS
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Local sponsorship discovery Quarterly scan                       Queue: recommendations           seo-intel                   Web search
Supplier directory submit   Onboarding                           Queue: verify before submit      local-presence              Manual queue
PR angle generation         Milestone trigger, seasonal          Queue: review before outreach    content                     Claude API
Journalist outreach draft   PR angle approved                    Queue: review before send        content                     Resend
Reddit/community monitor    Daily scan                           None — alerts to Slack           seo-intel                   Reddit API
```

Link building opportunities are surfaced in Helm as recommendations, not auto-executed. Agent finds opportunities; owner decides which to pursue.

---

## 3. MCP Tool Interfaces

### local-presence tools

```
localPresence.getProfile(locationId) → GBP profile data
localPresence.updateProfile(locationId, fields) → update GBP fields
localPresence.createPost(locationId, { content, media, type }) → create GBP post
localPresence.getQA(locationId) → Q&A list
localPresence.answerQuestion(questionId, answer) → post Q&A answer
localPresence.getCitationHealth(locationId) → consistency score + discrepancies
localPresence.submitCitation(locationId, directory, data) → submit to directory
localPresence.detectDuplicates(locationId) → duplicate listing scan
localPresence.suggestDBA(serviceType, city, state) → DBA recommendations
localPresence.suggestCategories(locationId, season) → category recommendations
```

### seo-intel tools

```
seoIntel.getRankings(locationId, keywords?, gridSize?) → rank data (grid or organic)
seoIntel.getScore(locationId) → SEO score breakdown
seoIntel.getCompetitors(locationId) → competitor profiles
seoIntel.getCompetitorScorecard(locationId) → monthly comparison
seoIntel.getContentGaps(locationId) → missing pages/topics vs competitors
seoIntel.getBacklinkGaps(locationId) → link opportunities
seoIntel.getKeywordData(keywords, city) → volume, difficulty, related
seoIntel.getAIVisibility(businessName, city, services) → LLM mention data
seoIntel.getAIBotTraffic(siteId, period) → bot crawl patterns
seoIntel.getPerformanceMetrics(siteId) → Core Web Vitals, PageSpeed
```

### review-mgmt tools

```
reviewMgmt.sendRequest(jobId) → trigger review request SMS + email
reviewMgmt.getReviews(locationId, { platform?, since?, rating? }) → review list
reviewMgmt.draftResponse(reviewId) → AI-generated response
reviewMgmt.postResponse(reviewId, response) → publish response
reviewMgmt.getMetrics(locationId, period) → velocity, rating, sentiment
reviewMgmt.getSourceAttribution(locationId, period) → reviews by tech/job
reviewMgmt.generateQRCode(locationId) → QR code for Google review
```

### content tools (SEO additions)

```
content.generateServicePage(serviceId, locationId) → draft service page
content.generateLocationPage(locationId, services) → draft location page
content.generateCityServicePage(locationId, serviceId) → draft combo page
content.generateGBPPost(locationId, { type, context }) → draft GBP post
content.generateReviewResponse(reviewId) → draft response (delegates to review-mgmt)
content.generateLlmsTxt(siteId) → structured llms.txt content
content.generateSchema(pageId, schemaType) → JSON-LD markup
content.generateTLDR(pageId) → AI-citable summary block
```

---

## 4. Helm Context Cards

The SEO Agent contributes three context cards to the contractor's Helm briefing, alongside existing ServiceStack cards (jobs pipeline, schedule, estimates pending, customer at-risk flags).

### SEO Score Card

```
SEO SCORE: 74/100  ▲ +3 from last week
──────────────────────────────────────────────

TOP 3 ACTIONS (by estimated impact):
1. Send review requests to your last 10 completed jobs
   → Your review velocity dropped 40% this month
2. Upload geotagged photos from recent jobs
   → Haven't posted a GBP photo in 12 days
3. Approve service page draft for "AC Repair"
   → Missing page that competitor has

COMPETITOR ALERT:
  [Competitor name] gained 12 reviews this month. You gained 3.
```

### AI Visibility Card

```
AI VISIBILITY
──────────────────────────────────────────────

MENTIONED BY: ChatGPT ✓  Claude ✓  Perplexity ✓  Gemini ✗

CHANGES (since last check):
  ✓ ChatGPT now recommends you for "emergency plumber charlotte"
     — up from not mentioned last month
  ✗ Lost mention for "ac repair charlotte" on Perplexity

AI BOT ACTIVITY: 342 crawls this week (↑12% from last week)
  Top pages: /services/plumbing, /services/ac-repair, /llms.txt
```

### Review Health Card

```
REVIEW HEALTH
──────────────────────────────────────────────

NEW THIS MONTH: 8 reviews (avg 4.7 stars)
  Google: 6  |  Yelp: 1  |  Facebook: 1

PENDING RESPONSES: 3 drafts waiting for review (oldest: 2 days)

SENTIMENT TREND: Stable (positive)
  Top praise: timeliness, professionalism
  Watch: 2 mentions of pricing concerns

VS COMPETITORS:
  You: 8 reviews/month  |  Comp 1: 12  |  Comp 2: 5  |  Comp 3: 3
```

---

## 5. Onboarding Sequence

When a new contractor signs up for ServiceStack, the SEO Agent activates this sequence:

### Day 1 — Automated (no human approval needed)

```
1. Generate llms.txt from service catalog and location data
2. Generate schema markup for all existing pages
3. Create XML sitemap, submit to Google Search Console
4. Configure robots.txt (allow AI bots)
5. Run initial SEO score (baseline)
6. Auto-identify top 10 competitors from map pack
```

### Day 1 — Queue (owner approval needed)

```
7. GBP profile optimization recommendations
8. Business description draft (750 chars)
9. Service list population from service catalog
10. Attributes checklist for owner to complete (veteran-owned, etc.)
```

### Week 1 — Queue

```
11. Tier 1 citation submissions (verify canonical NAP first)
12. Service page drafts for review (1 per service)
13. Location page drafts for review (1 per city)
14. Review collection system activation (confirm SMS templates)
15. Q&A seeding drafts (5-10 questions)
```

### Month 1 — Phased

```
16. Tier 2 citation submissions
17. City × service combo pages (batch review)
18. Competitor scorecard (first monthly)
19. GBP post calendar activation
20. AI/LLM monitoring baseline established
```

### Cadence

Automate structured data immediately. Queue content for review. Phase outbound submissions over the first month. After month 1, everything shifts to the ongoing agent workflows defined in section 2.

---

## 6. Autonomy Progression

### How Autonomy Earns

The SEO Agent starts with most actions requiring human approval. As the owner repeatedly approves the same type of action, the system suggests autonomy rules.

```
PATTERN:
  Owner approves [action type] → system counts approvals
  → after threshold → Helm suggests: "You've approved [N] 
    [action type] actions. Would you like to make this automatic?"
  → Owner accepts or rejects
  → If accepted: action type moves from queue to autonomous log
  → Owner can revoke autonomy at any time
```

### Autonomy Thresholds by Workflow

```
WORKFLOW                         THRESHOLD     AUTONOMY SCOPE
──────────────────────────────────────────────────────────────────────────
Review request dispatch          Initial setup  Autonomous after SMS template confirmation
Positive review responses        10 approvals   Auto-publish if sentiment > 0.8
GBP category seasonal swap       2 cycles       Auto-swap with notification
llms.txt generation              Always         Autonomous (structured data)
Schema markup generation         Always         Autonomous (template-driven)
GBP profile audit                Always         Autonomous (report only)
Rank tracking / data collection  Always         Autonomous (no decisions)
Competitor scorecard             Always         Autonomous (report only)
SEO score calculation            Always         Autonomous (metric only)
AI bot monitoring                Always         Autonomous (data only)

GBP post generation              5 approvals    Auto-publish with notification
Service page generation          5 approvals    Auto-publish with notification
TL;DR blocks                     3 approvals    Autonomous (low risk)
Q&A answers                      5 approvals    Auto-post with notification

NEVER AUTONOMOUS:
- Negative review responses (always owner)
- NAP changes (propagation affects everywhere)
- Citation submissions (first pass — need NAP verification)
- PR/outreach (represents the business externally)
- Budget-affecting decisions (ad spend, premium add-ons)
```

### Autonomy Log

Everything autonomous gets logged. The owner can review what the agent did on its own.

```
AUTONOMY LOG ENTRY:
  Timestamp: 2026-03-04 09:15 AM
  Workflow: GBP Post Generation
  Action: Published weekly GBP post
  Content: [preview/link]
  Rule: "Auto-publish GBP posts" (earned 2026-02-15, 8 prior approvals)
  Outcome: Posted successfully
  [Revoke autonomy] [Flag for review]
```

---

## 7. Module Definitions

Three SEO-specific modules. Live in ServiceStack for now. Behind clean interfaces for future extraction.

### local-presence

**Owns:** GBP profile management, citation building, citation consistency, NAP management, directory submissions, duplicate detection, virtual office strategy, DBA recommendation engine.

**Data model:** Locations (GBP-linked), citations (per directory per location), NAP records, verification status tracking.

**Depends on connectors:** Google GBP API, BrightLocal, DataForSEO Business Data API.

**Extraction likelihood:** Highest. Any local business using CAIO would benefit. But only after proven in ServiceStack production.

### seo-intel

**Owns:** Rank tracking (grid and organic), keyword research, competitor analysis, backlink analysis, SEO scoring engine, content gap detection, AI/GEO visibility monitoring, reporting and dashboards.

**Data model:** Rankings (historical, per keyword, per grid point), competitors (tracked per location), scores (weekly snapshots), AI mentions (per LLM, per prompt).

**Depends on connectors:** DataForSEO (SERP, Backlinks, Business Data, On-Page, AI Optimization APIs), Google Search Console, Google PageSpeed Insights, Serper.dev (optional).

**Value note:** This module is primarily a DataForSEO consumer. The real value is scoring logic, Helm context card integration, and the actionable recommendation engine — not raw data access.

### review-mgmt

**Owns:** Review collection workflows, routing logic (5★→Google, ≤4→internal), cross-platform monitoring, response drafting, sentiment analysis, review velocity tracking, keyword coaching, QR/NFC generation, review source attribution.

**Data model:** Reviews (per platform, linked to jobs and customers), review requests (sent, responded, converted), response drafts, sentiment scores, velocity metrics.

**Depends on connectors:** Google GBP API, DataForSEO Business Data API, Twilio/Quo, Resend, Claude API.

### Existing module extensions

```
websites → adds: schema markup generator, sitemap generation, llms.txt,
  robots.txt, Core Web Vitals monitoring, image optimization pipeline,
  internal linking mesh, canonical URL management, TL;DR blocks

content → adds: service page templates (per trade), location page templates,
  city×service combos, GBP post templates (seasonal per industry),
  review response templates, PR pitch templates, blog templates.
  All through anti-slop + voice calibration.

customer-mgmt → adds: review request trigger (job completion),
  sentiment tracking from reviews, at-risk flag on negative review

jobs → adds: photo capture prompt at completion (geotagging pipeline),
  review request trigger on status change
```

---

## 8. Cross-Agent Interactions

The SEO Agent doesn't operate in isolation. It interacts with other ServiceStack agents.

```
SEO AGENT → COMMS AGENT:
  Review request dispatch uses Comms Agent's SMS/email capabilities
  Post-job communication includes review request in sequence

SEO AGENT → INTAKE AGENT:
  Booking widget behavior influenced by service type (Type 1/2/3)
  Intake data feeds location page content (service area validation)

SEO AGENT → DEMAND AGENT:
  SEO score decline triggers demand marketing consideration
  Content gap detection feeds into content marketing strategy
  Low organic visibility + low utilization = SEO priority flag

SEO AGENT → FINANCE AGENT:
  SEO reporting includes ROI attribution (calls → bookings → revenue)

HELM ORCHESTRATOR → SEO AGENT:
  Orchestrator monitors SEO score as a business health indicator
  Cross-agent pattern: job completion rate dropping + review velocity 
  dropping = systemic issue (not just SEO problem)
```

---

## 9. Error Handling & Degradation

```
CONNECTOR FAILURE:
  DataForSEO down → skip weekly scan, retry next cycle, log gap
  GBP API rate limited → queue actions, retry with backoff
  BrightLocal unavailable → defer citations, alert in Helm

DATA QUALITY:
  Rank tracking returns inconsistent data → flag, compare to 
  previous week, don't update score until verified
  Competitor data changes dramatically → verify before scorecard
  AI mention results vary between checks → use rolling average

AUTONOMY SAFEGUARDS:
  Auto-published post gets negative engagement → pause autonomy,
  queue next 3 posts for review
  Auto-approved review response causes complaint → revoke 
  response autonomy, alert owner
  Any autonomous action produces unexpected result → log, 
  flag in Helm, don't repeat pattern until reviewed
```

---

## Usage in Agent Harness

```
When configuring SEO Agent for a new deployment:
1. Load this playbook
2. Load trade-specific config bundle (local-seo skill, section 11)
3. Run onboarding sequence (section 5)
4. Monitor Helm queue for first 30 days
5. Review autonomy suggestions as they emerge

When debugging SEO Agent behavior:
1. Check workflow trigger conditions
2. Check connector health (seo-integrations skill)
3. Check autonomy rules (is it auto-executing something it shouldn't?)
4. Check Helm queue (are items stuck?)
5. Check error log for degradation events

When adding new workflows:
1. Define trigger, checkpoint, modules, connectors
2. Start with full queue (no autonomy)
3. Define autonomy threshold
4. Add to Helm context card if it produces a metric
5. Wire cross-agent interactions if applicable
```
