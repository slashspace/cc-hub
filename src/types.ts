// src/types.ts

// A provider (API vendor) with multiple models
export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
}

// Scope: where to write Claude settings
export type Scope = "global" | "local";

// Full config store
// Note: All active state (provider, model, scenario mappings, scope) are derived from
// ~/.claude/settings.json or .claude/settings.local.json
export interface ConfigStore {
  providers: Provider[];
}
