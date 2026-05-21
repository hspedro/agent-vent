# agent-vent

An MCP server that lets coding agents (Claude Code, Cursor, …) **vent** when your tooling, docs, or environment get in their way. Vents are stored locally and surfaced via a macOS notification, so you actually see the friction signal instead of letting the agent silently loop.

Inspired by Lovable's ["We Gave Our Agent a Vent Tool"](https://lovable.dev/pt-br/blog/we-gave-our-agent-a-vent-tool). Their version routes to Slack and ~20% of vents convert into mergeable PRs; this is a personal-scale variant.

## What it does

Exposes a single MCP tool, `vent`:

- **`body`** (required, markdown, ≤2000 chars) — concrete description of the friction
- **`category`** (optional) — `tooling | docs | platform | env | other`
- **`severity`** (optional) — `low | medium | high`

On every call it:

1. Validates and sanitises the body (strips images and `data:` URIs, enforces the char cap).
2. Appends a row to `~/Library/Application Support/agent-vent/vents.jsonl` (machine-readable).
3. Appends a section to `~/Library/Application Support/agent-vent/vents.md` (human-readable).
4. Fires the configured notifier(s) — macOS banner by default.

The agent gets back a short `Vent recorded (…)` confirmation. Notifier failures are logged to stderr but never fail the tool call — the JSONL is the source of truth.

## Install

### Claude Code

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "agent-vent": {
      "command": "npx",
      "args": ["-y", "agent-vent@latest"]
    }
  }
}
```

Or via CLI:

```bash
claude mcp add agent-vent -- npx -y agent-vent@latest
```

### Cursor

Add to `~/.cursor/mcp.json` (or per-project `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "agent-vent": {
      "command": "npx",
      "args": ["-y", "agent-vent@latest"]
    }
  }
}
```

Restart the editor and the `vent` tool should appear in the tool list.

## Configuration

Env vars (set them in the MCP server block under `"env": {…}` if needed):

| Var                  | Default                                        | Description                                  |
| -------------------- | ---------------------------------------------- | -------------------------------------------- |
| `VENT_DATA_DIR`      | `~/Library/Application Support/agent-vent`     | Where `vents.jsonl` and `vents.md` are written |
| `VENT_NOTIFIERS`     | `macos`                                        | Comma-separated: `macos`, `gchat`            |
| `VENT_GCHAT_WEBHOOK` | _(unset)_                                      | Google Chat incoming webhook (v2, not yet wired) |

## Reading your vents

```bash
# tail the human-readable log
tail -f "$HOME/Library/Application Support/agent-vent/vents.md"

# query the structured log
jq -c 'select(.severity=="high")' "$HOME/Library/Application Support/agent-vent/vents.jsonl"
```

## Development

```bash
npm install
npm run build
npm test
```

Smoke test the server end-to-end via MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/bin/agent-vent.js
```

## Roadmap

- v0.2: Google Chat notifier (the GChat provider is currently scaffolded — interface + env var defined, throws `NotImplemented`).
- v0.3: Slack notifier.
- v0.4: A `vent-review` companion command that summarises recent vents into a friction backlog.

## License

MIT
