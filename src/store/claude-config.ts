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
import { ConfigStore, Provider, Scope } from "../types.js";

// Scenario model alias mappings (stored in settings.json, not config.json)
interface ScenarioModels {
  opusModelId?: string;
  sonnetModelId?: string;
  haikuModelId?: string;
  subagentModelId?: string;
}

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

/**
 * Detect scope based on existence of local settings file.
 * If .claude/settings.local.json exists in cwd, use "local", otherwise "global".
 */
export function detectScope(cwd?: string): Scope {
  const localPath = join(cwd ?? process.cwd(), ".claude", "settings.local.json");
  return existsSync(localPath) ? "local" : "global";
}

export function activateModel(
  provider: Provider,
  modelId: string,
  options?: ActivateOptions,
): void {
  const scope = options?.scope ?? detectScope(options?.cwd);
  const targetPath = resolveSettingsPath(scope, options?.cwd);

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
  env.ANTHROPIC_MODEL = modelId;

  // Always set scenario model IDs to current model
  env.ANTHROPIC_DEFAULT_OPUS_MODEL = modelId;
  env.ANTHROPIC_DEFAULT_SONNET_MODEL = modelId;
  env.ANTHROPIC_DEFAULT_HAIKU_MODEL = modelId;
  env.CLAUDE_CODE_SUBAGENT_MODEL = modelId;

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

export function getActiveInfo(
  scope: Scope = "global",
  cwd?: string,
): { modelId: string | null; baseUrl: string | null } {
  const targetPath = resolveSettingsPath(scope, cwd);
  if (!existsSync(targetPath)) return { modelId: null, baseUrl: null };
  try {
    const settings: ClaudeSettings = JSON.parse(
      readFileSync(targetPath, "utf8"),
    );
    return {
      modelId: settings.env?.ANTHROPIC_MODEL || null,
      baseUrl: settings.env?.ANTHROPIC_BASE_URL || null,
    };
  } catch {
    return { modelId: null, baseUrl: null };
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

/**
 * Get the currently active provider and model from Claude settings.
 * Matches provider by comparing apiKey with ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY.
 */
export function getActiveProviderAndModel(
  store: Pick<ConfigStore, "providers">,
  scope: Scope = "global",
  cwd?: string,
): { provider: Provider | null; modelId: string | null } {
  const targetPath = resolveSettingsPath(scope, cwd);
  if (!existsSync(targetPath)) {
    return { provider: null, modelId: null };
  }

  try {
    const settings: ClaudeSettings = JSON.parse(
      readFileSync(targetPath, "utf8"),
    );
    const env = settings.env ?? {};

    const authToken = env.ANTHROPIC_AUTH_TOKEN || env.ANTHROPIC_API_KEY;
    const modelId = env.ANTHROPIC_MODEL || null;

    if (!authToken) {
      return { provider: null, modelId };
    }

    const provider =
      store.providers.find((p) => p.apiKey === authToken) || null;
    return { provider, modelId };
  } catch {
    return { provider: null, modelId: null };
  }
}

/**
 * Save scenario model mappings to settings.json
 */
export function saveScenarioModels(
  updates: ScenarioModels,
  scope: Scope = "global",
  cwd?: string,
): void {
  const targetPath = resolveSettingsPath(scope, cwd);
  if (!existsSync(targetPath)) return;

  try {
    const settings: ClaudeSettings = JSON.parse(
      readFileSync(targetPath, "utf8"),
    );
    const env = settings.env ?? {};

    const scenarioEntries: [keyof ScenarioModels, string][] = [
      ["opusModelId", "ANTHROPIC_DEFAULT_OPUS_MODEL"],
      ["sonnetModelId", "ANTHROPIC_DEFAULT_SONNET_MODEL"],
      ["haikuModelId", "ANTHROPIC_DEFAULT_HAIKU_MODEL"],
      ["subagentModelId", "CLAUDE_CODE_SUBAGENT_MODEL"],
    ];

    for (const [key, envVar] of scenarioEntries) {
      const value = updates[key];
      if (value) {
        env[envVar] = value;
      } else {
        delete env[envVar];
      }
    }

    settings.env = env;

    const tmpPath = targetPath + ".tmp";
    writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
    renameSync(tmpPath, targetPath);
  } catch {
    // Ignore write errors
  }
}
