# cc-hub

A terminal TUI tool for managing Claude Code model configurations. Switch between LLM providers and models without manually editing config files.

## Features

- Switch active model with one key press
- Toggle between global and local scope (Tab)
- Manage multiple providers and models
- Map Claude Code role aliases (opus/sonnet/haiku/subagent) to any model
- Atomic config writes to prevent corruption
- JSON5 config file with comment support

## Demo

![cc-hub demo](demo.gif)

## Install

```bash
npm install -g cc-hub
```

Or run without installing:

```bash
npx cc-hub
```

## Usage

Run the TUI:

```bash
cc-hub
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate models |
| `Enter` | Switch to selected model |
| `Tab` | Toggle global/local scope |
| `d` | Delete selected model |
| `s` | Scenario alias mapping |
| `q` | Quit |

### Scope

Press `Tab` to toggle between **Global** and **Local** scope:

- **Global** — writes to `~/.claude/settings.json` (affects all projects)
- **Local** — writes to `.claude/settings.local.json` in the current project directory (project-specific)

### Scenario Mapping

Press `s` to map Claude Code's built-in aliases to your models:

| Alias | Env Var |
|-------|---------|
| Opus | `ANTHROPIC_DEFAULT_OPUS_MODEL` |
| Sonnet | `ANTHROPIC_DEFAULT_SONNET_MODEL` |
| Haiku | `ANTHROPIC_DEFAULT_HAIKU_MODEL` |
| Subagent | `CLAUDE_CODE_SUBAGENT_MODEL` |

## Configuration

Edit `~/.cc-hub/config.json` to add providers:

```jsonc
{
  "providers": [
    {
      "id": "dashscope",
      "name": "DashScope",
      "baseUrl": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "apiKey": "sk-your-api-key",
      "models": ["qwen3.6-plus", "qwen-max"]
    },
    {
      "id": "deepseek",
      "name": "DeepSeek",
      "baseUrl": "https://api.deepseek.com/v1",
      "apiKey": "sk-your-api-key",
      "models": ["deepseek-chat", "deepseek-reasoner"]
    }
  ]
}
```

When you select a model, cc-hub writes the provider's credentials and model ID into Claude's settings file (global or local, depending on current scope). **Restart Claude Code for the change to take effect.**

### How It Works

cc-hub derives all active state from Claude's settings file (`~/.claude/settings.json` or `.claude/settings.local.json`):

- **Active Provider** — matched by comparing `apiKey` with `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY`
- **Active Model** — read from `ANTHROPIC_MODEL`
- **Scenario Mappings** — read from `ANTHROPIC_DEFAULT_*_MODEL` env vars
- **Scope** — auto-detected based on existence of local settings file

This means you can manually edit Claude's settings file and cc-hub will always display the current state accurately.

## Development

```bash
pnpm run dev        # Build and run
pnpm run dev:watch  # Auto-rebuild on file changes
```

## License

MIT
