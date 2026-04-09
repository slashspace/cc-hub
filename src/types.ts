// src/types.ts

// A single model under a provider
export interface Model {
  id: string;
  name: string;
  modelId: string;
  description?: string;
}

// A provider (API vendor) with multiple models
export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: Model[];
}

// Scenario model alias mappings
export interface ScenarioModels {
  opusModelId?: string;
  sonnetModelId?: string;
  haikuModelId?: string;
  subagentModelId?: string;
}

// Full config store
export interface ConfigStore {
  providers: Provider[];
  activeProviderId: string | null;
  activeModelId: string | null;
  scenarioModels: ScenarioModels;
}
