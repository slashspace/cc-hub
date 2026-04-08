// src/types.ts

export interface ModelConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  modelId?: string;
  description?: string;
}

export interface Preset {
  id: string;
  name: string;
  baseUrl: string;
  modelId?: string;
  description?: string;
}

export interface ModelStore {
  models: ModelConfig[];
  activeModelId: string | null;
}
