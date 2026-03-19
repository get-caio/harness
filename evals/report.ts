import type { EvalResults } from "./types";

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function bar(value: number, width = 20): string {
  const filled = Math.round(value * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function deltaIcon(d: number): string {
  if (d > 0.15) return "++";
  if (d > 0.05) return "+ ";
  if (d > -0.05) return "= ";
  if (d > -0.15) return "- ";
  return "--";
}

export function generateReport(results: EvalResults): string {
  const lines: string[] = [];

  lines.push(`# Skill Eval Report`);
  lines.push(``);
  lines.push(`**Date:** ${results.timestamp}`);
  lines.push(`**Model:** ${results.config.model}`);
  lines.push(`**Judge:** ${results.config.judgeModel}`);
  if (results.config.skillFilter)
    lines.push(`**Filter:** ${results.config.skillFilter}`);
  lines.push(``);

  // ── Cost Summary ──
  const cost = results.cost_estimate;
  lines.push(`## Cost`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|---|---|`);
  lines.push(`| Input tokens | ${cost.input_tokens.toLocaleString()} |`);
  lines.push(`| Output tokens | ${cost.output_tokens.toLocaleString()} |`);
  lines.push(`| Estimated USD | $${cost.usd.toFixed(2)} |`);
  lines.push(``);

  // ── Tier 1: Retrieval ──
  if (results.retrieval.length > 0) {
    lines.push(`## Tier 1: Skill Retrieval`);
    lines.push(``);
    const avgF1 =
      results.retrieval.reduce((s, r) => s + r.f1, 0) /
      results.retrieval.length;
    const avgPrecision =
      results.retrieval.reduce((s, r) => s + r.precision, 0) /
      results.retrieval.length;
    const avgRecall =
      results.retrieval.reduce((s, r) => s + r.recall, 0) /
      results.retrieval.length;

    lines.push(
      `**Average F1:** ${pct(avgF1)} | **Precision:** ${pct(avgPrecision)} | **Recall:** ${pct(avgRecall)}`,
    );
    lines.push(``);
    lines.push(`| Case | F1 | Precision | Recall | Missed | Extra |`);
    lines.push(`|---|---|---|---|---|---|`);

    for (const r of results.retrieval) {
      lines.push(
        `| ${r.case_id} | ${pct(r.f1)} | ${pct(r.precision)} | ${pct(r.recall)} | ${r.false_negatives.join(", ") || "-"} | ${r.false_positives.join(", ") || "-"} |`,
      );
    }
    lines.push(``);
  }

  // ── Tier 2: Absorption ──
  if (results.absorption.length > 0) {
    lines.push(`## Tier 2: Skill Absorption`);
    lines.push(``);

    // Per-skill summary
    const bySkill = new Map<string, typeof results.absorption>();
    for (const r of results.absorption) {
      const arr = bySkill.get(r.skill) ?? [];
      arr.push(r);
      bySkill.set(r.skill, arr);
    }

    lines.push(`### Summary by Skill`);
    lines.push(``);
    lines.push(`| Skill | Cases | With Skill | Without | Delta | Status |`);
    lines.push(`|---|---|---|---|---|---|`);

    const skillSummaries: { skill: string; delta: number }[] = [];

    for (const [skill, cases] of bySkill) {
      const avgWith =
        cases.reduce((s, c) => s + c.with_skill_pass_rate, 0) / cases.length;
      const avgWithout =
        cases.reduce((s, c) => s + c.without_skill_pass_rate, 0) / cases.length;
      const delta = avgWith - avgWithout;
      const status =
        delta > 0.2
          ? "HIGH IMPACT"
          : delta > 0.05
            ? "MODERATE"
            : delta > 0
              ? "WEAK"
              : "DEAD WEIGHT";

      skillSummaries.push({ skill, delta });
      lines.push(
        `| ${skill} | ${cases.length} | ${pct(avgWith)} | ${pct(avgWithout)} | ${deltaIcon(delta)} ${pct(delta)} | ${status} |`,
      );
    }
    lines.push(``);

    // Detailed assertions
    lines.push(`### Assertion Details`);
    lines.push(``);

    for (const r of results.absorption) {
      lines.push(
        `#### ${r.case_id} — \`${r.skill}\` (delta: ${pct(r.absorption_delta)})`,
      );
      lines.push(``);
      lines.push(`| Assertion | With Skill | Without | Delta |`);
      lines.push(`|---|---|---|---|`);
      for (const a of r.assertions) {
        lines.push(
          `| ${a.description} | ${a.with_skill ? "PASS" : "FAIL"} | ${a.without_skill ? "PASS" : "FAIL"} | ${a.delta} |`,
        );
      }
      lines.push(``);
    }

    // Dead weight warning
    const deadWeight = skillSummaries.filter((s) => s.delta <= 0);
    if (deadWeight.length > 0) {
      lines.push(`### Dead Weight Skills`);
      lines.push(``);
      lines.push(
        `These skills showed zero or negative absorption — the agent produces equivalent or better code without them:`,
      );
      lines.push(``);
      for (const s of deadWeight) {
        lines.push(`- **${s.skill}** (delta: ${pct(s.delta)})`);
      }
      lines.push(``);
      lines.push(
        `> Consider: compress key rules into CLAUDE.md, or rewrite the skill to be more prescriptive.`,
      );
      lines.push(``);
    }
  }

  // ── Tier 3: Quality ──
  if (results.quality.length > 0) {
    lines.push(`## Tier 3: Output Quality`);
    lines.push(``);

    lines.push(`| Case | Skill | With Skill | Without | Delta | Bar |`);
    lines.push(`|---|---|---|---|---|---|`);

    for (const r of results.quality) {
      lines.push(
        `| ${r.case_id} | ${r.skill} | ${r.weighted_with.toFixed(2)} | ${r.weighted_without.toFixed(2)} | ${deltaIcon(r.quality_delta)} ${r.quality_delta >= 0 ? "+" : ""}${r.quality_delta.toFixed(2)} | ${bar(r.weighted_with)} |`,
      );
    }
    lines.push(``);

    // Rubric breakdown
    lines.push(`### Rubric Breakdown`);
    lines.push(``);

    for (const r of results.quality) {
      lines.push(`#### ${r.case_id} — \`${r.skill}\``);
      lines.push(``);
      lines.push(`| Dimension | With | Without | Delta |`);
      lines.push(`|---|---|---|---|`);
      for (const s of r.scores) {
        lines.push(
          `| ${s.dimension} | ${s.with_skill.toFixed(2)} | ${s.without_skill.toFixed(2)} | ${s.delta >= 0 ? "+" : ""}${s.delta.toFixed(2)} |`,
        );
      }
      lines.push(``);
    }
  }

  // ── Recommendations ──
  lines.push(`## Recommendations`);
  lines.push(``);

  if (results.absorption.length > 0) {
    const avgDelta =
      results.absorption.reduce((s, r) => s + r.absorption_delta, 0) /
      results.absorption.length;
    lines.push(
      `- **Overall absorption rate:** ${pct(avgDelta)} average delta across ${results.absorption.length} cases`,
    );
  }

  if (results.quality.length > 0) {
    const avgQDelta =
      results.quality.reduce((s, r) => s + r.quality_delta, 0) /
      results.quality.length;
    lines.push(
      `- **Overall quality impact:** ${avgQDelta >= 0 ? "+" : ""}${avgQDelta.toFixed(2)} average rubric delta across ${results.quality.length} cases`,
    );
  }

  lines.push(``);
  lines.push(
    `> Per Vercel's agents.md research: if skill absorption < 50%, consider migrating critical rules to CLAUDE.md as passive context.`,
  );
  lines.push(``);

  return lines.join("\n");
}
