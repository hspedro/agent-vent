import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { FileStorage, jsonlLine, markdownBlock } from "../src/storage.js";
import type { Vent } from "../src/vent.js";

const sampleVent: Vent = {
  ts: "2026-05-21T12:34:56.000Z",
  cwd: "/tmp/proj",
  client: "claude-code",
  category: "tooling",
  severity: "medium",
  body: "the `foo` tool 500s with no body",
};

describe("jsonlLine", () => {
  it("produces one line ending with newline", () => {
    const line = jsonlLine(sampleVent);
    expect(line.endsWith("\n")).toBe(true);
    expect(line.split("\n")).toHaveLength(2);
    expect(JSON.parse(line)).toMatchObject({
      ts: sampleVent.ts,
      category: "tooling",
      severity: "medium",
    });
  });
});

describe("markdownBlock", () => {
  it("includes ts, category, severity, cwd, body", () => {
    const block = markdownBlock(sampleVent);
    expect(block).toContain(sampleVent.ts);
    expect(block).toContain("tooling");
    expect(block).toContain("medium");
    expect(block).toContain("/tmp/proj");
    expect(block).toContain("foo` tool");
    expect(block).toContain("claude-code");
  });

  it("omits client section when absent", () => {
    const { client, ...rest } = sampleVent;
    const block = markdownBlock(rest as Vent);
    expect(block).not.toContain("claude-code");
  });
});

describe("FileStorage.append", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "agent-vent-test-"));
  });

  it("creates files and appends rows", async () => {
    const jsonlPath = path.join(dir, "sub", "vents.jsonl");
    const mdPath = path.join(dir, "sub", "vents.md");
    const storage = new FileStorage(jsonlPath, mdPath);

    await storage.append(sampleVent);
    await storage.append({ ...sampleVent, ts: "2026-05-21T12:35:00.000Z" });

    const jsonl = await fs.readFile(jsonlPath, "utf8");
    expect(jsonl.trim().split("\n")).toHaveLength(2);

    const md = await fs.readFile(mdPath, "utf8");
    expect(md.match(/^## /gm)?.length).toBe(2);
  });
});
