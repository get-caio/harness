import { describe, expect, it } from "bun:test";
import { runAssertions } from "./assertions";

// The absorption eval's verdict logic lives in runAssertions: it compares the
// with-skill output against the without-skill output per assertion and labels the
// delta. These tests pin the four behaviors the eval reports depend on.

describe("runAssertions", () => {
  it("marks 'improved' when the skill output satisfies a present-pattern the baseline misses", () => {
    const [r] = runAssertions(
      'className="min-h-[100dvh]"', // with skill
      'className="h-screen"', // without skill
      [
        {
          pattern: "min-h-\\[100dvh\\]",
          expect: "present",
          description: "dvh full-height",
        },
      ],
    );
    expect(r!.with_skill).toBe(true);
    expect(r!.without_skill).toBe(false);
    expect(r!.delta).toBe("improved");
  });

  it("honors expect:absent — a banned pattern present in output fails the assertion", () => {
    const [r] = runAssertions(
      "Calm, specific product copy.", // with skill: clean
      "Unleash synergy to elevate your workflow", // without skill: slop
      [
        {
          pattern: "unleash|synergy|elevate",
          expect: "absent",
          description: "no buzzwords",
        },
      ],
    );
    expect(r!.with_skill).toBe(true); // absent → pass
    expect(r!.without_skill).toBe(false); // present → fail
    expect(r!.delta).toBe("improved");
  });

  it("matches case-insensitively (the 'im' regex flags)", () => {
    const [r] = runAssertions("Uses INTER everywhere", "x", [
      { pattern: "\\binter\\b", expect: "present", description: "ci match" },
    ]);
    expect(r!.with_skill).toBe(true);
  });

  it("marks 'regressed' when the baseline passes but the skill output fails", () => {
    const [r] = runAssertions(
      'className="h-screen"', // with skill: wrong
      'className="min-h-[100dvh]"', // without skill: right
      [{ pattern: "h-screen", expect: "absent", description: "no h-screen" }],
    );
    expect(r!.delta).toBe("regressed");
  });

  it("marks 'same' when both outputs behave identically", () => {
    const [r] = runAssertions("clean", "also clean", [
      { pattern: "slop", expect: "absent", description: "no slop" },
    ]);
    expect(r!.delta).toBe("same");
  });
});
