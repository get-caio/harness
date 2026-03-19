#!/usr/bin/env bun

// Load .env from project root
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
try {
  const envPath = resolve(import.meta.dir, "../.env");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env not found, rely on environment
}

import { parseArgs } from "node:util";
import { runEvals } from "./runner";
import { generateReport } from "./report";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    tier: { type: "string", default: "all", short: "t" },
    skill: { type: "string", short: "s" },
    model: { type: "string", default: "claude-sonnet-4-20250514", short: "m" },
    "judge-model": {
      type: "string",
      default: "claude-haiku-4-5-20251001",
    },
    limit: { type: "string", short: "l" },
    "dry-run": { type: "boolean", default: false },
    "save-baseline": { type: "boolean", default: false },
    verbose: { type: "boolean", default: true, short: "v" },
    help: { type: "boolean", default: false, short: "h" },
  },
});

if (values.help) {
  console.log(`
Harness Skill Eval Runner

Usage: bun run evals/run.ts [options]

Options:
  -t, --tier <tier>        Eval tier: all, retrieval, absorption, quality (default: all)
  -s, --skill <name>       Filter to a single skill (absorption/quality tiers only)
  -m, --model <id>         Model for code generation (default: claude-sonnet-4-20250514)
      --judge-model <id>   Model for LLM-as-Judge (default: claude-haiku-4-5-20251001)
  -l, --limit <n>          Max cases per tier
      --dry-run            Show what would run without API calls
      --save-baseline      Save results as baseline for regression detection
  -v, --verbose            Show detailed output (default: true)
  -h, --help               Show this help

Examples:
  bun run evals/run.ts --dry-run                    # Preview all cases
  bun run evals/run.ts -t absorption -s security    # Test security skill absorption
  bun run evals/run.ts -t retrieval --limit 5       # Run first 5 retrieval cases
  bun run evals/run.ts --save-baseline              # Full run, save as regression baseline
`);
  process.exit(0);
}

// Validate tier
const validTiers = ["all", "retrieval", "absorption", "quality"];
const tier = values.tier as "all" | "retrieval" | "absorption" | "quality";
if (!validTiers.includes(tier)) {
  console.error(
    `Invalid tier: ${values.tier}. Must be one of: ${validTiers.join(", ")}`,
  );
  process.exit(1);
}

// Check API key
if (!process.env.ANTHROPIC_API_KEY && !values["dry-run"]) {
  console.error(
    "Error: ANTHROPIC_API_KEY environment variable required (or use --dry-run)",
  );
  process.exit(1);
}

console.log(`\n╔══════════════════════════════════╗`);
console.log(`║     Harness Skill Eval Suite     ║`);
console.log(`╚══════════════════════════════════╝\n`);
console.log(`Model:   ${values.model}`);
console.log(`Judge:   ${values["judge-model"]}`);
console.log(`Tier:    ${tier}`);
if (values.skill) console.log(`Skill:   ${values.skill}`);
if (values.limit) console.log(`Limit:   ${values.limit} cases/tier`);
if (values["dry-run"]) console.log(`Mode:    DRY RUN`);

const results = await runEvals({
  tier,
  skillFilter: values.skill,
  model: values.model!,
  judgeModel: values["judge-model"]!,
  limit: values.limit ? parseInt(values.limit) : undefined,
  dryRun: values["dry-run"]!,
  saveBaseline: values["save-baseline"]!,
  verbose: values.verbose!,
});

// Generate and save report
const report = generateReport(results);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const reportPath = join(import.meta.dir, "results", `eval-${timestamp}.md`);
const jsonPath = join(import.meta.dir, "results", `eval-${timestamp}.json`);

await Bun.write(reportPath, report);
await Bun.write(jsonPath, JSON.stringify(results, null, 2));

console.log(`\n── Report saved ──`);
console.log(`  Markdown: ${reportPath}`);
console.log(`  JSON:     ${jsonPath}`);

// Save baseline if requested
if (values["save-baseline"] && !values["dry-run"]) {
  const baselinePath = join(import.meta.dir, "baselines", "latest.json");
  await Bun.write(baselinePath, JSON.stringify(results, null, 2));
  console.log(`  Baseline: ${baselinePath}`);
}

// Print summary to stdout
console.log(`\n── Summary ──\n`);

if (results.retrieval.length > 0) {
  const avgF1 =
    results.retrieval.reduce((s, r) => s + r.f1, 0) / results.retrieval.length;
  console.log(
    `  Retrieval:  ${results.retrieval.length} cases, avg F1 = ${(avgF1 * 100).toFixed(0)}%`,
  );
}

if (results.absorption.length > 0) {
  const avgDelta =
    results.absorption.reduce((s, r) => s + r.absorption_delta, 0) /
    results.absorption.length;
  const dead = results.absorption.filter((r) => r.absorption_delta <= 0).length;
  console.log(
    `  Absorption: ${results.absorption.length} cases, avg delta = ${(avgDelta * 100).toFixed(0)}%, dead weight = ${dead}`,
  );
}

if (results.quality.length > 0) {
  const avgQDelta =
    results.quality.reduce((s, r) => s + r.quality_delta, 0) /
    results.quality.length;
  console.log(
    `  Quality:    ${results.quality.length} cases, avg delta = ${avgQDelta >= 0 ? "+" : ""}${avgQDelta.toFixed(2)}`,
  );
}

if (results.cost_estimate.usd > 0) {
  console.log(`  Cost:       ~$${results.cost_estimate.usd.toFixed(2)}`);
}

console.log(``);
