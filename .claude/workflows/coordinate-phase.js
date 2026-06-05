export const meta = {
  name: "coordinate-phase",
  description:
    "Deterministically coordinate parallel ticket work across a phase — dependency-ordered waves, file-disjoint parallelism, merge-and-gate between waves.",
  whenToUse:
    "A phase has 3+ independent TODO tickets that can run in parallel. Replaces the hand-rolled `coordinator` agent so worktree base commits and file ownership are guaranteed by construction, not improvised.",
  phases: [
    {
      title: "Parse",
      detail: "Read the phase file into a structured ticket graph",
    },
    {
      title: "Implement",
      detail:
        "feature agents in isolated worktrees, one ticket each, file-disjoint per wave",
    },
    {
      title: "Integrate",
      detail:
        "merge each wave onto the working branch and run the quality gate before the next wave starts",
    },
    { title: "Report", detail: "coordination report + build-log update" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Why this exists
//
// The `coordinator` agent improvises `git worktree add` + `Task` spawns on every
// run. In the "Chicken coop" session (shed-builder, Phase 22) two of three
// parallel agents branched from a commit BEFORE the orchestrator's own commits —
// a silent staleness bug. This workflow makes three things structural instead of
// remembered:
//
//   1. Worktree base — every `agent({isolation:'worktree'})` is cut from current
//      HEAD by the harness at spawn time. Because we MERGE each wave before
//      spawning the next, wave N+1 always branches from a HEAD that already
//      contains wave N. The staleness bug becomes unrepresentable.
//   2. File ownership — tickets in the same parallel wave are proven file-disjoint
//      in code (packIntoWaves). No two concurrent agents can touch the same file.
//   3. The gate — `bun test/lint/typecheck` runs after every merge, not when the
//      model remembers to.
//
// Invoke:  Workflow({ name: 'coordinate-phase', args: { phase: 2, maxParallel: 3 } })
//          (args optional — phase defaults to specs/CURRENT_PHASE, maxParallel to 3)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PARALLEL = Math.min(3, args?.maxParallel ?? 3); // harness rule: never >3 parallel agents

// ── Schemas (structured outputs — validated at the tool layer, model retries on mismatch) ──

const TICKET_GRAPH_SCHEMA = {
  type: "object",
  required: ["phase", "tickets"],
  properties: {
    phase: {
      type: "string",
      description: "Phase number/name from specs/CURRENT_PHASE",
    },
    phaseFile: {
      type: "string",
      description: "Path to the PHASE-N-*.md file that was parsed",
    },
    tickets: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "size", "status", "dependsOn", "files"],
        properties: {
          id: { type: "string", description: "e.g. P2-T007" },
          title: { type: "string" },
          size: { type: "string", enum: ["S", "M", "L", "XL"] },
          status: {
            type: "string",
            enum: ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "SKIPPED"],
          },
          dependsOn: {
            type: "array",
            items: { type: "string" },
            description:
              "Ticket ids this one is blocked-by. Empty if independent.",
          },
          files: {
            type: "array",
            items: { type: "string" },
            description:
              'Directory-granular ownership globs this ticket will write, e.g. "src/components/auth/", "prisma/schema.prisma". Declare at directory level so overlap detection is reliable.',
          },
          blockedByDecision: {
            type: ["string", "null"],
            description:
              "Decision id (SD-/AD-) if a PENDING spec/arch decision blocks this ticket, else null.",
          },
        },
      },
    },
  },
};

const FEATURE_RESULT_SCHEMA = {
  type: "object",
  required: ["ticket", "status", "branch"],
  properties: {
    ticket: { type: "string" },
    status: { type: "string", enum: ["done", "blocked", "failed"] },
    branch: {
      type: "string",
      description:
        "Worktree branch the commit landed on (git branch --show-current)",
    },
    commit: {
      type: ["string", "null"],
      description: "Commit sha, or null if blocked/failed",
    },
    filesChanged: { type: "array", items: { type: "string" } },
    testsAdded: { type: "number" },
    notes: {
      type: "string",
      description: "Blocker reason or one-line summary",
    },
  },
};

const MERGE_RESULT_SCHEMA = {
  type: "object",
  required: ["merges", "gatePassed"],
  properties: {
    merges: {
      type: "array",
      items: {
        type: "object",
        required: ["ticket", "branch", "merged"],
        properties: {
          ticket: { type: "string" },
          branch: { type: "string" },
          merged: { type: "boolean" },
          conflict: { type: ["string", "null"] },
        },
      },
    },
    gatePassed: {
      type: "boolean",
      description:
        "true only if bun test && lint && typecheck all exit 0 after the merges",
    },
    gateOutput: {
      type: "string",
      description:
        "Failing test/lint/type output if gatePassed is false, else short OK summary",
    },
  },
};

// ── Deterministic helpers (judgment-free — this is code, not a model call) ──

// Two tickets conflict if either's ownership path is a prefix of the other's
// (same file or nested directory). Directory-granular `files` make this reliable.
function filesOverlap(a, b) {
  const norm = (p) => p.replace(/\/+$/, "");
  for (const x of a.files.map(norm)) {
    for (const y of b.files.map(norm)) {
      if (x === y || x.startsWith(y + "/") || y.startsWith(x + "/"))
        return true;
    }
  }
  return false;
}

// Topological layering by dependsOn. Returns layers of ticket ids; throws on cycle.
function topoLayers(tickets) {
  const byId = new Map(tickets.map((t) => [t.id, t]));
  const done = new Set();
  const layers = [];
  let remaining = tickets.map((t) => t.id);
  while (remaining.length) {
    const ready = remaining.filter(
      (id) => byId.get(id).dependsOn.every((d) => done.has(d) || !byId.has(d)), // unknown deps treated as satisfied (cross-phase)
    );
    if (!ready.length)
      throw new Error(
        `Dependency cycle or unmet deps among: ${remaining.join(", ")}`,
      );
    layers.push(ready);
    ready.forEach((id) => done.add(id));
    remaining = remaining.filter((id) => !ready.includes(id));
  }
  return layers;
}

// Within one topo layer, greedily pack tickets into waves of <=MAX_PARALLEL,
// file-disjoint members. Guarantees no two agents in a wave share a file.
function packIntoWaves(layerTickets, maxParallel) {
  const waves = [];
  for (const t of layerTickets) {
    const slot = waves.find(
      (w) =>
        w.length < maxParallel && w.every((other) => !filesOverlap(t, other)),
    );
    if (slot) slot.push(t);
    else waves.push([t]);
  }
  return waves;
}

// Build the full ordered wave plan from the parsed graph.
function buildWavePlan(tickets, maxParallel) {
  const workable = tickets.filter(
    (t) => t.status === "TODO" && !t.blockedByDecision,
  );
  const byId = new Map(workable.map((t) => [t.id, t]));
  const layers = topoLayers(workable);
  const plan = [];
  for (const layer of layers) {
    const layerTickets = layer.map((id) => byId.get(id)).filter(Boolean);
    for (const wave of packIntoWaves(layerTickets, maxParallel))
      plan.push(wave);
  }
  return plan;
}

// ── Phase 0: parse the phase file into a structured graph (judgment → agent) ──

phase("Parse");
const phaseArg =
  args?.phase != null
    ? `Phase ${args.phase}`
    : "the phase named in specs/CURRENT_PHASE";
const graph = await agent(
  `Read specs/CURRENT_PHASE and the matching specs/phases/PHASE-N-*.md for ${phaseArg}.
   Parse EVERY ticket row into the schema. For each ticket:
   - dependsOn: the blocked-by ticket ids (column or prose). Empty array if independent.
   - files: the directories/files the ticket will write, at DIRECTORY granularity
     (e.g. "src/components/auth/", not "src/components/auth/LoginForm.tsx"). Infer from
     the ticket description and existing repo layout. This drives parallel-safety, so be
     conservative — if unsure whether two tickets share a file, give them an overlapping path.
   - blockedByDecision: scan specs/decisions/ and docs/decisions/ for a PENDING decision
     naming this ticket; set its id, else null.
   Return the full graph. Do not implement anything.`,
  { label: "parse-phase", phase: "Parse", schema: TICKET_GRAPH_SCHEMA },
);

const blocked = graph.tickets.filter(
  (t) => t.status === "TODO" && t.blockedByDecision,
);
const wavePlan = buildWavePlan(graph.tickets, MAX_PARALLEL);
const totalToWork = wavePlan.flat().length;
log(
  `Phase ${graph.phase}: ${totalToWork} workable ticket(s) across ${wavePlan.length} wave(s); ` +
    `${blocked.length} blocked on decisions; max ${MAX_PARALLEL} parallel.`,
);
if (blocked.length)
  log(
    `Blocked (skipped): ${blocked.map((t) => `${t.id}→${t.blockedByDecision}`).join(", ")}`,
  );

// ── Waves: implement (parallel, isolated worktrees) → integrate (merge + gate) ──
// Sequential across waves is REQUIRED: merging wave N before spawning wave N+1 is
// what guarantees later worktrees branch from a HEAD containing earlier work.

const completed = [];
const failures = [];

for (let w = 0; w < wavePlan.length; w++) {
  const wave = wavePlan[w];
  const tag = `wave ${w + 1}/${wavePlan.length}`;
  log(`${tag}: implementing ${wave.map((t) => t.id).join(", ")}`);

  // Implement — barrier within the wave (we need all branches before we can merge).
  const results = (
    await parallel(
      wave.map(
        (t) => () =>
          agent(
            `Implement ticket ${t.id}: "${t.title}" (size ${t.size}).

           You are in an ISOLATED WORKTREE cut from current HEAD — it already contains all
           prior waves' merged work. Do NOT create your own worktree or branch off any other ref.

           Scope: you OWN and may only write under: ${t.files.join(", ")}.
           Do not modify files outside that ownership set — another agent may own them.

           Read first: progress/conventions.md, progress/dead-ends.md, and the relevant docs/ pages
           and skills for what this ticket touches (see CLAUDE.md mappings). Follow TDD — failing test
           first. Run the quality gate (bun test/lint/typecheck) before committing.

           Commit exactly once: "[${t.id}] <description>". Then run \`git branch --show-current\`
           and report that branch name. If a PENDING decision or hard blocker stops you, do NOT
           commit broken code — return status "blocked" with the reason.`,
            {
              label: `impl:${t.id}`,
              phase: `Wave ${w + 1} · implement`,
              isolation: "worktree",
              agentType: "feature",
              schema: FEATURE_RESULT_SCHEMA,
            },
          ),
      ),
    )
  ).filter(Boolean);

  const succeeded = results.filter(
    (r) => r.status === "done" && r.commit && r.branch,
  );
  const didnt = results.filter((r) => r.status !== "done");
  didnt.forEach((r) => failures.push(r));
  if (didnt.length)
    log(`${tag}: ${didnt.map((r) => `${r.ticket}=${r.status}`).join(", ")}`);

  if (!succeeded.length) {
    log(`${tag}: nothing to integrate, moving on`);
    continue;
  }

  // Integrate — runs on the MAIN working tree (not a worktree). Merges this wave's
  // branches in order and runs the gate. Waves are file-disjoint, so conflicts here
  // signal an ownership-declaration error worth surfacing, not normal churn.
  const merge = await agent(
    `Integrate ${tag} onto the current working branch. The following committed worktree
     branches are ready (each from an isolated, file-disjoint ticket):

     ${succeeded.map((r) => `- ${r.ticket}: branch ${r.branch} (commit ${r.commit})`).join("\n")}

     For each, in order: \`git merge --no-ff <branch>\`. These were built on disjoint file sets,
     so merges should be clean — if one conflicts, abort that merge, record the conflicting paths,
     and continue with the rest (do not force-resolve).

     After merging, run the FULL quality gate: bun test && bun lint && bun typecheck.
     Then update each merged ticket's status to DONE in the phase file and append a line per ticket
     to progress/build-log.md (id, title, files, tests, commit, today's date via \`date\`).
     Report the merge outcomes and whether the gate passed.`,
    {
      label: `integrate:w${w + 1}`,
      phase: "Integrate",
      agentType: "implementer",
      schema: MERGE_RESULT_SCHEMA,
    },
  );

  merge.merges.filter((m) => m.merged).forEach((m) => completed.push(m.ticket));
  merge.merges
    .filter((m) => !m.merged)
    .forEach((m) =>
      failures.push({
        ticket: m.ticket,
        status: "merge-conflict",
        notes: m.conflict,
      }),
    );

  if (!merge.gatePassed) {
    // A red gate after a merge contaminates every later wave that branches from it.
    // Stop the line — surface it rather than building more work on a broken base.
    log(
      `${tag}: GATE FAILED after merge — halting before next wave. ${merge.gateOutput}`,
    );
    return {
      phase: graph.phase,
      halted: `Quality gate failed after ${tag}`,
      gateOutput: merge.gateOutput,
      completed,
      failures,
      blocked: blocked.map((t) => ({
        ticket: t.id,
        decision: t.blockedByDecision,
      })),
      wavesPlanned: wavePlan.length,
      wavesRun: w + 1,
    };
  }
}

// ── Report ──

phase("Report");
const report = await agent(
  `Write the Phase ${graph.phase} coordination report in the existing coordinator output style
   (parallel groups tree, tickets completed X/Y, merge conflicts, blocked tickets with decision ids).
   Data:
   - Completed & merged: ${JSON.stringify(completed)}
   - Failures/blocked-during-work: ${JSON.stringify(failures)}
   - Blocked on decisions (never started): ${JSON.stringify(blocked.map((t) => ({ id: t.id, decision: t.blockedByDecision })))}
   - Waves run: ${wavePlan.length}
   Then state the next action: if any tickets remain blocked, list the decisions a human must resolve;
   if the phase is fully DONE, recommend running /audit then /audit types.`,
  { label: "report", phase: "Report" },
);

return {
  phase: graph.phase,
  completed,
  failures,
  blocked: blocked.map((t) => ({
    ticket: t.id,
    decision: t.blockedByDecision,
  })),
  wavesRun: wavePlan.length,
  report,
};
