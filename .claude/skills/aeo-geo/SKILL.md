---
name: aeo-geo
description: "Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO). Covers getting cited by AI systems — ChatGPT, Claude, Perplexity, Google AI Overviews. Includes llms.txt, TL;DR blocks, AI mention monitoring, AI bot traffic management, voice search, featured snippets, and structured data for AI consumption. Load alongside seo-foundations for any site where AI visibility matters."
version: 1.0.0
---

# AEO + GEO: Optimizing for AI Systems

## Purpose

Non-obvious patterns for getting cited by AI systems. Traditional SEO gets you ranked on Google — AEO/GEO gets you cited by ChatGPT, Claude, Perplexity, and Google AI Overviews. Load seo-foundations first for keyword research and on-page basics.

---

## 1. llms.txt — Machine-Readable Business Identity

A standardized file at `/llms.txt` that tells AI systems about the business in a format optimized for LLM consumption. Auto-generate from service catalog + location data at onboarding, update quarterly. No human review needed (structured data from known inputs).

```markdown
# [Business Name]

## Overview

[2-3 sentence description: WHO, WHAT, WHERE, SINCE WHEN]

## Services

- [Service 1]: [1-sentence description with key details]

## Service Area

[Cities/regions served]

## Contact

- Phone: [number]
- Address: [full address]
- Website: [URL]
- Hours: [operating hours]
- Emergency: [yes/no, after-hours number if applicable]

## Credentials

- Licensed: [license type and number]
- Insured: [coverage type]
- Years in business: [number]
- BBB rating: [rating]

## Reviews

- Google: [rating] ([count] reviews)

## FAQ

Q: [Common question]
A: [Direct answer]
```

Rules: factual only, no marketing language (AI systems ignore it), under 2000 words.

---

## 2. TL;DR Content Blocks

2-3 sentence summaries at the top of every service/location page, written for AI citation. When an LLM pulls from a page, this block is what it's most likely to quote.

Placement: after H1, before main content.

```html
<div class="tldr" itemscope itemtype="https://schema.org/Service">
  <p>
    <strong>[Business Name]</strong> provides <strong>[service]</strong> in
    <strong>[city/area]</strong>. [Key differentiator — years, specialization,
    guarantee, or availability]. [Specific claim with number — response time,
    jobs completed, rating].
  </p>
</div>
```

Rules:

- Entity clarity: WHO + WHAT + WHERE in every block
- One quantitative claim required (rating, response time, years, review count)
- No superlatives without backing ("best" requires context)
- 2-3 sentences maximum

---

## 3. AI Mention Monitoring

Track whether AI systems cite the business for relevant queries. Run bi-weekly (LLM outputs don't shift as fast as search rankings — weekly is overkill, monthly misses shifts).

Monitored prompt templates (per service × per city):

```
"Who is the best [service] in [city]?"
"I need [emergency service] in [city], who should I call?"
"What [service] companies in [city] have the best reviews?"
```

Data source: DataForSEO AI Optimization API — LLM Responses API, LLM Mentions API, AI Keywords API.

Track per LLM (ChatGPT, Claude, Perplexity, Gemini): mentioned yes/no, position in list, what information is cited, whether information is accurate, what competitors are mentioned.

---

## 4. AI Bot Traffic — Default to ALLOW

Counter-intuitive vs. standard robots.txt instinct: allow all AI bots. The goal is maximum AI visibility.

```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /
```

Only block if there's a specific reason (paid content, gated resources). Monitor for new bots appearing and bots that stop crawling (investigate — robots.txt issue or site down?).

---

## 5. Content Optimization for AI Citation

Research shows these elements increase AI citation rates 30-40%:

```
1. ENTITY CLARITY
   Every page explicitly states WHO/WHAT/WHERE/WHEN
   No ambiguity about which business or which location

2. STATISTICS AND SPECIFIC CLAIMS
   "4.9 stars across 234 reviews" not "highly rated"
   "Licensed since 2012" not "experienced"
   "$150-$500 typical cost" not "affordable pricing"
   Numbers are AI catnip

3. DIRECT ANSWER FORMAT
   Question as H2 → direct answer as first sentence of paragraph
   Don't bury the answer — lead with it

4. SOURCE CITATIONS
   "According to the EPA..." / "Per Charlotte city code..."
   AI systems trust sourced claims more than unsourced ones
```

AI-optimized page structure:

```
H1: [Service] in [City] — [Business Name]
TL;DR BLOCK (entity-clear, one stat)
H2: [Primary question — "What does [service] cost in [city]?"]
H2: [Second question]
H2: Why Choose [Business Name] for [Service]
H2: Frequently Asked Questions (FAQPage schema, 5-8 Qs)
H2: Service Areas
BOOKING WIDGET
SCHEMA: LocalBusiness + Service + FAQPage + AggregateRating
```

---

## 6. AI Agent Bookability (2-3 Year Horizon)

ServiceStack Type 1/2/3 maps directly to AI agent booking capability:

- Type 1 (book instantly) → AI agent can book without human
- Type 2 (qualify then book) → AI agent can request callback
- Type 3 (estimate required) → AI agent can request estimate only

Technical requirements: booking API endpoint (JSON, documented), real-time availability endpoint, pricing endpoint per service.

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
8. Run baseline AI visibility scan (bi-weekly thereafter)
```
