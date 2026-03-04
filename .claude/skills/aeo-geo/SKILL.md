---
name: aeo-geo
description: "Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO). Covers getting cited by AI systems — ChatGPT, Claude, Perplexity, Google AI Overviews. Includes llms.txt, TL;DR blocks, AI mention monitoring, AI bot traffic management, voice search, featured snippets, and structured data for AI consumption. Load alongside seo-foundations for any site where AI visibility matters."
version: 1.0.0
---

# AEO + GEO: Optimizing for AI Systems

## Purpose

Traditional SEO gets you ranked on Google. AEO/GEO gets you cited by AI. As search shifts from "10 blue links" to AI-generated answers, the businesses that AI systems mention and recommend win. This skill covers how to become the answer AI gives, not just the result Google shows.

This is where ServiceStack gets ahead of every competitor in the contractor space. Nobody else is optimizing local businesses for LLM visibility yet.

---

## 1. How AI Systems Find and Cite Sources

### What AI Systems Use to Generate Answers

```
1. TRAINING DATA: Content that existed at training cutoff
   - Wikipedia, authoritative sites, major publications
   - You can't directly influence this (already baked in)

2. RETRIEVAL (RAG): Content fetched at query time
   - Web search results (Perplexity, Google AI Overviews)
   - Structured data and schema markup
   - llms.txt and similar machine-readable formats
   - YOU CAN DIRECTLY INFLUENCE THIS

3. GROUNDING SIGNALS: Trust and authority indicators
   - Domain authority and backlink profile
   - Review volume and rating
   - Citation consistency and business presence
   - Factual claims with sources
   - Entity clarity (unambiguous identity)
```

### What Makes Content AI-Citable

```
AI systems prefer to cite content that:
- States facts clearly and concisely (not buried in marketing fluff)
- Includes specific numbers, statistics, claims
- Has clear entity identification (WHO does WHAT WHERE)
- Answers questions directly (first sentence = answer)
- Is structured with headers and lists
- Has sources for claims
- Is from authoritative domains with good backlink profiles
```

---

## 2. llms.txt — Machine-Readable Business Identity

### What It Is

A standardized file (like robots.txt for search engines) that tells AI systems about your business in a format optimized for LLM consumption.

### Location

`/llms.txt` at the root of the domain.

### Structure

```markdown
# [Business Name]

## Overview
[2-3 sentence description: WHO, WHAT, WHERE, SINCE WHEN]

## Services
- [Service 1]: [1-sentence description with key details]
- [Service 2]: [1-sentence description with key details]
...

## Service Area
[Cities/regions served, with specific boundaries if relevant]

## Contact
- Phone: [number]
- Address: [full address]
- Website: [URL]
- Hours: [operating hours]
- Emergency: [yes/no, after-hours number if applicable]

## Credentials
- Licensed: [license type and number]
- Insured: [coverage type]
- Certifications: [relevant certs]
- Years in business: [number]
- BBB rating: [rating]

## Booking
- Online: [booking URL]
- Type 1 services (book instantly): [list]
- Type 2 services (call to schedule): [list]
- Type 3 services (estimate required): [list]

## Reviews
- Google: [rating] ([count] reviews)
- [Other platform]: [rating] ([count] reviews)

## FAQ
Q: [Common question 1]
A: [Direct answer]

Q: [Common question 2]
A: [Direct answer]
...
```

### Generation Rules

```
- Auto-generate from service catalog + location data
- Update quarterly (or on material business changes)
- Autonomous — no human review needed (structured data from known inputs)
- Include ONLY factual, verifiable information
- No marketing language — AI systems ignore it
- Keep under 2000 words
```

---

## 3. TL;DR Content Blocks

### What They Are

2-3 sentence summaries at the top of service/location pages, written specifically for AI citation. When an LLM pulls from your page, this block is what it's most likely to quote.

### Placement

Top of every service page, location page, and city×service combo page. After the H1, before the main content.

### Format

```html
<div class="tldr" itemscope itemtype="https://schema.org/Service">
  <p><strong>[Business Name]</strong> provides <strong>[service]</strong> 
  in <strong>[city/area]</strong>. [Key differentiator — years, 
  specialization, guarantee, or availability]. [Specific claim with 
  number — response time, jobs completed, rating].</p>
</div>
```

### Example

```
"Charlotte Plumbing Co provides emergency plumbing repair in Charlotte, NC 
and surrounding areas. Licensed since 2012 with 24/7 availability and 
60-minute response times. Rated 4.9 stars across 200+ Google reviews."
```

### Rules

```
- Entity clarity: WHO (business name) + WHAT (service) + WHERE (location)
- Include one quantitative claim (rating, response time, years, review count)
- 2-3 sentences maximum
- No superlatives without backing ("best" requires context)
- Plain language — no jargon, no marketing fluff
- Queue for review on initial pages, autonomous after pattern established
```

---

## 4. FAQ Strategy for AI Consumption

### Why FAQs Matter for AI

LLMs disproportionately cite FAQ-formatted content because it directly pairs questions with answers — exactly what the LLM needs to respond to user queries.

### FAQ Structure

```
EVERY SERVICE PAGE: 5-8 FAQs
EVERY LOCATION PAGE: 3-5 FAQs
FAQ HUB PAGE: 20-30 FAQs across all services

FORMAT:
- Question phrased exactly how a person would ask it
- "How much does AC repair cost in Charlotte?" not "AC Repair Pricing"
- Answer starts with direct response in first sentence
- Supporting detail in 2-3 additional sentences
- Specific numbers when possible (price ranges, timeframes)
```

### Schema Markup for FAQs

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does AC repair cost in Charlotte?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AC repair in Charlotte typically costs $150-$500 for common issues like refrigerant recharge or capacitor replacement. Major repairs like compressor replacement can run $1,200-$2,500. Charlotte Plumbing Co offers free diagnostic with any repair."
      }
    }
  ]
}
```

### Question Sources

```
1. Google "People Also Ask" for primary keywords
2. Customer call transcripts (real questions from real people)
3. Google Search Console (queries people use to find you)
4. Competitor FAQ pages (what are they answering?)
5. LLM queries — ask ChatGPT/Claude "what questions would someone
   have about [service] in [city]?" and see what comes up
```

---

## 5. AI Mention Monitoring

### What to Monitor

Track whether AI systems mention or recommend the business when asked relevant questions.

### Monitored Prompts

```
Per service × per city:
"Who is the best [service] in [city]?"
"I need [emergency service] in [city], who should I call?"
"What [service] companies in [city] have the best reviews?"
"How much does [service] cost in [city]?"
"Can you recommend a [service] near [neighborhood]?"
```

### Tracking Data Points

```
PER LLM (ChatGPT, Claude, Perplexity, Gemini):
- Is the business mentioned? (yes/no)
- Position in list (if multiple recommendations)
- What information is cited? (reviews, services, pricing, hours)
- Is the information accurate?
- What competitors are mentioned?
- What sources does the LLM cite?
```

### Frequency

Bi-weekly scan. LLM outputs don't change as fast as search rankings — weekly is overkill, monthly misses shifts.

### Data Source

DataForSEO AI Optimization API:
- LLM Responses API: Query LLMs programmatically, parse responses
- LLM Mentions API: Track mention frequency across LLM outputs
- AI Keywords API: Estimated search volume in AI tools

### Helm Integration

AI Visibility context card:
```
AI VISIBILITY
─────────────────────────────
Mentioned by: ChatGPT ✓  Claude ✓  Perplexity ✓  Gemini ✗

Changes since last check:
  ✓ ChatGPT now recommends you for "emergency plumber charlotte"
  ✗ Lost mention for "ac repair charlotte" on Perplexity

Competitor comparison:
  You: mentioned in 8/12 monitored prompts
  Top competitor: mentioned in 10/12
```

---

## 6. AI Bot Traffic Management

### What AI Bots Crawl

```
MAJOR CRAWLERS:
- GPTBot (OpenAI) — User-agent: GPTBot
- ClaudeBot (Anthropic) — User-agent: ClaudeBot  
- Google-Extended (Gemini) — User-agent: Google-Extended
- PerplexityBot — User-agent: PerplexityBot
- CCBot (Common Crawl) — User-agent: CCBot
```

### robots.txt Strategy

```
# ALLOW AI bots — we WANT to be in training data and citations
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /
```

Default: ALLOW all AI bots. The goal is maximum AI visibility. Only block if there's a specific reason (paid content, gated resources).

### Traffic Monitoring

Daily log scan for AI bot activity.

```
TRACK:
- Which bots are crawling
- Which pages they visit most
- Crawl frequency trends
- New bots appearing
- Pages NOT being crawled (may indicate issues)

ALERT:
- New major bot starts crawling → informational
- Bot stops crawling → investigate (robots.txt issue? site down?)
- Unusual crawl patterns → monitor
```

---

## 7. Content Optimization for AI Citation

### The 30-40% Improvement Framework

Research shows these content elements increase AI citation rates by 30-40%:

```
1. ENTITY CLARITY
   Every page explicitly states WHO/WHAT/WHERE/WHEN/WHY
   First paragraph has all five
   No ambiguity about which business or which location

2. STATISTICS AND SPECIFIC CLAIMS
   "4.9 stars across 234 reviews" not "highly rated"
   "Licensed since 2012" not "experienced"
   "$150-$500 typical cost" not "affordable pricing"
   Numbers are AI catnip

3. SOURCE CITATIONS
   Cite sources for claims where relevant
   "According to the EPA..." or "Per Charlotte city code..."
   AI systems trust sourced claims more than unsourced ones

4. DIRECT ANSWER FORMAT
   Question as H2 → direct answer as first sentence of paragraph
   Don't bury the answer — lead with it
   Supporting context follows

5. STRUCTURED DATA
   Schema markup for everything (see section 8)
   Semantic HTML (proper heading hierarchy)
   Tables for comparative data
   Lists for multi-item answers
```

### AI-Optimized Page Template

```
H1: [Service] in [City] — [Business Name]

TL;DR BLOCK (2-3 sentences, entity-clear, one stat)

H2: [Primary question — "What does [service] cost in [city]?"]
[Direct answer paragraph, specific numbers, sourced claims]

H2: [Second question — "How long does [service] take?"]  
[Direct answer paragraph]

H2: Why Choose [Business Name] for [Service]
[Differentiators with specifics, not marketing language]

H2: Frequently Asked Questions
[FAQPage schema markup, 5-8 Qs with direct answers]

H2: Service Areas
[Internal links to location pages]

BOOKING WIDGET

SCHEMA: LocalBusiness + Service + FAQPage + AggregateRating
```

---

## 8. Structured Data for AI Systems

### Required Schema Types

```
EVERY PAGE:
- Organization (or LocalBusiness for primary location)
- WebSite (with SearchAction for sitelinks)
- BreadcrumbList

SERVICE PAGES:
- Service (name, description, provider, areaServed, offers)
- FAQPage (all FAQ items)
- HowTo (if process explanation exists)
- AggregateRating (if reviews are displayed)
- Review (individual featured reviews)

LOCATION PAGES:
- LocalBusiness (full NAP, hours, geo coordinates)
- Service (per-location service list)
- FAQPage
- AggregateRating

BLOG POSTS:
- Article (author, datePublished, dateModified)
- FAQPage (if FAQ section exists)
- HowTo (if tutorial format)

BOOKING WIDGET:
- Offer (price, availability)
- Service
```

### Schema Generation Rules

```
- Auto-generate on page publish (template-driven)
- Autonomous — no human review needed
- Validate against Google's Rich Results Test
- Update when page content changes
- Include as JSON-LD in <head> (not microdata)
- One script block per schema type
```

---

## 9. Google AI Overviews

### What They Are

AI-generated summary boxes that appear above organic results for many queries. They pull from web content and cite sources.

### Optimization Strategy

```
1. TARGET QUERIES THAT TRIGGER AI OVERVIEWS
   - "How to..." questions
   - "What is..." questions
   - "How much does..." questions
   - Comparison queries
   - Use Serper.dev to check which keywords trigger overviews

2. STRUCTURE CONTENT FOR EXTRACTION
   - Direct answer in first paragraph after H2
   - Use numbered steps for process questions
   - Use tables for comparison questions
   - Use price ranges for cost questions
   - Keep paragraphs to 2-3 sentences (extraction-friendly)

3. BE THE CITED SOURCE
   - Domain authority matters (build links)
   - Page must already rank in top 10 organically
   - Content must directly answer the query
   - Structured data increases extraction likelihood
   - Fresh content (updated within 6 months) preferred
```

### Featured Snippet Optimization

Featured snippets still appear and still feed AI Overviews.

```
TARGET TYPES:
- Paragraph snippet: Direct answer in 40-60 words
- List snippet: Numbered or bulleted list under 8 items
- Table snippet: Comparison or pricing data in HTML table

FORMULA:
H2 = exact question
First paragraph/list = direct answer, formatted for extraction
Supporting content follows

MONITOR: Track which keywords have snippets, who currently owns them
```

---

## 10. Voice Search Optimization

### Why It Matters for Local

76% of voice searches are local. "Hey Google, I need a plumber." Voice returns one answer, not ten. Position zero is the only position.

### Optimization

```
1. FAQ PAGES WITH NATURAL QUESTIONS
   "How much does it cost to fix a leaking faucet?"
   Not: "Faucet Leak Repair Pricing"

2. SPEAKABLE SCHEMA
   Mark content sections as speakable for voice assistants:
   
   {
     "@type": "WebPage",
     "speakable": {
       "@type": "SpeakableSpecification",
       "cssSelector": [".tldr", ".faq-answer"]
     }
   }

3. CONVERSATIONAL CONTENT
   Match how people talk, not how they type
   "near me" queries, natural language
   
4. STRONG GBP SIGNALS
   Voice assistants pull heavily from GBP data
   Complete profile + good reviews = voice recommendations
```

---

## 11. Future-Proofing: AI Agent Bookability

### The 2-3 Year Vision

Homeowners won't search-then-call. Their AI assistant will search, evaluate, compare, and book autonomously. The contractor with machine-readable booking availability, transparent pricing, and trust signals wins.

### What AI Agents Need

```
MACHINE-READABLE:
- llms.txt with complete service catalog
- API-accessible booking (Type 1 services)
- Transparent pricing in structured data
- Real-time availability in schema markup
- Trust signals (reviews, licenses, insurance) in structured format

SERVICE STACK TYPE 1/2/3 MAPS TO:
- Type 1 → AI agent can book without human involvement
- Type 2 → AI agent can request callback or schedule assessment
- Type 3 → AI agent can request estimate but can't book

TECHNICAL REQUIREMENTS:
- Booking API endpoint (JSON, documented)
- Availability endpoint (real-time from calendar)
- Pricing endpoint (per-service, includes modifiers)
- Schema: Offer, Service, Schedule
```

### Multi-Modal Search Preparation

```
GOOGLE LENS / PHOTO SEARCH:
- Homeowner photographs broken pipe, Google matches to local plumber
- Rich image content with alt text, schema, geotagging is the play
- Before/after photos with descriptive metadata
- Product/equipment photos with brand names in alt text

PREPARATION:
- Geotagged photos on every page
- Descriptive alt text (not "photo1.jpg")
- Schema ImageObject where appropriate
- WebP format with responsive sizes
```

---

## 12. Network Effect Data Intelligence

Every ServiceStack contractor using SEO feeds data back. Cross-tenant intelligence compounds over time.

```
BENCHMARK DATA:
- What review velocity produces map pack results in HVAC vs plumbing?
- What citation count correlates with ranking in [market size]?
- How long does it take to crack the map pack from zero?

CONTENT INTELLIGENCE:
- Which page structures convert best for [service type]?
- What FAQ topics drive the most traffic?
- What TL;DR format gets cited most by AI?

COMPETITIVE INTELLIGENCE:
- Aggregated competitor data across verticals
- Market-level trends (is AI Overview showing more for contractor queries?)
- New competitor patterns (franchise expansion, aggregator growth)

AI TRAINING ADVANTAGE:
- Knows what LLMs recommend and why
- Can optimize faster because of cross-tenant data
- Recommendations improve with scale
```

This is the moat. The more contractors on the platform, the smarter recommendations get for all of them.

---

## Usage in Agent Harness

```
For any site build where AI visibility matters:
1. Load seo-foundations (base layer)
2. Load this skill (aeo-geo)
3. Generate llms.txt at onboarding (autonomous)
4. Add TL;DR blocks to all service/location pages
5. Generate FAQPage schema for every FAQ section
6. Configure AI mention monitoring prompts
7. Set robots.txt to allow all AI bots
8. Run baseline AI visibility scan

For content generation:
- Every page follows the AI-Optimized Page Template (section 7)
- Every FAQ is structured for AI extraction (section 4)
- TL;DR blocks on every substantive page (section 3)

For monitoring:
- AI mention scan bi-weekly
- AI bot traffic daily
- AI Overview coverage check monthly
- Cross-reference with organic ranking changes
```
