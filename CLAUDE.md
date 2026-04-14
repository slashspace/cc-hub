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

**Data flow:** `~/.cc-hub/config.json` (JSON5) → in-memory `ConfigStore` (providers only) → `~/.claude/settings.json` (env block)

All active state (current provider, model, scenario mappings, scope) is derived from Claude's settings file, not stored in `config.json`.

### Config layer (`src/store/`)
- **config-store.ts** — CRUD for `~/.cc-hub/config.json`. Loads JSON5 config, saves as JSON. Key functions: `loadConfig`, `saveConfig`, `findModel`, `removeModelFromProvider`. Uses atomic writes (`.tmp` + `rename`).
- **claude-config.ts** — Reads/writes env vars in `~/.claude/settings.json` or `.claude/settings.local.json`:
  - `activateModel()` — Sets `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`. Preserves existing scenario mappings.
  - `getActiveProviderAndModel()` — Derives active provider by matching `apiKey` with auth token in settings.
  - `getScenarioModels()` / `saveScenarioModels()` — Read/write scenario alias mappings.
  - `detectScope()` — Auto-detects scope based on existence of local settings file.

### TUI layer (`src/tui/`)
- **app.tsx** — State machine routing between `dashboard` / `scenario` / `confirm` screens. Centralized `useInput` handler for all keyboard navigation. Manages `scope` as local UI state (not persisted).
- **dashboard.tsx** — Read-only view rendering provider/model table. Active state derived via `getActiveProviderAndModel()`.
- **scenario-config.tsx** — Maps Claude Code role aliases to specific model IDs. Reads/writes directly to settings file.

### UI components (`src/components/ui/`)
Reusable Ink components: **Table** (bordered table with `Cell[][]` API), **StatusBar** (keybinding hints bar), **Modal** (bordered overlay), **TabBar** (scope selector).

### Types (`src/types.ts`)
- `Provider` — API vendor with `id`, `name`, `baseUrl`, `apiKey`, `models: string[]`
- `Scope` — `"global"` or `"local"`
- `ConfigStore` — Only contains `providers: Provider[]`

### Build (`build.mjs`)
Runs `tsc` then prepends `#!/usr/bin/env node` to `dist/cli.js`.

## Key Design Decisions

- **Single source of truth:** All active state lives in Claude's settings file (`~/.claude/settings.json` or `.claude/settings.local.json`). `config.json` only stores provider definitions.
- **Auto-detection:** Active provider is matched by comparing `apiKey` with `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY` in settings.
- **Scope is UI-only:** Scope is auto-detected from file existence and can be toggled via Tab key, but is not persisted to `config.json`.
- **Config file uses JSON5** (supports comments) for user editing; saved back as plain JSON
- **No model editing via TUI** — users edit `~/.cc-hub/config.json` directly to add/modify providers
- **Switching models writes to settings** but requires Claude Code restart to take effect (env vars are read at startup, not hot-reloaded)
