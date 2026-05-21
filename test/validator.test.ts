import { describe, it, expect } from "vitest";
import { validateBody } from "../src/validator.js";
import { MAX_BODY_CHARS } from "../src/config.js";

describe("validateBody", () => {
  it("accepts a normal markdown body", () => {
    const result = validateBody("the `foo` tool returned a 500 with no body");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.body).toContain("foo");
    }
  });

  it("rejects empty input", () => {
    const result = validateBody("   \n  ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("empty");
  });

  it("strips image markdown", () => {
    const input = "before ![alt text](https://example.com/x.png) after";
    const result = validateBody(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.body).not.toContain("![");
      expect(result.value.body).not.toContain("example.com");
    }
  });

  it("strips data: URIs", () => {
    const input = "see data:image/png;base64,AAAA here";
    const result = validateBody(input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.body).not.toContain("data:");
  });

  it("rejects bodies over the cap", () => {
    const input = "x".repeat(MAX_BODY_CHARS + 1);
    const result = validateBody(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("too_long");
  });

  it("rejects non-printable bytes", () => {
    const result = validateBody("hello\x00world");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("binary_content");
  });

  it("accepts body that exceeds cap pre-strip but fits post-strip", () => {
    const filler = "x".repeat(MAX_BODY_CHARS - 10);
    const input = `${filler} ![big](data:image/png;base64,${"A".repeat(500)})`;
    const result = validateBody(input);
    expect(result.ok).toBe(true);
  });
});
