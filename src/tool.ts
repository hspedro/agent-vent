import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { validateBody } from "./validator.js";
import type { Storage } from "./storage.js";
import type { Notifier } from "./notifier/index.js";
import { dispatch } from "./notifier/index.js";
import type { Vent, Category, Severity } from "./vent.js";

export const VENT_DESCRIPTION = [
  "Use `vent` ONCE when tooling, docs, or platform behavior materially slows or degrades your work.",
  "",
  "Good reasons to vent:",
  "- missing or unsuitable tools",
  "- unclear tool names, parameters, or schemas",
  "- confusing or conflicting docs or instructions",
  "- broken or unexpected platform behavior",
  "- repeated failed attempts caused by environment limitations",
  "",
  "Do NOT use for transient issues you can work around, or to apologize for past vents.",
  "Be concrete: name the tool/doc/file, describe what you expected vs got. Markdown OK. 2000 char cap.",
].join("\n");

const inputSchema = {
  body: z
    .string()
    .min(1)
    .max(2000)
    .describe(
      "Free-text frustration in markdown, up to 2000 chars. Be concrete about what blocked you.",
    ),
  category: z
    .enum(["tooling", "docs", "platform", "env", "other"])
    .optional()
    .describe("What kind of friction this is."),
  severity: z
    .enum(["low", "medium", "high"])
    .optional()
    .describe("How much this slowed you down."),
};

export interface ToolDeps {
  storage: Storage;
  notifiers: Notifier[];
  clientName?: () => string | undefined;
  now?: () => Date;
}

export function registerVentTool(server: McpServer, deps: ToolDeps): void {
  server.registerTool(
    "vent",
    {
      title: "Vent frustration",
      description: VENT_DESCRIPTION,
      inputSchema,
    },
    async (args) => {
      const result = validateBody(args.body);
      if (!result.ok) {
        return {
          isError: true,
          content: [{ type: "text", text: result.error.message }],
        };
      }
      const vent: Vent = {
        ts: (deps.now ?? (() => new Date()))().toISOString(),
        cwd: process.cwd(),
        client: deps.clientName?.(),
        category: (args.category ?? "other") as Category,
        severity: (args.severity ?? "medium") as Severity,
        body: result.value.body,
      };
      await deps.storage.append(vent);
      await dispatch(deps.notifiers, vent);
      return {
        content: [
          {
            type: "text",
            text: `Vent recorded (${vent.category}/${vent.severity}, ${vent.body.length} chars).`,
          },
        ],
      };
    },
  );
}
