import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Vent } from "../vent.js";
import type { Notifier } from "./index.js";

const execFileAsync = promisify(execFile);

const BANNER_PREVIEW_CHARS = 120;

function escapeForAppleScript(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function preview(body: string): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  if (oneLine.length <= BANNER_PREVIEW_CHARS) return oneLine;
  return oneLine.slice(0, BANNER_PREVIEW_CHARS - 1) + "…";
}

export function buildOsascriptArgs(vent: Vent): string[] {
  const message = escapeForAppleScript(preview(vent.body));
  const title = "Agent vent";
  const subtitle = escapeForAppleScript(
    `${vent.category} · ${vent.severity}`,
  );
  const script = `display notification "${message}" with title "${title}" subtitle "${subtitle}"`;
  return ["-e", script];
}

export type ExecFile = (
  file: string,
  args: string[],
) => Promise<{ stdout: string; stderr: string }>;

export class MacOsNotifier implements Notifier {
  readonly name = "macos";

  constructor(private readonly run: ExecFile = execFileAsync) {}

  async notify(vent: Vent): Promise<void> {
    await this.run("osascript", buildOsascriptArgs(vent));
  }
}
