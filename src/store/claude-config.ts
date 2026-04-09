// src/store/claude-config.ts

import { existsSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { Provider, ScenarioModels } from "../types.js";
import { findModel } from "./config-store.js";

const CLAUDE_SETTINGS = join(homedir(), ".claude", "settings.json");

interface ClaudeSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

export function activateModel(
  store: { providers: Provider[] },
  modelId: string,
  scenarioModels: ScenarioModels,
): void {
  const dir = join(homedir(), ".claude");
  if (!existsSync(dir)) {
    return;
  }

  const resolved = findModel(store, modelId);
  if (!resolved) return;

  const { provider, modelId: resolvedModelId } = resolved;

  let settings: ClaudeSettings = {};
  if (existsSync(CLAUDE_SETTINGS)) {
    try {
      settings = JSON.parse(readFileSync(CLAUDE_SETTINGS, "utf8"));
    } catch {
      settings = {};
    }
  }

  // Determine which auth env var to use based on existing settings
  // Priority: ANTHROPIC_AUTH_TOKEN > ANTHROPIC_API_KEY
  const existingEnv = settings.env || {};
  const hasAuthToken = "ANTHROPIC_AUTH_TOKEN" in existingEnv;
  const hasApiKey = "ANTHROPIC_API_KEY" in existingEnv;

  const env: Record<string, string> = { ...existingEnv };

  if (hasAuthToken) {
    // Prefer AUTH_TOKEN, remove API_KEY if both exist
    env.ANTHROPIC_AUTH_TOKEN = provider.apiKey;
    delete env.ANTHROPIC_API_KEY;
  } else if (hasApiKey) {
    env.ANTHROPIC_API_KEY = provider.apiKey;
  } else {
    // Default to AUTH_TOKEN for new setups
    env.ANTHROPIC_AUTH_TOKEN = provider.apiKey;
  }

  env.ANTHROPIC_BASE_URL = provider.baseUrl;
  env.ANTHROPIC_MODEL = resolvedModelId;

  // Set scenario model IDs: use configured mapping, or fall back to current model
  const scenarioEntries: [keyof ScenarioModels, string][] = [
    ["opusModelId", "ANTHROPIC_DEFAULT_OPUS_MODEL"],
    ["sonnetModelId", "ANTHROPIC_DEFAULT_SONNET_MODEL"],
    ["haikuModelId", "ANTHROPIC_DEFAULT_HAIKU_MODEL"],
    ["subagentModelId", "CLAUDE_CODE_SUBAGENT_MODEL"],
  ];

  for (const [scenarioKey, envVar] of scenarioEntries) {
    const configuredModelId = scenarioModels[scenarioKey];
    if (configuredModelId) {
      const r = findModel(store, configuredModelId);
      if (r) env[envVar] = r.modelId;
    } else {
      // Not configured — default to current model
      env[envVar] = resolvedModelId;
    }
  }

  settings.env = env;

  const tmpPath = CLAUDE_SETTINGS + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
  renameSync(tmpPath, CLAUDE_SETTINGS);
}

export function getActiveModelName(): string | null {
  if (!existsSync(CLAUDE_SETTINGS)) return null;
  try {
    const settings: ClaudeSettings = JSON.parse(
      readFileSync(CLAUDE_SETTINGS, "utf8"),
    );
    return settings.env?.ANTHROPIC_BASE_URL || null;
  } catch {
    return null;
  }
}
