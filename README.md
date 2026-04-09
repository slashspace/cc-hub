# cc-hub

A terminal TUI tool for managing Claude Code model configurations. Switch between LLM providers and models without manually editing config files.

## Features

- Switch active model with one key press
- Manage multiple providers and models
- Map Claude Code role aliases (opus/sonnet/haiku/subagent) to any model
- Atomic config writes to prevent corruption
- JSON5 config file with comment support

## Install

```bash
pnpm install
pnpm run build
```

For global install:

```bash
pnpm add -g .
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
| `d` | Delete selected model |
| `s` | Scenario alias mapping |
| `q` | Quit |

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
  ],
  "scenarioModels": {}
}
```

When you select a model, cc-hub writes the provider's credentials and model ID into `~/.claude/settings.json`. **Restart Claude Code for the change to take effect.**

## Development

```bash
pnpm run dev        # Build and run
pnpm run dev:watch  # Auto-rebuild on file changes
```

## License

MIT
