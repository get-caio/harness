#!/usr/bin/env bun
// MCP server exposing the deterministic phase-coordination planner as a first-class tool.
//
// DEPENDENCY-FREE BY DESIGN. An installed plugin ships only the `.claude/` tree with no
// node_modules, so this server cannot import an MCP SDK. The MCP stdio transport is just
// newline-delimited JSON-RPC 2.0, which we speak directly with process.stdin/stdout.
//
// It owns only the deterministic planning (where the real bugs lived — stale base, wave
// ordering, cascade). Spawning feature agents and merging stays in the /coordinate command
// loop, because an MCP server cannot spawn Claude subagents.

import { planWaves, type Ticket } from "./wave-planner";

const SERVER_INFO = { name: "coordinate", version: "1.0.0" };

const PLAN_WAVES_TOOL = {
  name: "plan_waves",
  description:
    "Compute a dependency-ordered, file-disjoint wave plan for parallel ticket execution " +
    "in a phase. Returns { waves, deferredByDependency }: each wave is file-disjoint tickets " +
    "to run in parallel (<= maxParallel, capped 3); blockage cascades to dependents; DONE and " +
    "cross-phase deps count as satisfied. Run waves sequentially, merging each before spawning " +
    "the next so later worktrees branch from a HEAD containing earlier work.",
  inputSchema: {
    type: "object",
    properties: {
      tickets: {
        type: "array",
        description: "Parsed phase tickets.",
        items: {
          type: "object",
          required: ["id", "status", "dependsOn", "files"],
          properties: {
            id: { type: "string" },
            title: { type: "string" },
            size: { type: "string", enum: ["S", "M", "L", "XL"] },
            status: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "BLOCKED", "DONE", "SKIPPED"],
            },
            dependsOn: { type: "array", items: { type: "string" } },
            files: {
              type: "array",
              items: { type: "string" },
              description:
                "Directory-granular ownership paths the ticket will write.",
            },
            blockedByDecision: { type: ["string", "null"] },
          },
        },
      },
      maxParallel: {
        type: "number",
        description: "Max parallel agents per wave (1-3, default 3).",
      },
    },
    required: ["tickets"],
  },
};

// Fail loudly on malformed input rather than silently producing a wrong plan.
function validateTickets(value: unknown): Ticket[] {
  if (!Array.isArray(value))
    throw new Error("`tickets` must be an array of ticket objects.");
  return value.map((t, i) => {
    if (typeof t !== "object" || t === null)
      throw new Error(`tickets[${i}] is not an object.`);
    const o = t as Record<string, unknown>;
    if (typeof o.id !== "string")
      throw new Error(`tickets[${i}].id must be a string.`);
    if (typeof o.status !== "string")
      throw new Error(`tickets[${String(o.id ?? i)}].status must be a string.`);
    if (!Array.isArray(o.dependsOn))
      throw new Error(`tickets[${String(o.id)}].dependsOn must be an array.`);
    if (!Array.isArray(o.files))
      throw new Error(`tickets[${String(o.id)}].files must be an array.`);
    return o as unknown as Ticket;
  });
}

interface Rpc {
  jsonrpc: "2.0";
  id?: number | string | null;
  method?: string;
  params?: Record<string, unknown>;
}

function send(msg: Record<string, unknown>): void {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...msg }) + "\n");
}
function result(id: Rpc["id"], res: unknown): void {
  send({ id, result: res });
}

function callPlanWaves(params: Record<string, unknown> | undefined) {
  if (params?.name !== "plan_waves")
    return {
      isError: true,
      content: [
        { type: "text", text: `Unknown tool: ${String(params?.name)}` },
      ],
    };
  try {
    const args = (params?.arguments ?? {}) as Record<string, unknown>;
    const tickets = validateTickets(args.tickets);
    const maxParallel =
      typeof args.maxParallel === "number" ? args.maxParallel : 3;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(planWaves(tickets, maxParallel), null, 2),
        },
      ],
    };
  } catch (e) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `plan_waves failed: ${e instanceof Error ? e.message : String(e)}`,
        },
      ],
    };
  }
}

function handle(req: Rpc): void {
  const { id, method, params } = req;
  switch (method) {
    case "initialize":
      return result(id, {
        protocolVersion: (params?.protocolVersion as string) ?? "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case "notifications/initialized":
    case "initialized":
      return; // notification — no response
    case "ping":
      return result(id, {});
    case "tools/list":
      return result(id, { tools: [PLAN_WAVES_TOOL] });
    case "tools/call":
      return result(id, callPlanWaves(params));
    default:
      if (id !== undefined && id !== null)
        send({
          id,
          error: {
            code: -32601,
            message: `Method not found: ${String(method)}`,
          },
        });
  }
}

let buffer = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk: string) => {
  buffer += chunk;
  let nl: number;
  while ((nl = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let req: Rpc;
    try {
      req = JSON.parse(line) as Rpc;
    } catch {
      continue; // skip malformed line, keep the server alive
    }
    handle(req);
  }
});
process.stdin.on("end", () => process.exit(0));
