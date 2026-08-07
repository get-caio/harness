import { describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const hooksDir = join(root, ".cursor/hooks");

async function runHook(
  script: string,
  payload: Record<string, unknown>,
  cwd: string = root,
): Promise<{ stdout: string; exitCode: number; stderr: string }> {
  const proc = Bun.spawn(["bash", join(hooksDir, script)], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    cwd,
  });
  proc.stdin.write(JSON.stringify(payload));
  proc.stdin.end();
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { stdout, exitCode, stderr };
}

function permission(stdout: string): string {
  return JSON.parse(stdout).permission;
}

describe("Cursor dual-harness surface", () => {
  test("hooks.json is valid and references existing scripts", () => {
    const raw = readFileSync(join(root, ".cursor/hooks.json"), "utf8");
    const config = JSON.parse(raw) as {
      version: number;
      hooks: Record<string, Array<{ command: string; matcher?: string }>>;
    };
    expect(config.version).toBe(1);
    const preTool = config.hooks.preToolUse ?? [];
    expect(preTool.some((e) => e.matcher?.includes("Delete"))).toBe(true);
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

    const docWriter = readFileSync(join(agentsDir, "doc-writer.md"), "utf8");
    expect(docWriter.toLowerCase()).not.toContain("haiku");
    expect(docWriter).toMatch(/model:\s*inherit/);
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

  test("skill diet documents allowlist and do-not-auto-load", () => {
    const harness = readFileSync(join(root, "HARNESS.md"), "utf8");
    expect(harness).toContain("Skill diet");
    expect(harness).toContain("Do not auto-load");
    for (const skill of [
      "testing",
      "security",
      "database-migrations",
      "git-workflow",
      "payments",
      "design-routing",
    ]) {
      expect(harness).toContain(`\`${skill}\``);
    }
    for (const banned of [
      "shopify-remix",
      "woocommerce",
      "wordpress-plugin",
      "heroku-deploy",
    ]) {
      expect(harness).toContain(`\`${banned}\``);
    }

    const rules = readFileSync(join(root, ".cursor/rules/harness.mdc"), "utf8");
    expect(rules).toContain("Skill diet");
    expect(rules).toContain("Allowlist (prefer)");
  });

  test("daily-driver playbook covers morning work PR and cloud", () => {
    const playbook = readFileSync(
      join(root, "docs/guide/cursor-harness.md"),
      "utf8",
    );
    expect(playbook).toContain("## Morning");
    expect(playbook).toContain("## Workday loop");
    expect(playbook).toContain("## Before a PR");
    expect(playbook).toContain("## Overnight / Cloud babysit");
    expect(playbook).toContain("Team Rules");
    expect(playbook).toContain("/check-decisions");
    expect(playbook).toContain("verifier");
  });
});

describe("Cursor hook scripts", () => {
  test("block-prod-push denies push to prod", async () => {
    const { stdout, exitCode } = await runHook("block-prod-push.sh", {
      command: "git push origin prod",
    });
    expect(exitCode).toBe(0);
    expect(permission(stdout)).toBe("deny");
  });

  test("block-prod-push denies git -C push to prod", async () => {
    const { stdout, exitCode } = await runHook("block-prod-push.sh", {
      command: "git -C /workspace push origin prod",
    });
    expect(exitCode).toBe(0);
    expect(permission(stdout)).toBe("deny");
  });

  test("block-prod-push denies force-with-lease to main", async () => {
    const { stdout, exitCode } = await runHook("block-prod-push.sh", {
      command: "git push --force-with-lease origin HEAD:main",
    });
    expect(exitCode).toBe(0);
    expect(permission(stdout)).toBe("deny");
  });

  test("block-prod-push denies push while checked out on prod", async () => {
    const fixture = mkdtempSync(join(tmpdir(), "harness-prod-"));
    const init = Bun.spawnSync(["git", "init", "-b", "prod"], { cwd: fixture });
    expect(init.exitCode).toBe(0);
    writeFileSync(join(fixture, "README"), "x\n");
    Bun.spawnSync(["git", "config", "user.email", "test@example.com"], { cwd: fixture });
    Bun.spawnSync(["git", "config", "user.name", "Test"], { cwd: fixture });
    Bun.spawnSync(["git", "add", "README"], { cwd: fixture });
    Bun.spawnSync(["git", "commit", "-m", "init"], { cwd: fixture });

    const { stdout, exitCode } = await runHook(
      "block-prod-push.sh",
      { command: "git push origin HEAD" },
      fixture,
    );
    expect(exitCode).toBe(0);
    expect(permission(stdout)).toBe("deny");
  });

  test("block-prod-push allows feature branch push", async () => {
    const { stdout, exitCode } = await runHook("block-prod-push.sh", {
      command: "git push -u origin cursor/feature-ca82",
    });
    expect(exitCode).toBe(0);
    expect(permission(stdout)).toBe("allow");
  });

  test("protect-env denies redirect, sed, python, and Delete", async () => {
    const cases: Record<string, unknown>[] = [
      { command: "echo secret > .env.local" },
      { command: "sed -i 's/x/y/' .env.local" },
      { command: "python -c \"open('.env','w').write('x')\"" },
      { command: "git checkout -- .env.local" },
      { command: "dd if=/dev/null of=.env" },
      { tool_input: { file_path: "apps/web/.env" } },
      { tool_name: "Delete", tool_input: { path: ".env.production" } },
    ];
    for (const payload of cases) {
      const { stdout, exitCode } = await runHook("protect-env.sh", payload);
      expect(exitCode).toBe(0);
      expect(permission(stdout)).toBe("deny");
    }
  });

  test("protect-env allows read-only .env inspection", async () => {
    const { stdout, exitCode } = await runHook("protect-env.sh", {
      command: "cat .env.example",
    });
    expect(exitCode).toBe(0);
    expect(permission(stdout)).toBe("allow");
  });

  test("stop-continue returns empty when no phase file", async () => {
    const { stdout, exitCode } = await runHook("stop-continue-todos.sh", {
      status: "completed",
      loop_count: 0,
    });
    expect(exitCode).toBe(0);
    expect(JSON.parse(stdout)).toEqual({});
  });

  test("stop-continue emits followup when TODOs exist and BLOCKED is zero", async () => {
    const fixture = mkdtempSync(join(tmpdir(), "harness-stop-"));
    mkdirSync(join(fixture, "specs/phases"), { recursive: true });
    writeFileSync(join(fixture, "specs/CURRENT_PHASE"), "1\n");
    writeFileSync(
      join(fixture, "specs/phases/PHASE-1-foundation.md"),
      `| ID | Title | Status | Est | Blocked By |
| -- | ----- | ------ | --- | ---------- |
| P1-T001 | Setup | TODO | S | - |
| P1-T002 | Auth | DONE | M | - |
`,
    );

    const { stdout, exitCode } = await runHook(
      "stop-continue-todos.sh",
      { status: "completed", loop_count: 0 },
      fixture,
    );
    expect(exitCode).toBe(0);
    const json = JSON.parse(stdout) as { followup_message?: string };
    expect(json.followup_message).toContain("1 TODO");
    expect(json.followup_message).toContain("0 BLOCKED");
  });
});
