---
name: seo-integrations
description: "Technical reference for the SEO connector layer. Covers DataForSEO, Google APIs (GBP, Search Console, PageSpeed), BrightLocal, Serper.dev, CallRail, Moz, Twilio, Reddit API. Includes connector interface patterns, cost modeling, build-vs-buy decisions, credential management, and extraction checklist. Load when implementing or debugging SEO integrations."
version: 1.0.0
---

# SEO Integrations

## Purpose

Technical reference for every third-party service behind ServiceStack's SEO capabilities. Every integration is behind a connector interface — modules call the interface, never the API directly. When it's time to extract to CAIO Core, you move the implementation files; module code doesn't change.

---

## 1. Connector Architecture

```
SEO Agent workflows
  └─ SEO modules (local-presence, seo-intel, review-mgmt)
       └─ connector interfaces (what modules import)
            └─ connector implementations (API-specific code)
                 └─ credential store (per-tenant, BYO or managed)
```

Every connector handles: authentication, rate limiting, error handling + retry, credential management per tenant, response normalization, and cost tracking (for usage-metered billing).

Modules never import `dataforseo` or `google-gbp` directly. They import interfaces like `SEODataConnector` or `GBPConnector`.

---

## 2. Core Connectors

### 2.1 DataForSEO — Primary API (Use This First)

**dataforseo.com** | Pay-as-you-go, starts at $50 credit | No monthly subscription

**DataForSEO is the primary API for keyword research, SERP tracking, and competitor analysis.** It is the data backbone that replaces Ahrefs + Semrush + Moz + SERP scraper + local rank tracker. Powers 80%+ of SEO data needs.

When implementing any of the following, use DataForSEO — do not reach for an alternative first:

- Keyword research and search volume data
- SERP rank tracking (local pack and organic)
- Competitor analysis and backlink profiles
- Content gap analysis
- On-page SEO audits
- AI/LLM mention monitoring

Other connectors (Serper.dev, Moz, etc.) are supplemental additions for specific narrow use cases — they do not replace DataForSEO for the above tasks.

**Interface:** `SEODataConnector`

```typescript
interface SEODataConnector {
  // SERP data
  getSERPResults(
    keyword: string,
    location: LatLng,
    options?: SERPOptions,
  ): Promise<SERPResult[]>;
  getLocalPackResults(
    keyword: string,
    location: LatLng,
  ): Promise<LocalPackResult[]>;
  getOrganicRankings(
    keywords: string[],
    location: string,
  ): Promise<RankingResult[]>;

  // Keywords
  getKeywordData(keywords: string[], location: string): Promise<KeywordData[]>;
  getRelatedKeywords(keyword: string, location: string): Promise<KeywordData[]>;

  // Backlinks
  getBacklinks(domain: string): Promise<BacklinkProfile>;
  getBacklinkGap(domain: string, competitors: string[]): Promise<BacklinkGap>;

  // Business data
  getBusinessData(
    businessName: string,
    location: string,
  ): Promise<BusinessListing[]>;
  getBusinessReviews(businessId: string, platform: string): Promise<Review[]>;

  // On-page
  getOnPageAudit(url: string): Promise<OnPageReport>;

  // AI/LLM
  getAIMentions(query: string, llms?: string[]): Promise<AIMentionResult[]>;
  getAIKeywords(keywords: string[]): Promise<AIKeywordData[]>;

  // Content analysis
  getContentGaps(domain: string, competitors: string[]): Promise<ContentGap[]>;
}
```

**API mapping:**

```
MODULE CONSUMER         DATAFORSEO API                  WHAT IT DOES                              EST. COST/CLIENT/MO
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
seo-intel               SERP API (Local Pack)           Grid rank tracking — local pack per        $0.50-2.00
                                                        keyword per lat/lng point
seo-intel               SERP API (Organic)              Organic keyword rank tracking               $0.50-1.00
seo-intel               Keywords Data API               Search volume, difficulty, related          $0.10-0.50
                                                        keywords by city
seo-intel               Backlinks API                   Competitor backlink profiles, referring     $0.50-1.00
                                                        domains, domain authority
seo-intel               Labs API                        Content gap, keyword gap, competitor        $0.25-0.75
                                                        domain stats
seo-intel               On-Page API                     Technical SEO audit, page-level scoring     $0.10-0.50
seo-intel,              Business Data API               Public GBP info, reviews, posts for        $0.25-0.50
  local-presence                                        competitors + citation scan
seo-intel               AI Optimization API             Query LLMs, check if contractor            $1.00-3.00
                        (LLM Responses)                 mentioned/cited
seo-intel               AI Optimization API             Estimated keyword usage in AI tools        $0.25-0.50
                        (AI Keywords)
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
TOTAL                                                                                              $3-10/client/month
```

**Why DataForSEO over alternatives:**

- Pay-per-use, not per-seat. At 100 clients, Ahrefs = $249+/mo for ONE login. DataForSEO = $300-1,000/mo for 100 clients full data.
- API-first. Designed to embed in your product, not used as standalone dashboard.
- Backlink index smaller than Ahrefs (the one weakness) but adequate for local SEO — small business sites, not enterprise domains.
- LLM monitoring capability (AI Optimization API) launched 2025. Powers the entire GEO monitoring system.

**Credential model:** CAIO-managed only. Single account, usage tracked per tenant for cost allocation. Contractors will never BYO.

**Rate limiting:** Varies by API endpoint. Implement exponential backoff. Batch requests where possible (Keywords Data API supports bulk).

**Quirks learned in production:**

```
- Business Data API sometimes returns inconsistent business IDs
  across calls — cache and deduplicate
- SERP API local pack results can vary by time of day —
  standardize scan times
- AI Optimization API has longer response times (~5-15s) —
  async processing, don't block UI
- On-Page API requires full page crawl — rate limit to avoid
  hammering client sites
```

---

### 2.2 Google Business Profile API

**developers.google.com/my-business** | Free (requires approval)

Direct GBP management. Non-negotiable for any local SEO product.

**Interface:** `GBPConnector`

```typescript
interface GBPConnector {
  // Profile
  getProfile(locationId: string): Promise<GBPProfile>;
  updateProfile(
    locationId: string,
    fields: Partial<GBPProfile>,
  ): Promise<GBPProfile>;
  getCategories(categoryType?: string): Promise<Category[]>;

  // Posts
  createPost(locationId: string, post: GBPPostInput): Promise<GBPPost>;
  getPosts(locationId: string): Promise<GBPPost[]>;
  deletePost(postId: string): Promise<void>;

  // Reviews
  getReviews(locationId: string, options?: ReviewOptions): Promise<GBPReview[]>;
  replyToReview(reviewId: string, comment: string): Promise<void>;

  // Media
  uploadPhoto(locationId: string, photo: PhotoInput): Promise<GBPMedia>;
  uploadVideo(locationId: string, video: VideoInput): Promise<GBPMedia>;
  getMedia(locationId: string): Promise<GBPMedia[]>;

  // Q&A
  getQuestions(locationId: string): Promise<GBPQuestion[]>;
  answerQuestion(questionId: string, answer: string): Promise<void>;

  // Insights
  getInsights(locationId: string, period: DateRange): Promise<GBPInsights>;

  // Verification
  getVerificationStatus(locationId: string): Promise<VerificationStatus>;
}
```

**API capabilities:**

```
FEATURE              ENDPOINT              WHAT YOU CAN DO
────────────────────────────────────────────────────────────────────
Profile Management   Accounts/Locations    Create, update, read business info
Posts                Local Posts           Create, read, delete GBP posts
Reviews              Reviews               Read reviews, reply to reviews
Photos/Video         Media                 Upload, manage photos and videos
Q&A                  Questions/Answers     Read and respond to Q&A
Insights             Performance Metrics   Impressions, clicks, calls, directions
Verification         Verifications         Initiate and check verification
Categories           Categories            List available categories
```

**Setup requirements:**

- Register as GBP Organization (agency/partner)
- Requires managing 10+ locations to qualify
- Apply early — approval takes weeks
- OAuth for per-contractor access delegation

**What CAN'T be done via API (manual onboarding tasks):**

- Initial claiming of listing (postcard/phone/video verification)
- Changing primary owner
- Video verification for new listings
- These are tracked in the jobs module as onboarding tasks

**Credential model:** BYO. Contractor grants ServiceStack access to their GBP listing. OAuth flow during onboarding.

---

### 2.3 Google Search Console API

**developers.google.com/webmaster-tools** | Free

Organic search performance data for every ServiceStack website.

**Interface:** `SearchConsoleConnector`

```typescript
interface SearchConsoleConnector {
  getSearchAnalytics(
    siteUrl: string,
    options: AnalyticsOptions,
  ): Promise<SearchAnalyticsRow[]>;
  getIndexingStatus(siteUrl: string): Promise<IndexingReport>;
  getCoreWebVitals(siteUrl: string): Promise<CWVReport>;
  getMobileUsability(siteUrl: string): Promise<MobileReport>;
  submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void>;
}
```

**Provides:** Queries, clicks, impressions, CTR by keyword and city. Indexing status and errors. Core Web Vitals data. Mobile usability issues.

**Credential model:** BYO. Auto-connect during onboarding (OAuth flow). Contractor authorizes read access.

---

### 2.4 Google PageSpeed Insights API

**Interface:** `PageSpeedConnector` (can fold into `SearchConsoleConnector`)

```typescript
interface PageSpeedConnector {
  getPageSpeedScore(
    url: string,
    strategy?: "mobile" | "desktop",
  ): Promise<PageSpeedReport>;
  getCoreWebVitals(url: string): Promise<CWVData>;
}
```

**Provides:** LCP, FID/INP, CLS scores. Lighthouse performance audits. Speed degradation alerts.

**Cost:** Free. No credential needed — public API with rate limits.

---

## 3. Specialized Connectors

### 3.1 BrightLocal (Citation Management)

**brightlocal.com** | $2-3.20 per citation submission | Pro plan for API access

**Interface:** `CitationConnector`

```typescript
interface CitationConnector {
  submitCitation(
    location: LocationData,
    directory: string,
  ): Promise<SubmissionResult>;
  getCitationHealth(locationId: string): Promise<CitationHealthReport>;
  getNAPAudit(locationId: string): Promise<NAPAuditResult>;
  getDirectoryList(industry?: string): Promise<Directory[]>;
  detectDuplicates(locationId: string): Promise<DuplicateListing[]>;
}
```

**Why BrightLocal over Yext:** Pay-per-citation, not per-location subscription. Yext is $499+/location — absurd for contractors. BrightLocal designed for agencies/platforms.

**Credential model:** CAIO-managed. Single account, usage per tenant.

**Scale path:** At 200+ clients, evaluate Advice Local for bulk submission via data aggregators (Data Axle, Neustar/Localeze, Foursquare). The `CitationConnector` interface doesn't change — swap or add an implementation.

**Build order:** Tier 2. Not needed at launch — initial citations can be manual queue items.

---

### 3.2 Twilio / Quo (SMS for Review Requests)

**Interface:** `SMSConnector`

```typescript
interface SMSConnector {
  sendSMS(to: string, message: string, from?: string): Promise<SMSResult>;
  getDeliveryStatus(messageId: string): Promise<DeliveryStatus>;
}
```

**Decision:** Check if Quo's API supports outbound SMS automation first. If yes, use Quo (already integrated for calling). If not, Twilio (~$0.008/SMS).

**Credential model:** Per-tenant. Each contractor gets their own number for review requests (matches business caller ID).

**Build order:** Tier 1 — required for review collection flow.

---

### 3.3 Serper.dev (Real-Time SERP Snapshots)

**serper.dev** | $50/mo for 5,000 searches

**Interface:** Extend `SEODataConnector` or separate `SERPSnapshotConnector`

```typescript
interface SERPSnapshotConnector {
  getRealtimeSERP(query: string, location?: string): Promise<SERPSnapshot>;
  getAIOverviewContent(query: string): Promise<AIOverviewData | null>;
  getFeaturedSnippet(query: string): Promise<FeaturedSnippetData | null>;
}
```

Supplemental to DataForSEO, not a replacement. Fast, lightweight real-time SERP checks. Specifically useful for AI Overview detection and content extraction.

**Credential model:** CAIO-managed. Single account, usage tracked per tenant.

**Build order:** Tier 2. Add when AI Overview monitoring becomes a selling point.

---

### 3.4 CallRail (Premium Call Tracking)

**callrail.com** | $50+/mo per client

**Interface:** `CallTrackingConnector`

```typescript
interface CallTrackingConnector {
  getCallsBySource(period: DateRange): Promise<CallSourceReport>;
  getDynamicNumbers(websiteId: string): Promise<TrackingNumber[]>;
  getCallRecording(callId: string): Promise<RecordingData>;
}
```

Optional premium add-on. Dynamic number insertion (different number per channel: GBP, website, paid). Call source attribution. Recording + transcription.

**Credential model:** BYO preferred (many contractors already have accounts). CAIO-managed as upsell.

**Build order:** Tier 2. For contractors who don't have CallRail, offer simplified Twilio-based tracking with 2-3 numbers.

---

### 3.5 Reddit API (Community Monitoring)

**Interface:** `CommunityMonitorConnector`

```typescript
interface CommunityMonitorConnector {
  searchSubreddits(
    query: string,
    subreddits: string[],
  ): Promise<RedditThread[]>;
  monitorMentions(businessName: string, city: string): Promise<MentionResult[]>;
}
```

Free (rate limited, 100 queries/minute). Monitor city subreddits for recommendation threads. Track business/competitor mentions. Alert when thread matches trade + city.

**Credential model:** CAIO-managed. Single Reddit API app, usage per tenant.

**Build order:** Tier 2. Start with Reddit API + Google Alerts. Skip paid monitoring tools.

---

### 3.6 Moz API (Domain Authority Scoring)

**moz.com** | $79/mo

**Interface:** Extend `SEODataConnector`

```typescript
// Added to SEODataConnector:
getDomainAuthority(domain: string): Promise<{ da: number; pa: number; }>
```

Only reason to add: DA is the most recognized authority metric. Useful for credibility in reports and competitor scorecards even if DataForSEO provides everything else.

**Build order:** Tier 2. Nice-to-have, not functionally critical.

---

### 3.7 Claude API (Content Generation)

Already exists in ServiceStack's content module. Not a new connector — extend existing content generation capabilities with SEO-specific templates.

```
SEO CONTENT TASKS:                        EST. COST/CLIENT/MO
──────────────────────────────────────────────────────────────
Service page generation (800-1,500 words)  $0.50-2.00
Location page generation                   (included above)
GBP post generation (weekly)               (included above)
Review response drafts                     (included above)
Meta description/title optimization        (included above)
FAQ generation from service catalog        (included above)
llms.txt generation                        (included above)
TL;DR block generation for GEO             (included above)
Sentiment analysis                         (included above)
```

All content generation loads anti-slop filter + tenant voice calibration from skills library. Same engine the content module uses — different templates.

---

## 4. Native Builds (No Connector Needed)

These are built into ServiceStack modules directly. Core differentiation — never outsource.

```
CAPABILITY                        MODULE              WHY NATIVE
──────────────────────────────────────────────────────────────────────────
Schema markup generator            websites           Template-driven, auto-injected
Sitemap generation                 websites           Trivial, no external data
llms.txt generation                websites           Auto-built from catalog + location
robots.txt management              websites           Configuration, not service
Image optimization (WebP, EXIF)    websites + jobs    Photo geotagging is selling point
Internal linking mesh              websites           Service ↔ location page connections
SEO scoring engine (100-pt)        seo-intel          Data from connectors, logic is proprietary
Review collection & routing        review-mgmt        Core selling point
Grid rank tracking UI              seo-intel          DataForSEO = data, visualization = yours
Competitor scorecard               seo-intel          Aggregation + presentation
Location/service page generator    content + websites AI-powered but templates are yours
Citation consistency checker       local-presence     DataForSEO = raw data, reconciliation = yours
```

---

## 5. Cost Model

### Per-Client Monthly Cost

```
COMPONENT                    LOW USAGE    MEDIUM     HEAVY
──────────────────────────────────────────────────────────
DataForSEO (all APIs)        $3.00        $7.00      $15.00
Claude API (content gen)     $0.50        $1.50      $3.00
Twilio/Quo (SMS reviews)     $0.50        $1.00      $2.00
Google APIs                  Free         Free       Free
BrightLocal (post-initial)   $0.00        $5.00      $10.00
──────────────────────────────────────────────────────────
TOTAL                        $4.00        $14.50     $30.00
```

### Margin Analysis

At ServiceStack pricing tiers ($197-449/mo):

- SEO data costs = 2-7% of revenue per client
- At 100 clients on Growth ($297/mo): $29,700/mo revenue, ~$1,450/mo API costs = **95% gross margin**

### Cost Tracking

Connectors report usage per-tenant. Billing module aggregates for usage-metered add-ons. Track by connector, by API endpoint, by tenant, by month.

---

## 6. Build Order

### Tier 1 — Launch (required for SEO Agent to function)

```
CONNECTOR              INTERFACE               PRIORITY
──────────────────────────────────────────────────────────────
DataForSEO             SEODataConnector         Critical — rank tracking, competitor intel, AI monitoring
Google GBP API         GBPConnector             Critical — direct GBP management, reviews, posting
Google Search Console  SearchConsoleConnector   Critical — organic performance data
Google PageSpeed       PageSpeedConnector       Critical — Core Web Vitals
Claude API             (existing connector)     Critical — content generation, review responses
Twilio or Quo          SMSConnector             Critical — review request dispatch
```

### Tier 2 — Month 2-3

```
CONNECTOR              INTERFACE                TRIGGER
──────────────────────────────────────────────────────────────
BrightLocal            CitationConnector        After onboarding flow proves citation need
Serper.dev             SERPSnapshotConnector    When AI Overview monitoring becomes selling point
CallRail               CallTrackingConnector    When premium clients request call attribution
Moz                    extend SEODataConnector  When competitor scorecards need DA metric
Reddit                 CommunityMonitorConnector When community monitoring is in scope
```

### Tier 3 — Scale (100+ clients)

```
CONNECTOR              INTERFACE                TRIGGER
──────────────────────────────────────────────────────────────
Advice Local           extend CitationConnector  Bulk citation via data aggregators at scale
Ahrefs                 extend SEODataConnector   Enterprise backlink analysis if DataForSEO insufficient
Local Falcon           extend SEODataConnector   AI Voice tracking if their metric proves valuable
```

---

## 7. Services to Skip

```
SERVICE          REASON
──────────────────────────────────────────────────────────────
Semrush          Per-seat pricing. DataForSEO provides same data at 1/10th cost embedded.
Ahrefs (now)     $249/mo minimum. DataForSEO backlinks adequate for local SEO. Revisit at 500+ clients.
Podium/Birdeye   Review management is core to ServiceStack. Don't outsource differentiation.
Yext             $499+/location. BrightLocal + aggregators accomplish 90% at fraction of cost.
Whitespark       Overlaps entirely with DataForSEO + BrightLocal.
SE Ranking       Another per-seat platform. Need data APIs, not dashboards.
```

---

## 8. Credential Management

### Models

```
CAIO-MANAGED:
- DataForSEO (single account, usage per tenant)
- BrightLocal (single account, usage per tenant)
- Serper.dev (single account, usage per tenant)
- Reddit API (single app, usage per tenant)

BYO (contractor owns):
- Google GBP API (OAuth delegation)
- Google Search Console (OAuth delegation)
- CallRail (many already have accounts)

MIXED:
- Twilio/Quo — per-tenant phone numbers
- Claude API — platform-managed with per-tenant usage tracking
```

### Credential Storage

Follow existing Go pattern: encrypted at rest via `lib/crypto` (AES). Stored as workspace columns. Validation-first (`validateIntegration()` before saving). Status tracking via `integration_status` table.

---

## 9. Extraction Checklist (CAIO Core)

When it's time to move connectors from ServiceStack to CAIO Core:

```
□ Identify which connectors Go/other products actually need (verify from production usage)
□ Move connector implementations to shared package
□ Credential management moves to platform-level tenant config
□ Rate limiting and cost tracking move to platform billing
□ Module code in ServiceStack doesn't change (still imports same interfaces)
□ Add consumer mapping: which products can use which connectors
□ Per-tenant cost allocation shifts from ServiceStack billing to platform billing
```

This checklist stays dormant until both Go and ServiceStack are running in production and real overlap is visible.

---

## Usage in Agent Harness

```
When implementing a new connector:
1. Define the interface in the connector layer
2. Implement against the specific API
3. Handle auth, rate limiting, retries, normalization
4. Add cost tracking hooks
5. Wire to modules via dependency injection
6. Modules import interface, never implementation
7. Test with mock implementation first

When debugging integration issues:
1. Check credential validity (validateIntegration)
2. Check rate limit status
3. Check response normalization (API may have changed)
4. Check cost tracking (budget exhausted?)
5. Review quirks notes for the specific connector
```
