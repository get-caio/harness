export const meta = {
  name: "doc-sync",
  description:
    "Docs drift sweep — haiku checkers diff every docs/ page against the current code, and doc-writer agents fix only the pages that drifted. Each writer owns exactly one file, so the fan-out is conflict-free by construction.",
  whenToUse:
    "At the end of a phase, or whenever docs drift is suspected. The per-ticket doc-writer nag keeps individual tickets honest; this catches the drift that accumulates between nags. Nearly free: haiku checkers, read-only except the drifted pages.",
  phases: [
    {
      title: "Inventory",
      detail: "list docs/ pages and what code each documents",
    },
    {
      title: "Check",
      detail: "one haiku drift-checker per page, pipelined straight into fixes",
    },
    {
      title: "Fix",
      detail: "doc-writer per drifted page — one page, one owner, no conflicts",
    },
    {
      title: "Report",
      detail: "counts + build-log line; changes left uncommitted",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Why this exists
//
// The post-commit hook nags "spawn a doc-writer" per ticket — which works per
// ticket and silently drifts per phase (skipped nags, multi-page features, code
// changed by refactors with no doc nag at all). The sweep is structural:
//
//   1. Coverage — every page is checked, not just pages a recent ticket touched.
//   2. Cost — checkers run on haiku (model override), fixes use the existing
//      doc-writer agent (already haiku). The whole sweep costs less than one
//      opus context re-reading docs/.
//   3. Safety — pipeline(page → check → fix) means each doc-writer owns exactly
//      one file; parallel writers can't conflict. docs/decisions/ is excluded:
//      decision records are history, not living docs.
//
// Changes are left UNCOMMITTED for human/caller review — the report says what
// to commit.
//
// Invoke:  Workflow({ name: 'doc-sync' })
//          Workflow({ name: 'doc-sync', args: { maxPages: 40 } })
// ─────────────────────────────────────────────────────────────────────────────

const PAGE_CAP = args?.maxPages ?? 20;

// ── Schemas ──

const INVENTORY_SCHEMA = {
  type: "object",
  required: ["pages"],
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        required: ["path", "covers"],
        properties: {
          path: { type: "string", description: "e.g. docs/api/users.md" },
          covers: {
            type: "string",
            description:
              "What code this page documents — modules, routes, components",
          },
        },
      },
    },
  },
};

const DRIFT_SCHEMA = {
  type: "object",
  required: ["inSync", "drifts"],
  properties: {
    inSync: { type: "boolean" },
    drifts: {
      type: "array",
      items: {
        type: "object",
        required: ["documented", "actual", "files"],
        properties: {
          documented: { type: "string", description: "What the page claims" },
          actual: { type: "string", description: "What the code does today" },
          files: {
            type: "array",
            items: { type: "string" },
            description: "Code files that prove the actual behavior",
          },
        },
      },
    },
  },
};

const FIX_SCHEMA = {
  type: "object",
  required: ["status", "notes"],
  properties: {
    status: { type: "string", enum: ["updated", "skipped", "failed"] },
    notes: { type: "string" },
  },
};

// ── Inventory ──

phase("Inventory");

const inventory = await agent(
  `List every living-docs page in docs/ (all *.md, recursively) EXCLUDING docs/decisions/ —
decision records are history, not living docs. Also exclude VitePress config/theme files.
For each page, read enough of it to state what code it documents (modules, routes, components).
Read-only; list, don't check anything yet.`,
  { label: "inventory", phase: "Inventory", schema: INVENTORY_SCHEMA },
);

if (!inventory || !inventory.pages.length) {
  log("No living docs found under docs/ — nothing to sync.");
  return { pagesChecked: 0, updated: [], note: "no docs pages" };
}

const pages = inventory.pages.slice(0, PAGE_CAP);
const droppedPages = inventory.pages.slice(PAGE_CAP).map((p) => p.path);
if (droppedPages.length)
  log(
    `Page cap ${PAGE_CAP}: checking ${pages.length}, SKIPPING ${droppedPages.length}: ${droppedPages.join(", ")} — re-run with { maxPages } to cover them.`,
  );

// ── Check → Fix (pipeline: a drifted page is fixed while others are still being checked) ──

phase("Check");

const results = (
  await pipeline(
    pages,
    (p) =>
      agent(
        `Diff ONE docs page against the current code. Page: ${p.path} (documents: ${p.covers}).

Read the page, then read the code it documents. Report every claim the page makes that the code
contradicts: renamed/removed exports, changed routes or parameters, changed behavior, components
that no longer exist, env vars or commands that changed. Cite the code files that prove the actual
behavior. Cosmetic wording is NOT drift — only factual mismatches. If the page is accurate,
inSync=true with an empty drifts array. Read-only.`,
        {
          label: `check:${p.path}`,
          phase: "Check",
          schema: DRIFT_SCHEMA,
          model: "haiku",
        },
      ),
    async (drift, p) => {
      if (!drift)
        return { page: p.path, status: "failed", notes: "drift checker died" };
      if (drift.inSync || !drift.drifts.length)
        return { page: p.path, status: "in-sync", notes: "" };
      const fix = await agent(
        `Update EXACTLY ONE documentation page to match the current code: ${p.path}.
You own ONLY that file — modify nothing else.

Confirmed drifts to correct (verify each against the cited code files as you write):
${drift.drifts.map((d) => `- Page claims: ${d.documented}\n  Code reality: ${d.actual} (see ${d.files.join(", ")})`).join("\n")}

Keep the page's existing structure, tone, and VitePress conventions. Fix the factual claims;
do not rewrite prose that is still accurate. Do NOT commit.`,
        {
          label: `fix:${p.path}`,
          phase: "Fix",
          agentType: "doc-writer",
          schema: FIX_SCHEMA,
        },
      );
      return {
        page: p.path,
        status: fix?.status ?? "failed",
        notes: fix?.notes ?? "doc-writer died",
        drifts: drift.drifts.length,
      };
    },
  )
).filter(Boolean);

// ── Report ──

phase("Report");

const updated = results.filter((r) => r.status === "updated");
const inSync = results.filter((r) => r.status === "in-sync");
const failed = results.filter(
  (r) => r.status === "failed" || r.status === "skipped",
);

log(
  `Doc sync: ${inSync.length} in sync, ${updated.length} updated, ${failed.length} failed/skipped` +
    (droppedPages.length ? `, ${droppedPages.length} not checked (cap)` : "") +
    ".",
);

if (updated.length || failed.length) {
  await agent(
    `Append a one-line doc-sync entry to progress/build-log.md (date via \`date\`):
pages checked ${results.length}, updated ${updated.length} (${updated.map((u) => u.page).join(", ") || "none"}), failed ${failed.length}${droppedPages.length ? `, skipped by cap ${droppedPages.length}` : ""}.
Change nothing else.`,
    { label: "build-log", phase: "Report", model: "haiku" },
  );
}

return {
  pagesChecked: results.length,
  pagesSkippedByCap: droppedPages,
  inSync: inSync.map((r) => r.page),
  updated: updated.map((r) => ({ page: r.page, drifts: r.drifts })),
  failed: failed.map((r) => ({ page: r.page, notes: r.notes })),
  note: updated.length
    ? 'Updated pages are UNCOMMITTED — review and commit with message "docs: sync with code".'
    : "Docs are in sync.",
};
