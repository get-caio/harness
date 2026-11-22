import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The gates are only worth having if they stop the command. Claude Code blocks
// a tool call on exit code 2 and on nothing else, so every test here asserts
// the exit code of the real script against a real git repo.

const root = join(import.meta.dir, "..");
const hooksDir = join(root, ".claude/hooks");
let repo = "";

// Fake credentials are assembled at runtime so no key-shaped literal sits in
// this file (GitHub push protection rejects those, fake or not).
const FAKE_STRIPE_KEY = ["sk", "live", "abcdefghijklmnopqrstuvwx"].join("_");
const FAKE_GITHUB_TOKEN = ["ghp", "abcdefghijklmnopqrstuvwxyz0123456789"].join(
  "_",
);

function sh(cmd: string, cwd = repo) {
  const p = Bun.spawnSync(["bash", "-c", cmd], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  return { code: p.exitCode, out: p.stdout.toString() + p.stderr.toString() };
}

function hook(script: string, input: Record<string, unknown>) {
  const p = Bun.spawnSync(["bash", join(hooksDir, script)], {
    stdin: Buffer.from(JSON.stringify({ cwd: repo, ...input })),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, PATH: process.env.PATH ?? "" },
  });
  return {
    code: p.exitCode,
    out: p.stdout.toString(),
    err: p.stderr.toString(),
  };
}

const bash = (command: string) =>
  hook("pre-bash.sh", { tool_input: { command } });
const edit = (file: string) =>
  hook("pre-edit.sh", { tool_input: { file_path: join(repo, file) } });

function setTypecheck(script: string) {
  writeFileSync(
    join(repo, "package.json"),
    JSON.stringify({ name: "t", scripts: { typecheck: script } }),
  );
}

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "harness-hooks-"));
  sh(
    "git init -q -b main && git config user.email t@t.t && git config user.name t",
  );
  mkdirSync(join(repo, ".claude"));
  mkdirSync(join(repo, "src"));
  // {} selects the built-in secret scanner; gitleaks runs only when asked for.
  writeFileSync(join(repo, ".claude/harness.json"), "{}");
  setTypecheck("true");
  sh("git add -A && git commit -qm init");
});

afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe("hooks.json", () => {
  const config = JSON.parse(
    readFileSync(join(hooksDir, "hooks.json"), "utf8"),
  ) as {
    hooks: Record<string, Array<{ hooks: Array<{ command: string }> }>>;
  };
  const commands = Object.values(config.hooks).flatMap((e) =>
    e.flatMap((m) => m.hooks.map((h) => h.command)),
  );

  test("every command runs an existing script through CLAUDE_PLUGIN_ROOT", () => {
    expect(commands.length).toBeGreaterThan(0);
    for (const c of commands) {
      const m = c.match(
        /^bash "\$\{CLAUDE_PLUGIN_ROOT\}\/hooks\/([a-z-]+\.sh)"$/,
      );
      expect(m).not.toBeNull();
      expect(existsSync(join(hooksDir, m![1]!))).toBe(true);
    }
  });

  test("no script uses exit 1 to block", () => {
    for (const f of ["pre-bash.sh", "pre-edit.sh", "post-edit.sh", "lib.sh"]) {
      expect(readFileSync(join(hooksDir, f), "utf8")).not.toMatch(/exit 1\b/);
    }
  });

  test("project settings.json carries no hooks (the plugin owns them)", () => {
    const settings = JSON.parse(
      readFileSync(join(root, ".claude/settings.json"), "utf8"),
    );
    expect(settings.hooks).toBeUndefined();
    expect(settings.model).toBeUndefined();
    expect(settings.env.CLAUDE_CODE_SUBAGENT_MODEL).toBeUndefined();
  });
});

describe("opt-in", () => {
  test("does nothing in a repo without .claude/harness.json", () => {
    sh("mv .claude/harness.json .claude/off.json");
    expect(bash("git push origin prod").code).toBe(0);
    expect(edit(".env").code).toBe(0);
    sh("mv .claude/off.json .claude/harness.json");
  });
});

describe("pre-bash gates", () => {
  test("blocks a push to prod, by name or refspec", () => {
    expect(bash("git push origin prod").code).toBe(2);
    expect(bash("git push origin HEAD:prod").code).toBe(2);
    expect(bash("cd x && git push -f origin prod").code).toBe(2);
  });

  test("blocks the fully qualified prod ref", () => {
    expect(bash("git push origin HEAD:refs/heads/prod").code).toBe(2);
  });

  test("prose that mentions a prod push is not a push", () => {
    expect(
      bash('git commit -m "docs: never run git push origin prod"').code,
    ).toBe(0);
    expect(
      bash('gh pr create --title "x" --body "do not git push origin prod"')
        .code,
    ).toBe(0);
  });

  test("quoting the refspec does not get a prod push past the gate", () => {
    expect(bash('git push origin "HEAD:prod"').code).toBe(2);
    expect(bash("git push origin 'prod'").code).toBe(2);
    expect(bash('git push origin HEAD:"prod"').code).toBe(2);
    expect(bash('git push origin "refs/heads/prod"').code).toBe(2);
  });

  test("quoted prose next to a real push is still not a prod push", () => {
    expect(bash('git commit -m "push to prod"').code).toBe(0);
    expect(
      bash(
        'git commit -m "docs: never run git push origin prod" && git push origin feature',
      ).code,
    ).toBe(0);
    expect(bash('git commit -m "prod" && git push origin feature').code).toBe(
      0,
    );
    expect(bash('git push origin "prod-fixes"').code).toBe(0);
  });

  // These run from outside the repo, so the gate only fires if the hook both
  // recognises the command and follows the quoted -C directory.
  const outside = (command: string) =>
    hook("pre-bash.sh", { cwd: tmpdir(), tool_input: { command } });

  test("a quoted -C directory does not get a prod push past the gate", () => {
    expect(outside(`git -C "${repo}" push origin prod`).code).toBe(2);
    expect(outside(`git -C '${repo}' push origin prod`).code).toBe(2);
    expect(outside(`git -C "${repo}" push origin "HEAD:prod"`).code).toBe(2);
    expect(outside(`git -C "${repo}" push origin feature`).code).toBe(0);
  });

  test("a quoted -C directory does not get a commit past the gate", () => {
    sh("git checkout -qb prod");
    expect(outside(`git -C "${repo}" commit -m "test"`).code).toBe(2);
    expect(outside(`git -C '${repo}' commit -m 'test'`).code).toBe(2);
    sh("git checkout -q main && git branch -qD prod");
  });

  test("a quoted -C directory with spaces is followed and gated", () => {
    const spaced = mkdtempSync(join(tmpdir(), "harness hooks "));
    try {
      sh(
        "git init -q -b main && git config user.email t@t.t && git config user.name t",
        spaced,
      );
      mkdirSync(join(spaced, ".claude"));
      writeFileSync(join(spaced, ".claude/harness.json"), "{}");
      sh("git add -A && git commit -qm init", spaced);
      expect(outside(`git -C "${spaced}" push origin prod`).code).toBe(2);
      expect(outside(`git -C '${spaced}' push origin HEAD:prod`).code).toBe(2);
      expect(outside(`git -C "${spaced}" push origin feature`).code).toBe(0);
      sh("git checkout -qb prod", spaced);
      expect(outside(`git -C "${spaced}" commit -m "x"`).code).toBe(2);
    } finally {
      rmSync(spaced, { recursive: true, force: true });
    }
  });

  test("prose that mentions git -C is still not a command", () => {
    expect(bash('git commit -m "docs: git -C x push origin prod"').code).toBe(
      0,
    );
    expect(
      bash(`git commit -m 'never run git -C "/x" push origin prod'`).code,
    ).toBe(0);
    expect(
      bash('gh pr create --title "x" --body "git -C x commit, then push prod"')
        .code,
    ).toBe(0);
  });

  test("a message ending in git -C does not hide the push after it", () => {
    expect(
      bash(
        'git commit -m "note: git -C " && git push origin prod && echo "done"',
      ).code,
    ).toBe(2);
  });

  test("does not mistake other branch names for prod", () => {
    expect(bash("git push -u origin feature/product-page").code).toBe(0);
    expect(bash("git push origin prod-fixes").code).toBe(0);
  });

  test("blocks a commit made while on prod", () => {
    sh("git checkout -qb prod");
    expect(bash('git commit -m "x"').code).toBe(2);
    sh("git checkout -q main");
  });

  test("blocks npm install in a bun project only", () => {
    expect(bash("npm install left-pad").code).toBe(0);
    writeFileSync(join(repo, "bun.lock"), "");
    expect(bash("npm install left-pad").code).toBe(2);
    expect(bash("cd x && npm ci").code).toBe(2);
    expect(bash("(npm install left-pad)").code).toBe(2);
    expect(bash("bun add left-pad").code).toBe(0);
    // Quoted prose that mentions npm is not an npm command.
    expect(
      bash('git commit -m "docs: replace npm install with bun install"').code,
    ).toBe(0);
    expect(
      bash('gh pr create --title "x" --body "run npm install first"').code,
    ).toBe(0);
    rmSync(join(repo, "bun.lock"));
  });

  test("blocks a staged credential, and names the line", () => {
    writeFileSync(join(repo, ".claude/harness.json"), "{}");
    writeFileSync(
      join(repo, "src/k.ts"),
      `export const k = "${FAKE_STRIPE_KEY}";\n`,
    );
    sh("git add src/k.ts");
    const r = hook("pre-bash.sh", {
      tool_input: { command: 'git commit -m "k"' },
    });
    expect(r.code).toBe(2);
    expect(r.err).toContain("look like real credentials");
    sh("git reset -q && rm src/k.ts");
  });

  test("gitleaks, when selected and installed, blocks the same credential", () => {
    if (Bun.spawnSync(["bash", "-c", "command -v gitleaks"]).exitCode !== 0)
      return;
    writeFileSync(
      join(repo, ".claude/harness.json"),
      JSON.stringify({ secretScanner: "gitleaks" }),
    );
    writeFileSync(
      join(repo, "src/k.ts"),
      `export const k = "${FAKE_STRIPE_KEY}";\n`,
    );
    sh("git add src/k.ts");
    const r = bash('git commit -m "k"');
    sh("git reset -q && rm src/k.ts");
    writeFileSync(join(repo, ".claude/harness.json"), "{}");
    expect(r.code).toBe(2);
    expect(r.err).toContain("gitleaks");
  });

  test("lets ordinary code that mentions tokens and passwords through", () => {
    writeFileSync(
      join(repo, "src/auth.ts"),
      'const token = session.token;\nconst password = input.password;\nconst apiKey = process.env.API_KEY;\nconst secret: string = "";\n',
    );
    sh("git add src/auth.ts");
    expect(bash('git commit -m "auth"').code).toBe(0);
    sh("git commit -qm auth");
  });

  test("blocks on real TypeScript errors", () => {
    setTypecheck('echo "src/a.ts(1,1): error TS2322: nope"; exit 2');
    writeFileSync(join(repo, "src/a.ts"), "export const a = 1;\n");
    sh("git add -A");
    const r = bash('git commit -m "a"');
    expect(r.code).toBe(2);
    expect(r.err).toContain("TS2322");
  });

  test("does not block when the typechecker crashes without compiler errors", () => {
    setTypecheck('echo "FATAL ERROR: Reached heap limit"; exit 134');
    sh("git add -A");
    const r = bash('git commit -m "a"');
    expect(r.code).toBe(0);
    expect(r.err).toContain("not blocking");
  });

  test("a gate set to false in harness.json is skipped", () => {
    setTypecheck('echo "src/a.ts(1,1): error TS2322: nope"; exit 2');
    sh("git add -A");
    writeFileSync(
      join(repo, ".claude/harness.json"),
      JSON.stringify({ gates: { typecheck: false } }),
    );
    expect(bash('git commit -m "a"').code).toBe(0);
    writeFileSync(join(repo, ".claude/harness.json"), "{}");
    setTypecheck("true");
    sh("git add -A && git commit -qm a");
  });

  test("ignores commands that are neither commit nor push", () => {
    expect(bash("git status").code).toBe(0);
    expect(bash('echo "git commit is a phrase"; ls').code).toBeLessThan(3);
  });
});

describe("pre-edit gate", () => {
  test("blocks env files and lockfiles, allows templates and source", () => {
    expect(edit(".env").code).toBe(2);
    expect(edit(".env.local").code).toBe(2);
    expect(edit("bun.lock").code).toBe(2);
    expect(edit(".env.example").code).toBe(0);
    expect(edit("src/env.ts").code).toBe(0);
  });
});

describe("post-edit test run", () => {
  const post = (file: string) =>
    hook("post-edit.sh", { tool_input: { file_path: join(repo, file) } });

  test("exit 2 with the failure when the sibling test fails, 0 when it passes", () => {
    writeFileSync(
      join(repo, "src/sum.ts"),
      "export const sum = (a: number, b: number) => a - b;\n",
    );
    writeFileSync(
      join(repo, "src/sum.test.ts"),
      'import { expect, test } from "bun:test";\nimport { sum } from "./sum";\ntest("sum", () => expect(sum(1, 2)).toBe(3));\n',
    );
    const bad = post("src/sum.ts");
    expect(bad.code).toBe(2);
    expect(bad.err).toContain("Test failed");
    writeFileSync(
      join(repo, "src/sum.ts"),
      "export const sum = (a: number, b: number) => a + b;\n",
    );
    expect(post("src/sum.ts").code).toBe(0);
  });

  test("stays silent for a file with no test", () => {
    writeFileSync(join(repo, "src/lonely.ts"), "export const x = 1;\n");
    const r = post("src/lonely.ts");
    expect(r.code).toBe(0);
    expect(r.out + r.err).toBe("");
  });
});

describe("secret-scan", () => {
  const scan = (diff: string) =>
    Bun.spawnSync(["bash", join(hooksDir, "secret-scan.sh")], {
      stdin: Buffer.from(diff),
      stdout: "pipe",
    }).exitCode;

  test("flags known key formats, long literal assignments and credentialed DB URLs", () => {
    expect(scan(`+++ b/src/a.ts\n+const k = "${FAKE_GITHUB_TOKEN}";\n`)).toBe(
      1,
    );
    expect(
      scan('+++ b/src/a.ts\n+  apiKey: "Zx9Kq2Lm8Vb4Nc7Ht1Rw5Yp3Jd6Fg0Sa",\n'),
    ).toBe(1);
    expect(
      scan(
        "+++ b/a.sh\n+DATABASE_URL=postgres://app:Sup3rS3cretPw@db.internal/prod\n",
      ),
    ).toBe(1);
  });

  test("a placeholder word elsewhere on the line does not hide a real key", () => {
    expect(
      scan(
        `+++ b/src/a.ts\n+const apiKey = process.env.STRIPE_KEY || "${FAKE_STRIPE_KEY}";\n`,
      ),
    ).toBe(1);
    expect(
      scan(
        `+++ b/src/a.ts\n+const k = "${FAKE_GITHUB_TOKEN}"; // not an example\n`,
      ),
    ).toBe(1);
    expect(
      scan(
        `+++ b/src/a.ts\n+const c = { host: "localhost", apiKey: "Zx9Kq2Lm8Vb4Nc7Ht1Rw5Yp3Jd6Fg0Sa" };\n`,
      ),
    ).toBe(1);
  });

  test("placeholder identifiers and local DB hosts stay exempt", () => {
    expect(
      scan(
        '+++ b/src/a.ts\n+const test_secret = "Zx9Kq2Lm8Vb4Nc7Ht1Rw5Yp3Jd6Fg0Sa";\n',
      ),
    ).toBe(0);
    expect(
      scan(
        '+++ b/src/a.ts\n+const fakeToken = "Zx9Kq2Lm8Vb4Nc7Ht1Rw5Yp3Jd6Fg0Sa";\n',
      ),
    ).toBe(0);
    expect(
      scan(
        "+++ b/a.sh\n+DATABASE_URL=postgres://postgres:postgres@localhost:5432/app\n",
      ),
    ).toBe(0);
    expect(
      scan('+++ b/src/a.ts\n+  apiKey: "your-api-key-goes-here-0000",\n'),
    ).toBe(0);
  });

  test("ignores tests, fixtures, placeholders, env lookups and allow-marked lines", () => {
    expect(
      scan(
        '+++ b/src/a.test.ts\n+  apiKey: "Zx9Kq2Lm8Vb4Nc7Ht1Rw5Yp3Jd6Fg0Sa",\n',
      ),
    ).toBe(0);
    expect(
      scan(
        '+++ b/src/a.ts\n+const secret = "small-crm-fixture-cron-secret";\n',
      ),
    ).toBe(0);
    expect(scan("+++ b/src/a.ts\n+const token = process.env.TOKEN;\n")).toBe(0);
    expect(
      scan("+++ b/a.sh\n+DATABASE_URL=postgres://user:pass@localhost/db\n"),
    ).toBe(0);
    expect(
      scan(
        '+++ b/src/a.ts\n+  apiKey: "Zx9Kq2Lm8Vb4Nc7Ht1Rw5Yp3Jd6Fg0Sa", // gitleaks:allow\n',
      ),
    ).toBe(0);
  });
});
