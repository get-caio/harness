---
name: anti-slop
description: Detect and prevent AI-generated "slop" patterns in any written content — blog posts, landing pages, sequences, ads, social posts, email. Use whenever generating user-facing copy, reviewing AI output, or auditing existing content for buzzwords, opener crimes, formulaic structure, unsourced stats, fabricated anecdotes, bumper-sticker endings, or line-per-thought layout. Includes a runnable scorer (scripts/anti-slop.ts) and a rules reference for prompt injection.
---

# Anti-Slop Skill

Detect AI-generated content patterns and score quality. Lower violation counts = more authentic, human-sounding content.

Two ways to use this skill:

1. **As a writer's checklist** — read the rules below before generating or reviewing copy.
2. **As a scorer** — run `scripts/anti-slop.ts` against any text to get a numeric score (0–100, ≥70 acceptable) and a list of violations with suggestions.

---

## When to invoke

- Generating user-facing content (blog, landing pages, sequences, ads, social posts, transactional email body copy).
- Reviewing AI-generated drafts before they ship to a human.
- Auditing existing content for the patterns below.
- Writing a system prompt for any content-generation step — inject `ANTI_SLOP_PROMPT_RULES` (bottom of this file) so the model avoids them upfront.

---

## Quick usage

```bash
# Score a file
bun run .claude/skills/anti-slop/scripts/anti-slop.ts path/to/draft.md

# Score from stdin
cat draft.md | bun run .claude/skills/anti-slop/scripts/anti-slop.ts -

# Import the function
import { analyzeContent } from "./.claude/skills/anti-slop/scripts/anti-slop";
const { score, violations, isAcceptable, filteredContent } = analyzeContent(text);
```

Output shape:

```ts
{
  score: number; // 0-100, higher is better
  violations: Array<{
    type: string; // e.g. "opener", "buzzword", "bumper_sticker"
    text: string; // matched text
    suggestion: string; // how to fix
    severity: "warning" | "error";
  }>;
  filteredContent: string; // content with filler/cringe stripped
  isAcceptable: boolean; // score >= 70
}
```

---

## Scoring rubric

Each violation deducts points from 100. Threshold for "acceptable" is ≥ 70.

| Category               | Penalty per hit       |
| ---------------------- | --------------------- |
| Opener crimes          | -15                   |
| Line-per-thought       | -15 (one-shot)        |
| Overused metaphors     | -12                   |
| Cringe phrases         | -10                   |
| Thought-terminating    | -10                   |
| Instant-promise        | -10                   |
| Structure issues       | -10                   |
| Fabricated anecdotes   | -8                    |
| Formulaic pivots       | -8                    |
| Unsourced statistics   | -8                    |
| Bumper-sticker endings | -8                    |
| Absolute claims        | -8                    |
| Rhetorical questions   | -6                    |
| Jargon stacking        | -6                    |
| Business metaphors     | -6                    |
| Buzzwords              | -5                    |
| Filler phrases         | -5                    |
| False precision        | -5                    |
| Emoji overuse          | -5 per extra (over 2) |

---

## The 19 categories (what to look for)

**1. Opener crimes** — "In today's rapidly evolving…", "Let me tell you…", "Picture this:", "Hot take:", "What if I told you…", "Imagine if…", "PSA:", "A thread on…". Start with a specific observation, not a preamble.

**2. Buzzwords** — leverage, synergy, disrupt, paradigm, holistic, ecosystem, unlock, empower, optimize, streamline, revolutionize, game-changing, cutting-edge, seamless, bandwidth, circle back, low-hanging fruit, move the needle, deep dive, pivot, double down, thought leader, value-add, alignment, ideation. Use the specific word for what you actually mean.

**3. Filler phrases** — "at the end of the day", "to be honest", "honestly", "basically", "essentially", "literally", "actually", "needless to say", "the fact of the matter is", "in this day and age", "moving forward", "going forward", "let's be clear", "the reality is". Cut them; the sentence loses nothing.

**4. Cringe phrases (LinkedIn-flavored)** — "agree?", "thoughts?", "this.", "let that sink in", "read that again", "smash that like", "follow for more", "tag someone who", "is it just me", "mic drop", "boom", "link in bio". Manipulative engagement bait.

**5. Structural issues** — numbered lists with `**bold headers**`, engagement-bait endings ("what do you think?"), 4+ consecutive line breaks, all-caps words (>2 non-acronyms). Looks like AI output.

**6. Emoji overuse** — more than 2 emojis in a single piece signals AI. Cut to 0–2.

**7. Fabricated anecdotes** — "I met a developer who…", "A founder told me…", "Someone reached out and said…", "I spent 4 hours yesterday…". Vague stories with no verifiable detail. Either name the person/company or drop the setup.

**8. False precision** — "in 47 seconds", "9 out of 10 founders", "94% of teams". Suspiciously exact numbers used for rhetorical effect, not measured.

**9. Formulaic pivots** — "But here's the thing…", "And then it hit me…", "Plot twist:", "Spoiler alert:", "Here's what nobody tells you…". Theatrical setup-then-subversion templates.

**10. Thought-terminating clichés** — "the old X isn't working", "it's not about X, it's about Y", "the future is bright", "at the end of the day", "the reality is…". Sounds profound, says nothing, kills further analysis.

**11. Overused metaphors** — "AI is like a junior developer", "X is the new Y", "X on steroids", "Think of it as…". Tired comparisons. Find a fresh angle or drop the metaphor.

**12. Rhetorical questions** — "The question isn't X. It's Y.", "What if I told you…", "Have you ever stopped to think…", "Why do we X? Because…", "What does this mean for [group]?". Pseudo-profound formats.

**13. Unsourced statistics** — "15-20% of search…", "by 60%", "taking another 30%". Numbers presented as fact with no source. Cite or qualify ("estimates suggest").

**14. Instant promises** — "double overnight", "instantly transform", "in just 7 days", "immediately boost". Unrealistic timeframes; marketing speak.

**15. Bumper sticker endings** — "Stop X. Start Y.", "Diversify or die.", "Be the X, not the Y.", "The future belongs to…", "Choose X. Choose Y.". Punchy but empty closers. End with substance.

**16. Jargon stacking** — three+ compound buzzwords in a row ("first-party data monetization stack"), "complex X chains/loops", "owning your [buzzword] stack". Authority signaling without substance.

**17. Business metaphors** — "squeezed from both ends", "caught in the middle", "race to the bottom", "feeding the machine". Tired framing. Describe the actual dynamic.

**18. Line-per-thought structure** — when >85% of non-empty lines are single sentences. The #1 visual tell of AI-generated LinkedIn content. Develop thoughts into paragraphs.

**19. Absolute claims** — "every single time", "will always", "should never", "are always better". Universal statements are almost always wrong. Add conditions.

---

## Prompt rules — paste into any content-generation system prompt

```
## CRITICAL: Avoid AI "Slop" Patterns

These patterns instantly mark content as AI-generated. NEVER use them:

### Opener Crimes (NEVER start with):
- "In today's rapidly evolving..." / "In an era of..." / "As we navigate..."
- "Picture this:" / "Imagine a world where..."
- "Let me tell you a story..." / "Here's the thing..."
- "Hot take:" / "Unpopular opinion:" / "Truth bomb:"
- "I hope this message finds you well" / "I hope you're doing well"

### Unsourced Statistics (NEVER use vague stats):
- "X% of [group]..." without citing the source
- "Studies show..." / "Research indicates..." without naming the study
- Made-up ranges like "15-20%" or "40-60%"

### Structural Slop (NEVER do this):
- One sentence per line, stacked vertically (the #1 AI tell)
- Arrow bullets (→) for lists
- "Here's what I learned:" followed by numbered list
- "The fix is simple:" / "The answer is clear:"

### Bumper Sticker Endings (NEVER end with):
- "Diversify or die." / "Adapt or perish." / "Evolve or become irrelevant."
- "Stop X. Start Y." / "Stop X and start Y." / "Less X, more Y."
- "The future is [noun]." / "This is the way."
- Single-sentence "mic drop" conclusions

### Jargon & Buzzwords (NEVER use):
- "leverage", "synergy", "unlock", "game-changer", "disrupt"
- "double down", "doubling down"
- "revolutionize", "transform", "empower"
- Stacking 3+ buzzwords in one sentence

### Clichés (NEVER use):
- "The old X isn't working anymore" / "The playbook has changed"
- "It's not about X, it's about Y"
- "But here's the real question..."
- "I'd love to pick your brain" / "Can I steal 15 minutes?"
- Fabricated anecdotes: "A friend of mine..." / "I recently met someone..."

## What TO Do:
1. Sound human — contractions, natural rhythm, specific details
2. Be direct — state purpose early, don't bury the ask
3. End with substance — a specific next step, not a bumper sticker
4. Write like a real person would actually write in this channel
```

---

## Workflow when reviewing AI-generated copy

1. Run `bun run .claude/skills/anti-slop/scripts/anti-slop.ts <file>` against the draft.
2. If score < 70, treat as failing — fix the highest-penalty violations first (openers, line-per-thought, bumper-sticker endings, metaphors).
3. Re-score. Iterate until ≥ 70 or hand to a human reviewer with the violation list attached.
4. For generation-time prevention, inject the prompt-rules block above into the system prompt so the model avoids these in the first place. Score is then a backstop, not the only line of defense.
