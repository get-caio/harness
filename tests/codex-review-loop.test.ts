import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Behavioral tests for the codex-review-loop state machine. The script is
// executed for real: its body runs inside an AsyncFunction with a stubbed
// agent() whose responses are keyed by the label each call declares
// ("scope", "review:<i>", "fix:<i>", "gate"). Every terminal status and
// continuation path asserted here was a shipped bug at least once.

const src = readFileSync(
  join(import.meta.dir, "../.claude/workflows/codex-review-loop.js"),
  "utf8",
).replace("export const meta", "const meta");

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
  ...a: string[]
) => (...a: unknown[]) => Promise<any>;

type Call = { label: string; prompt: string };

async function runLoop(
  args: Record<string, unknown> | undefined,
  respond: (label: string, prompt: string) => unknown,
): Promise<{ result: any; calls: Call[] }> {
  const calls: Call[] = [];
  const agent = async (
    prompt: string,
    opts: { label?: string; phase?: string } = {},
  ) => {
    const label = opts.label ?? "";
    calls.push({ label, prompt });
    return respond(label, prompt);
  };
  const noop = () => {};
  const budget = { total: null, spent: () => 0, remaining: () => Infinity };
  const fn = new AsyncFunction(
    "agent",
    "parallel",
    "pipeline",
    "phase",
    "log",
    "args",
    "budget",
    "workflow",
    src,
  );
  const result = await fn(
    agent,
    undefined,
    undefined,
    noop,
    noop,
    args,
    budget,
    undefined,
  );
  return { result, calls };
}

const SCOPE_PR = {
  ok: true,
  problem: null,
  branch: "feat-x",
  base: "main",
  pr: 123,
  prState: "OPEN",
  headSha: "abc123",
};

const finding = (key: string, actionable: "agent" | "human" = "agent") => ({
  key,
  title: key,
  severity: "important",
  file: key.split(":")[0],
  line: 1,
  detail: "an issue",
  suggestedFix: "change it",
  actionable,
  humanReason: actionable === "human" ? "needs a product call" : null,
});

const review = (...findings: unknown[]) => ({
  reviewRan: true,
  failureNote: null,
  findings,
});

const FIX_OK = {
  applied: ["src/a.ts:bug"],
  rejected: [],
  committed: true,
  pushed: true,
  testsPassed: true,
  commitMessage: "[codex-review] iteration 1: fix",
  notes: null,
};

const GATE_GREEN = {
  mergeable: true,
  mergeStateStatus: "CLEAN",
  reviewDecision: null,
  failingChecks: [],
  humanOnlySteps: [],
};

describe("codex-review-loop state machine", () => {
  it("reaches mergeable: finding fixed, re-review clean, CI green", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review(finding("src/a.ts:bug"));
      if (label === "fix:1") return FIX_OK;
      if (label === "review:2") return review();
      if (label === "gate") return GATE_GREEN;
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("mergeable");
    expect(result.iterationsRun).toBe(2);
  });

  it("failing CI blocks mergeable even when GitHub says mergeable:true", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review();
      if (label === "gate")
        return {
          mergeable: true,
          mergeStateStatus: "UNSTABLE",
          reviewDecision: null,
          failingChecks: ["test: failed"],
          humanOnlySteps: [],
        };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("human-steps-remaining");
  });

  it("a pending required check blocks mergeable even in a CLEAN-looking state", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review();
      if (label === "gate")
        return { ...GATE_GREEN, failingChecks: ["ci: pending"] };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("human-steps-remaining");
  });

  it("BLOCKED state with zero failing checks = awaiting approval = mergeable", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review();
      if (label === "gate")
        return { ...GATE_GREEN, mergeStateStatus: "BLOCKED" };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("mergeable");
  });

  it("approve/merge listed in humanOnlySteps does not block mergeable", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review();
      if (label === "gate")
        return {
          ...GATE_GREEN,
          humanOnlySteps: ["human approves the PR", "merge when ready"],
        };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("mergeable");
  });

  it("exhausting the batch returns checkin-required with full continuation state", async () => {
    const { result } = await runLoop({ pr: 123, checkinEvery: 2 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review(finding("src/a.ts:one"));
      if (label === "fix:1") return FIX_OK;
      if (label === "review:2") return review(finding("src/b.ts:two"));
      if (label === "fix:2") return FIX_OK;
      if (label === "gate") return GATE_GREEN;
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("checkin-required");
    expect(result.iterationsRun).toBe(2);
    expect(result.nextIteration).toBe(3);
    expect(result.checkinEvery).toBe(2);
    expect(result.seenCounts).toEqual({ "src/a.ts:one": 1, "src/b.ts:two": 1 });
  });

  it("continuation rehydrates seenCounts and escalates a non-converging finding", async () => {
    const { result, calls } = await runLoop(
      {
        pr: 123,
        startIteration: 3,
        seenCounts: { "src/a.ts:bug": 2 },
        humanItems: [
          {
            key: "h1",
            title: "h1",
            severity: "suggestion",
            file: null,
            reason: "carried over",
          },
        ],
      },
      (label) => {
        if (label === "scope") return SCOPE_PR;
        if (label === "review:3") return review(finding("src/a.ts:bug"));
        if (label === "gate") return GATE_GREEN;
        throw new Error(`unexpected agent call: ${label}`);
      },
    );
    // third sighting -> escalated, so no fixer runs and the loop goes to the gate
    expect(calls.map((c) => c.label)).toEqual(["scope", "review:3", "gate"]);
    const titles = result.humanItems.map((h: any) => h.title);
    expect(titles).toContain("h1"); // carried across the check-in
    expect(titles).toContain("src/a.ts:bug"); // escalated
    expect(
      result.humanItems.find((h: any) => h.title === "src/a.ts:bug").reason,
    ).toContain("did not converge");
    expect(result.status).toBe("human-steps-remaining");
    expect(result.seenCounts["src/a.ts:bug"]).toBe(3);
  });

  it("a failed push in PR mode blocks instead of gating a stale remote", async () => {
    const { result, calls } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review(finding("src/a.ts:bug"));
      if (label === "fix:1") return { ...FIX_OK, pushed: false };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("blocked");
    expect(result.iterationLog[0].error).toContain("push failed");
    expect(calls.some((c) => c.label === "gate")).toBe(false);
  });

  it("failing tests after fixes blocks the loop", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review(finding("src/a.ts:bug"));
      if (label === "fix:1") return { ...FIX_OK, testsPassed: false };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("blocked");
    expect(result.iterationLog[0].error).toContain("tests failing");
  });

  it("fixer rejecting every finding is review-clean, not blocked", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1") return review(finding("src/a.ts:bug"));
      if (label === "fix:1")
        return {
          applied: [],
          rejected: [{ key: "src/a.ts:bug", reason: "false positive" }],
          committed: false,
          pushed: false,
          testsPassed: null,
          commitMessage: null,
          notes: null,
        };
      if (label === "gate") return GATE_GREEN;
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).not.toBe("blocked");
    expect(result.status).toBe("human-steps-remaining"); // rejection is held for the human
    expect(result.humanItems[0].reason).toContain("rejected");
  });

  it("human-only findings skip the fixer entirely", async () => {
    const { result, calls } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1")
        return review(finding("src/pay.ts:pricing", "human"));
      if (label === "gate") return GATE_GREEN;
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(calls.some((c) => c.label.startsWith("fix:"))).toBe(false);
    expect(result.status).toBe("human-steps-remaining");
    expect(result.humanItems[0].title).toBe("src/pay.ts:pricing");
  });

  it("a codex CLI failure blocks with the failure note", async () => {
    const { result } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope") return SCOPE_PR;
      if (label === "review:1")
        return {
          reviewRan: false,
          failureNote: "codex: not logged in",
          findings: [],
        };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("blocked");
    expect(result.iterationLog[0].error).toBe("codex: not logged in");
  });

  it("a bad scope blocks before any iteration", async () => {
    const { result, calls } = await runLoop({ pr: 123 }, (label) => {
      if (label === "scope")
        return { ...SCOPE_PR, ok: false, problem: "uncommitted changes" };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("blocked");
    expect(result.problem).toBe("uncommitted changes");
    expect(result.iterationsRun).toBe(0);
    expect(calls).toHaveLength(1);
  });

  it("local mode never reports mergeable", async () => {
    const { result } = await runLoop(undefined, (label) => {
      if (label === "scope") return { ...SCOPE_PR, pr: null, prState: null };
      if (label === "review:1") return review();
      if (label === "gate")
        return {
          mergeable: null,
          mergeStateStatus: null,
          reviewDecision: null,
          failingChecks: [],
          humanOnlySteps: ["open a PR when ready"],
        };
      throw new Error(`unexpected agent call: ${label}`);
    });
    expect(result.status).toBe("human-steps-remaining");
  });
});
