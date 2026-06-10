export const meta = {
  name: "design-review",
  description:
    "Visual polish audit after UI phases — a global static scan plus three design lenses (visual foundations, UX patterns + a11y, state coverage + delight) over every route, critical/high findings adversarially verified, one prioritized report.",
  whenToUse:
    "After a UI phase completes (CLAUDE.md note 20) or before /pre-ship on UI-heavy work. The design skills are already factored into lenses; this runs them per-route instead of one context skimming the whole app. Pass { page: '/dashboard' } to scope to one route, { maxRoutes: 20 } to widen the cap.",
  phases: [
    {
      title: "Inventory",
      detail:
        "enumerate routes + read DESIGN.md; global static scan runs alongside",
    },
    {
      title: "Review",
      detail: "route × lens pipeline — visual, patterns+a11y, states+delight",
    },
    {
      title: "Verify",
      detail: "adversarial check on critical/high findings only",
    },
    {
      title: "Report",
      detail:
        "deduped, prioritized report written to progress/design-review-report.md",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Why this exists
//
// /design-review is a single context walking every screen with every concern at
// once — by route five it's pattern-matching, not looking. The design skills are
// already factored into lenses (visual-design, ui-patterns, design-craft), which
// maps directly onto a route × lens fan-out:
//
//   1. Each route gets fresh eyes per lens — state coverage on the last route is
//      checked as carefully as hierarchy on the first.
//   2. The route cap is LOGGED, never silent (no-silent-caps rule): skipped
//      routes are named in the report instead of reading as "covered".
//   3. Critical/high findings face a skeptic before they reach the punch list;
//      medium/low (most polish items) pass through marked unverified.
//
// Invoke:  Workflow({ name: 'design-review' })
//          Workflow({ name: 'design-review', args: { page: '/dashboard' } })
// ─────────────────────────────────────────────────────────────────────────────

const ROUTE_CAP = args?.maxRoutes ?? 12;

// ── Schemas ──

const INVENTORY_SCHEMA = {
  type: "object",
  required: ["routes", "designSystem"],
  properties: {
    routes: {
      type: "array",
      items: {
        type: "object",
        required: ["route", "file"],
        properties: {
          route: { type: "string", description: 'URL path, e.g. "/dashboard"' },
          file: { type: "string", description: "page/screen source file" },
        },
      },
    },
    designSystem: {
      type: ["string", "null"],
      description: "Path to specs/design/DESIGN.md if it exists, else null",
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
        required: ["title", "severity", "route", "file", "detail", "fix"],
        properties: {
          title: { type: "string" },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description:
              "critical = blocks ship (broken/unusable); high = fix before ship; medium = fix soon; low = polish",
          },
          route: {
            type: "string",
            description: 'Route, or "global" for app-wide issues',
          },
          file: { type: "string" },
          detail: { type: "string" },
          fix: { type: "string" },
        },
      },
    },
    delight: {
      type: "array",
      items: { type: "string" },
      description:
        'Optional polish opportunities, e.g. "empty state on /dashboard could use an illustration"',
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

// ── Deterministic helpers ──

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

function dedupe(findings) {
  const seen = new Map();
  for (const f of findings) {
    const key = (f.route + "::" + f.file + "::" + f.title)
      .toLowerCase()
      .replace(/[^a-z0-9:]+/g, "-");
    if (!seen.has(key)) seen.set(key, f);
  }
  return [...seen.values()].sort(
    (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity],
  );
}

function shortLabel(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
}

// ── Inventory + global static scan (independent — run together) ──

phase("Inventory");

const pageFilter = args?.page
  ? `Only include the route matching "${args.page}".`
  : "";

const [inventory, staticScan] = await parallel([
  () =>
    agent(
      `Enumerate every user-facing route/screen in this app (Next.js app/ or pages/, or the
framework's equivalent) with its source file. Skip API routes and pure layouts. ${pageFilter}
Also report whether specs/design/DESIGN.md exists. Read-only; list, don't review.`,
      { label: "inventory", phase: "Inventory", schema: INVENTORY_SCHEMA },
    ),
  () =>
    agent(
      `GLOBAL STATIC design scan (grep-level, whole src/ tree — route-independent). Find:
- hardcoded colors in components (hex/rgb/hsl literals, raw Tailwind grays like text-gray-500)
  where semantic tokens (text-muted-foreground, bg-background) should be used,
- non-scale spacing (arbitrary values, odd one-off paddings) vs a consistent spacing scale,
- string-concatenated Tailwind class names instead of cn(),
- <img> without alt, inputs without labels, buttons without accessible names,
- animations without prefers-reduced-motion / motion-reduce handling.
Use route "global". Read-only.`,
      { label: "static-scan", phase: "Inventory", schema: FINDINGS_SCHEMA },
    ),
]);

if (!inventory || !inventory.routes.length) {
  log("No routes found — nothing to review.");
  return { routes: 0, findings: dedupe(staticScan?.findings ?? []) };
}

const routes = inventory.routes.slice(0, ROUTE_CAP);
const droppedRoutes = inventory.routes.slice(ROUTE_CAP).map((r) => r.route);
if (droppedRoutes.length)
  log(
    `Route cap ${ROUTE_CAP}: reviewing ${routes.length}, SKIPPING ${droppedRoutes.length}: ${droppedRoutes.join(", ")} — re-run with { maxRoutes } or { page } to cover them.`,
  );

const designRef = inventory.designSystem
  ? `Read ${inventory.designSystem} first — it is the source of truth for colors, typography, and spacing.`
  : "No DESIGN.md exists — judge against the dominant pattern already in the codebase and flag inconsistency, not taste.";

// ── Review: route × lens pipeline ──

phase("Review");

const LENSES = [
  {
    key: "visual",
    brief: `LENS — VISUAL FOUNDATIONS (read .claude/skills/visual-design/SKILL.md). Judge: hierarchy
(squint test — is the primary action obvious?), typography scale and heading order, color token
usage and contrast, spacing-scale consistency, alignment/grid.`,
  },
  {
    key: "patterns",
    brief: `LENS — UX PATTERNS + ACCESSIBILITY (read .claude/skills/ui-patterns/SKILL.md). Judge:
Nielsen heuristics (feedback, undo, recognition over recall), form patterns (labels, inline
validation, error placement), table/list patterns, keyboard navigation and visible focus,
responsive behavior at 320/768/1440.`,
  },
  {
    key: "states",
    brief: `LENS — STATE COVERAGE + DELIGHT (read .claude/skills/design-craft/SKILL.md). For every
data surface on this route verify a DESIGNED state exists for: empty (not just blank), loading
(skeleton matching content shape, not "Loading..."), error (helpful, not scary), success feedback,
disabled, hover/focus. Missing empty/error states on a primary surface is "high". Also list
delight opportunities in the delight array.`,
  },
];

const pairs = routes.flatMap((r) => LENSES.map((l) => ({ r, l })));

const reviews = (
  await pipeline(pairs, ({ r, l }) =>
    agent(
      `${l.brief}

${designRef}

Review EXACTLY ONE route: ${r.route} (source: ${r.file}). Read the page file and the components it
renders. Findings must be concrete — name the element and the fix, never "could be better".
Severity honestly: most polish findings are medium/low; reserve critical for broken/unusable.
Read-only. At most 8 findings — strongest only.`,
      {
        label: `${l.key}:${r.route}`,
        phase: "Review",
        schema: FINDINGS_SCHEMA,
      },
    ),
  )
).filter(Boolean);

const allFindings = dedupe([
  ...(staticScan?.findings ?? []),
  ...reviews.flatMap((r) => r.findings),
]);
const delight = [...new Set(reviews.flatMap((r) => r.delight ?? []))];

// ── Verify critical/high only; medium/low pass through unverified ──

phase("Verify");

const toVerify = allFindings.filter(
  (f) => f.severity === "critical" || f.severity === "high",
);
const passthrough = allFindings.filter(
  (f) => f.severity !== "critical" && f.severity !== "high",
);
log(
  `Review: ${allFindings.length} unique finding(s); verifying ${toVerify.length} critical/high; ${passthrough.length} medium/low pass through unverified.`,
);

const judged = (
  await parallel(
    toVerify.map(
      (f) => () =>
        agent(
          `Adversarially verify this ${f.severity} design finding — try to REFUTE it.

${f.title} — route ${f.route}, file ${f.file}
Claim: ${f.detail}
Proposed fix: ${f.fix}

Read the actual code. refuted=true if the claim misreads the code (e.g. the state IS handled, the
token IS semantic, the label exists in a wrapper) or the severity is inflated (real impact is
polish, not ship-blocking). Default to refuted=true when uncertain.`,
          {
            label: `verify:${shortLabel(f.title)}`,
            phase: "Verify",
            schema: VERDICT_SCHEMA,
          },
        ).then((v) => ({ ...f, confirmed: !!v && !v.refuted })),
    ),
  )
).filter(Boolean);

const confirmed = judged.filter((f) => f.confirmed);
const refuted = judged.filter((f) => !f.confirmed);

// ── Report ──

phase("Report");

const report = await agent(
  `Write the design review report to progress/design-review-report.md using the exact template in
.claude/commands/design-review.md ("Output Report" — summary table by category, issues grouped
Critical/High/Medium/Low, Delight Opportunities). Date via \`date\`. Overwrite any prior report.

Data:
- Routes reviewed: ${JSON.stringify(routes.map((r) => r.route))}
- Routes SKIPPED by cap (state this explicitly — they are NOT covered): ${JSON.stringify(droppedRoutes)}
- Confirmed critical/high: ${JSON.stringify(confirmed)}
- Refuted by verification (do NOT action): ${JSON.stringify(refuted.map((f) => f.title))}
- Unverified medium/low: ${JSON.stringify(passthrough)}
- Delight opportunities: ${JSON.stringify(delight)}

End with the next action: confirmed criticals block ship; otherwise list the high items as the
pre-ship polish punch list.`,
  { label: "report", phase: "Report" },
);

return {
  routesReviewed: routes.map((r) => r.route),
  routesSkipped: droppedRoutes,
  critical: confirmed.filter((f) => f.severity === "critical"),
  high: confirmed.filter((f) => f.severity === "high"),
  mediumLowUnverified: passthrough.length,
  refuted: refuted.map((f) => f.title),
  delight,
  reportFile: "progress/design-review-report.md",
  report,
};
