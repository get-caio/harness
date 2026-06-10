export const meta = {
  name: "check-decisions",
  description:
    "Per-ticket ambiguity scan against SPEC.md — every ticket gets its own scanner, ambiguities are clustered across tickets so one underlying question becomes one decision file, and a single writer creates the files (sequential numbering by construction).",
  whenToUse:
    "After /init-phase N and before /work. The single-context /check-decisions skims long ticket lists; this fans out one scanner per ticket so the long tail — where ambiguities hide — gets the same attention as ticket 1.",
  phases: [
    {
      title: "Parse",
      detail: "tickets, existing decisions, and the next decision number",
    },
    { title: "Scan", detail: "one ambiguity scanner per ticket, parallel" },
    {
      title: "Cluster",
      detail:
        "merge across tickets — one underlying question, one decision (barrier: needs all scans)",
    },
    {
      title: "Write",
      detail:
        "a SINGLE writer creates decision files and marks tickets BLOCKED — numbering can't collide",
    },
    { title: "Report", detail: "what needs human input before /work" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Why this exists
//
// One context reading a 20-ticket phase file against a long SPEC.md skims the
// tail: ambiguities in tickets 14–20 get a fraction of the attention of ticket 1.
// Structure fixes three things:
//
//   1. Recall — every ticket gets a dedicated scanner with the full spec budget.
//   2. Dedup — three tickets hinging on the same undefined auth provider must
//      become ONE decision file, not three. That requires seeing all scans at
//      once, so the Cluster step is a genuine barrier.
//   3. Numbering — decision files are sequentially numbered (NNN-slug.md).
//      Parallel writers would collide; the single-writer Write step makes
//      collision unrepresentable, the same way coordinate-phase serializes merges.
//
// Invoke:  Workflow({ name: 'check-decisions' })            — phase from specs/CURRENT_PHASE
//          Workflow({ name: 'check-decisions', args: { phase: 2 } })
// ─────────────────────────────────────────────────────────────────────────────

const phaseRef =
  args?.phase != null
    ? `Phase ${args.phase}`
    : "the phase named in specs/CURRENT_PHASE";

// ── Schemas ──

const PARSE_SCHEMA = {
  type: "object",
  required: [
    "phase",
    "phaseFile",
    "tickets",
    "existingDecisions",
    "nextDecisionNumber",
  ],
  properties: {
    phase: { type: "string" },
    phaseFile: { type: "string" },
    tickets: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "summary"],
        properties: {
          id: { type: "string", description: "e.g. P2-T007" },
          title: { type: "string" },
          summary: {
            type: "string",
            description:
              "The ticket's full description/acceptance criteria, condensed but losing no requirements",
          },
        },
      },
    },
    existingDecisions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "status"],
        properties: {
          id: { type: "string", description: "e.g. 003" },
          title: { type: "string" },
          status: { type: "string", enum: ["PENDING", "DECIDED"] },
        },
      },
    },
    nextDecisionNumber: {
      type: "number",
      description: "max existing NNN + 1 (sequential across all phases)",
    },
  },
};

const SCAN_SCHEMA = {
  type: "object",
  required: ["ambiguities"],
  properties: {
    ambiguities: {
      type: "array",
      items: {
        type: "object",
        required: ["question", "category", "specEvidence", "whyItBlocks"],
        properties: {
          question: {
            type: "string",
            description: "The specific question a human must answer",
          },
          category: {
            type: "string",
            enum: [
              "technology",
              "business-logic",
              "contradiction",
              "missing-info",
              "scope",
            ],
          },
          specEvidence: {
            type: "string",
            description:
              "Quote or cite what SPEC.md says (or note its silence) — no fabricated quotes",
          },
          whyItBlocks: {
            type: "string",
            description: "What gets built wrong if the agent guesses",
          },
        },
      },
    },
  },
};

const CLUSTER_SCHEMA = {
  type: "object",
  required: ["decisions"],
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        required: [
          "title",
          "question",
          "category",
          "blocksTickets",
          "options",
          "recommendation",
          "coveredByExisting",
        ],
        properties: {
          title: { type: "string", description: "Short decision title" },
          question: { type: "string" },
          category: {
            type: "string",
            enum: [
              "technology",
              "business-logic",
              "contradiction",
              "missing-info",
              "scope",
            ],
          },
          blocksTickets: { type: "array", items: { type: "string" } },
          specEvidence: { type: "string" },
          options: {
            type: "array",
            minItems: 2,
            items: {
              type: "object",
              required: ["name", "pros", "cons"],
              properties: {
                name: { type: "string" },
                pros: { type: "array", items: { type: "string" } },
                cons: { type: "array", items: { type: "string" } },
              },
            },
          },
          recommendation: {
            type: "string",
            description:
              'The agent\'s pick with one-line rationale, or "Need human input"',
          },
          coveredByExisting: {
            type: ["string", "null"],
            description:
              "Existing decision id (NNN) that already answers this question, else null",
          },
        },
      },
    },
  },
};

const WRITE_SCHEMA = {
  type: "object",
  required: ["created", "ticketsBlocked"],
  properties: {
    created: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "file", "blocks"],
        properties: {
          id: { type: "string" },
          file: { type: "string" },
          blocks: { type: "array", items: { type: "string" } },
        },
      },
    },
    ticketsBlocked: { type: "number" },
  },
};

// ── Parse ──

phase("Parse");

const parsed = await agent(
  `Read specs/CURRENT_PHASE and the matching specs/phases/PHASE-N-*.md for ${phaseRef}, plus every
file in specs/decisions/. Return:
- every ticket in the phase (id, title, and a summary that loses NO requirements),
- every existing decision (NNN id, title, PENDING/DECIDED status),
- nextDecisionNumber = highest existing NNN + 1 (numbering is sequential across ALL phases; 1 if none).
Parse only — do not judge ambiguity yet, do not write anything.`,
  { label: "parse", phase: "Parse", schema: PARSE_SCHEMA },
);

log(
  `${parsed.phase}: ${parsed.tickets.length} ticket(s), ${parsed.existingDecisions.length} existing decision(s), next number ${parsed.nextDecisionNumber}.`,
);

const existingList = parsed.existingDecisions.length
  ? parsed.existingDecisions
      .map((d) => `- [${d.id}] ${d.title} (${d.status})`)
      .join("\n")
  : "(none)";

// ── Scan: one scanner per ticket ──

phase("Scan");

const scans = await parallel(
  parsed.tickets.map(
    (t) => () =>
      agent(
        `You are checking ONE ticket for spec ambiguities that need a HUMAN decision before building.

Ticket ${t.id}: ${t.title}
${t.summary}

Read the relevant parts of specs/SPEC.md (and specs/design/DESIGN.md if this is UI work). Look for:
technology choices the spec doesn't make, unclear business logic / edge cases / limits,
contradictions between spec sections, references to undefined things, and scope ambiguity
(this phase or later?).

Existing decisions already filed — do NOT re-raise a question one of these answers:
${existingList}

THE BAR: only raise an ambiguity if guessing wrong would mean rework or a wrong product —
"the spec doesn't specify a button color" does not qualify; "the spec doesn't say which auth
provider" does. An empty list is a perfectly good answer. Read-only.`,
        { label: `scan:${t.id}`, phase: "Scan", schema: SCAN_SCHEMA },
      ).then((r) =>
        r ? r.ambiguities.map((a) => ({ ...a, ticket: t.id })) : [],
      ),
  ),
);

const ambiguities = scans.filter(Boolean).flat();
log(
  `Scan: ${ambiguities.length} raw ambiguit${ambiguities.length === 1 ? "y" : "ies"} across ${parsed.tickets.length} ticket(s).`,
);

if (!ambiguities.length) {
  return {
    phase: parsed.phase,
    decisionsCreated: [],
    ticketsBlocked: 0,
    note: "No ambiguities found — phase is clear to /work (or /coordinate).",
  };
}

// ── Cluster (barrier — genuinely needs every scan): one question, one decision ──

phase("Cluster");

const clustered = await agent(
  `Cluster these raw per-ticket spec ambiguities into DECISION candidates for ${phaseRef}.

Raw ambiguities (each tagged with the ticket that raised it):
${JSON.stringify(ambiguities, null, 2)}

Existing decisions:
${existingList}

Rules:
- Ambiguities that hinge on the SAME underlying question merge into ONE decision whose
  blocksTickets is the union of their tickets.
- If an existing decision (PENDING or DECIDED) already answers a question, set
  coveredByExisting to its id — do not draft a duplicate.
- For each decision: 2–4 genuinely distinct options with honest pros/cons, and a recommendation
  (your pick + one line, or "Need human input" when genuinely a coin-flip the human must call).
Read SPEC.md again wherever you need to verify a quote. Do not write any files.`,
  { label: "cluster", phase: "Cluster", schema: CLUSTER_SCHEMA },
);

const newDecisions = clustered.decisions.filter((d) => !d.coveredByExisting);
const covered = clustered.decisions.filter((d) => d.coveredByExisting);
if (covered.length)
  log(
    `Cluster: ${covered.length} question(s) already covered by existing decisions: ${covered.map((d) => `"${d.title}"→${d.coveredByExisting}`).join(", ")}.`,
  );

if (!newDecisions.length) {
  return {
    phase: parsed.phase,
    decisionsCreated: [],
    coveredByExisting: covered.map((d) => ({
      title: d.title,
      existing: d.coveredByExisting,
    })),
    ticketsBlocked: 0,
    note: "All ambiguities are covered by existing decisions — resolve any PENDING ones, then /work.",
  };
}

// ── Write: ONE writer — sequential numbering can't collide ──

phase("Write");

const written = await agent(
  `Create the spec decision files for ${phaseRef}. Use the EXACT template from
.claude/commands/check-decisions.md (§3): Status PENDING, Phase, Created (today via \`date\`),
Blocks line, Question, Context with spec evidence, Options with pros/cons/implications,
Recommendation, and the empty human Decision/Rationale sections.

Decisions to create (in this order), numbering sequentially starting at ${String(parsed.nextDecisionNumber).padStart(3, "0")}:
${JSON.stringify(newDecisions, null, 2)}

File names: specs/decisions/NNN-short-slug.md. After writing the files, mark every ticket listed
in any blocksTickets as BLOCKED in ${parsed.phaseFile}, referencing the new SD id (add a
Blocked By column if the table lacks one). Touch nothing else.`,
  { label: "write-decisions", phase: "Write", schema: WRITE_SCHEMA },
);

// ── Report ──

phase("Report");

const report = await agent(
  `Write the spec-decision check report for ${parsed.phase} in the format from
.claude/commands/check-decisions.md (§5): tickets scanned, decisions created, tickets blocked,
the decisions table, which tickets can proceed without decisions, and the action required
(human resolves PENDING → DECIDED before /work). Output the report as your final text — also
append a one-line entry to progress/build-log.md (date via \`date\`).

Data:
- Tickets scanned: ${parsed.tickets.length}
- Created: ${JSON.stringify(written?.created ?? [])}
- Covered by existing decisions: ${JSON.stringify(covered.map((d) => ({ title: d.title, existing: d.coveredByExisting })))}
- All phase tickets: ${JSON.stringify(parsed.tickets.map((t) => t.id))}`,
  { label: "report", phase: "Report" },
);

return {
  phase: parsed.phase,
  decisionsCreated: written?.created ?? [],
  ticketsBlocked: written?.ticketsBlocked ?? 0,
  coveredByExisting: covered.map((d) => ({
    title: d.title,
    existing: d.coveredByExisting,
  })),
  report,
};
