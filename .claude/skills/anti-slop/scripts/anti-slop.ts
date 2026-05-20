#!/usr/bin/env bun
/**
 * Anti-Slop — single-file, dependency-free content analyzer.
 *
 * Usage:
 *   bun run anti-slop.ts path/to/file.md
 *   cat draft.md | bun run anti-slop.ts -
 *
 * Programmatic:
 *   import { analyzeContent } from "./anti-slop";
 *   const result = analyzeContent(text);
 *
 * Score is 0-100. Higher is better. ≥ 70 is acceptable.
 */

// ============================================================================
// Types
// ============================================================================

export type SlopViolationType =
  | "opener"
  | "buzzword"
  | "filler"
  | "cringe"
  | "structure"
  | "emoji"
  | "fabricated"
  | "false_precision"
  | "formulaic"
  | "cliche"
  | "overused_metaphor"
  | "rhetorical"
  | "unsourced_stat"
  | "instant_promise"
  | "bumper_sticker"
  | "jargon_stack"
  | "business_metaphor"
  | "line_per_thought"
  | "absolute_claim";

export interface SlopViolation {
  type: SlopViolationType;
  text: string;
  suggestion: string;
  severity: "warning" | "error";
}

export interface SlopAnalysis {
  score: number;
  violations: SlopViolation[];
  filteredContent: string;
  isAcceptable: boolean;
}

// ============================================================================
// Utilities
// ============================================================================

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ============================================================================
// Patterns
// ============================================================================

const OPENER_CRIMES: { pattern: RegExp; suggestion: string }[] = [
  {
    pattern: /^In today['']s (rapidly )?(evolving|changing)/i,
    suggestion: "Start with a specific observation or question",
  },
  {
    pattern: /^Let me (tell you|share|explain)/i,
    suggestion: "Just share it directly without the preamble",
  },
  {
    pattern: /^I('m| am) (so )?(excited|thrilled|delighted)/i,
    suggestion: "Show enthusiasm through your content, not declarations",
  },
  { pattern: /^Here['']s the thing/i, suggestion: "Just say the thing" },
  {
    pattern: /^(Hot take|Unpopular opinion):/i,
    suggestion: "State your view confidently without the disclaimer",
  },
  { pattern: /^What if I told you/i, suggestion: "Just tell them" },
  {
    pattern: /^The (secret|truth) (about|is)/i,
    suggestion: "Be direct without clickbait framing",
  },
  {
    pattern: /^I['']ve been thinking a lot about/i,
    suggestion: "Share your insight directly",
  },
  {
    pattern: /^Can we (all )?(just )?talk about/i,
    suggestion: "Just talk about it",
  },
  {
    pattern: /^(Controversial|Bold) (take|opinion):/i,
    suggestion: "Let your content speak for itself",
  },
  { pattern: /^Picture this:/i, suggestion: "Describe the scenario directly" },
  {
    pattern: /^Imagine (if|a world)/i,
    suggestion: "Paint the picture without 'imagine'",
  },
  {
    pattern: /^(PSA|Pro tip|Fun fact):/i,
    suggestion: "Share the insight without the label",
  },
  { pattern: /^(Real|True) story:/i, suggestion: "Just tell the story" },
  { pattern: /^A thread on/i, suggestion: "Start with your first point" },
];

const BUZZWORDS: string[] = [
  "leverage",
  "leveraging",
  "synergy",
  "synergies",
  "synergize",
  "disrupt",
  "disrupting",
  "disruptive",
  "disruption",
  "paradigm",
  "paradigm shift",
  "holistic",
  "scalable",
  "scalability",
  "ecosystem",
  "unlock",
  "unlocking",
  "empower",
  "empowerment",
  "enablement",
  "operationalize",
  "democratize",
  "democratizing",
  "optimize",
  "optimization",
  "streamline",
  "elevate",
  "revolutionize",
  "transform",
  "transformative",
  "game-changing",
  "game changer",
  "revolutionary",
  "cutting-edge",
  "bleeding-edge",
  "best-in-class",
  "world-class",
  "next-gen",
  "next-level",
  "mission-critical",
  "robust",
  "seamless",
  "seamlessly",
  "innovative",
  "bandwidth",
  "circle back",
  "low-hanging fruit",
  "move the needle",
  "deep dive",
  "touch base",
  "pivot",
  "pivoting",
  "double down",
  "doubling down",
  "unpack",
  "thought leader",
  "thought leadership",
  "value-add",
  "value proposition",
  "alignment",
  "aligned",
  "ideation",
];

const FILLER_PHRASES: string[] = [
  "at the end of the day",
  "to be honest",
  "to be perfectly honest",
  "honestly",
  "truthfully",
  "basically",
  "essentially",
  "literally",
  "actually",
  "in my humble opinion",
  "just saying",
  "you know",
  "like i said",
  "as i mentioned",
  "needless to say",
  "it goes without saying",
  "in other words",
  "that being said",
  "having said that",
  "with that being said",
  "when all is said and done",
  "the fact of the matter is",
  "at this point in time",
  "in this day and age",
  "each and every",
  "first and foremost",
  "very unique",
  "absolutely essential",
  "it's worth noting",
  "the reality is",
  "the truth is",
  "let's be clear",
  "moving forward",
  "going forward",
  "IMHO",
  "i mean",
  "right?",
  "squeezed hard",
  "pushed hard",
  "hit hard",
  "working hard",
  "trying hard",
];

const CRINGE_PHRASES: string[] = [
  "agree?",
  "thoughts?",
  "who else?",
  "am i right?",
  "change my mind",
  "let that sink in",
  "read that again",
  "this.",
  "drop a like",
  "smash that like",
  "hit the bell",
  "don't forget to",
  "follow for more",
  "follow me for",
  "repost if you agree",
  "share if you agree",
  "tag someone who",
  "comment below",
  "comment your",
  "drop an emoji",
  "i'll go first",
  "your turn",
  "am i the only one",
  "is it just me",
  "raise your hand if",
  "can i get an amen",
  "mic drop",
  "boom",
  "said no one ever",
  "just dropped",
  "go check it out",
  "link in bio",
  "link in comments",
  "link in the first comment",
];

const COMMON_ACRONYMS = new Set([
  "AI",
  "ML",
  "API",
  "CEO",
  "CTO",
  "CFO",
  "CMO",
  "COO",
  "VP",
  "SaaS",
  "B2B",
  "B2C",
  "ROI",
  "KPI",
  "USA",
  "UK",
  "EU",
  "SEO",
  "PPC",
  "CRM",
  "ERP",
  "HR",
  "PR",
  "IT",
  "IOT",
  "UX",
  "UI",
  "MVP",
  "IPO",
  "Q1",
  "Q2",
  "Q3",
  "Q4",
  "YOY",
  "MOM",
  "WOW",
  "ASAP",
  "FYI",
  "TL;DR",
  "TLDR",
  "PS",
  "AMA",
  "ICYMI",
  "IMO",
  "FWIW",
  "YMMV",
  "OKR",
  "OKRs",
]);

const ENGAGEMENT_BAIT_ENDINGS: RegExp[] = [
  /what do you think\?$/i,
  /agree or disagree\?$/i,
  /what's your take\?$/i,
  /what would you add\?$/i,
  /did i miss anything\?$/i,
  /let me know in the comments$/i,
];

const FABRICATED_ANECDOTE_PATTERNS = [
  {
    pattern:
      /^(?:I |Yesterday,? I |Last (?:week|month|year),? I )(?:watched|saw|met|talked to|spoke with) (?:a |an |my )?(?:developer|engineer|founder|CEO|manager|friend|colleague|client|customer|designer|marketer|sales rep|intern|junior|senior)\b/i,
    suggestion: "Add specific details: name, company, or verifiable context",
  },
  {
    pattern:
      /^A (?:developer|engineer|founder|CEO|manager|friend|colleague|client|customer|designer|marketer)\s+(?:told me|shared|mentioned|said)/i,
    suggestion: "Name your source or provide verifiable context",
  },
  {
    pattern:
      /^(?:Someone|A reader|A follower|A friend) (?:asked me|sent me|told me|reached out)/i,
    suggestion: "Be specific about who and when, or skip the setup",
  },
  {
    pattern:
      /(?:for |spent |took )\d+\s*(?:hours?|days?|weeks?|months?|years?)\s+(?:yesterday|last week|last month|recently|the other day)/i,
    suggestion: "Round numbers + vague timing suggests a fabricated story",
  },
];

const FALSE_PRECISION_PATTERNS = [
  {
    pattern:
      /\b(?:in |took (?:\w+\s+)?|within |under )(\d{1,2})\s*(?:seconds?|minutes?)\b/i,
    suggestion: "Suspiciously precise timing - is this actually measured?",
  },
  {
    pattern:
      /\b(\d{1,2})\s*(?:seconds?|minutes?)\s+(?:to solve|to fix|later|flat)\b/i,
    suggestion: "Suspiciously precise timing suggests rhetorical flourish",
  },
  {
    pattern:
      /\b(9[0-9]|[1-9][0-9])%\s+of\s+(?:people|companies|teams|developers|engineers|founders|CEOs|startups)/i,
    suggestion: "High round percentages often signal invented statistics",
  },
  {
    pattern: /\b([89]|9)\s*(?:out of|\/)\s*10\b/i,
    suggestion: "Is this a real statistic or rhetorical flourish?",
  },
];

const FORMULAIC_PIVOT_PATTERNS = [
  {
    pattern:
      /\bbut here['']?s (?:what|the thing|the catch|the twist|the kicker)/i,
    suggestion:
      "The 'but here's what...' pivot is a formulaic engagement pattern",
  },
  {
    pattern: /\b(?:and )?then it (?:hit me|clicked|dawned on me)/i,
    suggestion: "The sudden realization trope is overused",
  },
  { pattern: /\bplot twist:?/i, suggestion: "Avoid theatrical framing" },
  {
    pattern:
      /\bhere['']?s (?:the thing|what|something) (?:nobody|no one|people don['']t) (?:tells you|talks about|mentions)/i,
    suggestion: "Drop the 'secret knowledge' framing",
  },
  { pattern: /\bspoiler(?: alert)?:/i, suggestion: "Avoid theatrical framing" },
];

const THOUGHT_TERMINATING_CLICHES = [
  {
    pattern:
      /\bthe\s+old\s+(?:\w+\s+)?(?:isn['']t|is not|doesn['']t|does not|won['']t)\s+(?:work|cut it|apply|hold up)/i,
    suggestion:
      "'The old X isn't working' is a cliché - explain what changed specifically",
  },
  {
    pattern:
      /\b(?:we['']re|you['']re|they['']re) not (?:being )?(?:replaced|going anywhere|obsolete)/i,
    suggestion:
      "This is a thought-terminating cliché that oversimplifies complex issues",
  },
  {
    pattern:
      /\bit['']?s not (?:about|whether|if)\s+.{5,40},?\s*it['']?s (?:about|whether|if)/i,
    suggestion: "The 'not X, but Y' structure sounds profound but often isn't",
  },
  {
    pattern:
      /\bthe future (?:is|will be|looks) (?:bright|exciting|here|now|promising|uncertain)/i,
    suggestion: "Vague statements about 'the future' add no insight",
  },
  {
    pattern: /\bat the end of the day\b/i,
    suggestion:
      "This phrase signals you're wrapping up without adding substance",
  },
  {
    pattern: /\b(?:the )?(?:reality|truth|fact) is(?:,|:|\s+that)/i,
    suggestion:
      "Asserting something is 'reality' doesn't make your point stronger",
  },
];

const OVERUSED_METAPHORS = [
  {
    pattern:
      /\b(?:AI|ChatGPT|Claude|GPT|LLM)s?\s+(?:is|are|as|like)\s+(?:a |an )?(?:really fast |very fast |super )?(?:junior|intern|assistant|copilot|co-pilot|teammate|partner)/i,
    suggestion:
      "The 'AI as junior developer' metaphor has been used thousands of times",
  },
  {
    pattern:
      /\b(?:getting|having|like having)\s+(?:a |an )?(?:really |very |super )?fast (?:junior|intern|assistant)/i,
    suggestion: "This exact framing is extremely common - find a fresh angle",
  },
  {
    pattern: /\b\w+\s+is the new\s+\w+\b/i,
    suggestion: "'X is the new Y' is a tired formula",
  },
  {
    pattern: /\b\w+\s+on steroids\b/i,
    suggestion: "Find a more original comparison",
  },
  {
    pattern: /\bthink of (?:it|this|AI|them) as\b/i,
    suggestion: "The 'think of X as Y' setup often precedes a clichéd metaphor",
  },
];

const RHETORICAL_QUESTION_PATTERNS = [
  {
    pattern:
      /\bthe (?:real )?question (?:isn['']t|is not|is never)\s+.{5,50}[.?]\s*(?:It['']?s|The question is)/i,
    suggestion: "The 'question isn't X, it's Y' structure is a clichéd reframe",
  },
  {
    pattern: /\bwhat if I told you\b/i,
    suggestion: "This Matrix-reference opener is overdone",
  },
  {
    pattern:
      /\bhave you ever (?:stopped to |really )?(?:think|thought|consider|wonder)/i,
    suggestion:
      "Don't ask if they've thought about it - just share your insight",
  },
  {
    pattern:
      /\bwhy do (?:we|people|companies|founders)\s+.{5,30}\?\s*because\b/i,
    suggestion: "The self-answering question is a formulaic structure",
  },
  {
    pattern: /\bwhat does this (?:mean|tell us|say) (?:for|about)\b/i,
    suggestion: "Instead of asking what it means, just explain your insight",
  },
];

const UNSOURCED_STATISTICS_PATTERNS = [
  {
    pattern:
      /\b\d{1,2}-\d{1,2}%\s+(?:of\s+)?(?:search|traffic|revenue|users|customers|companies|growth|decline|increase|decrease)/i,
    suggestion: "Cite your source or qualify with 'estimates suggest'",
  },
  {
    pattern:
      /\b(?:taking|takes|siphoning|losing|gaining|capturing|slashing|cutting)\s+(?:another\s+)?\d{1,2}-?\d{0,2}%/i,
    suggestion: "Unsourced percentage - add attribution or qualify",
  },
  {
    pattern:
      /\b\d{1,2}(?:-\d{1,2})?%\s+of\s+(?:ad\s+)?(?:revenue|traffic|market|share|budget|every|each)/i,
    suggestion: "Statistics need sources to be credible",
  },
  {
    pattern: /\bby\s+\d{1,3}(?:-\d{1,3})?%/i,
    suggestion: "Percentage change claims need sources",
  },
];

const INSTANT_TRANSFORMATION_PATTERNS = [
  {
    pattern:
      /\b(?:double|triple|10x|transform|revolutionize|change)\s+(?:your\s+)?(?:\w+\s+){0,3}overnight\b/i,
    suggestion: "'Overnight' results are marketing speak, not reality",
  },
  {
    pattern:
      /\b(?:instantly|immediately)\s+(?:increase|boost|improve|transform|double|triple)/i,
    suggestion: "Instant transformation claims undermine credibility",
  },
  {
    pattern: /\bin just\s+(?:\d+\s+)?(?:days?|hours?|minutes?|weeks?)\b/i,
    suggestion: "Quick-fix timeframes often signal oversimplification",
  },
];

const BUMPER_STICKER_ENDINGS = [
  {
    pattern:
      /\bstop\s+\w+(?:\s+\w+){0,3}\.\s*start\s+\w+(?:\s+\w+){0,3}\.?\s*$/i,
    suggestion:
      "The 'Stop X. Start Y.' ending is a cliché that sounds profound but says little",
  },
  {
    pattern:
      /\bstop\s+\w+(?:\s+\w+){0,6}\s+and\s+start\s+\w+(?:\s+\w+){0,6}\.?\s*$/i,
    suggestion:
      "The 'Stop X and start Y' ending is a bumper sticker - end with specific insight instead",
  },
  {
    pattern: /\b\w+\s+or\s+(?:die|perish|fail|become\s+irrelevant)\.?\s*$/i,
    suggestion:
      "'X or die' is dramatic but hollow - explain the actual consequences",
  },
  {
    pattern: /\bbe\s+the\s+\w+,?\s+not\s+the\s+\w+\.?\s*$/i,
    suggestion:
      "This closing pattern is overused - end with something specific",
  },
  {
    pattern: /\bthe\s+future\s+(?:belongs|is|goes)\s+to\b.*$/i,
    suggestion: "Vague statements about the future add no actionable insight",
  },
  {
    pattern: /\bchoose\s+\w+\.\s*choose\s+\w+\.?\s*$/i,
    suggestion: "Repetitive imperative endings are a tired pattern",
  },
];

const JARGON_STACKING_PATTERNS = [
  {
    pattern:
      /\b(?:first-party|third-party|programmatic|omnichannel|cross-platform|full-stack|end-to-end)\s+(?:data|revenue|monetization|integration|solution|strategy)\s+(?:monetization|optimization|stack|strategy|platform|ecosystem)/i,
    suggestion: "Stacking jargon signals authority without substance",
  },
  {
    pattern:
      /\bcomplex\s+(?:\w+\s+)?(?:chains?|loops?|cycles?|systems?|stacks?)\b/i,
    suggestion:
      "'Complex X' is often used to sound knowledgeable without explaining",
  },
  {
    pattern:
      /\b(?:owning|own|control|controlling)\s+(?:your\s+)?(?:\w+\s+)?(?:stack|pipeline|funnel|ecosystem)\b/i,
    suggestion: "What does 'owning your stack' actually mean in practice?",
  },
];

const OVERUSED_BUSINESS_METAPHORS = [
  {
    pattern:
      /\bsqueezed\s+(?:from\s+)?(?:both|all|every)\s+(?:ends?|sides?|directions?)\b/i,
    suggestion: "'Squeezed from both ends' is an overused business metaphor",
  },
  {
    pattern: /\bcaught\s+in\s+the\s+middle\b/i,
    suggestion: "This framing is clichéd - be more specific about the dynamics",
  },
  {
    pattern: /\brace\s+to\s+the\s+bottom\b/i,
    suggestion:
      "'Race to the bottom' is overused - describe the specific mechanism",
  },
  {
    pattern:
      /\b(?:feeding|feed)\s+the\s+(?:machine|beast|monster|algorithm)\b/i,
    suggestion: "'Feeding the machine' is a tired metaphor - be specific",
  },
];

const ABSOLUTE_CLAIM_PATTERNS = [
  {
    pattern: /\bevery\s+(?:single\s+)?time\.?\s*$/im,
    suggestion: "'Every time' is almost never true - add context or conditions",
  },
  {
    pattern: /\b(?:will|should|must)\s+always\b/i,
    suggestion:
      "Absolute claims undermine credibility - real advice has conditions",
  },
  {
    pattern: /\b(?:will|should|must)\s+never\b/i,
    suggestion: "'Never' is rarely accurate - acknowledge exceptions",
  },
  {
    pattern: /\bwill\s+(?:always\s+)?beat\b/i,
    suggestion:
      "Universal comparisons need context: beat on what metric? For whom?",
  },
  {
    pattern:
      /\b(?:is|are)\s+(?:always|never)\s+(?:better|worse|right|wrong)\b/i,
    suggestion:
      "Universal value judgments are almost always oversimplifications",
  },
];

// ============================================================================
// Detectors
// ============================================================================

function detectOpenerCrimes(content: string): SlopViolation[] {
  const violations: SlopViolation[] = [];
  const firstLine = content.split("\n")[0];
  for (const { pattern, suggestion } of OPENER_CRIMES) {
    const match = firstLine.match(pattern);
    if (match)
      violations.push({
        type: "opener",
        text: match[0],
        suggestion,
        severity: "error",
      });
  }
  return violations;
}

function detectBuzzwords(content: string): SlopViolation[] {
  const violations: SlopViolation[] = [];
  for (const buzzword of BUZZWORDS) {
    const pattern = new RegExp(`\\b${escapeRegex(buzzword)}\\b`, "gi");
    const matches = content.match(pattern);
    if (matches)
      for (const match of matches)
        violations.push({
          type: "buzzword",
          text: match,
          suggestion: `Consider a more specific term instead of "${buzzword}"`,
          severity: "warning",
        });
  }
  return violations;
}

function detectFillerPhrases(content: string): SlopViolation[] {
  const violations: SlopViolation[] = [];
  for (const phrase of FILLER_PHRASES) {
    const pattern = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
    const matches = content.match(pattern);
    if (matches)
      for (const match of matches)
        violations.push({
          type: "filler",
          text: match,
          suggestion: `Remove "${phrase}" - it doesn't add value`,
          severity: "warning",
        });
  }
  return violations;
}

function detectCringePhrases(content: string): SlopViolation[] {
  const violations: SlopViolation[] = [];
  for (const phrase of CRINGE_PHRASES) {
    let pattern: RegExp;
    if (phrase.endsWith("?")) {
      const phraseWithoutQ = phrase.slice(0, -1);
      pattern = new RegExp(
        `(?:^|\\s|[.!,;:])${escapeRegex(phraseWithoutQ)}\\?`,
        "gi",
      );
    } else {
      pattern = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
    }
    const matches = content.match(pattern);
    if (matches)
      for (const match of matches)
        violations.push({
          type: "cringe",
          text: match.trim(),
          suggestion: `Remove "${phrase}" - it feels manipulative`,
          severity: "error",
        });
  }
  return violations;
}

function detectStructuralIssues(content: string): SlopViolation[] {
  const violations: SlopViolation[] = [];
  if (/^\d+\.\s*\*\*[^*]+\*\*/gm.test(content)) {
    violations.push({
      type: "structure",
      text: "Numbered list with bold headers",
      suggestion:
        "Consider a more conversational format instead of formatted lists",
      severity: "warning",
    });
  }
  const lastLine = content.trim().split("\n").pop() || "";
  for (const pattern of ENGAGEMENT_BAIT_ENDINGS) {
    if (pattern.test(lastLine)) {
      violations.push({
        type: "structure",
        text: lastLine.match(pattern)?.[0] || "Engagement bait ending",
        suggestion: "End with substance, not a call for engagement",
        severity: "warning",
      });
      break;
    }
  }
  if (/\n{4,}/.test(content)) {
    violations.push({
      type: "structure",
      text: "Excessive line breaks",
      suggestion: "Reduce spacing between sections",
      severity: "warning",
    });
  }
  const allCapsMatches = content.match(/\b[A-Z]{3,}\b/g) || [];
  const nonAcronymCaps = allCapsMatches.filter((w) => !COMMON_ACRONYMS.has(w));
  if (nonAcronymCaps.length > 2) {
    violations.push({
      type: "structure",
      text: `Excessive caps: ${nonAcronymCaps.slice(0, 3).join(", ")}...`,
      suggestion: "Reduce ALL CAPS usage - it comes across as shouting",
      severity: "warning",
    });
  }
  return violations;
}

function detectEmojiOveruse(content: string): SlopViolation[] {
  const emojis =
    content.match(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/gu,
    ) || [];
  if (emojis.length > 2) {
    return [
      {
        type: "emoji",
        text: `${emojis.length} emojis used`,
        suggestion: `Reduce to 2 or fewer emojis. Current: ${emojis.slice(0, 5).join(" ")}${emojis.length > 5 ? "..." : ""}`,
        severity: emojis.length > 5 ? "error" : "warning",
      },
    ];
  }
  return [];
}

function detectFabricatedAnecdotes(content: string): SlopViolation[] {
  const violations: SlopViolation[] = [];
  const firstLine = content.split("\n")[0];
  for (const { pattern, suggestion } of FABRICATED_ANECDOTE_PATTERNS) {
    const target = pattern.source.startsWith("^") ? firstLine : content;
    const match = target.match(pattern);
    if (match)
      violations.push({
        type: "fabricated",
        text: match[0],
        suggestion,
        severity: "warning",
      });
  }
  return violations;
}

function detectByPatterns(
  content: string,
  type: SlopViolationType,
  severity: "warning" | "error",
  patterns: { pattern: RegExp; suggestion: string }[],
): SlopViolation[] {
  const violations: SlopViolation[] = [];
  for (const { pattern, suggestion } of patterns) {
    const match = content.match(pattern);
    if (match) violations.push({ type, text: match[0], suggestion, severity });
  }
  return violations;
}

function detectLinePerThought(content: string): SlopViolation[] {
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 8) return [];
  let single = 0;
  for (const line of lines) {
    const terminators = line.match(/[.!?]+(?:\s|$)/g) || [];
    if (terminators.length <= 1 && line.length > 10) single++;
  }
  const ratio = single / lines.length;
  if (ratio > 0.85) {
    return [
      {
        type: "line_per_thought",
        text: `${Math.round(ratio * 100)}% single-sentence lines`,
        suggestion:
          "Develop your thoughts into paragraphs instead of stacking one-liners. This structure is a hallmark of AI-generated content.",
        severity: "warning",
      },
    ];
  }
  return [];
}

// ============================================================================
// Scoring
// ============================================================================

export const ACCEPTABLE_THRESHOLD = 70;

const PENALTIES: Record<SlopViolationType, number> = {
  opener: 15,
  buzzword: 5,
  filler: 5,
  cringe: 10,
  structure: 10,
  emoji: 0, // handled specially below
  fabricated: 8,
  false_precision: 5,
  formulaic: 8,
  cliche: 10,
  overused_metaphor: 12,
  rhetorical: 6,
  unsourced_stat: 8,
  instant_promise: 10,
  bumper_sticker: 8,
  jargon_stack: 6,
  business_metaphor: 6,
  line_per_thought: 15,
  absolute_claim: 8,
};

export function calculateScore(violations: SlopViolation[]): number {
  let penalty = 0;
  for (const v of violations) {
    if (v.type === "emoji") {
      const m = v.text.match(/(\d+) emojis/);
      if (m) penalty += (parseInt(m[1], 10) - 2) * 5;
    } else {
      penalty += PENALTIES[v.type] ?? 0;
    }
  }
  return Math.max(0, 100 - penalty);
}

// ============================================================================
// Filter (strips fillers + cringe from content)
// ============================================================================

function generateFilteredContent(
  content: string,
  violations: SlopViolation[],
): string {
  let filtered = content;
  for (const v of violations.filter((x) => x.type === "filler")) {
    filtered = filtered.replace(
      new RegExp(`\\b${escapeRegex(v.text)}\\b\\s*`, "gi"),
      "",
    );
  }
  for (const v of violations.filter((x) => x.type === "cringe")) {
    filtered = filtered.replace(
      new RegExp(
        `(?:\\s|^)${escapeRegex(v.text.trim())}(?:\\s|$|[.!,;:])`,
        "gi",
      ),
      " ",
    );
  }
  return filtered
    .replace(/  +/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ============================================================================
// Main entry point
// ============================================================================

export function analyzeContent(content: string): SlopAnalysis {
  if (!content || content.trim().length === 0) {
    return {
      score: 100,
      violations: [],
      filteredContent: "",
      isAcceptable: true,
    };
  }

  const violations: SlopViolation[] = [
    ...detectOpenerCrimes(content),
    ...detectBuzzwords(content),
    ...detectFillerPhrases(content),
    ...detectCringePhrases(content),
    ...detectStructuralIssues(content),
    ...detectEmojiOveruse(content),
    ...detectFabricatedAnecdotes(content),
    ...detectByPatterns(
      content,
      "false_precision",
      "warning",
      FALSE_PRECISION_PATTERNS,
    ),
    ...detectByPatterns(
      content,
      "formulaic",
      "warning",
      FORMULAIC_PIVOT_PATTERNS,
    ),
    ...detectByPatterns(
      content,
      "cliche",
      "error",
      THOUGHT_TERMINATING_CLICHES,
    ),
    ...detectByPatterns(
      content,
      "overused_metaphor",
      "error",
      OVERUSED_METAPHORS,
    ),
    ...detectByPatterns(
      content,
      "rhetorical",
      "warning",
      RHETORICAL_QUESTION_PATTERNS,
    ),
    ...detectByPatterns(
      content,
      "unsourced_stat",
      "warning",
      UNSOURCED_STATISTICS_PATTERNS,
    ),
    ...detectByPatterns(
      content,
      "instant_promise",
      "error",
      INSTANT_TRANSFORMATION_PATTERNS,
    ),
    ...detectByPatterns(
      content,
      "bumper_sticker",
      "warning",
      BUMPER_STICKER_ENDINGS,
    ),
    ...detectByPatterns(
      content,
      "jargon_stack",
      "warning",
      JARGON_STACKING_PATTERNS,
    ),
    ...detectByPatterns(
      content,
      "business_metaphor",
      "warning",
      OVERUSED_BUSINESS_METAPHORS,
    ),
    ...detectLinePerThought(content),
    ...detectByPatterns(
      content,
      "absolute_claim",
      "warning",
      ABSOLUTE_CLAIM_PATTERNS,
    ),
  ];

  const score = calculateScore(violations);
  return {
    score,
    violations,
    filteredContent: generateFilteredContent(content, violations),
    isAcceptable: score >= ACCEPTABLE_THRESHOLD,
  };
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error(
      "Usage: anti-slop.ts <file>   |   cat draft.md | anti-slop.ts -",
    );
    process.exit(2);
  }

  let content: string;
  if (arg === "-") {
    const chunks: Buffer[] = [];
    for await (const c of process.stdin) chunks.push(c as Buffer);
    content = Buffer.concat(chunks).toString("utf8");
  } else {
    content = await Bun.file(arg).text();
  }

  const result = analyzeContent(content);
  const verdict = result.isAcceptable ? "PASS" : "FAIL";
  console.log(
    `\nSCORE: ${result.score}/100 (${verdict}, threshold ${ACCEPTABLE_THRESHOLD})`,
  );
  console.log(`VIOLATIONS: ${result.violations.length}\n`);

  for (const v of result.violations) {
    const tag = v.severity === "error" ? "ERR" : "WRN";
    console.log(`  [${tag}] ${v.type.padEnd(20)} "${v.text.slice(0, 80)}"`);
    console.log(`        → ${v.suggestion}`);
  }

  process.exit(result.isAcceptable ? 0 : 1);
}

if (import.meta.main) {
  main();
}
