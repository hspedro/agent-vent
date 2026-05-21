# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run build          # tsc → dist/
npm test               # vitest run (all suites)
npm test -- test/validator.test.ts          # single file
npm test -- -t "strips image markdown"      # single test by name
npm run dev            # run server via tsx (no build step)
```

End-to-end smoke against the built server, using a temp data dir so it doesn't touch the real log:

```bash
VENT_DATA_DIR=/tmp/agent-vent-smoke node dist/bin/agent-vent.js
# pipe raw JSON-RPC frames via stdin: initialize → notifications/initialized → tools/call
```

## Architecture

This is an MCP **stdio** server (not HTTP). The editor (Claude Code / Cursor) spawns `node dist/bin/agent-vent.js` as a child and speaks JSON-RPC over its stdin/stdout. No port, no daemon.

Single tool exposed: `vent`. One request flow:

```
tool call → validator.ts (sanitise + cap) → storage.ts (JSONL + md, both append-only)
                                          ↘ notifier/index.ts dispatch (fan-out, best-effort)
                                                ├── notifier/macos.ts  (osascript banner)
                                                └── notifier/gchat.ts  (stub — throws NotImplemented)
```

Key invariants worth preserving:

- **Storage is the source of truth.** Notifier failures are caught in `dispatch()` and only logged to stderr — they never fail the tool call. If you add a provider, follow that contract.
- **Validation is a single pure function** (`validateBody`) returning a discriminated union. The tool handler turns failures into `isError: true` MCP responses, not exceptions. Keep this shape — tests rely on the `{ ok, value | error }` discriminant.
- **The 2000-char cap is post-strip.** Images and `data:` URIs are removed *before* measuring length, so a body bloated with `![…](data:…)` can still fit. See the `validator.test.ts` "exceeds cap pre-strip but fits post-strip" case.
- **Default data dir is macOS-specific** (`~/Library/Application Support/agent-vent/`). All other paths come from `VENT_DATA_DIR`. The `loadConfig` function accepts an `env` parameter to make this testable — don't read `process.env` directly inside the server modules.
- **`McpServer.registerTool` (not the deprecated `tool()`) with zod raw shapes** is what we use — the SDK is 1.29+. Inputs come back already parsed/typed.
- **Notifier interface is `{ name, notify(vent): Promise<void> }`.** New providers go under `src/notifier/`, register in `server.ts`'s `buildNotifiers` switch, and add a value to the `NotifierName` union in `config.ts`. The switch is exhaustive — TS will fail the build if you forget.

## Distribution model

`package.json` declares `"bin": { "agent-vent": "dist/bin/agent-vent.js" }` and `"files": ["dist", "README.md", "LICENSE"]`. Source lives in `bin/` (TS) and `src/`; only `dist/` ships to npm. The current install path documented in README points at `npx agent-vent@latest` (assumes published). For local-only installs, MCP configs can point at an absolute `node /abs/path/dist/bin/agent-vent.js`.

## Out of scope (deliberately)

Do not add: a `vent-retract` tool (the article callback), per-call rate limiting, a long-lived daemon, schema migrations, or a SQLite backend. v1 stays narrow on purpose — see `README.md` Roadmap and the original plan at `~/.claude/plans/i-want-to-create-abundant-otter.md`.
