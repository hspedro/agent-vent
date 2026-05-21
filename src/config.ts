import { homedir } from "node:os";
import path from "node:path";

export const MAX_BODY_CHARS = 2000;

export type NotifierName = "macos" | "gchat";

export interface Config {
  dataDir: string;
  jsonlPath: string;
  markdownPath: string;
  notifiers: NotifierName[];
  gchatWebhook?: string;
}

const DEFAULT_DATA_DIR = path.join(
  homedir(),
  "Library",
  "Application Support",
  "agent-vent",
);

function parseNotifiers(raw: string | undefined): NotifierName[] {
  if (!raw) return ["macos"];
  const known: NotifierName[] = ["macos", "gchat"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is NotifierName => (known as string[]).includes(s));
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const dataDir = env.VENT_DATA_DIR ?? DEFAULT_DATA_DIR;
  return {
    dataDir,
    jsonlPath: path.join(dataDir, "vents.jsonl"),
    markdownPath: path.join(dataDir, "vents.md"),
    notifiers: parseNotifiers(env.VENT_NOTIFIERS),
    gchatWebhook: env.VENT_GCHAT_WEBHOOK,
  };
}
