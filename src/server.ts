import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { FileStorage } from "./storage.js";
import type { Notifier } from "./notifier/index.js";
import { MacOsNotifier } from "./notifier/macos.js";
import { GChatNotifier } from "./notifier/gchat.js";
import { registerVentTool } from "./tool.js";

const PKG_NAME = "agent-vent";
const PKG_VERSION = "0.1.0";

function buildNotifiers(
  names: ReturnType<typeof loadConfig>["notifiers"],
  gchatWebhook: string | undefined,
): Notifier[] {
  return names.map((name) => {
    switch (name) {
      case "macos":
        return new MacOsNotifier();
      case "gchat":
        return new GChatNotifier(gchatWebhook);
    }
  });
}

export async function start(): Promise<void> {
  const config = loadConfig();
  const storage = new FileStorage(config.jsonlPath, config.markdownPath);
  const notifiers = buildNotifiers(config.notifiers, config.gchatWebhook);

  const server = new McpServer({ name: PKG_NAME, version: PKG_VERSION });
  registerVentTool(server, {
    storage,
    notifiers,
    clientName: () => server.server.getClientVersion()?.name,
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(
    `[agent-vent] ready. log: ${config.markdownPath}\n`,
  );
}
