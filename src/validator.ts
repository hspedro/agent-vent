import { MAX_BODY_CHARS } from "./config.js";

const IMAGE_MD = /!\[[^\]]*\]\([^)]*\)/g;
const DATA_URI = /data:[^\s)]+/g;
const NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

export interface ValidationError {
  code: "too_long" | "binary_content" | "empty";
  message: string;
}

export interface ValidationOk {
  body: string;
}

export function validateBody(
  input: string,
): { ok: true; value: ValidationOk } | { ok: false; error: ValidationError } {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: { code: "empty", message: "vent body is empty" } };
  }
  if (NON_PRINTABLE.test(trimmed)) {
    return {
      ok: false,
      error: {
        code: "binary_content",
        message: "vent body contains non-printable bytes",
      },
    };
  }
  const stripped = trimmed.replace(IMAGE_MD, "").replace(DATA_URI, "").trim();
  if (stripped.length > MAX_BODY_CHARS) {
    return {
      ok: false,
      error: {
        code: "too_long",
        message: `vent body is ${stripped.length} chars; cap is ${MAX_BODY_CHARS}`,
      },
    };
  }
  return { ok: true, value: { body: stripped } };
}
