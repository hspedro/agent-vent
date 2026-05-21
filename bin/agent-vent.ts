#!/usr/bin/env node
import { start } from "../src/server.js";

start().catch((err) => {
  process.stderr.write(
    `[agent-vent] fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
  );
  process.exit(1);
});
