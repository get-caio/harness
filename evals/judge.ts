import Anthropic from "@anthropic-ai/sdk";
import type { RubricScore } from "./types";

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
          `    [RETRY] judge ${label} — ${status}, waiting ${(delay / 1000).toFixed(0)}s`,
        );
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

/** Use LLM-as-Judge to score code output against a rubric */
export async function judgeOutput(
  client: Anthropic,
  model: string,
  task: string,
  output: string,
  rubric: Record<string, string>,
): Promise<{
  scores: Record<string, { score: number; justification: string }>;
}> {
  const rubricText = Object.entries(rubric)
    .map(([dim, desc]) => `- **${dim}**: ${desc}`)
    .join("\n");

  const response = await withRetry(
    () =>
      client.messages.create({
        model,
        max_tokens: 2048,
        system: `You are an expert code evaluator. You score code outputs against rubric dimensions.
You MUST respond with valid JSON only. No markdown, no explanation outside JSON.`,
        messages: [
          {
            role: "user",
            content: `## Task
${task}

## Code Output
\`\`\`
${output}
\`\`\`

## Rubric
Score each dimension 0.0-1.0:
${rubricText}

Respond with JSON:
{
  "scores": {
    "dimension_name": { "score": 0.0, "justification": "..." },
    ...
  }
}`,
          },
        ],
      }),
    5,
    "judge",
  );

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    // Strip markdown code fences if present
    const cleaned = text
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Judge returned invalid JSON:", text.slice(0, 200));
    // Return zero scores on parse failure
    const fallback: Record<string, { score: number; justification: string }> =
      {};
    for (const dim of Object.keys(rubric)) {
      fallback[dim] = { score: 0, justification: "Judge parse error" };
    }
    return { scores: fallback };
  }
}

/** Run judge on both with/without skill outputs and compute deltas */
export async function compareWithJudge(
  client: Anthropic,
  model: string,
  task: string,
  withSkillOutput: string,
  withoutSkillOutput: string,
  rubric: Record<string, string>,
): Promise<RubricScore[]> {
  const [withScores, withoutScores] = await Promise.all([
    judgeOutput(client, model, task, withSkillOutput, rubric),
    judgeOutput(client, model, task, withoutSkillOutput, rubric),
  ]);

  return Object.keys(rubric).map((dim) => {
    const ws = withScores.scores[dim] ?? { score: 0, justification: "missing" };
    const wos = withoutScores.scores[dim] ?? {
      score: 0,
      justification: "missing",
    };
    return {
      dimension: dim,
      with_skill: ws.score,
      without_skill: wos.score,
      delta: ws.score - wos.score,
      justification_with: ws.justification,
      justification_without: wos.justification,
    };
  });
}
