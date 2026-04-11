// src/types.ts

// A provider (API vendor) with multiple models
export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
}

// Scenario model alias mappings
export interface ScenarioModels {
  opusModelId?: string;
  sonnetModelId?: string;
  haikuModelId?: string;
  subagentModelId?: string;
}

// Scope: where to write Claude settings
export type Scope = "global" | "local";

// Full config store
export interface ConfigStore {
  providers: Provider[];
  activeProviderId: string | null;
  activeModelId: string | null;
  scenarioModels: ScenarioModels;
  scope: Scope;
}
