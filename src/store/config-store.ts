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
import { ConfigStore, Provider } from "../types.js";

const CONFIG_DIR = join(homedir(), ".cc-hub");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

const DEFAULT_STORE: ConfigStore = {
  providers: [],
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
  // cc-hub configuration
  // Edit this file to add or modify providers, then restart.

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
  ]
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
    };
  }
  const raw = readFileSync(CONFIG_PATH, "utf8");
  if (!raw.trim() || raw.trim() === "{}") {
    atomicWrite(CONFIG_PATH, EXAMPLE_CONFIG);
    const parsed = JSON5.parse(EXAMPLE_CONFIG) as ConfigStore;
    return {
      providers: parsed.providers ?? [],
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

// --- Delete model from provider ---

export function removeModelFromProvider(
  store: ConfigStore,
  providerId: string,
  modelId: string,
): ConfigStore {
  return {
    ...store,
    providers: store.providers.map((p) =>
      p.id === providerId
        ? { ...p, models: p.models.filter((m) => m !== modelId) }
        : p,
    ),
  };
}
