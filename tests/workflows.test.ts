import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

// Structural validation for every Workflow script in .claude/workflows/.
// The Workflow runtime requires: a PURE-LITERAL `export const meta` (no variables,
// calls, or interpolation) with name/description, and bans Date.now() /
// Math.random() / argless new Date() in the script body (they would break resume).
// These tests catch a malformed script at CI time instead of at invocation time.

const WORKFLOWS_DIR = join(import.meta.dir, "../.claude/workflows");

const files = readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith(".js"));

// Grab the balanced object literal assigned to `export const meta =`.
function extractMetaSource(src: string, file: string): string {
  const anchor = "export const meta =";
  const i = src.indexOf(anchor);
  if (i === -1) throw new Error(`${file}: missing \`export const meta =\``);
  const start = src.indexOf("{", i);
  let depth = 0;
  for (let k = start; k < src.length; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}" && --depth === 0) return src.slice(start, k + 1);
  }
  throw new Error(`${file}: unbalanced meta object`);
}

describe("workflow scripts", () => {
  it("the workflows directory is not empty", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const src = readFileSync(join(WORKFLOWS_DIR, file), "utf8");

    describe(file, () => {
      // Evaluating the literal in an empty scope proves it is PURE: any reference
      // to a variable, function, or template interpolation throws here exactly as
      // it would in the Workflow runtime's meta parser.
      const meta = new Function(
        `"use strict"; return (${extractMetaSource(src, file)});`,
      )() as {
        name: string;
        description: string;
        whenToUse?: string;
        phases?: Array<{ title: string; detail?: string }>;
      };

      it("meta is a pure literal with required fields", () => {
        expect(typeof meta.name).toBe("string");
        expect(meta.name.length).toBeGreaterThan(0);
        expect(typeof meta.description).toBe("string");
        expect(meta.description.length).toBeGreaterThan(0);
      });

      it("meta.name matches the filename", () => {
        expect(meta.name).toBe(basename(file, ".js"));
      });

      it("meta.phases entries have string titles", () => {
        for (const p of meta.phases ?? []) {
          expect(typeof p.title).toBe("string");
          expect(p.title.length).toBeGreaterThan(0);
        }
      });

      it("every phase() call uses a title declared in meta.phases", () => {
        // Only literal phase("...") calls are checkable statically; dynamic
        // per-wave group labels (phase opts) are intentionally exempt.
        const declared = new Set((meta.phases ?? []).map((p) => p.title));
        const calls = [
          ...src.matchAll(/^\s*phase\(\s*["'`]([^"'`]+)["'`]\s*\)/gm),
        ].map((m) => m[1]!);
        for (const title of calls) expect(declared).toContain(title);
      });

      it("avoids resume-breaking runtime calls", () => {
        expect(src).not.toMatch(/Date\.now\s*\(/);
        expect(src).not.toMatch(/Math\.random\s*\(/);
        expect(src).not.toMatch(/new Date\s*\(\s*\)/);
      });
    });
  }
});
