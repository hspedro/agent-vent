import fs from "node:fs/promises";
import path from "node:path";
import type { Vent } from "./vent.js";

export interface Storage {
  append(vent: Vent): Promise<void>;
}

export function jsonlLine(vent: Vent): string {
  return JSON.stringify(vent) + "\n";
}

export function markdownBlock(vent: Vent): string {
  const client = vent.client ? ` · \`${vent.client}\`` : "";
  return [
    `## ${vent.ts} · ${vent.category} · ${vent.severity}${client}`,
    `**cwd**: \`${vent.cwd}\``,
    "",
    vent.body,
    "",
    "---",
    "",
  ].join("\n");
}

export class FileStorage implements Storage {
  constructor(
    private readonly jsonlPath: string,
    private readonly markdownPath: string,
  ) {}

  async append(vent: Vent): Promise<void> {
    await fs.mkdir(path.dirname(this.jsonlPath), { recursive: true });
    await Promise.all([
      fs.appendFile(this.jsonlPath, jsonlLine(vent), "utf8"),
      fs.appendFile(this.markdownPath, markdownBlock(vent), "utf8"),
    ]);
  }
}
