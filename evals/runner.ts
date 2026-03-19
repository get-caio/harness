import Anthropic from "@anthropic-ai/sdk";
import { parse } from "yaml";
import { join } from "node:path";
import { runAssertions } from "./assertions";
import { compareWithJudge } from "./judge";
import { loadSkill, loadSkillCatalog, formatCatalogForPrompt } from "./skills";
import type {
  EvalConfig,
  EvalResults,
  RetrievalCase,
  RetrievalResult,
  AbsorptionCase,
  AbsorptionResult,
  QualityCase,
  QualityResult,
  CaseFile,
  TokenUsage,
} from "./types";

const CASES_DIR = join(import.meta.dir, "cases");

// ── Cost constants (per million tokens) ──
const COST_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4 },
  default: { input: 3, output: 15 },
};

function estimateCost(
  model: string,
  tokens: { input: number; output: number },
): number {
  const rates = COST_PER_MTOK[model] ?? COST_PER_MTOK.default;
  return (
    (tokens.input / 1_000_000) * rates.input +
    (tokens.output / 1_000_000) * rates.output
  );
}

async function loadCases<T>(filename: string): Promise<T[]> {
  const content = await Bun.file(join(CASES_DIR, filename)).text();
  const parsed = parse(content) as CaseFile<T>;
  return parsed.cases ?? [];
}

/** Load cases from multiple files matching a glob prefix */
async function loadAllCases<T>(prefix: string): Promise<T[]> {
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(CASES_DIR);
  const matching = files
    .filter((f) => f.startsWith(prefix) && f.endsWith(".yaml"))
    .sort();
  const all: T[] = [];
  for (const file of matching) {
    const cases = await loadCases<T>(file);
    all.push(...cases);
  }
  return all;
}

function extractTokens(response: Anthropic.Messages.Message): TokenUsage {
  return {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
  };
}

function extractText(response: Anthropic.Messages.Message): string {
  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ── Retry with exponential backoff ──

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  label = "",
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.status ?? err?.statusCode ?? 0;
      const retryable = status === 429 || status === 529 || status >= 500;
      if (!retryable || attempt === maxRetries) throw err;
      const delay = Math.min(1000 * 2 ** attempt + Math.random() * 1000, 60000);
      if (label) {
        console.log(
          `    [RETRY] ${label} — ${status} error, waiting ${(delay / 1000).toFixed(0)}s (attempt ${attempt + 1}/${maxRetries})`,
        );
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

// ── Generate code with/without skill context ──

async function generateCode(
  client: Anthropic,
  model: string,
  task: string,
  skillContent?: string,
): Promise<{ text: string; tokens: TokenUsage }> {
  const systemParts = [
    "You are a senior TypeScript/React engineer. Write production-quality code to complete the task.",
    "Output ONLY code (with imports). No explanations, no markdown fences.",
  ];
  if (skillContent) {
    systemParts.push(`\n## Reference Documentation\n\n${skillContent}`);
  }

  const response = await withRetry(
    () =>
      client.messages.create({
        model,
        max_tokens: 4096,
        system: systemParts.join("\n"),
        messages: [{ role: "user", content: task }],
      }),
    5,
    "generateCode",
  );

  return { text: extractText(response), tokens: extractTokens(response) };
}

// ── Tier 1: Retrieval ──

async function runRetrievalEval(
  client: Anthropic,
  config: EvalConfig,
  cases: RetrievalCase[],
): Promise<RetrievalResult[]> {
  const catalog = await loadSkillCatalog();
  const catalogText = formatCatalogForPrompt(catalog);
  const allSkillNames = catalog.map((s) => s.name);
  const results: RetrievalResult[] = [];

  for (const c of cases) {
    if (config.dryRun) {
      console.log(`  [DRY RUN] ${c.id}: ${c.task.slice(0, 60)}...`);
      continue;
    }

    const response = await withRetry(
      () =>
        client.messages.create({
          model: config.model,
          max_tokens: 1024,
          system: `You are a development agent that selects which skills to load before starting a task.
You MUST respond with valid JSON only: { "skills": ["skill-name", ...] }
Select 1-5 skills most relevant to the task. Choose from the catalog below.`,
          messages: [
            {
              role: "user",
              content: `## Available Skills\n\n${catalogText}\n\n## Task\n\n${c.task}\n\nWhich skills should be loaded?`,
            },
          ],
        }),
      5,
      c.id,
    );

    const text = extractText(response);
    let selected: string[] = [];
    try {
      const cleaned = text
        .replace(/```json?\n?/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      selected = (parsed.skills ?? []).filter((s: string) =>
        allSkillNames.includes(s),
      );
    } catch {
      console.error(`  [PARSE ERROR] ${c.id}: ${text.slice(0, 100)}`);
    }

    const expectedSet = new Set(c.expected);
    const notExpectedSet = new Set(c.not_expected ?? []);
    const selectedSet = new Set(selected);

    const truePositives = selected.filter((s) => expectedSet.has(s));
    const falsePositives = selected.filter(
      (s) => !expectedSet.has(s) && notExpectedSet.has(s),
    );
    const falseNegatives = c.expected.filter((s) => !selectedSet.has(s));

    const precision =
      selected.length > 0 ? truePositives.length / selected.length : 0;
    const recall =
      c.expected.length > 0 ? truePositives.length / c.expected.length : 0;
    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    results.push({
      case_id: c.id,
      task: c.task,
      selected_skills: selected,
      expected: c.expected,
      not_expected: c.not_expected ?? [],
      precision,
      recall,
      f1,
      false_positives: falsePositives,
      false_negatives: falseNegatives,
    });

    if (config.verbose) {
      const status = f1 >= 0.8 ? "PASS" : f1 >= 0.5 ? "WARN" : "FAIL";
      console.log(
        `  [${status}] ${c.id}: F1=${f1.toFixed(2)} | Selected: ${selected.join(", ")}`,
      );
    }
  }

  return results;
}

// ── Tier 2: Absorption ──

async function runAbsorptionEval(
  client: Anthropic,
  config: EvalConfig,
  cases: AbsorptionCase[],
): Promise<AbsorptionResult[]> {
  const results: AbsorptionResult[] = [];

  for (const c of cases) {
    if (config.skillFilter && c.skill !== config.skillFilter) continue;

    if (config.dryRun) {
      console.log(
        `  [DRY RUN] ${c.id} (${c.skill}): ${c.task.slice(0, 60)}...`,
      );
      continue;
    }

    const skillContent = await loadSkill(c.skill);

    // Run with and without skill in parallel
    const [withResult, withoutResult] = await Promise.all([
      generateCode(client, config.model, c.task, skillContent),
      generateCode(client, config.model, c.task),
    ]);

    const assertionResults = runAssertions(
      withResult.text,
      withoutResult.text,
      c.assertions,
    );

    const withPassRate =
      assertionResults.filter((a) => a.with_skill).length /
      assertionResults.length;
    const withoutPassRate =
      assertionResults.filter((a) => a.without_skill).length /
      assertionResults.length;

    const result: AbsorptionResult = {
      case_id: c.id,
      skill: c.skill,
      task: c.task,
      assertions: assertionResults,
      with_skill_pass_rate: withPassRate,
      without_skill_pass_rate: withoutPassRate,
      absorption_delta: withPassRate - withoutPassRate,
      tokens: {
        with_skill: withResult.tokens,
        without_skill: withoutResult.tokens,
      },
    };

    results.push(result);

    if (config.verbose) {
      const delta = result.absorption_delta;
      const status = delta > 0.2 ? "PASS" : delta > 0 ? "WEAK" : "DEAD";
      console.log(
        `  [${status}] ${c.id} (${c.skill}): delta=${delta.toFixed(2)} | with=${withPassRate.toFixed(2)} without=${withoutPassRate.toFixed(2)}`,
      );
      for (const a of assertionResults) {
        const icon =
          a.delta === "improved" ? "+" : a.delta === "regressed" ? "-" : "=";
        console.log(`    [${icon}] ${a.description}`);
      }
    }
  }

  return results;
}

// ── Tier 3: Quality ──

async function runQualityEval(
  client: Anthropic,
  config: EvalConfig,
  cases: QualityCase[],
): Promise<QualityResult[]> {
  const results: QualityResult[] = [];

  for (const c of cases) {
    if (config.skillFilter && c.skill !== config.skillFilter) continue;

    if (config.dryRun) {
      console.log(
        `  [DRY RUN] ${c.id} (${c.skill}): ${c.task.slice(0, 60)}...`,
      );
      continue;
    }

    const skillContent = await loadSkill(c.skill);

    // Generate code with and without skill
    const [withResult, withoutResult] = await Promise.all([
      generateCode(client, config.model, c.task, skillContent),
      generateCode(client, config.model, c.task),
    ]);

    // Judge both outputs
    const scores = await compareWithJudge(
      client,
      config.judgeModel,
      c.task,
      withResult.text,
      withoutResult.text,
      c.rubric,
    );

    const dims = Object.keys(c.rubric).length;
    const weightedWith =
      scores.reduce((sum, s) => sum + s.with_skill, 0) / dims;
    const weightedWithout =
      scores.reduce((sum, s) => sum + s.without_skill, 0) / dims;

    const result: QualityResult = {
      case_id: c.id,
      skill: c.skill,
      task: c.task,
      scores,
      weighted_with: weightedWith,
      weighted_without: weightedWithout,
      quality_delta: weightedWith - weightedWithout,
      tokens: {
        with_skill: withResult.tokens,
        without_skill: withoutResult.tokens,
      },
    };

    results.push(result);

    if (config.verbose) {
      const delta = result.quality_delta;
      const status = delta > 0.1 ? "PASS" : delta > 0 ? "WEAK" : "DEAD";
      console.log(
        `  [${status}] ${c.id} (${c.skill}): delta=${delta.toFixed(2)} | with=${weightedWith.toFixed(2)} without=${weightedWithout.toFixed(2)}`,
      );
      for (const s of scores) {
        console.log(
          `    ${s.dimension}: ${s.with_skill.toFixed(1)} vs ${s.without_skill.toFixed(1)} (${s.delta >= 0 ? "+" : ""}${s.delta.toFixed(2)})`,
        );
      }
    }
  }

  return results;
}

// ── Main Runner ──

export async function runEvals(config: EvalConfig): Promise<EvalResults> {
  const client = new Anthropic();
  const totalTokens = { input: 0, output: 0 };

  const results: EvalResults = {
    timestamp: new Date().toISOString(),
    config: {
      tier: config.tier,
      skillFilter: config.skillFilter,
      model: config.model,
      judgeModel: config.judgeModel,
      limit: config.limit,
      saveBaseline: config.saveBaseline,
      verbose: config.verbose,
    },
    retrieval: [],
    absorption: [],
    quality: [],
    cost_estimate: { input_tokens: 0, output_tokens: 0, usd: 0 },
  };

  // ── Retrieval ──
  if (config.tier === "all" || config.tier === "retrieval") {
    console.log("\n── Tier 1: Retrieval Eval ──\n");
    let cases = await loadCases<RetrievalCase>("retrieval.yaml");
    if (config.limit) cases = cases.slice(0, config.limit);
    results.retrieval = await runRetrievalEval(client, config, cases);
  }

  // ── Absorption ──
  if (config.tier === "all" || config.tier === "absorption") {
    console.log("\n── Tier 2: Absorption Eval ──\n");
    let cases = await loadAllCases<AbsorptionCase>("absorption");
    if (config.limit) cases = cases.slice(0, config.limit);
    results.absorption = await runAbsorptionEval(client, config, cases);
  }

  // ── Quality ──
  if (config.tier === "all" || config.tier === "quality") {
    console.log("\n── Tier 3: Quality Eval ──\n");
    let cases = await loadCases<QualityCase>("quality.yaml");
    if (config.limit) cases = cases.slice(0, config.limit);
    results.quality = await runQualityEval(client, config, cases);
  }

  // ── Aggregate token usage ──
  for (const r of results.absorption) {
    totalTokens.input +=
      r.tokens.with_skill.input + r.tokens.without_skill.input;
    totalTokens.output +=
      r.tokens.with_skill.output + r.tokens.without_skill.output;
  }
  for (const r of results.quality) {
    totalTokens.input +=
      r.tokens.with_skill.input + r.tokens.without_skill.input;
    totalTokens.output +=
      r.tokens.with_skill.output + r.tokens.without_skill.output;
  }

  results.cost_estimate = {
    input_tokens: totalTokens.input,
    output_tokens: totalTokens.output,
    usd:
      estimateCost(config.model, totalTokens) +
      estimateCost(
        config.judgeModel,
        // Rough estimate: judge uses ~50% of code gen tokens
        { input: totalTokens.input * 0.5, output: totalTokens.output * 0.3 },
      ),
  };

  return results;
}
