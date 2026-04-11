// src/store/claude-config.ts

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { Provider, ScenarioModels, Scope } from "../types.js";
import { findModel } from "./config-store.js";

function resolveSettingsPath(scope: Scope, cwd?: string): string {
  if (scope === "local") {
    return join(cwd ?? process.cwd(), ".claude", "settings.local.json");
  }
  return join(homedir(), ".claude", "settings.json");
}

interface ClaudeSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

interface ActivateOptions {
  scope?: Scope;
  cwd?: string;
}

export function activateModel(
  store: { providers: Provider[] },
  modelId: string,
  scenarioModels: ScenarioModels,
  options?: ActivateOptions,
): void {
  const scope = options?.scope ?? "global";
  const targetPath = resolveSettingsPath(scope, options?.cwd);

  const resolved = findModel(store, modelId);
  if (!resolved) return;

  const { provider, modelId: resolvedModelId } = resolved;

  // Ensure target directory exists
  const targetDir = dirname(targetPath);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  let settings: ClaudeSettings = {};
  if (existsSync(targetPath)) {
    try {
      settings = JSON.parse(readFileSync(targetPath, "utf8"));
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

  const tmpPath = targetPath + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
  renameSync(tmpPath, targetPath);
}

export function getActiveModelName(
  scope: Scope = "global",
  cwd?: string,
): string | null {
  const targetPath = resolveSettingsPath(scope, cwd);
  if (!existsSync(targetPath)) return null;
  try {
    const settings: ClaudeSettings = JSON.parse(
      readFileSync(targetPath, "utf8"),
    );
    return settings.env?.ANTHROPIC_BASE_URL || null;
  } catch {
    return null;
  }
}

export function getSettingsPath(scope: Scope, cwd?: string): string {
  return resolveSettingsPath(scope, cwd);
}

export function getActiveModelId(
  scope: Scope = "global",
  cwd?: string,
): string | null {
  const targetPath = resolveSettingsPath(scope, cwd);
  if (!existsSync(targetPath)) return null;
  try {
    const settings: ClaudeSettings = JSON.parse(
      readFileSync(targetPath, "utf8"),
    );
    return settings.env?.ANTHROPIC_MODEL || null;
  } catch {
    return null;
  }
}

export function getScenarioModels(
  scope: Scope = "global",
  cwd?: string,
): ScenarioModels {
  const targetPath = resolveSettingsPath(scope, cwd);
  if (!existsSync(targetPath)) return {};
  try {
    const settings: ClaudeSettings = JSON.parse(
      readFileSync(targetPath, "utf8"),
    );
    const env = settings.env ?? {};
    return {
      opusModelId: env.ANTHROPIC_DEFAULT_OPUS_MODEL,
      sonnetModelId: env.ANTHROPIC_DEFAULT_SONNET_MODEL,
      haikuModelId: env.ANTHROPIC_DEFAULT_HAIKU_MODEL,
      subagentModelId: env.CLAUDE_CODE_SUBAGENT_MODEL,
    };
  } catch {
    return {};
  }
}
