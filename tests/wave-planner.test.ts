import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  filesOverlap,
  planWaves,
  type Ticket,
} from "../.claude/mcp/wave-planner";

const t = (
  id: string,
  deps: string[],
  files: string[],
  extra: Partial<Ticket> = {},
): Ticket => ({
  id,
  title: id,
  size: "S",
  status: "TODO",
  dependsOn: deps,
  files,
  blockedByDecision: null,
  ...extra,
});

describe("filesOverlap", () => {
  it("flags identical and nested directory ownership as conflicting", () => {
    expect(filesOverlap(t("a", [], ["src/x/"]), t("b", [], ["src/x/"]))).toBe(
      true,
    );
    expect(
      filesOverlap(t("a", [], ["src/x/"]), t("b", [], ["src/x/y.ts"])),
    ).toBe(true);
    expect(filesOverlap(t("a", [], ["src/x/"]), t("b", [], ["src/y/"]))).toBe(
      false,
    );
  });
});

describe("planWaves", () => {
  it("cascades blockage to dependents while scheduling independents and DONE-dep tickets", () => {
    const tickets: Ticket[] = [
      t("T001", [], ["src/a/"], { blockedByDecision: "SD-1" }), // blocked by decision
      t("T002", ["T001"], ["src/b/"]), // -> deferred (needs blocked T001)
      t("T003", ["T002"], ["src/c/"]), // -> deferred (cascades off T002)
      t("T004", [], ["src/d/"]), // -> schedulable
      t("T005", ["T000"], ["src/e/"]), // -> schedulable (dep is DONE)
      t("T000", [], ["src/z/"], { status: "DONE" }),
    ];
    const { waves, deferredByDependency } = planWaves(tickets, 3);
    const scheduled = waves
      .flat()
      .map((x) => x.id)
      .sort();
    expect(scheduled).toEqual(["T004", "T005"]);
    expect(deferredByDependency).toEqual([
      { id: "T002", dependsOn: "T001" },
      { id: "T003", dependsOn: "T002" },
    ]);
  });

  it("never places two file-overlapping tickets in the same wave", () => {
    const tickets = [
      t("A", [], ["src/shared/"]),
      t("B", [], ["src/shared/"]), // overlaps A
      t("C", [], ["src/other/"]),
    ];
    const { waves } = planWaves(tickets, 3);
    for (const wave of waves) {
      for (let i = 0; i < wave.length; i++)
        for (let j = i + 1; j < wave.length; j++)
          expect(filesOverlap(wave[i]!, wave[j]!)).toBe(false);
    }
  });

  it("respects the maxParallel cap (clamped to 3)", () => {
    const tickets = Array.from({ length: 6 }, (_, i) =>
      t(`K${i}`, [], [`src/k${i}/`]),
    );
    const { waves } = planWaves(tickets, 2);
    expect(Math.max(...waves.map((w) => w.length))).toBeLessThanOrEqual(2);
  });

  it("orders dependent tickets into a later wave than their dependency", () => {
    const tickets = [t("B", ["A"], ["src/b/"]), t("A", [], ["src/a/"])];
    const { waves } = planWaves(tickets, 3);
    const waveOf = (id: string) =>
      waves.findIndex((w) => w.some((x) => x.id === id));
    expect(waveOf("A")).toBeLessThan(waveOf("B"));
  });

  it("throws on a dependency cycle", () => {
    const tickets = [t("A", ["B"], ["src/a/"]), t("B", ["A"], ["src/b/"])];
    expect(() => planWaves(tickets, 3)).toThrow();
  });
});

// Parity: the Workflow runtime needs a self-contained script, so coordinate-phase.js
// carries an inline copy of this algorithm. This test extracts the workflow's pure
// functions and asserts they produce an identical plan — so the two cannot silently drift.
describe("parity with coordinate-phase.js inline planner", () => {
  it("workflow buildWavePlan matches planWaves on the cascade fixture", () => {
    const src = readFileSync(
      join(import.meta.dir, "../.claude/workflows/coordinate-phase.js"),
      "utf8",
    );
    const grab = (name: string): string => {
      const i = src.indexOf("function " + name);
      if (i === -1) throw new Error(`missing ${name} in workflow`);
      let depth = 0;
      for (let k = src.indexOf("{", i); k < src.length; k++) {
        if (src[k] === "{") depth++;
        else if (src[k] === "}" && --depth === 0) return src.slice(i, k + 1);
      }
      throw new Error(`unbalanced ${name}`);
    };
    const code = [
      "filesOverlap",
      "topoLayers",
      "packIntoWaves",
      "buildWavePlan",
    ]
      .map(grab)
      .join("\n\n");
    const buildWavePlan = new Function(code + "\nreturn buildWavePlan;")() as (
      tk: Ticket[],
      mp: number,
    ) => { plan: Ticket[][]; blockedByDep: unknown };

    const tickets: Ticket[] = [
      t("T001", [], ["src/a/"], { blockedByDecision: "SD-1" }),
      t("T002", ["T001"], ["src/b/"]),
      t("T003", ["T002"], ["src/c/"]),
      t("T004", [], ["src/d/"]),
      t("T000", [], ["src/z/"], { status: "DONE" }),
      t("T005", ["T000"], ["src/e/"]),
    ];
    const ours = planWaves(tickets, 3);
    const wf = buildWavePlan(tickets, 3);

    const ids = (waves: Ticket[][]) =>
      waves.map((w) => w.map((x) => x.id).sort());
    expect(ids(wf.plan)).toEqual(ids(ours.waves));
    expect(wf.blockedByDep).toEqual(ours.deferredByDependency);
  });
});
