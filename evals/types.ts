// ── Eval Case Definitions ──

export interface RetrievalCase {
  id: string;
  task: string;
  expected: string[];
  not_expected?: string[];
}

export interface AbsorptionAssertion {
  pattern: string;
  expect: "present" | "absent";
  description: string;
}

export interface AbsorptionCase {
  id: string;
  skill: string;
  task: string;
  assertions: AbsorptionAssertion[];
}

export interface QualityCase {
  id: string;
  skill: string;
  task: string;
  rubric: Record<string, string>;
  ground_truth_patterns?: string[];
}

export interface CaseFile<T> {
  cases: T[];
}

// ── Run Configuration ──

export interface EvalConfig {
  tier: "all" | "retrieval" | "absorption" | "quality";
  skillFilter?: string;
  model: string;
  judgeModel: string;
  limit?: number;
  dryRun: boolean;
  saveBaseline: boolean;
  verbose: boolean;
}

// ── Results ──

export interface AssertionResult {
  pattern: string;
  expect: "present" | "absent";
  description: string;
  with_skill: boolean;
  without_skill: boolean;
  delta: "improved" | "regressed" | "same";
}

export interface RetrievalResult {
  case_id: string;
  task: string;
  selected_skills: string[];
  expected: string[];
  not_expected: string[];
  precision: number;
  recall: number;
  f1: number;
  false_positives: string[];
  false_negatives: string[];
}

export interface AbsorptionResult {
  case_id: string;
  skill: string;
  task: string;
  assertions: AssertionResult[];
  with_skill_pass_rate: number;
  without_skill_pass_rate: number;
  absorption_delta: number;
  tokens: { with_skill: TokenUsage; without_skill: TokenUsage };
}

export interface RubricScore {
  dimension: string;
  with_skill: number;
  without_skill: number;
  delta: number;
  justification_with: string;
  justification_without: string;
}

export interface QualityResult {
  case_id: string;
  skill: string;
  task: string;
  scores: RubricScore[];
  weighted_with: number;
  weighted_without: number;
  quality_delta: number;
  tokens: { with_skill: TokenUsage; without_skill: TokenUsage };
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface EvalResults {
  timestamp: string;
  config: Omit<EvalConfig, "dryRun">;
  retrieval: RetrievalResult[];
  absorption: AbsorptionResult[];
  quality: QualityResult[];
  cost_estimate: { input_tokens: number; output_tokens: number; usd: number };
}

// ── Skill Catalog ──

export interface SkillEntry {
  name: string;
  description: string;
  content: string;
}
