export const meta = {
  name: "review-ticket",
  description:
    "Multi-lens diff review — correctness, security, type discipline, conventions, and test meaningfulness review the same diff independently; every finding is adversarially verified before it reaches the punch list.",
  whenToUse:
    "After a ticket commit or before human PR review. One reviewer context blurs lenses; this runs five specialists and kills plausible-but-wrong findings. Pass { pr: 123 } to review a GitHub PR, { range: 'abc..def' } for an explicit range, { post: true } to post confirmed findings as PR comments.",
  phases: [
    { title: "Scope", detail: "resolve the diff range and changed files" },
    {
      title: "Review",
      detail:
        "five lens agents over the same diff, pipelined into verification",
    },
    {
      title: "Verify",
      detail: "one adversarial skeptic per finding — uncertain findings die",
    },
    {
      title: "Report",
      detail: "prioritized punch list; optional PR comments (never approve)",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Why this exists
//
// The `reviewer` agent is one context with one perspective; the hook layer only
// WARNS on security-sensitive paths, it doesn't review them. This workflow makes
// the review multi-lens and self-skeptical:
//
//   1. Five lenses the harness already cares about, each as its own agent:
//      correctness (incl. the Vercel/serverless pitfalls), security, TYPE
//      DISCIPLINE (the #1 integration-bug source per CLAUDE.md), conventions
//      (progress/conventions.md + compressed skill rules), and test
//      meaningfulness (the banned expect(true).toBe(true) class).
//   2. pipeline(): each lens's findings go to verification the moment that lens
//      finishes — no barrier waiting on the slowest lens.
//   3. Every finding faces a skeptic prompted to refute, defaulting to refuted
//      when uncertain. Review noise is what makes humans ignore reviews.
//   4. Posting is opt-in and comment-only — approval/merge stays human.
//
// Invoke:  Workflow({ name: 'review-ticket' })                      — merge-base..HEAD
//          Workflow({ name: 'review-ticket', args: { pr: 123, post: true } })
//          Workflow({ name: 'review-ticket', args: { range: 'main..HEAD' } })
// ─────────────────────────────────────────────────────────────────────────────

// ── Schemas ──

const SCOPE_SCHEMA = {
  type: "object",
  required: ["range", "files", "summary"],
  properties: {
    range: {
      type: "string",
      description:
        'The git range reviewed (e.g. "abc123..HEAD"), or "WORKTREE" for uncommitted changes',
    },
    ticket: {
      type: ["string", "null"],
      description: "[PN-TXXX] id from the latest commit message, if present",
    },
    pr: { type: ["number", "null"] },
    files: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "changeKind"],
        properties: {
          path: { type: "string" },
          changeKind: {
            type: "string",
            enum: ["added", "modified", "deleted", "renamed"],
          },
        },
      },
    },
    summary: {
      type: "string",
      description: "One paragraph: what this change does",
    },
  },
};

const FINDINGS_SCHEMA = {
  type: "object",
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "severity", "file", "line", "detail", "fix"],
        properties: {
          title: { type: "string" },
          severity: {
            type: "string",
            enum: ["blocking", "important", "suggestion"],
          },
          file: { type: "string" },
          line: { type: ["number", "null"] },
          detail: {
            type: "string",
            description: "What is wrong and why it matters",
          },
          fix: { type: "string" },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: "object",
  required: ["refuted", "reasoning"],
  properties: {
    refuted: { type: "boolean" },
    reasoning: { type: "string" },
  },
};

const SEV_RANK = { blocking: 0, important: 1, suggestion: 2 };

function shortLabel(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
}

// ── Scope ──

phase("Scope");

const scopeHint = args?.pr
  ? `Review GitHub PR #${args.pr}: use \`gh pr view ${args.pr}\` and \`gh pr diff ${args.pr}\` to get its diff and head/base.`
  : args?.range
    ? `Review the explicit git range: ${args.range}.`
    : `No range given — default scope: the diff from the merge-base with the default branch to HEAD
(\`git merge-base origin/main HEAD\` — fall back to main, then master). If HEAD is not ahead of the
merge-base, review uncommitted work instead (\`git diff HEAD\` plus staged) and set range "WORKTREE".`;

const scope = await agent(
  `Resolve the review scope. ${scopeHint}
List every changed file with its change kind, extract the [PN-TXXX] ticket id from the latest
commit message if present, and summarize what the change does in one paragraph. Do not review
anything yet; do not modify anything.`,
  { label: "scope", phase: "Scope", schema: SCOPE_SCHEMA },
);

if (!scope || !scope.files.length) {
  log("Empty diff — nothing to review.");
  return { scope, confirmed: [], note: "empty diff" };
}
log(
  `Reviewing ${scope.range}${scope.ticket ? ` (${scope.ticket})` : ""}: ${scope.files.length} file(s).`,
);

const scopeBlock = `SCOPE (already resolved — review exactly this, nothing else):
Range: ${scope.range}${scope.pr ? ` (PR #${scope.pr})` : ""}
Changed files:
${scope.files.map((f) => `- ${f.path} (${f.changeKind})`).join("\n")}
Change summary: ${scope.summary}

Get the diff with \`git diff ${scope.range === "WORKTREE" ? "HEAD" : scope.range}\`${scope.pr ? ` or \`gh pr diff ${scope.pr}\`` : ""}.
Read surrounding code for context, but only the DIFF is in scope for findings. You are read-only.
Report at most your 10 strongest findings — a flooded review is an ignored review.`;

// ── Lenses ──

const LENSES = [
  {
    key: "correctness",
    prompt: `${scopeBlock}

LENS — CORRECTNESS. Hunt for: logic bugs, unhandled edge cases (null/empty/concurrent), swallowed
errors (catch-and-return-null violates the harness "fail loudly" rule), async/await mistakes,
off-by-one and ordering bugs. Also check the CLAUDE.md serverless pitfalls verbatim: cron route
handlers must export GET; no module-level state assumed to persist across requests; Drizzle batch
inserts must pass explicit UUIDs.`,
  },
  {
    key: "security",
    prompt: `${scopeBlock}

LENS — SECURITY. Hunt for: missing auth checks on new/changed routes and server actions, request
input used without zod/schema validation, secrets or tokens in the diff, injection (SQL/command/
path), IDOR (ids accepted without ownership checks), and webhook handlers that JSON-parse the body
before signature verification (Stripe must use raw text).`,
  },
  {
    key: "types",
    prompt: `${scopeBlock}

LENS — TYPE DISCIPLINE (CLAUDE.md "Import, Don't Reinvent"). For EVERY interface, type alias, or
Zod schema declared in this diff: grep lib/**/types.ts, lib/**/schemas.ts, and the latest
specs/phases/PHASE-*-type-manifest.md for an existing type covering the same concept (singular,
plural, synonyms). Flag as blocking: a redeclaration of an existing canonical type; an API-route
Zod schema written by hand instead of derived via .pick()/.omit()/.extend(); a component prop
interface duplicating a shared type instead of importing it; a new domain type defined inline in a
route/component instead of lib/<module>/types.ts.`,
  },
  {
    key: "conventions",
    prompt: `${scopeBlock}

LENS — CONVENTIONS. Read progress/conventions.md (if present) and the "Compressed Skill Rules" in
CLAUDE.md, then flag violations in the diff: string-concatenated Tailwind classes instead of cn();
raw color utilities instead of semantic tokens; console.log instead of structured pino logging;
tRPC init without superjson; a THIRD pattern introduced where the codebase already has two (error
formats, date utils, auth helpers); speculative abstractions the ticket didn't need; drive-by
refactors unrelated to the ticket.`,
  },
  {
    key: "tests",
    prompt: `${scopeBlock}

LENS — TEST MEANINGFULNESS. Check: every behavior change in the diff has a test asserting the
actual requirement; flag banned meaningless assertions (expect(true).toBe(true),
expect(x).toBeDefined() as the only assertion, snapshot-only tests of logic); MSW setups without
onUnhandledRequest: "error"; tests that mock the very unit under test. A changed code path with NO
test at all is "important", a meaningless test pretending to cover it is "blocking".`,
  },
];

// ── Review → Verify (pipeline: each lens verifies as soon as it returns) ──

phase("Review");

const verified = (
  await pipeline(
    LENSES,
    (l) =>
      agent(l.prompt, {
        label: `review:${l.key}`,
        phase: "Review",
        schema: FINDINGS_SCHEMA,
      }),
    async (rev, l) => {
      if (!rev) return [];
      const judged = await parallel(
        rev.findings.map(
          (f) => () =>
            agent(
              `Adversarially verify this code-review finding from the "${l.key}" lens. Try to REFUTE it.

Finding: ${f.title} (${f.severity})
Location: ${f.file}${f.line ? `:${f.line}` : ""}
Claim: ${f.detail}
Proposed fix: ${f.fix}

Read the actual file and the diff (\`git diff ${scope.range === "WORKTREE" ? "HEAD" : scope.range}\`).
refuted=true if: the issue does not exist in the code as written, it is already handled elsewhere,
the cited line is not part of this diff, or the claim misreads the code. Default to refuted=true
when uncertain — a noisy review is an ignored review.`,
              {
                label: `verify:${shortLabel(f.title)}`,
                phase: "Verify",
                schema: VERDICT_SCHEMA,
              },
            ).then((v) => ({ ...f, lens: l.key, verdict: v })),
        ),
      );
      return judged.filter(Boolean);
    },
  )
)
  .filter(Boolean)
  .flat();

const confirmed = verified
  .filter((f) => f.verdict && !f.verdict.refuted)
  .sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
const dropped = verified.filter((f) => !f.verdict || f.verdict.refuted);
log(
  `Verify: ${confirmed.length} confirmed (${confirmed.filter((f) => f.severity === "blocking").length} blocking), ${dropped.length} refuted/dropped.`,
);

// ── Report (and optional PR comments — comment-only, never approve) ──

phase("Report");

if (args?.post && (scope.pr ?? args?.pr)) {
  const pr = scope.pr ?? args.pr;
  await agent(
    `Post these CONFIRMED review findings as comments on PR #${pr} using \`gh\` (inline file/line
comments where line is known, a single summary review comment otherwise). Group by severity.
You comment ONLY — NEVER approve, request changes, or merge; a human does that.

${JSON.stringify(confirmed)}`,
    { label: "post-comments", phase: "Report", agentType: "reviewer" },
  );
  log(`Posted ${confirmed.length} comment(s) to PR #${pr}.`);
}

const punchList = confirmed.map(
  (f) =>
    `[${f.severity}/${f.lens}] ${f.file}${f.line ? `:${f.line}` : ""} — ${f.title}: ${f.fix}`,
);

return {
  scope: {
    range: scope.range,
    ticket: scope.ticket,
    pr: scope.pr,
    files: scope.files.length,
  },
  blocking: confirmed.filter((f) => f.severity === "blocking"),
  important: confirmed.filter((f) => f.severity === "important"),
  suggestions: confirmed.filter((f) => f.severity === "suggestion"),
  punchList,
  droppedAsRefuted: dropped.map((f) => f.title),
};
