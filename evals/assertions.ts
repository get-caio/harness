import type { AbsorptionAssertion, AssertionResult } from "./types";

/** Run a single assertion against generated output */
function checkAssertion(
  output: string,
  assertion: AbsorptionAssertion,
): boolean {
  const regex = new RegExp(assertion.pattern, "im");
  const found = regex.test(output);
  return assertion.expect === "present" ? found : !found;
}

/** Run all assertions for an absorption case, comparing with/without skill */
export function runAssertions(
  withSkillOutput: string,
  withoutSkillOutput: string,
  assertions: AbsorptionAssertion[],
): AssertionResult[] {
  return assertions.map((a) => {
    const withResult = checkAssertion(withSkillOutput, a);
    const withoutResult = checkAssertion(withoutSkillOutput, a);

    let delta: AssertionResult["delta"] = "same";
    if (withResult && !withoutResult) delta = "improved";
    if (!withResult && withoutResult) delta = "regressed";

    return {
      pattern: a.pattern,
      expect: a.expect,
      description: a.description,
      with_skill: withResult,
      without_skill: withoutResult,
      delta,
    };
  });
}
