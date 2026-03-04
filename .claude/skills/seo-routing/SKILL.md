---
name: seo-routing
description: "SEO skill routing guide — which SEO skills to load for common tasks. Always load seo-foundations as baseline. Add local-seo for local businesses, aeo-geo for AI visibility, seo-agent-playbook for agent workflows, and seo-integrations for technical implementation. Read this skill first when doing any SEO work to know which skills to combine."
version: 1.0.0
---

# SEO Skill Routing Guide

## Skill Overview

| Skill                | Layer                    | Question It Answers             |
| -------------------- | ------------------------ | ------------------------------- |
| `seo-foundations`    | Base                     | Are the SEO fundamentals right? |
| `local-seo`          | Local                    | Are we visible in local search? |
| `aeo-geo`            | AI Visibility            | Are AI systems citing us?       |
| `seo-agent-playbook` | Agent Operations         | How does the SEO agent work?    |
| `seo-integrations`   | Technical Implementation | Which APIs and connectors?      |

---

## Routing Rules

### Always Load (Baseline)

**`seo-foundations`** — keyword research, on-page optimization, technical SEO, content strategy, link building. Required for any SEO-related task.

### Add Based on Task Type

| Task Type                         | Skills to Load                                |
| --------------------------------- | --------------------------------------------- |
| Any site build                    | `seo-foundations`                             |
| Local business site               | `seo-foundations` + `local-seo`               |
| Site targeting AI visibility      | `seo-foundations` + `aeo-geo`                 |
| Local business + AI visibility    | `seo-foundations` + `local-seo` + `aeo-geo`   |
| SEO agent configuration/debugging | `seo-agent-playbook` + relevant domain skills |
| Implementing SEO integrations     | `seo-integrations` + relevant domain skills   |
| Full local business deployment    | All five skills                               |

---

## Task-to-Skill Matrix

| Task                                   | foundations | local-seo | aeo-geo | playbook | integrations |
| -------------------------------------- | :---------: | :-------: | :-----: | :------: | :----------: |
| Keyword research & mapping             |      x      |           |         |          |              |
| On-page SEO (meta, headings, content)  |      x      |           |         |          |              |
| Technical SEO audit                    |      x      |           |         |          |              |
| Content strategy & blog planning       |      x      |           |         |          |              |
| Link building strategy                 |      x      |           |         |          |              |
| Google Business Profile management     |      x      |     x     |         |          |              |
| Map pack ranking optimization          |      x      |     x     |         |          |              |
| Citation building & NAP management     |      x      |     x     |         |          |              |
| Review strategy & response drafting    |      x      |     x     |         |          |              |
| Local competitor intelligence          |      x      |     x     |         |          |              |
| DBA recommendation                     |             |     x     |         |          |              |
| Virtual office strategy                |             |     x     |         |          |              |
| llms.txt generation                    |      x      |           |    x    |          |              |
| TL;DR blocks for AI citation           |             |           |    x    |          |              |
| AI mention monitoring setup            |             |           |    x    |          |              |
| AI bot traffic management              |             |           |    x    |          |              |
| Voice search optimization              |      x      |           |    x    |          |              |
| Featured snippet targeting             |      x      |           |    x    |          |              |
| Schema/structured data for AI          |      x      |           |    x    |          |              |
| SEO agent workflow setup               |             |           |         |    x     |              |
| Helm context card configuration        |             |           |         |    x     |              |
| Autonomy progression rules             |             |           |         |    x     |              |
| Agent onboarding sequence              |             |           |         |    x     |              |
| Cross-agent interaction design         |             |           |         |    x     |              |
| DataForSEO connector implementation    |             |           |         |          |      x       |
| Google GBP API integration             |             |           |         |          |      x       |
| Search Console / PageSpeed setup       |             |           |         |          |      x       |
| Citation connector (BrightLocal)       |             |           |         |          |      x       |
| SMS connector (Twilio/Quo)             |             |           |         |          |      x       |
| Cost modeling & connector architecture |             |           |         |          |      x       |

---

## Common Combos

### Site Build (Non-Local)

```
Load: seo-foundations
Skip: local-seo, seo-agent-playbook (no agent), seo-integrations (no connectors)
Add aeo-geo if AI visibility is a goal
```

### Local Business Site Build

```
Load: seo-foundations + local-seo
Add: aeo-geo (recommended — competitive advantage)
Skip: seo-agent-playbook + seo-integrations (unless building the agent system)
```

### ServiceStack SEO Agent Development

```
Load: All five skills
seo-foundations → what the agent needs to know about SEO
local-seo → what the agent manages for local businesses
aeo-geo → AI visibility features the agent monitors
seo-agent-playbook → how the agent operates
seo-integrations → what APIs the agent calls
```

### SEO Audit

```
Load: seo-foundations + local-seo (if local business)
Reference: seo-integrations for tool/API selection
Skip: seo-agent-playbook (audit is manual, not agent-driven)
```

### Content Generation

```
Load: seo-foundations (content strategy, on-page rules)
Add: aeo-geo (if optimizing for AI citation)
Add: local-seo section 1 (if generating GBP posts)
```

---

## Relationship to Other Skills

SEO skills pair with these harness skills:

| Harness Skill          | Pairing                                                   |
| ---------------------- | --------------------------------------------------------- |
| `visual-design`        | Page layout affects SEO (heading hierarchy, content flow) |
| `ui-patterns`          | Forms, CTAs, booking widgets referenced in SEO pages      |
| `react-best-practices` | Core Web Vitals, performance optimization                 |
| `security`             | Input validation on SEO-generated forms, booking widgets  |
| `observability`        | Health checks, monitoring for SEO bot crawl patterns      |
| `ai-integration`       | Claude API for content generation, review responses       |
| `data-protection`      | GDPR/CCPA compliance in review collection, tracking       |
