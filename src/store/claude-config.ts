// src/store/claude-config.ts

import { existsSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ModelConfig } from "../types.js";

const CLAUDE_SETTINGS = join(homedir(), ".claude", "settings.json");

interface ClaudeSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

export function activateModel(model: ModelConfig): void {
  const dir = join(homedir(), ".claude");
  if (!existsSync(dir)) {
    // Claude not installed — skip silently
    return;
  }

  let settings: ClaudeSettings = {};
  if (existsSync(CLAUDE_SETTINGS)) {
    try {
      settings = JSON.parse(readFileSync(CLAUDE_SETTINGS, "utf8"));
    } catch {
      // Corrupted — start fresh
      settings = {};
    }
  }

  settings.env = {
    ...(settings.env || {}),
    ANTHROPIC_API_KEY: model.apiKey,
    ANTHROPIC_BASE_URL: model.baseUrl,
    ...(model.modelId ? { ANTHROPIC_MODEL: model.modelId } : {}),
  };

  const tmpPath = CLAUDE_SETTINGS + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
  renameSync(tmpPath, CLAUDE_SETTINGS);
}

export function getActiveModelName(): string | null {
  if (!existsSync(CLAUDE_SETTINGS)) return null;
  try {
    const settings: ClaudeSettings = JSON.parse(readFileSync(CLAUDE_SETTINGS, "utf8"));
    return settings.env?.ANTHROPIC_BASE_URL || null;
  } catch {
    return null;
  }
}
