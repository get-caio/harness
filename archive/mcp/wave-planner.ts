// Canonical wave-planning core for phase coordination.
//
// This is the single source of truth for the deterministic part of /coordinate —
// dependency-ordered, file-disjoint wave construction with cascading blockage. It is
// consumed by the MCP server (mcp/coordinate-server.ts, the plugin-distributable path)
// AND mirrored inline by .claude/workflows/coordinate-phase.js (the Workflow runtime
// requires a self-contained script). A parity test pins the two together so they cannot
// drift — see mcp/wave-planner.test.ts.

export interface Ticket {
  id: string;
  title?: string;
  size?: string;
  status: "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "SKIPPED";
  dependsOn: string[];
  files: string[];
  blockedByDecision?: string | null;
}

export interface DeferredTicket {
  id: string;
  dependsOn: string;
}

export interface WavePlan {
  waves: Ticket[][];
  deferredByDependency: DeferredTicket[];
}

// Two tickets conflict if either's ownership path is a prefix of the other's (same file
// or a nested directory). Directory-granular `files` make this reliable.
export function filesOverlap(a: Ticket, b: Ticket): boolean {
  const norm = (p: string) => p.replace(/\/+$/, "");
  for (const x of a.files.map(norm)) {
    for (const y of b.files.map(norm)) {
      if (x === y || x.startsWith(y + "/") || y.startsWith(x + "/"))
        return true;
    }
  }
  return false;
}

// Topological layering by dependsOn over a candidate set. A dependency is "satisfied" if
// it is already DONE (in doneIds) or refers to a ticket outside this phase entirely
// (cross-phase — assumed shipped). Throws on cycle. Callers must pre-filter so every
// unsatisfiable in-phase dependency has already cascaded out (see planWaves).
export function topoLayers(
  tickets: Ticket[],
  doneIds: Set<string>,
  inPhaseIds: Set<string>,
): string[][] {
  const byId = new Map(tickets.map((t) => [t.id, t]));
  const satisfied = new Set(doneIds);
  const layers: string[][] = [];
  let remaining = tickets.map((t) => t.id);
  while (remaining.length) {
    const ready = remaining.filter((id) =>
      (byId.get(id)?.dependsOn ?? []).every(
        (d) => satisfied.has(d) || !inPhaseIds.has(d),
      ),
    );
    if (!ready.length)
      throw new Error(
        `Dependency cycle or unmet deps among: ${remaining.join(", ")}`,
      );
    layers.push(ready);
    ready.forEach((id) => satisfied.add(id));
    remaining = remaining.filter((id) => !ready.includes(id));
  }
  return layers;
}

// Within one topo layer, greedily pack tickets into waves of <=maxParallel, file-disjoint
// members. Guarantees no two tickets in a wave share a file.
export function packIntoWaves(
  layerTickets: Ticket[],
  maxParallel: number,
): Ticket[][] {
  const waves: Ticket[][] = [];
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

// Build the ordered wave plan. Blockage CASCADES: a TODO ticket whose dependency is an
// in-phase ticket that is neither DONE nor itself schedulable this run is deferred — it
// cannot be worked until that dependency lands. The fixpoint loop propagates this through
// chains (A blocked -> B that needs A dropped -> C that needs B dropped). Returns the plan
// plus the deferred tickets so callers can surface them.
export function planWaves(tickets: Ticket[], maxParallel: number): WavePlan {
  const cap = Math.max(1, Math.min(maxParallel || 3, 3));
  const inPhaseIds = new Set(tickets.map((t) => t.id));
  const doneIds = new Set(
    tickets.filter((t) => t.status === "DONE").map((t) => t.id),
  );

  let candidates = tickets.filter(
    (t) => t.status === "TODO" && !t.blockedByDecision,
  );

  const deferredByDependency: DeferredTicket[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    const candidateIds = new Set(candidates.map((c) => c.id));
    const survivors: Ticket[] = [];
    for (const c of candidates) {
      const badDep = c.dependsOn.find(
        (d) => inPhaseIds.has(d) && !doneIds.has(d) && !candidateIds.has(d),
      );
      if (badDep) {
        deferredByDependency.push({ id: c.id, dependsOn: badDep });
        changed = true;
      } else survivors.push(c);
    }
    candidates = survivors;
  }

  const byId = new Map(candidates.map((t) => [t.id, t]));
  const layers = topoLayers(candidates, doneIds, inPhaseIds);
  const waves: Ticket[][] = [];
  for (const layer of layers) {
    const layerTickets = layer
      .map((id) => byId.get(id))
      .filter((t): t is Ticket => Boolean(t));
    for (const wave of packIntoWaves(layerTickets, cap)) waves.push(wave);
  }
  return { waves, deferredByDependency };
}
