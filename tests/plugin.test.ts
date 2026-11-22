import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The plugin is the only distribution path, so the manifest has to describe
// exactly what is on disk, and nothing shipped may point at a retired piece.

const root = join(import.meta.dir, "..");
const plugin = join(root, ".claude");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const manifest = JSON.parse(read(".claude/.claude-plugin/plugin.json"));
const marketplace = JSON.parse(read(".claude-plugin/marketplace.json"));

const RETIRED_COMMANDS = [
  "work",
  "coordinate",
  "init-phase",
  "plan-phases",
  "check-decisions",
  "status",
  "red-team",
  "pre-ship",
  "clarify",
];
const RETIRED_AGENTS = [
  "architect",
  "coordinator",
  "deployer",
  "interviewer",
  "tester",
];
const ARCHIVED_SKILLS = [
  "shopify-remix",
  "woocommerce",
  "wordpress-plugin",
  "heroku-deploy",
  "cloudflare-dns",
  "mysql-planetscale",
  "pinecone",
  "council",
  "resend-email",
  "payments",
];

describe("plugin manifest", () => {
  test("both manifests carry the same version", () => {
    expect(marketplace.plugins[0].version).toBe(manifest.version);
    expect(marketplace.plugins[0].source).toBe("./.claude");
  });

  test("lists every skill, command, agent and workflow on disk, and only those", () => {
    const onDisk = (dir: string) =>
      readdirSync(join(plugin, dir))
        .filter((f) => !f.startsWith("."))
        .map((f) => `${dir}/${f}`)
        .sort();
    expect([...manifest.includes.skills].sort()).toEqual(onDisk("skills"));
    expect([...manifest.includes.commands].sort()).toEqual(onDisk("commands"));
    expect([...manifest.includes.agents].sort()).toEqual(onDisk("agents"));
    expect([...manifest.includes.workflows].sort()).toEqual(
      onDisk("workflows"),
    );
    for (const s of manifest.includes.skills)
      expect(existsSync(join(plugin, s, "SKILL.md"))).toBe(true);
  });

  test("ships hooks and the rules file at the plugin root", () => {
    expect(manifest.includes.hooks).toBe("hooks/hooks.json");
    expect(existsSync(join(plugin, "hooks/hooks.json"))).toBe(true);
    expect(existsSync(join(plugin, "HARNESS.md"))).toBe(true);
    expect(existsSync(join(root, "HARNESS.md"))).toBe(false);
  });
});

describe("retired pieces", () => {
  test("are archived, not shipped", () => {
    for (const c of RETIRED_COMMANDS) {
      expect(existsSync(join(plugin, "commands", `${c}.md`))).toBe(false);
      expect(existsSync(join(root, "archive/commands", `${c}.md`))).toBe(true);
    }
    for (const a of RETIRED_AGENTS) {
      expect(existsSync(join(plugin, "agents", `${a}.md`))).toBe(false);
      expect(existsSync(join(root, "archive/agents", `${a}.md`))).toBe(true);
    }
    for (const s of ARCHIVED_SKILLS) {
      expect(existsSync(join(plugin, "skills", s))).toBe(false);
      expect(existsSync(join(root, "archive/skills", s, "SKILL.md"))).toBe(
        true,
      );
    }
    expect(existsSync(join(root, ".cursor"))).toBe(false);
  });

  test("archived skills have no live eval cases", () => {
    for (const f of readdirSync(join(root, "evals/cases"))) {
      const src = read(`evals/cases/${f}`);
      for (const s of ARCHIVED_SKILLS)
        expect(src).not.toMatch(new RegExp(`^\\s+skill: ${s}$`, "m"));
    }
  });

  test("workflows only spawn agents the plugin ships", () => {
    const agents = readdirSync(join(plugin, "agents")).map((f) =>
      f.replace(/\.md$/, ""),
    );
    for (const f of readdirSync(join(plugin, "workflows"))) {
      const src = read(`.claude/workflows/${f}`);
      for (const m of src.matchAll(/agentType:\s*"([a-z-]+)"/g))
        expect(agents).toContain(m[1]!);
    }
  });

  test("agents preload only skills that exist, and none is pinned to sonnet", () => {
    for (const f of readdirSync(join(plugin, "agents"))) {
      const front = read(`.claude/agents/${f}`).split("---")[1] ?? "";
      expect(front).not.toMatch(/^model:\s*sonnet/m);
      const skills = front.match(/^skills:\n((?:\s+- .+\n?)+)/m)?.[1] ?? "";
      for (const m of skills.matchAll(/- ([a-z-]+)/g))
        expect(existsSync(join(plugin, "skills", m[1]!, "SKILL.md"))).toBe(
          true,
        );
    }
  });
});

describe("HARNESS.md", () => {
  const harness = read(".claude/HARNESS.md");

  test("states the session topology and the escalation rule", () => {
    for (const s of [
      "## Sessions and Delegation",
      "Questions go up, not out",
      "DECIDED (orchestrator)",
      "## Gates",
    ]) {
      expect(harness).toContain(s);
    }
  });

  test("names no retired command as something to run", () => {
    const body = harness.replace(/The phase-loop commands[^\n]*\n/, "");
    for (const c of RETIRED_COMMANDS)
      expect(body).not.toMatch(new RegExp("`/" + c + "\\b"));
    expect(body).not.toMatch(/Grok|\.cursor/);
  });

  test("documents every gate the scripts check", () => {
    const scripts = [
      "pre-bash.sh",
      "pre-edit.sh",
      "post-edit.sh",
      "post-bash.sh",
      "stop.sh",
    ]
      .map((f) => read(`.claude/hooks/${f}`))
      .join("\n");
    const gates = new Set(
      [...scripts.matchAll(/gate_on ([a-zA-Z]+)/g)].map((m) => m[1]!),
    );
    gates.delete("sounds");
    expect(gates.size).toBeGreaterThan(5);
    for (const g of gates) expect(harness).toContain("`" + g + "`");
  });
});
