import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { SkillEntry } from "./types";

const SKILLS_DIR = join(import.meta.dir, "../.claude/skills");

/** Extract frontmatter description or first paragraph as description */
function extractDescription(content: string): string {
  // Try YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const descMatch = fmMatch[1].match(/description:\s*["']?(.*?)["']?\s*$/m);
    if (descMatch) return descMatch[1];
  }

  // Fall back to first paragraph after the title
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith("#") && !line.startsWith("---")) {
      return line.slice(0, 200);
    }
  }

  return "(no description)";
}

/** Load a single skill's content */
export async function loadSkill(name: string): Promise<string> {
  const path = join(SKILLS_DIR, name, "SKILL.md");
  return Bun.file(path).text();
}

/** Load the full skill catalog (name + description for retrieval eval) */
export async function loadSkillCatalog(): Promise<SkillEntry[]> {
  const entries = await readdir(SKILLS_DIR, { withFileTypes: true });
  const skills: SkillEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(SKILLS_DIR, entry.name, "SKILL.md");
    try {
      const content = await Bun.file(skillPath).text();
      skills.push({
        name: entry.name,
        description: extractDescription(content),
        content,
      });
    } catch {
      // Skip directories without SKILL.md
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

/** Format catalog as a concise list for the retrieval eval prompt */
export function formatCatalogForPrompt(catalog: SkillEntry[]): string {
  return catalog.map((s) => `- **${s.name}**: ${s.description}`).join("\n");
}
