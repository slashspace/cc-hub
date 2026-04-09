// src/store/config-store.ts

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "fs";
import { join } from "path";
import { homedir } from "os";
import JSON5 from "json5";
import { ConfigStore, Provider, ScenarioModels } from "../types.js";

const CONFIG_DIR = join(homedir(), ".cc-model-hub");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULT_STORE: ConfigStore = {
  providers: [],
  activeProviderId: null,
  activeModelId: null,
  scenarioModels: {},
};

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function atomicWrite(filePath: string, content: string): void {
  const tmpPath = filePath + ".tmp";
  writeFileSync(tmpPath, content, "utf8");
  renameSync(tmpPath, filePath);
}

const EXAMPLE_CONFIG = `{
  // CC Model Hub configuration
  // Edit this file to add or modify providers, then restart ccmm.

  "providers": [
  //  {
  //    "id": "dashscope",
  //    "name": "DashScope",
  //    "baseUrl": "https://coding.dashscope.aliyuncs.com/apps/anthropic",
  //    "apiKey": "sk-your-api-key",
  //    "models": [
  //      "qwen3.6-plus",
  //      "qwen-max"
  //    ]
  // }
  ],

  // Optional: map Claude Code aliases (sonnet/opus/haiku) to your models.
  // These write ANTHROPIC_DEFAULT_SONNET_MODEL etc. into Claude's settings.json.
  "scenarioModels": {}
}
`;

let _configError: string | null = null;

export function getConfigError(): string | null {
  return _configError;
}

export function clearConfigError(): void {
  _configError = null;
}

export function loadConfig(): ConfigStore {
  ensureConfigDir();
  if (!existsSync(CONFIG_PATH)) {
    atomicWrite(CONFIG_PATH, EXAMPLE_CONFIG);
    const parsed = JSON5.parse(EXAMPLE_CONFIG) as ConfigStore;
    return {
      providers: parsed.providers ?? [],
      activeProviderId: null,
      activeModelId: null,
      scenarioModels: parsed.scenarioModels ?? {},
    };
  }
  const raw = readFileSync(CONFIG_PATH, "utf8");
  if (!raw.trim() || raw.trim() === "{}") {
    atomicWrite(CONFIG_PATH, EXAMPLE_CONFIG);
    const parsed = JSON5.parse(EXAMPLE_CONFIG) as ConfigStore;
    return {
      providers: parsed.providers ?? [],
      activeProviderId: null,
      activeModelId: null,
      scenarioModels: parsed.scenarioModels ?? {},
    };
  }
  try {
    const parsed = JSON5.parse(raw) as ConfigStore;
    if (!Array.isArray(parsed.providers) || parsed.providers.length === 0) {
      atomicWrite(CONFIG_PATH, EXAMPLE_CONFIG);
      return { ...DEFAULT_STORE };
    }
    return {
      providers: parsed.providers,
      activeProviderId: parsed.activeProviderId ?? null,
      activeModelId: parsed.activeModelId ?? null,
      scenarioModels: parsed.scenarioModels ?? {},
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown parse error";
    _configError = `Config file is invalid. ${msg}`;
    return { ...DEFAULT_STORE };
  }
}

export function saveConfig(store: ConfigStore): void {
  ensureConfigDir();
  atomicWrite(CONFIG_PATH, JSON.stringify(store, null, 2));
}

// --- Helper: resolve a model by id across all providers ---

export function findModel(
  store: { providers: Provider[] },
  modelId: string,
): { provider: Provider; modelId: string } | undefined {
  for (const p of store.providers) {
    if (p.models.includes(modelId)) return { provider: p, modelId };
  }
  return undefined;
}

export function getAllModels(store: ConfigStore): string[] {
  return store.providers.flatMap((p) => p.models);
}

// --- Active model ---

export function setActiveModel(
  store: ConfigStore,
  modelId: string,
): ConfigStore {
  const found = findModel(store, modelId);
  if (!found) return store;
  return {
    ...store,
    activeProviderId: found.provider.id,
    activeModelId: modelId,
  };
}

// --- Scenario models ---

export function updateScenarioModels(
  store: ConfigStore,
  updates: Partial<ScenarioModels>,
): ConfigStore {
  return {
    ...store,
    scenarioModels: { ...store.scenarioModels, ...updates },
  };
}

// --- Delete model from provider ---

export function removeModelFromProvider(
  store: ConfigStore,
  providerId: string,
  modelId: string,
): ConfigStore {
  const wasActive = store.activeModelId === modelId;
  return {
    ...store,
    providers: store.providers.map((p) =>
      p.id === providerId
        ? { ...p, models: p.models.filter((m) => m !== modelId) }
        : p,
    ),
    activeModelId: wasActive ? null : store.activeModelId,
  };
}
