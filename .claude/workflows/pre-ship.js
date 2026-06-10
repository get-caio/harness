export const meta = {
  name: "pre-ship",
  description:
    "Final gate before production — deployer, security, data-protection, observability, build, testing, rollback, environment, and docs lenses run in parallel; blockers are adversarially verified; the ship/no-ship verdict is computed in code.",
  whenToUse:
    "All phases complete, final /audit done, PR approved, human is about to deploy. Structural version of the /pre-ship checklist. Pass { quick: true } for hotfix mode, { appUrl: 'http://localhost:3000' } to include live red-team probes.",
  phases: [
    {
      title: "Checks",
      detail: "one agent per checklist category, fully parallel",
    },
    {
      title: "Confirm",
      detail:
        "2 adversarial verifiers per blocker — demoted only if BOTH refute",
    },
    {
      title: "Report",
      detail:
        "verdict computed in code; report written to progress/pre-ship-report.md",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Why this exists
//
// /pre-ship guards the "career-critical failures" table in CLAUDE.md, which makes
// it the worst place in the harness to depend on a single context remembering
// nine checklist sections. This workflow makes the gate structural:
//
//   1. Every category runs as its own agent with a forced pass/warn/fail schema —
//      a section can't be skimmed past, and a missing check is a visible null,
//      not a silent omission.
//   2. Blockers are verified by 2 independent skeptics, but ASYMMETRICALLY: a
//      blocker is demoted to warning only if BOTH refute it. False blockers cost
//      a human minutes; false ships cost an outage. We bias toward blocking.
//   3. The verdict is code: any surviving blocker ⇒ DO_NOT_SHIP. No narrative
//      judgment call at the end of a long context.
//
// Invoke:  Workflow({ name: 'pre-ship' })
//          Workflow({ name: 'pre-ship', args: { quick: true } })
//          Workflow({ name: 'pre-ship', args: { appUrl: 'http://localhost:3000' } })
// ─────────────────────────────────────────────────────────────────────────────

const QUICK = !!args?.quick;
const APP_URL = args?.appUrl ?? null;

// ── Schemas ──

const CHECK_SCHEMA = {
  type: "object",
  required: ["category", "status", "blockers", "warnings", "evidence"],
  properties: {
    category: { type: "string" },
    status: { type: "string", enum: ["pass", "warn", "fail"] },
    blockers: {
      type: "array",
      description: "Ship-stopping failures. Empty unless status is fail.",
      items: {
        type: "object",
        required: ["title", "detail", "remediation"],
        properties: {
          title: { type: "string" },
          detail: {
            type: "string",
            description: "What failed, with command output",
          },
          remediation: { type: "string", description: "Exactly what to do" },
        },
      },
    },
    warnings: {
      type: "array",
      items: {
        type: "object",
        required: ["title", "detail"],
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
        },
      },
    },
    evidence: {
      type: "string",
      description:
        "Commands run and the key output lines that justify the status",
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
        "true ONLY if you re-ran the evidence and the blocker does not hold",
    },
    reasoning: { type: "string" },
  },
};

const READ_RULES = `You verify configuration and code — you change NOTHING. Read-only plus
non-mutating commands. Include the commands you ran and their key output in "evidence".
Status: "fail" needs at least one blocker; "warn" for accepted-risk issues; "pass" only on real evidence.`;

// ── Lens definitions (aligned section-by-section with .claude/commands/pre-ship.md) ──

const LENSES = [
  {
    key: "infrastructure",
    quick: false,
    agentType: "deployer",
    prompt: `Run your full pre-deploy infrastructure check: pending/reversible migrations, env vars
referenced in code vs documented/configured, webhook URL registrations, cron job configs (and the
Vercel pitfall — cron routes MUST export GET), third-party service connectivity, build health.
${READ_RULES}`,
  },
  {
    key: "security",
    quick: true,
    agentType: null,
    prompt: `Pre-ship SECURITY check (career-ending if failed). Verify: no secrets in code or git
history (grep for key/secret/password assignments), .env not tracked (\`git ls-files\`),
dependencies clean (\`bun audit\` or \`npm audit --audit-level=high\` — critical/high are blockers),
auth present on all protected routes, input validation on every request-body read (req.body
without a zod/schema parse is a finding). ${READ_RULES}`,
  },
  {
    key: "data-protection",
    quick: false,
    agentType: null,
    prompt: `Pre-ship DATA PROTECTION check (legal risk). Read .claude/skills/data-protection/SKILL.md
first. Verify: no PII in log statements (names, emails, IPs), soft-delete (deletedAt) on user data
models, data export capability if GDPR applies, cookie consent if EU users, privacy policy link.
Blocker ONLY if the app clearly handles EU users and GDPR compliance is missing; otherwise warn.
${READ_RULES}`,
  },
  {
    key: "observability",
    quick: false,
    agentType: null,
    prompt: `Pre-ship OBSERVABILITY check (blind-debugging risk). Verify: health endpoint exists AND
actually queries the database (SELECT 1) returning 503 when degraded — an always-200 health route
is a finding; structured logging via pino (not console.log); error boundaries on pages; Sentry or
equivalent DSN configured; request-id tracing middleware. Missing observability is "warn" unless
the health endpoint lies (always-200), which is "fail". ${READ_RULES}`,
  },
  {
    key: "build",
    quick: true,
    agentType: null,
    prompt: `Pre-ship BUILD & PERFORMANCE check. Run the repo's build script (check package.json
scripts block first). Build failure = blocker. Also check: build warnings, initial JS bundle size
(<500KB target), obvious N+1 query patterns, unoptimized external images. Non-build-failure issues
are warnings. ${READ_RULES}`,
  },
  {
    key: "testing",
    quick: true,
    agentType: null,
    prompt: `Pre-ship TESTING check. Run the repo's test script with coverage if supported. Blockers:
any failing test; coverage below 40%; an untested critical path (auth, payments, the core feature).
Warnings: coverage 40–60%, missing edge-case coverage (error/empty states). Also run e2e tests if a
test:e2e script exists. ${READ_RULES}`,
  },
  {
    key: "rollback",
    quick: false,
    agentType: null,
    prompt: `Pre-ship ROLLBACK PLAN check (disaster recovery). Verify: a recent prod tag exists
(\`git tag -l "prod-*"\`), rollback procedure documented somewhere findable, database migrations
reversible (down migrations or documented restore), feature flags on risky features. No documented
rollback path for an irreversible migration = blocker; the rest are warnings. ${READ_RULES}`,
  },
  {
    key: "environment",
    quick: false,
    agentType: null,
    prompt: `Pre-ship ENVIRONMENT CONFIG check. Diff every process.env.* referenced in source against
.env.example — every referenced var must be documented. Check for development values that look like
they'd ship (localhost URLs in committed config). An env var used in code but absent from
.env.example is a blocker (silent prod failure); the rest are warnings. ${READ_RULES}`,
  },
  {
    key: "documentation",
    quick: false,
    agentType: null,
    prompt: `Pre-ship DOCUMENTATION check. Verify: README deployment instructions current, public API
documented if one exists, CHANGELOG has this release, known issues listed. Documentation gaps are
WARNINGS, never blockers — status at worst "warn". ${READ_RULES}`,
  },
];

if (APP_URL && !QUICK) {
  LENSES.push({
    key: "red-team",
    quick: false,
    agentType: null,
    prompt: `Pre-ship RED-TEAM probe against the running app at ${APP_URL}. Read
.claude/skills/red-team/SKILL.md first. Probe (non-destructively): auth bypass on protected routes,
IDOR on id-bearing endpoints, missing access control between users, basic injection on inputs.
Confirm the app is actually reachable first — if it is not, return status "warn" with a warning
saying red-team could not run, do NOT fabricate results. Any successful exploit = blocker.
${READ_RULES}`,
  });
}

const active = LENSES.filter((l) => !QUICK || l.quick);
const skipped = LENSES.filter((l) => QUICK && !l.quick).map((l) => l.key);
if (skipped.length)
  log(
    `Quick mode: running ${active.map((l) => l.key).join(", ")}; SKIPPING ${skipped.join(", ")} — hotfixes only.`,
  );

// ── Checks → per-lens blocker confirmation (pipeline: no barrier between lenses) ──

phase("Checks");

async function confirmBlocker(category, b) {
  const votes = (
    await parallel(
      Array.from(
        { length: 2 },
        (_, i) => () =>
          agent(
            `You are skeptic ${i + 1} of 2. Try to REFUTE this pre-ship BLOCKER from the
"${category}" check by re-running its evidence yourself:

Title: ${b.title}
Detail: ${b.detail}
Claimed remediation: ${b.remediation}

Re-run the relevant commands / re-read the relevant files. Set refuted=true ONLY if the evidence
does not hold (the check passes, the config exists, the test is green). If you cannot reproduce
the evidence either way, refuted=false — pre-ship bias is toward blocking.`,
            {
              label: `confirm:${category}`,
              phase: "Confirm",
              schema: VERDICT_SCHEMA,
            },
          ),
      ),
    )
  ).filter(Boolean);
  // Asymmetric rule: demote only on unanimous refutation. A lost verifier keeps the blocker.
  const demoted = votes.length === 2 && votes.every((v) => v.refuted);
  return {
    ...b,
    category,
    demoted,
    refutations: votes.filter((v) => v.refuted).length,
  };
}

const results = (
  await pipeline(
    active,
    (l) =>
      agent(l.prompt, {
        label: `check:${l.key}`,
        phase: "Checks",
        schema: CHECK_SCHEMA,
        ...(l.agentType ? { agentType: l.agentType } : {}),
      }),
    async (check, l) => {
      if (!check) return null;
      const confirmed = await parallel(
        check.blockers.map((b) => () => confirmBlocker(l.key, b)),
      );
      return { lens: l.key, check, blockers: confirmed.filter(Boolean) };
    },
  )
).filter(Boolean);

// ── Verdict — pure code ──

const confirmedBlockers = results.flatMap((r) =>
  r.blockers.filter((b) => !b.demoted),
);
const demotedBlockers = results.flatMap((r) =>
  r.blockers.filter((b) => b.demoted),
);
const warnings = results.flatMap((r) =>
  r.check.warnings.map((w) => ({ ...w, category: r.lens })),
);
const missing = active
  .filter((l) => !results.some((r) => r.lens === l.key))
  .map((l) => l.key);

// A check agent that died is an UNKNOWN, not a pass — unknowns block.
const decision = confirmedBlockers.length
  ? "DO_NOT_SHIP"
  : missing.length
    ? "DO_NOT_SHIP"
    : warnings.length || demotedBlockers.length
      ? "FIX_THEN_SHIP"
      : "SHIP";

log(
  `Verdict: ${decision} — ${confirmedBlockers.length} blocker(s), ${warnings.length} warning(s), ` +
    `${demotedBlockers.length} demoted by unanimous refutation${missing.length ? `, ${missing.length} check(s) FAILED TO RUN: ${missing.join(", ")}` : ""}.`,
);

// ── Report ──

phase("Report");
const report = await agent(
  `Write the pre-ship report to progress/pre-ship-report.md using the exact template in
.claude/commands/pre-ship.md ("Output Report" section — summary table per category, Decision
checkboxes, Blockers, Warnings, Sign-off). Get today's date via \`date\`. Overwrite any prior report.

Data:
- DECISION (already computed — do not re-judge): ${decision}
- Mode: ${QUICK ? "QUICK (hotfix — skipped: " + skipped.join(", ") + ")" : "FULL"}
- Per-category results: ${JSON.stringify(results.map((r) => ({ category: r.lens, status: r.check.status, evidence: r.check.evidence })))}
- Confirmed blockers: ${JSON.stringify(confirmedBlockers)}
- Blockers demoted by unanimous refutation (list as warnings, note the demotion): ${JSON.stringify(demotedBlockers)}
- Warnings: ${JSON.stringify(warnings)}
- Checks that failed to run (treat as blockers — unknown ≠ pass): ${JSON.stringify(missing)}

End the file with the next action: DO_NOT_SHIP → fix blockers and re-run; FIX_THEN_SHIP → human
judges the warnings; SHIP → hand off to human for deploy (the harness never deploys to prod).`,
  { label: "report", phase: "Report" },
);

return {
  decision,
  blockers: confirmedBlockers,
  demoted: demotedBlockers,
  warnings,
  checksFailedToRun: missing,
  categories: results.map((r) => ({
    category: r.lens,
    status: r.check.status,
  })),
  reportFile: "progress/pre-ship-report.md",
  report,
};
