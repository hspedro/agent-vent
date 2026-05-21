import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("defaults to macOS notifier and Application Support paths", () => {
    const cfg = loadConfig({});
    expect(cfg.notifiers).toEqual(["macos"]);
    expect(cfg.jsonlPath).toContain("agent-vent");
    expect(cfg.markdownPath.endsWith("vents.md")).toBe(true);
  });

  it("honours VENT_DATA_DIR override", () => {
    const cfg = loadConfig({ VENT_DATA_DIR: "/tmp/vent-test" });
    expect(cfg.jsonlPath).toBe("/tmp/vent-test/vents.jsonl");
  });

  it("parses VENT_NOTIFIERS csv and filters unknowns", () => {
    const cfg = loadConfig({ VENT_NOTIFIERS: "macos, gchat, bogus" });
    expect(cfg.notifiers).toEqual(["macos", "gchat"]);
  });
});
