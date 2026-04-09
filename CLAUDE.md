# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**cc-hub** (binary: `cc-hub`) is a terminal TUI tool for managing Claude Code model configurations. It lets users switch between LLM providers/models without manually editing `~/.claude/settings.json`.

## Commands

```bash
pnpm run build        # Build (tsc + prepend shebang via build.mjs)
pnpm start            # Run built TUI
pnpm run dev          # Build + run in one step
pnpm run dev:watch    # Auto-rebuild + restart on source changes (nodemon)
```

There are no tests or lint commands configured.

## Architecture

**Data flow:** `~/.cc-hub/config.json` (JSON5) → in-memory `ConfigStore` → `~/.claude/settings.json` (env block)

### Config layer (`src/store/`)
- **config-store.ts** — CRUD for `~/.cc-hub/config.json`. Loads JSON5 config, saves as JSON. Key functions: `loadConfig`, `saveConfig`, `setActiveModel`, `findModel`, `updateScenarioModels`, `removeModelFromProvider`. Uses atomic writes (`.tmp` + `rename`).
- **claude-config.ts** — Writes env vars into `~/.claude/settings.json`. `activateModel()` sets `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, and scenario aliases (`ANTHROPIC_DEFAULT_OPUS_MODEL`, etc.). Detects which auth env var is already in use and preserves that choice.

### TUI layer (`src/tui/`)
- **app.tsx** — State machine routing between `dashboard` / `scenario` / `confirm` screens. Centralized `useInput` handler for all keyboard navigation. All state mutations go through handlers here.
- **dashboard.tsx** — Read-only view rendering provider/model table with selection highlight.
- **scenario-config.tsx** — Maps Claude Code role aliases (opus/sonnet/haiku/subagent) to specific model IDs. Uses left/right arrows to cycle through available models.
- **confirm.tsx** — Yes/No confirmation dialog (currently unused, confirm is rendered inline in app.tsx via Modal).

### UI components (`src/components/ui/`)
Reusable Ink components: **Table** (bordered table with `Cell[][]` API), **StatusBar** (keybinding hints bar), **Modal** (bordered overlay), **TabBar** (unused).

### Types (`src/types.ts`)
- `Provider` — API vendor with `id`, `name`, `baseUrl`, `apiKey`, `models: string[]`
- `ScenarioModels` — Optional mappings for opus/sonnet/haiku/subagent aliases
- `ConfigStore` — Full state: providers, activeProviderId, activeModelId, scenarioModels

### Build (`build.mjs`)
Runs `tsc` then prepends `#!/usr/bin/env node` to `dist/cli.js`.

## Key Design Decisions

- Config file uses JSON5 (supports comments) for user editing; saved back as plain JSON
- No model editing via TUI — users edit `~/.cc-hub/config.json` directly to add/modify providers
- When a model is selected on the dashboard, all four scenario aliases are synced to that model by default
- Switching models writes to `~/.claude/settings.json` but requires Claude Code restart to take effect (env vars are read at startup, not hot-reloaded)
