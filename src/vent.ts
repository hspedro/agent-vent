export type Category = "tooling" | "docs" | "platform" | "env" | "other";
export type Severity = "low" | "medium" | "high";

export interface Vent {
  ts: string;
  cwd: string;
  client?: string;
  category: Category;
  severity: Severity;
  body: string;
}
