---
name: seo-foundations
description: "Core SEO knowledge covering keyword research, on-page optimization, technical SEO, content strategy, and link building fundamentals. Platform-agnostic — applies to any site (CAIO, Go, ServiceStack, client deployments). Load this skill before any site build, content generation, or SEO audit."
version: 1.0.0
---

# SEO Foundations

## Purpose

The universal SEO reference for every site built on the CAIO platform. Covers the fundamentals that don't change across products: keyword strategy, on-page elements, technical requirements, content structure, and link building.

---

## 1. Keyword Research & Strategy

### Discovery Process

```
1. Seed list → core services, problems solved, audience language
2. Expand → run seeds through tools (DataForSEO Keywords Data API, Ahrefs, Google Keyword Planner)
3. Competitor harvest → pull ranking keywords from top 5 organic competitors
4. Question mining → People Also Ask, Reddit, Quora, search autocomplete
5. Intent classification → informational / commercial / transactional / navigational
6. Cluster → group by topic theme, not individual terms
7. Prioritize → volume × relevance × intent match × difficulty gap
```

### Topic Cluster Architecture

```
PILLAR PAGE (broad topic, 2000+ words)
  ├── Cluster Post A (subtopic, 800-1500 words)
  ├── Cluster Post B (subtopic, 800-1500 words)
  ├── Cluster Post C (subtopic, 800-1500 words)
  └── Cluster Post D (subtopic, 800-1500 words)

Links: Every cluster → pillar. Pillar → all clusters.
Cross-links between related clusters where natural.
```

### Keyword Mapping Rules

- One primary keyword per page — no cannibalization across pages
- 2-5 secondary/LSI keywords per page
- Map keywords to URLs in a spreadsheet — keyword map is source of truth
- Review quarterly — intent shifts, terms emerge, competitors move

### Difficulty Tiers

```
Easy (KD 0-20):     New sites rank in 2-4 months with solid content
Medium (KD 21-50):  Need backlinks + good content, 4-8 months
Hard (KD 51-70):    Need authority + strong backlinks, 8-12+ months
Very Hard (KD 71+): Enterprise effort, usually not worth it for SMBs
```

### Long-Tail Strategy

```
Head:       "plumber charlotte"                          (high vol, high KD)
Mid-tail:   "emergency plumber charlotte nc"             (med vol, med KD)
Long-tail:  "water heater repair south charlotte"        (low vol, low KD, high intent)
Question:   "how much does water heater replacement cost in charlotte" (AEO target)
```

Long-tail converts at 2-5× head terms. Prioritize for new sites.

---

## 2. On-Page SEO

### Meta Title

```
Format:   Primary Keyword — Secondary Keyword | Brand Name
Length:   50-60 characters (truncates at ~580px)
Rules:
  ✓ Primary keyword near the front
  ✓ Each page title unique site-wide
  ✓ City/location for local pages
  ✓ Pipes (|) or dashes (—) as separators
  ✗ No keyword stuffing
  ✗ No ALL CAPS
```

### Meta Description

```
Length:   150-160 characters
Rules:
  ✓ Include primary keyword naturally
  ✓ Clear value prop or CTA
  ✓ Unique per page
  ✓ Write as ad copy — for humans
  ✓ Location for local pages
  ✗ No duplicates across pages
```

### Heading Structure

```
H1: One per page. Contains primary keyword. Matches intent.
H2: Major sections. Secondary keywords where natural.
H3: Subsections. FAQ questions, feature breakdowns.
H4+: Rarely needed.

Rules:
  ✓ Only one H1
  ✓ H2s form a scannable outline
  ✓ Don't skip levels (H1 → H3 without H2)
  ✓ Hierarchy should make sense reading only headings
```

### Keyword Density & Placement

```
Primary:   1-2% density (natural > forced)
Secondary: 0.5-1%

Priority placement (in order):
  1. Meta title
  2. H1
  3. First 100 words
  4. H2 subheadings (where natural)
  5. Image alt text
  6. URL slug
  7. Meta description
  8. Internal anchor text pointing to page

Avoid:
  ✗ Exact match in every heading
  ✗ Bolding every keyword instance
  ✗ Forcing keywords into unrelated image filenames
```

### URL Structure

```
Format:  /primary-keyword or /category/primary-keyword
Rules:
  ✓ Lowercase, hyphen-separated
  ✓ 3-5 words max
  ✓ Include primary keyword
  ✓ No dates (evergreen stays fresh)
  ✗ No underscores, special chars, parameter strings
  ✗ No deep nesting (/a/b/c/d/e/)
```

### Image Optimization

**Filename:**
```
Format:  descriptive-keyword-phrase.webp
  ✓ Lowercase, hyphen-separated
  ✓ Describe the image
  ✗ No IMG_4532.jpg, screenshot.png
  ✗ No keyword stuffing in filenames
```

**Alt Text:**
```
  ✓ Describe image content accurately
  ✓ Include keyword if it naturally describes the image
  ✓ 80-125 characters
  ✓ Write for accessibility first
  ✗ Don't start with "Image of..." or "Photo of..."
  ✗ Don't stuff keywords
  ✗ Decorative images get alt="" (empty)
```

**Technical:**
```
Format:     WebP preferred, AVIF for next-gen, JPEG/PNG fallback
Size:       < 200KB hero, < 100KB content images
Dimensions: Serve at display size
Lazy load:  All below-fold images
Srcset:     Responsive sizes for mobile/tablet/desktop
CDN:        Cache headers, 1 year for hashed filenames
```

### Internal Linking

```
Strategy:
  ✓ Every page: 3-10 internal links (inbound + outbound)
  ✓ Descriptive anchor text (not "click here")
  ✓ Link from high-authority pages to pages needing help
  ✓ Pillar ↔ cluster bidirectional
  ✓ Contextual links in body copy, not just nav/footer
  ✓ Update old content with links to new related content
  ✓ Fix orphan pages (zero inbound internal links)

Anchor Text:
  ✓ Descriptive: "water heater installation guide"
  ✓ Partial match: "learn about our AC repair services"
  ✗ Exact match every time — looks manipulative
  ✗ Generic: "click here", "read more"

Audit quarterly: orphans, under-linked pages, broken links, anchor distribution
```

### Content Formatting

```
✓ Short paragraphs (2-4 sentences)
✓ Subheadings every 200-300 words
✓ Bullets/lists for scannable content
✓ Bold key phrases sparingly
✓ ToC for posts >1500 words
✓ TL;DR at top for long-form
✓ FAQ section with schema

Content Length:
  Service page:       800-1500 words
  Blog post:          1200-2500 words
  Pillar page:        2500-5000 words
  Location page:      500-1000 words (unique per location)
  FAQ entry:          50-150 words per question
```

---

## 3. Technical SEO

### Core Web Vitals

```
LCP (Largest Contentful Paint):   ≤ 2.5s   — main content load speed
INP (Interaction to Next Paint):  ≤ 200ms  — interaction responsiveness
CLS (Cumulative Layout Shift):    ≤ 0.1    — visual stability

Common fixes:
  LCP:  Optimize hero image, preload critical resources, CDN, SSR above-fold
  INP:  Break long tasks, defer non-critical JS, reduce DOM size
  CLS:  Explicit width/height on images/embeds, reserve space for dynamic content
```

### Page Speed Checklist

```
□ Images compressed, WebP/AVIF
□ Lazy loading below-fold images
□ Critical CSS inlined, non-critical deferred
□ JS bundled, minified, tree-shaken
□ Fonts preloaded, font-display: swap
□ HTTP/2 or HTTP/3
□ Gzip/Brotli compression
□ CDN for static assets
□ Browser cache with long TTL for hashed assets
□ No render-blocking resources above fold
□ TTFB < 200ms
□ Preconnect to required third-party origins
□ Remove unused CSS/JS
```

### XML Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2026-03-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>

Rules:
  ✓ All indexable pages included
  ✓ Exclude noindex, redirects, canonicalized dupes
  ✓ Update lastmod only on actual content changes
  ✓ < 50,000 URLs per sitemap (index for larger)
  ✓ Submit to Search Console + Bing Webmaster Tools
  ✓ Reference in robots.txt
  ✓ Auto-generate on build or cron
```

**News Sitemap** (content-heavy sites): Include articles from last 2 days with `<news:publication_date>` and `<news:title>`.

**Image Sitemap** (optional): Include `<image:loc>` and `<image:title>` for enhanced image search visibility.

### robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /_next/
Disallow: /private/

# AI crawler directives — configure per client strategy
User-agent: GPTBot
Allow: /     # or Disallow: / depending on GEO strategy

User-agent: Google-Extended
Disallow: /  # blocks Gemini training, not Search indexing

User-agent: Googlebot
Allow: /

Sitemap: https://example.com/sitemap.xml

Rules:
  ✓ Always include Sitemap directive
  ✓ Block admin, API, auth routes
  ✓ Don't block CSS/JS (Googlebot needs them to render)
  ✓ Test with Google's robots.txt tester before deploy
  ✓ Strategic AI crawler decisions per client
```

### 404 Handling & Redirects

```
404:
  ✓ Custom 404 page with nav, search, popular pages
  ✓ Monitor weekly in Search Console
  ✓ Redirect 404s with backlinks/traffic → nearest relevant page
  ✓ Valueless 404s → leave as 404 (don't redirect everything to homepage)

Redirects:
  301: Permanent move (default for URL changes)
  302: Temporary
  ✓ Max 1 hop (never A→B→C→D chains)
  ✓ Update internal links to final URL
  ✗ Don't mass-redirect to homepage (soft 404 signal)
  ✗ Don't use meta refresh or JS redirects for SEO pages
```

### Canonical Tags

```html
<link rel="canonical" href="https://example.com/services/ac-repair" />

  ✓ Every page has a self-referencing canonical
  ✓ Preferred URL format (https, consistent www/non-www)
  ✓ Duplicate pages canonical to primary
  ✓ Paginated pages: each canonicals to itself
```

### Schema / Structured Data

**Required per page type:**

```
Homepage:      Organization, WebSite (with SearchAction)
Service:       Service, LocalBusiness, FAQPage, BreadcrumbList
Blog:          Article/BlogPosting, FAQPage, BreadcrumbList, Author
Location:      LocalBusiness, GeoCoordinates, OpeningHoursSpecification
About:         Organization, Person (team members)
Contact:       LocalBusiness, ContactPoint
Product:       Product, Offer, AggregateRating
FAQ:           FAQPage
How-To:        HowTo
Video:         VideoObject
```

**FAQPage Schema (AEO target):**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "How much does AC repair cost in Charlotte?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "AC repair in Charlotte typically costs $150-$450. Refrigerant recharges run $200-$400, compressor replacement $1,500-$2,500."
    }
  }]
}
```

### Webmaster Tools Setup

```
Google Search Console:
  □ Verify (DNS TXT preferred)
  □ Submit sitemap
  □ Set preferred domain
  □ Monitor: Coverage, Performance, Core Web Vitals, Links
  □ Email alerts for critical issues

Bing Webmaster Tools:
  □ Verify, submit sitemap, import from GSC

Google Analytics 4:
  □ Install via GTM
  □ Set up conversions (forms, calls, bookings)
  □ Connect to Search Console
```

---

## 4. Content Strategy

### Blog Frequency

```
Minimum:      2 posts/month (maintains crawl frequency)
Good:         1 post/week (builds topical authority)
Aggressive:   3-5 posts/week (content-led growth, needs QA)

Rules:
  ✓ Consistency > volume
  ✓ Every post targets a keyword cluster
  ✓ Every post has internal links to/from relevant pages
  ✓ Update high-performing existing posts before publishing duplicates
  ✓ AI-generated posts MUST pass anti-slop filter
```

### Blog Post Template

```
Title:     [Primary Keyword — benefit-oriented] (50-60 chars)
Meta:      [Compelling summary + CTA] (150-160 chars)
URL:       /blog/[primary-keyword-slug]

Structure:
  H1:      Post title
  Intro:   2-3 sentences. Problem → promise. (100 words)
  ToC:     Auto from H2s for posts >1500 words
  H2s:     Subtopics with secondary keywords
  H3s:     Detail under H2s
  FAQ:     3-5 questions with FAQPage schema
  CTA:     Clear next step

Pre-Publish:
  □ Primary keyword in title, H1, first 100 words, URL
  □ Meta title + description written
  □ 2+ internal links out, 2+ inbound
  □ Images with alt text
  □ Schema (Article + FAQ)
  □ Anti-slop filter passed
  □ Mobile preview checked
```

### FAQ Strategy

```
Source questions from:
  1. People Also Ask for target keywords
  2. Customer service / sales call transcripts
  3. Reddit / Quora threads
  4. Competitor FAQ pages
  5. Search Console queries
  6. AI: "What questions do people ask about [service] in [city]?"

Placement:
  ✓ 3-5 questions on service pages
  ✓ Standalone FAQ page for comprehensive coverage
  ✓ Blog posts answering single questions in depth
  ✓ Always add FAQPage schema

Writing:
  ✓ Question matches natural search queries
  ✓ Answer starts with direct 1-2 sentence response
  ✓ Then expand with detail, pricing, context
  ✓ Include location for local businesses
```

---

## 5. Link Building Fundamentals

### Link Magnet Content Types

```
1. Original Research / Data Studies — surveys, benchmarks, industry data
2. Free Tools / Calculators — cost estimators, ROI calculators, assessments
3. Definitive Guides — most comprehensive resource, updated annually
4. Infographics / Visual Data — data viz, process flowcharts, comparison charts
5. Templates / Checklists — downloadable resources, seasonal checklists
6. Expert Roundups / Interviews — contributors promote to their audience
```

### Tactics by Tier

```
TIER 1 — High Authority:
  Digital PR, guest posts on industry pubs, HARO/Connectively responses,
  conference speaking, podcast appearances

TIER 2 — Medium Authority:
  Resource page outreach, broken link building, unlinked brand mentions,
  partner cross-links, directory submissions

TIER 3 — Foundation:
  Google Business Profile, social profiles, industry associations,
  Chamber of Commerce, BBB, Crunchbase
```

### Link Quality Signals

```
Good:                              Bad:
  Relevant to your industry          Random unrelated sites
  DR/DA 30+                          PBN / link farms
  Editorial placement in content     Footer/sidebar sitewide links
  From unique referring domains      Same site linking 100 times
  Contextually placed                Comment spam
  From trafficked sites              Directories with zero traffic
```

---

## Usage in Agent Harness

```
When building or auditing any site:

1. Pre-build: Load this skill for keyword mapping and technical requirements
2. Page creation: Reference on-page rules for meta, headings, content structure
3. Post-build: Run technical SEO checklist
4. Ongoing: Reference content strategy and link building for monthly execution
5. Quarterly: Full audit against this skill's standards

Pair with:
  - local-seo skill for local business sites
  - aeo-geo skill for AI visibility optimization
  - anti-slop-filter skill for content generation
  - seo-integrations skill for tool/API selection
```
