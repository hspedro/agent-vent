import { describe, it, expect, vi } from "vitest";
import { MacOsNotifier, buildOsascriptArgs } from "../src/notifier/macos.js";
import type { Vent } from "../src/vent.js";

const baseVent: Vent = {
  ts: "2026-05-21T12:00:00.000Z",
  cwd: "/x",
  category: "tooling",
  severity: "high",
  body: "the foo tool fails with 'oops' and stops",
};

describe("buildOsascriptArgs", () => {
  it("returns -e plus a single AppleScript string", () => {
    const args = buildOsascriptArgs(baseVent);
    expect(args[0]).toBe("-e");
    expect(args[1]).toContain("display notification");
    expect(args[1]).toContain("Agent vent");
    expect(args[1]).toContain("tooling");
    expect(args[1]).toContain("high");
  });

  it("escapes double quotes", () => {
    const args = buildOsascriptArgs({
      ...baseVent,
      body: 'tool says "no" repeatedly',
    });
    expect(args[1]).toContain('\\"no\\"');
  });

  it("truncates long previews", () => {
    const args = buildOsascriptArgs({ ...baseVent, body: "x".repeat(500) });
    expect(args[1].length).toBeLessThan(500);
    expect(args[1]).toContain("…");
  });

  it("collapses whitespace into single spaces in the preview", () => {
    const args = buildOsascriptArgs({
      ...baseVent,
      body: "line1\n\n\nline2\tline3",
    });
    expect(args[1]).toContain("line1 line2 line3");
  });
});

describe("MacOsNotifier", () => {
  it("invokes osascript with the built args", async () => {
    const run = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
    const notifier = new MacOsNotifier(run);
    await notifier.notify(baseVent);
    expect(run).toHaveBeenCalledTimes(1);
    const [bin, args] = run.mock.calls[0];
    expect(bin).toBe("osascript");
    expect(args[0]).toBe("-e");
  });
});
