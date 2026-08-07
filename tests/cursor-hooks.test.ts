import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const hooksDir = join(root, ".cursor/hooks");

async function runHook(
  script: string,
  payload: Record<string, unknown>,
): Promise<{ stdout: string; exitCode: number }> {
  const proc = Bun.spawn(["bash", join(hooksDir, script)], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    cwd: root,
  });
  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  return { stdout, exitCode };
}

describe("Cursor dual-harness surface", () => {
  test("hooks.json is valid and references existing scripts", () => {
    const raw = readFileSync(join(root, ".cursor/hooks.json"), "utf8");
    const config = JSON.parse(raw) as {
      version: number;
      hooks: Record<string, Array<{ command: string }>>;
    };
    expect(config.version).toBe(1);
    const commands = Object.values(config.hooks).flatMap((entries) =>
      entries.map((e) => e.command),
    );
    expect(commands.length).toBeGreaterThan(0);
    for (const command of commands) {
      expect(existsSync(join(root, command))).toBe(true);
    }
  });

  test("environment.json has bun install", () => {
    const env = JSON.parse(
      readFileSync(join(root, ".cursor/environment.json"), "utf8"),
    ) as { install: string };
    expect(env.install).toContain("bun install");
  });

  test("Cursor agents use Cursor model IDs, not Claude short aliases", () => {
    const agentsDir = join(root, ".cursor/agents");
    const files = readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
    expect(files).toContain("verifier.md");
    expect(files.length).toBeGreaterThanOrEqual(13);

    const banned = /^\s*model:\s*(opus|sonnet|haiku)\s*$/m;
    for (const file of files) {
      const text = readFileSync(join(agentsDir, file), "utf8");
      expect(banned.test(text)).toBe(false);
      expect(text).toMatch(/^---[\s\S]*?^model:\s+\S+/m);
    }

    const reviewer = readFileSync(join(agentsDir, "reviewer.md"), "utf8");
    expect(reviewer).toMatch(/model:\s*gpt-5\.6-sol/);
    expect(reviewer).toMatch(/readonly:\s*true/);

    const architect = readFileSync(join(agentsDir, "architect.md"), "utf8");
    expect(architect).toMatch(/model:\s*claude-opus-5/);

    const implementer = readFileSync(join(agentsDir, "implementer.md"), "utf8");
    expect(implementer).toMatch(/model:\s*inherit/);
  });

  test("workflow skills are slash-only", () => {
    const workflowRoot = join(root, ".cursor/skills/workflow");
    for (const name of [
      "work",
      "check-decisions",
      "init-phase",
      "status",
      "pre-ship",
    ]) {
      const skill = readFileSync(join(workflowRoot, name, "SKILL.md"), "utf8");
      expect(skill).toContain("disable-model-invocation: true");
      expect(skill).toContain(`name: ${name}`);
    }
  });

  test("CLAUDE.md is a thin pointer to HARNESS.md", () => {
    const claude = readFileSync(join(root, "CLAUDE.md"), "utf8");
    const harness = readFileSync(join(root, "HARNESS.md"), "utf8");
    expect(claude.length).toBeLessThan(2000);
    expect(claude).toContain("HARNESS.md");
    expect(harness).toContain("Grok 4.5");
    expect(harness).toContain("Never pin Opus");
  });
});

describe("Cursor hook scripts", () => {
  test("block-prod-push denies push to prod", async () => {
    const { stdout, exitCode } = await runHook("block-prod-push.sh", {
      command: "git push origin prod",
    });
    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout);
    expect(json.permission).toBe("deny");
  });

  test("block-prod-push allows feature branch push", async () => {
    const { stdout, exitCode } = await runHook("block-prod-push.sh", {
      command: "git push -u origin cursor/feature-ca82",
    });
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout).permission).toBe("allow");
  });

  test("protect-env denies .env writes", async () => {
    const shell = await runHook("protect-env.sh", {
      command: "echo secret > .env.local",
    });
    expect(JSON.parse(shell.stdout).permission).toBe("deny");

    const tool = await runHook("protect-env.sh", {
      tool_input: { file_path: "apps/web/.env" },
    });
    expect(JSON.parse(tool.stdout).permission).toBe("deny");
  });

  test("stop-continue returns empty when no phase file", async () => {
    const { stdout, exitCode } = await runHook("stop-continue-todos.sh", {
      status: "completed",
      loop_count: 0,
    });
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toEqual({});
  });
});
