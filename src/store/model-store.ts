// src/store/model-store.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ModelConfig, ModelStore } from "../types.js";

const CONFIG_DIR = join(homedir(), ".cc-model-manager");
const STORE_PATH = join(CONFIG_DIR, "models.json");

const DEFAULT_STORE: ModelStore = {
  models: [],
  activeModelId: null,
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

export function loadStore(): ModelStore {
  ensureConfigDir();
  if (!existsSync(STORE_PATH)) {
    atomicWrite(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
    return { ...DEFAULT_STORE };
  }
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw) as ModelStore;
  } catch {
    // Corrupted file — backup and recreate
    const backupPath = STORE_PATH + ".bak";
    try {
      renameSync(STORE_PATH, backupPath);
    } catch {
      // ignore
    }
    atomicWrite(STORE_PATH, JSON.stringify(DEFAULT_STORE, null, 2));
    return { ...DEFAULT_STORE };
  }
}

export function saveStore(store: ModelStore): void {
  ensureConfigDir();
  atomicWrite(STORE_PATH, JSON.stringify(store, null, 2));
}

export function addModel(store: ModelStore, model: ModelConfig): ModelStore {
  return {
    ...store,
    models: [...store.models, model],
  };
}

export function updateModel(
  store: ModelStore,
  id: string,
  updates: Partial<ModelConfig>
): ModelStore {
  return {
    ...store,
    models: store.models.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  };
}

export function removeModel(store: ModelStore, id: string): ModelStore {
  const newActive = store.activeModelId === id ? null : store.activeModelId;
  return {
    ...store,
    models: store.models.filter((m) => m.id !== id),
    activeModelId: newActive,
  };
}

export function setActiveModel(store: ModelStore, id: string): ModelStore {
  const exists = store.models.some((m) => m.id === id);
  if (!exists) return store;
  return { ...store, activeModelId: id };
}

export function getModel(store: ModelStore, id: string): ModelConfig | undefined {
  return store.models.find((m) => m.id === id);
}
