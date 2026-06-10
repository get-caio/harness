export const meta = {
  name: "phase-gate",
  description:
    "Phase-boundary gate — auditor, product-critic, and code-audit fan out in parallel, findings are adversarially verified, the type manifest is generated, and a zero-behavior refactor pass lands. Confirmed criticals block /init-phase N+1.",
  whenToUse:
    "Every ticket in the current phase is DONE and the next phase has not been initialized. Replaces the remembered 4-step checklist the CURRENT_PHASE hook echoes (auditor, product-critic, refactorer, /audit) and the mandatory /audit types manifest.",
  phases: [
    {
      title: "Inspect",
      detail: "auditor + product-critic + code-audit, read-only, in parallel",
    },
    {
      title: "Verify",
      detail: "adversarial verification of every critical/high finding",
    },
    {
      title: "Manifest",
      detail:
        "generate specs/phases/PHASE-N-type-manifest.md (mandatory before /init-phase N+1) — runs concurrently with Verify",
    },
    {
      title: "Cleanup",
      detail: "refactorer applies confirmed zero-behavior cleanups, test-gated",
    },
    { title: "Report", detail: "gate verdict + punch list + build-log entry" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Why this exists
//
// The CURRENT_PHASE hook only ECHOES a 4-step checklist (spawn auditor, spawn
// product-critic, spawn refactorer, run /audit) — exactly the remembered-not-
// structural failure mode coordinate-phase was built to kill. This workflow makes
// the phase boundary structural:
//
//   1. The three read-only inspectors always run, always in parallel, and their
//      findings are deduped across lenses before anything acts on them.
//   2. Every critical/high finding is adversarially verified (criticals by a
//      3-skeptic majority) so plausible-but-wrong findings don't become tickets.
//   3. The type manifest — mandatory before /init-phase N+1 per CLAUDE.md, but
//      previously enforced by nothing — is generated unconditionally.
//   4. The refactorer runs LAST, only against confirmed cleanup findings, and
//      only commits on a green gate. Inspections never read mid-refactor code.
//   5. The verdict is computed in code: confirmed criticals (or high
//      security/correctness) ⇒ gate "fail" ⇒ do not start the next phase.
//
// Invoke:  Workflow({ name: 'phase-gate' })            — phase from specs/CURRENT_PHASE
//          Workflow({ name: 'phase-gate', args: { phase: 2 } })
// ─────────────────────────────────────────────────────────────────────────────

const phaseRef =
  args?.phase != null
    ? `Phase ${args.phase}`
    : "the phase named in specs/CURRENT_PHASE";

// ── Schemas ──

const CATEGORIES = [
  "security",
  "correctness",
  "product-flow",
  "ux",
  "performance",
  "observability",
  "error-handling",
  "dead-code",
  "duplication",
  "naming",
  "consistency",
  "types",
  "testing",
  "docs",
];

// Zero-behavior categories the refactorer is allowed to act on. Everything else
// (bugs, security, product issues) goes to humans/tickets — never auto-fixed here.
const CLEANUP_CATEGORIES = [
  "dead-code",
  "duplication",
  "naming",
  "consistency",
];

const FINDINGS_SCHEMA = {
  type: "object",
  required: ["findings"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "severity", "category", "file", "detail", "fix"],
        properties: {
          title: { type: "string", description: "One-line, specific, unique" },
          severity: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
          },
          category: { type: "string", enum: CATEGORIES },
          file: {
            type: "string",
            description:
              'Primary file or route, e.g. "src/app/api/health/route.ts". Use "product" for flow-level findings with no single file.',
          },
          detail: {
            type: "string",
            description: "What is wrong, with evidence",
          },
          fix: { type: "string", description: "Concrete remediation" },
        },
      },
    },
  },
};

const VERDICT_SCHEMA = {
  type: "object",
  required: ["refuted", "reasoning"],
  properties: {
    refuted: {
      type: "boolean",
      description:
        "true if the finding does not reproduce, is already handled, or its severity is inflated",
    },
    reasoning: {
      type: "string",
      description: "One or two sentences of evidence",
    },
  },
};

const MANIFEST_SCHEMA = {
  type: "object",
  required: ["path", "exportCount"],
  properties: {
    path: { type: "string", description: "Manifest file written" },
    exportCount: {
      type: "number",
      description: "Total exported types/schemas listed",
    },
    modules: { type: "array", items: { type: "string" } },
  },
};

const CLEANUP_SCHEMA = {
  type: "object",
  required: ["status", "itemsFixed", "notes"],
  properties: {
    status: { type: "string", enum: ["applied", "clean", "failed", "skipped"] },
    commit: {
      type: ["string", "null"],
      description: "Commit sha if applied, else null",
    },
    itemsFixed: { type: "number" },
    notes: { type: "string" },
  },
};

// ── Deterministic helpers ──

const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3 };

// Exact-ish dedupe across the three lenses. Differently-worded duplicates survive
// this (the report agent merges those narratively); the point is that the SAME
// finding surfaced by two inspectors is verified once, not twice.
function dedupe(findings) {
  const seen = new Map();
  for (const f of findings) {
    const key = (f.file + "::" + f.title)
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

// ── Inspect: three read-only lenses in parallel ──
// Barrier is correct here: dedupe needs ALL findings before verification starts.

phase("Inspect");

const READ_ONLY_RULES = `You are READ-ONLY for this run: report, do not fix, do not write files.
Return every finding in the schema. Severity honestly — "critical" means ship-blocking.`;

const INSPECTORS = [
  {
    key: "audit",
    agentType: "auditor",
    prompt: `Run your full between-phases product audit for ${phaseRef}.
Walk every route, API endpoint, DB table, and UI flow. Hunt specifically for: dead endpoints,
schema-without-UI, UI-without-API, missing/inconsistent error handling, silent failure paths
(caught-and-swallowed errors, returns of null on error), missing observability (health check
that doesn't hit the DB, console.log instead of pino), and pattern inconsistencies.
${READ_ONLY_RULES}`,
  },
  {
    key: "product",
    agentType: "product-critic",
    prompt: `Run your product quality critique for ${phaseRef}.
Read specs/SPEC.md, the phase file in specs/phases/, and the UI code. Hunt specifically for:
flows that don't make sense for a human, spec drift (built ≠ specced), onboarding that collects
data nothing uses, three clicks where one would do, and "technically correct but nobody would
use this". Use category "product-flow" or "ux" for these.
${READ_ONLY_RULES}`,
  },
  {
    key: "code",
    agentType: null,
    prompt: `Read .claude/skills/code-audit/SKILL.md and run the quick-scan portion against this
repo for ${phaseRef}: hardcoded secrets, dependency vulnerabilities (\`bun audit\` or
\`npm audit\`), unvalidated input (req.body used without zod/schema parse), missing auth checks
on protected routes, and complexity hotspots (files > 400 lines, functions > 40 lines).
${READ_ONLY_RULES}`,
  },
];

const inspections = (
  await parallel(
    INSPECTORS.map(
      (ins) => () =>
        agent(ins.prompt, {
          label: `inspect:${ins.key}`,
          phase: "Inspect",
          schema: FINDINGS_SCHEMA,
          ...(ins.agentType ? { agentType: ins.agentType } : {}),
        }),
    ),
  )
).filter(Boolean);

const allFindings = dedupe(inspections.flatMap((r) => r.findings));
const toVerify = allFindings.filter(
  (f) => f.severity === "critical" || f.severity === "high",
);
const passthrough = allFindings.filter(
  (f) => f.severity !== "critical" && f.severity !== "high",
);
log(
  `Inspect: ${allFindings.length} unique finding(s) across ${inspections.length} lens(es); ` +
    `verifying ${toVerify.length} critical/high; ${passthrough.length} medium/low pass through UNVERIFIED.`,
);

// ── Verify (adversarial) + Manifest (independent) — concurrently ──
// Criticals get a 3-skeptic majority; highs a single skeptic. The manifest does not
// depend on findings, so it runs alongside instead of waiting.

phase("Verify");

async function verdictFor(f) {
  const n = f.severity === "critical" ? 3 : 1;
  const votes = (
    await parallel(
      Array.from(
        { length: n },
        (_, i) => () =>
          agent(
            `You are skeptic ${i + 1} of ${n}. Try to REFUTE this ${f.severity} phase-gate finding:

Title: ${f.title}
File/route: ${f.file}
Category: ${f.category}
Claim: ${f.detail}
Proposed fix: ${f.fix}

Re-check the ACTUAL code with Read/Grep/Bash — do not trust the claim. Set refuted=true if it
does not reproduce, is already handled elsewhere, or the real severity is medium/low rather
than ${f.severity}. Default to refuted=true when uncertain.`,
            {
              label: `verify:${shortLabel(f.title)}`,
              phase: "Verify",
              schema: VERDICT_SCHEMA,
            },
          ),
      ),
    )
  ).filter(Boolean);
  const refutedVotes = votes.filter((v) => v.refuted).length;
  // Majority rule for criticals; a single confirming skeptic is enough for highs.
  const confirmed =
    votes.length > 0 && (n === 3 ? refutedVotes <= 1 : refutedVotes === 0);
  return { ...f, confirmed, votes: votes.length, refutedVotes };
}

const [verifiedHighs, manifest] = await parallel([
  () => parallel(toVerify.map((f) => () => verdictFor(f))),
  () =>
    agent(
      `Generate the type manifest for ${phaseRef} — the "/audit types" procedure from
.claude/commands/audit.md (§3a). Read specs/CURRENT_PHASE, then enumerate EVERY exported type,
interface, type alias, and Zod schema in lib/**/types.ts, lib/**/schemas.ts, the DB schema
(prisma/schema.prisma or lib/db/schema.ts), and the source tree. Write
specs/phases/PHASE-N-type-manifest.md (N = current phase) listing each export with its module
path and a one-line shape summary, so the next phase imports instead of reinventing.
Write ONLY that manifest file. Report its path and export count.`,
      { label: "type-manifest", phase: "Manifest", schema: MANIFEST_SCHEMA },
    ),
]);

const confirmed = (verifiedHighs ?? [])
  .filter(Boolean)
  .filter((f) => f.confirmed);
const refuted = (verifiedHighs ?? [])
  .filter(Boolean)
  .filter((f) => !f.confirmed);
log(
  `Verify: ${confirmed.length} confirmed, ${refuted.length} refuted. ` +
    (manifest
      ? `Manifest: ${manifest.path} (${manifest.exportCount} exports).`
      : "Manifest agent returned nothing — generate it manually with /audit types."),
);

// ── Cleanup: refactorer, confirmed zero-behavior findings only, AFTER all reads ──

phase("Cleanup");

const cleanupItems = [...confirmed, ...passthrough].filter((f) =>
  CLEANUP_CATEGORIES.includes(f.category),
);

let cleanup = {
  status: "skipped",
  commit: null,
  itemsFixed: 0,
  notes: "no cleanup findings",
};
if (cleanupItems.length) {
  cleanup =
    (await agent(
      `Apply ONLY the following zero-behavior cleanup findings from the ${phaseRef} gate.
Each must change how code is organized, never what the product does. If one turns out to be
behavioral, SKIP it and say so in notes.

${cleanupItems.map((f) => `- [${f.severity}/${f.category}] ${f.title} — ${f.file}: ${f.fix}`).join("\n")}

Before committing, run whichever quality-gate scripts this repo defines in package.json
(\`npm run typecheck\` / \`npm test\` / \`npm run lint\` — check the scripts block first; a
missing script is N/A). Commit exactly once on a GREEN gate with message
"refactor(phase-gate): <summary>". On a red gate, revert your changes and return status
"failed" with the failing output in notes.`,
      {
        label: "cleanup",
        phase: "Cleanup",
        agentType: "refactorer",
        schema: CLEANUP_SCHEMA,
      },
    )) ?? cleanup;
} else {
  log(
    "Cleanup: no dead-code/duplication/naming/consistency findings — skipping refactorer.",
  );
}

// ── Verdict (code, not judgment) + Report ──

const blockers = confirmed.filter(
  (f) =>
    f.severity === "critical" ||
    (f.severity === "high" &&
      (f.category === "security" || f.category === "correctness")),
);
const gate = blockers.length ? "fail" : "pass";

phase("Report");
const report = await agent(
  `Write the ${phaseRef} gate report and append a one-paragraph summary to progress/build-log.md
(get today's date via the \`date\` command). Merge any near-duplicate findings narratively.

Data:
- GATE VERDICT: ${gate.toUpperCase()}${blockers.length ? ` — ${blockers.length} blocker(s)` : ""}
- Blockers (confirmed critical / high security|correctness): ${JSON.stringify(blockers)}
- Other confirmed findings: ${JSON.stringify(confirmed.filter((f) => !blockers.includes(f)))}
- Refuted by skeptics (do NOT action): ${JSON.stringify(refuted.map((f) => f.title))}
- Unverified medium/low (triage at leisure): ${JSON.stringify(passthrough)}
- Type manifest: ${JSON.stringify(manifest)}
- Cleanup pass: ${JSON.stringify(cleanup)}

End with the next action: if the gate FAILED, list the blockers as tickets to fix before
/init-phase N+1; if it PASSED, state that the phase boundary is clear and /init-phase N+1 may run.`,
  { label: "report", phase: "Report" },
);

return {
  gate,
  blockers,
  confirmed,
  refuted: refuted.map((f) => f.title),
  unverified: passthrough,
  manifest,
  cleanup,
  report,
};
