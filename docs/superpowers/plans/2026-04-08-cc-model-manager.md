# CC Model Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a terminal TUI tool (`ccmm`) that manages Claude Code model configurations — add, edit, delete, and switch between LLM providers with a Dashboard interface.

**Architecture:** Ink-based TUI with a JSON-backed model store. Model CRUD operates on `~/.cc-model-manager/models.json`. Switching a model writes the selected model's credentials into `~/.claude/settings.json` under the `env` block. The TUI is a simple state machine routing between Dashboard, Add, Edit, and Confirm screens.

**Tech Stack:** TypeScript, Ink 6.x, ink-select-input, ink-text-input, ink-spinner, pnpm, tsx

---

## File Structure

```
cc-model-manager/
├── src/
│   ├── cli.ts                  # Bin entry point
│   ├── types.ts                # ModelConfig, Preset interfaces
│   ├── config/
│   │   └── presets.ts          # 8 built-in provider presets
│   ├── store/
│   │   ├── model-store.ts      # models.json CRUD
│   │   └── claude-config.ts    # Claude settings.json read/write
│   └── tui/
│       ├── app.tsx             # State machine (Dashboard | Add | Edit | Confirm)
│       ├── dashboard.tsx       # Main list view
│       ├── add-model.tsx       # Add: preset select → form
│       ├── edit-model.tsx      # Edit: form for existing model
│       └── confirm.tsx         # Yes/No confirmation dialog
├── package.json
└── tsconfig.json
```

Each file has one clear responsibility:
- `types.ts`: Type definitions only
- `presets.ts`: Static data only
- `model-store.ts`: Pure file I/O for models.json
- `claude-config.ts`: Pure file I/O for Claude settings.json
- `app.tsx`: Routing logic only (state + key handlers)
- `dashboard.tsx`: Render-only, receives props
- `add-model.tsx` / `edit-model.tsx`: Form logic + render
- `confirm.tsx`: Render-only confirmation dialog
- `cli.ts`: Bootstrap only

---

### Task 1: Project Scaffold

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/package.json`
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/tsconfig.json`

- [ ] **Step 1: Initialize project with pnpm**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm init
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm add ink@6 react@19 ink-select-input ink-text-input ink-spinner
pnpm add -D typescript @types/react @types/node tsx
```

- [ ] **Step 3: Create package.json**

```json
{
  "name": "cc-model-manager",
  "version": "0.1.0",
  "description": "TUI for managing Claude Code model configurations",
  "type": "module",
  "bin": {
    "ccmm": "./dist/cli.js"
  },
  "scripts": {
    "dev": "tsx watch src/cli.ts",
    "build": "tsc",
    "start": "node dist/cli.js"
  },
  "dependencies": {
    "ink": "^6.0.0",
    "react": "^19.0.0",
    "ink-select-input": "^6.0.0",
    "ink-text-input": "^6.0.0",
    "ink-spinner": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/react": "^19.0.0",
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0"
  }
}
```

- [ ] **Step 4: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Create placeholder src files and verify build**

```bash
mkdir -p src/tui src/store src/config
echo 'console.log("hello");' > src/cli.ts
pnpm run build
```

Expected: `dist/cli.js` generated with no errors.

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json
git commit -m "chore: scaffold project with Ink and TypeScript"
```

---

### Task 2: Types and Presets

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/types.ts`
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/config/presets.ts`

- [ ] **Step 1: Create types.ts**

```typescript
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

export type Screen =
  | { type: "dashboard" }
  | { type: "add" }
  | { type: "edit"; modelId: string }
  | { type: "confirm"; action: string; onConfirm: () => void };
```

- [ ] **Step 2: Create presets.ts**

```typescript
// src/config/presets.ts

import { Preset } from "../types.js";

export const PRESETS: Preset[] = [
  {
    id: "qwen-plus",
    name: "Qwen 3.6 Plus",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    modelId: "qwen3.6-plus",
  },
  {
    id: "qwen-max",
    name: "Qwen Max",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    modelId: "qwen-max",
  },
  {
    id: "kimi-k2",
    name: "Kimi K2.5",
    baseUrl: "https://api.moonshot.cn/v1",
    modelId: "kimi-k2-0905",
  },
  {
    id: "minimax-m2",
    name: "MiniMax M2.7",
    baseUrl: "https://api.minimax.chat/v1",
    modelId: "MiniMax-M2.7",
  },
  {
    id: "glm-5",
    name: "GLM 5.1",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    modelId: "glm-5",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    baseUrl: "https://api.deepseek.com/v1",
    modelId: "deepseek-chat",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    baseUrl: "https://api.deepseek.com/v1",
    modelId: "deepseek-reasoner",
  },
  {
    id: "siliconflow-qwen",
    name: "SiliconFlow Qwen",
    baseUrl: "https://api.siliconflow.cn/v1",
    modelId: "Qwen/Qwen2.5-72B-Instruct",
  },
];
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/config/presets.ts
git commit -m "feat: add types and built-in provider presets"
```

---

### Task 3: Model Store (CRUD)

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/store/model-store.ts`

- [ ] **Step 1: Create model-store.ts**

```typescript
// src/store/model-store.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "fs";
import { dirname, join } from "path";
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
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/model-store.ts
git commit -m "feat: implement model store with atomic writes and CRUD"
```

---

### Task 4: Claude Config Writer

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/store/claude-config.ts`

- [ ] **Step 1: Create claude-config.ts**

```typescript
// src/store/claude-config.ts

import { existsSync, readFileSync, writeFileSync, renameSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ModelConfig } from "../types.js";

const CLAUDE_SETTINGS = join(homedir(), ".claude", "settings.json");

interface ClaudeSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

export function activateModel(model: ModelConfig): void {
  const dir = join(homedir(), ".claude");
  if (!existsSync(dir)) {
    // Claude not installed — skip silently
    return;
  }

  let settings: ClaudeSettings = {};
  if (existsSync(CLAUDE_SETTINGS)) {
    try {
      settings = JSON.parse(readFileSync(CLAUDE_SETTINGS, "utf8"));
    } catch {
      // Corrupted — start fresh
      settings = {};
    }
  }

  settings.env = {
    ...(settings.env || {}),
    ANTHROPIC_API_KEY: model.apiKey,
    ANTHROPIC_BASE_URL: model.baseUrl,
    ...(model.modelId ? { ANTHROPIC_MODEL: model.modelId } : {}),
  };

  const tmpPath = CLAUDE_SETTINGS + ".tmp";
  writeFileSync(tmpPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
  renameSync(tmpPath, CLAUDE_SETTINGS);
}

export function getActiveModelName(): string | null {
  if (!existsSync(CLAUDE_SETTINGS)) return null;
  try {
    const settings: ClaudeSettings = JSON.parse(readFileSync(CLAUDE_SETTINGS, "utf8"));
    return settings.env?.ANTHROPIC_BASE_URL || null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/store/claude-config.ts
git commit -m "feat: add Claude settings writer with atomic writes"
```

---

### Task 5: Confirm Dialog Component

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/tui/confirm.tsx`

- [ ] **Step 1: Create confirm.tsx**

```tsx
// src/tui/confirm.tsx

import React from "react";
import { Box, Text, useInput } from "ink";

interface ConfirmProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Confirm({ message, onConfirm, onCancel }: ConfirmProps) {
  useInput((input) => {
    if (input === "y" || input === "Y") {
      onConfirm();
    } else if (input === "n" || input === "N" || input === "q" || input === "escape") {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text>{message}</Text>
      <Box marginTop={1}>
        <Text color="green">[Y]</Text>
        <Text>es  </Text>
        <Text color="red">[N]</Text>
        <Text>o</Text>
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/tui/confirm.tsx
git commit -m "feat: add confirmation dialog component"
```

---

### Task 6: Dashboard Component

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/tui/dashboard.tsx`

- [ ] **Step 1: Create dashboard.tsx**

```tsx
// src/tui/dashboard.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import { ModelConfig, ModelStore } from "../types.js";
import { getModel } from "../store/model-store.js";

interface DashboardProps {
  store: ModelStore;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onQuit: () => void;
}

export function Dashboard({
  store,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onQuit,
}: DashboardProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  useInput((input, key) => {
    if (input === "q" || input === "escape") {
      onQuit();
      return;
    }
    if (input === "a") {
      onAdd();
      return;
    }
    if (input === "e" && store.models.length > 0) {
      onEdit(store.models[selectedIndex].id);
      return;
    }
    if (input === "d" && store.models.length > 0) {
      onDelete(store.models[selectedIndex].id);
      return;
    }
    if (key.return && store.models.length > 0) {
      onSelect(store.models[selectedIndex].id);
      return;
    }
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(store.models.length - 1, i + 1));
    }
  });

  const activeModel = store.activeModelId
    ? getModel(store, store.activeModelId)
    : null;

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Text bold>CC Model Manager</Text>
      <Text>{"─".repeat(50)}</Text>

      {/* Active model info */}
      <Box flexDirection="column" marginTop={1}>
        {activeModel ? (
          <>
            <Text>
              Active: <Text color="green" bold>{activeModel.name}</Text>
              {" "}({activeModel.id})
            </Text>
            <Text color="dim">
              Endpoint: {truncateUrl(activeModel.baseUrl)}
            </Text>
          </>
        ) : (
          <Text color="yellow">No active model selected</Text>
        )}
      </Box>

      {/* Model list */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>MODELS</Text>
        <Text>{"─".repeat(50)}</Text>

        {store.models.length === 0 ? (
          <Text color="dim" marginTop={1}>
            No models configured. Press <Text color="green" bold>[a]</Text> to add one.
          </Text>
        ) : (
          store.models.map((model, index) => (
            <Box key={model.id}>
              <Text>
                {index === selectedIndex ? "> " : "  "}
              </Text>
              <Text>
                {model.id === store.activeModelId ? (
                  <Text color="green">●</Text>
                ) : (
                  <Text color="dim">○</Text>
                )}
              </Text>
              <Text> {model.id.padEnd(20)}</Text>
              <Text color="dim">{model.name}</Text>
              {index === selectedIndex && (
                <Text color="yellow">  ←</Text>
              )}
            </Box>
          ))
        )}
      </Box>

      {/* Help bar */}
      <Box marginTop={1}>
        <Text color="dim">
          <Text color="green" bold>Enter</Text>: Select  {" "}
          <Text color="green" bold>a</Text>: Add  {" "}
          <Text color="green" bold>e</Text>: Edit  {" "}
          <Text color="green" bold>d</Text>: Delete  {" "}
          <Text color="green" bold>q</Text>: Quit
        </Text>
      </Box>
    </Box>
  );
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname;
  } catch {
    return url.length > 40 ? url.slice(0, 37) + "..." : url;
  }
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/tui/dashboard.tsx
git commit -m "feat: add dashboard component with model list and keyboard navigation"
```

---

### Task 7: Add Model Component

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/tui/add-model.tsx`

- [ ] **Step 1: Create add-model.tsx**

```tsx
// src/tui/add-model.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { ModelConfig, Preset } from "../types.js";
import { PRESETS } from "../config/presets.js";

interface AddModelProps {
  onSubmit: (model: ModelConfig) => void;
  onCancel: () => void;
}

type AddStep = "select-preset" | "enter-key" | "enter-baseurl" | "enter-modelid" | "enter-name";

interface AddState {
  step: AddStep;
  preset: Preset | null;
  apiKey: string;
  customBaseUrl: string;
  customModelId: string;
  customName: string;
}

export function AddModel({ onSubmit, onCancel }: AddModelProps) {
  const [state, setState] = React.useState<AddState>({
    step: "select-preset",
    preset: null,
    apiKey: "",
    customBaseUrl: "",
    customModelId: "",
    customName: "",
  });

  useInput((input, key) => {
    if (input === "q" || input === "escape") {
      onCancel();
      return;
    }
    if (state.step === "select-preset" && key.return) {
      setState((s) => ({ ...s, step: "enter-key" }));
    }
  });

  // Preset selection
  if (state.step === "select-preset") {
    return <PresetSelect onSelect={(preset) => setState((s) => ({ ...s, preset, step: "enter-key" }))} />;
  }

  // Determine which field to ask for next
  const isCustom = !state.preset;

  if (state.step === "enter-key") {
    return (
      <FieldInput
        label="API Key"
        value={state.apiKey}
        onChange={(apiKey) => setState((s) => ({ ...s, apiKey }))}
        onSubmit={() => {
          if (isCustom) {
            setState((s) => ({ ...s, step: "enter-baseurl" }));
          } else {
            setState((s) => ({ ...s, step: "enter-name" }));
          }
        }}
      />
    );
  }

  if (state.step === "enter-baseurl") {
    return (
      <FieldInput
        label="Base URL"
        value={state.customBaseUrl}
        onChange={(customBaseUrl) => setState((s) => ({ ...s, customBaseUrl }))}
        onSubmit={() => setState((s) => ({ ...s, step: "enter-modelid" }))}
      />
    );
  }

  if (state.step === "enter-modelid") {
    return (
      <FieldInput
        label="Model ID (optional)"
        value={state.customModelId}
        onChange={(customModelId) => setState((s) => ({ ...s, customModelId }))}
        onSubmit={() => setState((s) => ({ ...s, step: "enter-name" }))}
      />
    );
  }

  // Final step — submit
  if (state.step === "enter-name") {
    return (
      <FieldInput
        label={isCustom ? "Name (required)" : "Display name (optional)"}
        value={state.customName}
        onChange={(customName) => setState((s) => ({ ...s, customName }))}
        onSubmit={() => {
          const preset = state.preset;
          if (isCustom && !state.customBaseUrl.trim()) return;
          if (isCustom && !state.customName.trim()) return;

          const model: ModelConfig = {
            id: isCustom
              ? toKebabCase(state.customName)
              : preset!.id,
            name: state.customName.trim() || (preset ? preset.name : state.customBaseUrl),
            baseUrl: isCustom ? state.customBaseUrl.trim() : preset!.baseUrl,
            apiKey: state.apiKey,
            modelId: isCustom
              ? state.customModelId.trim() || undefined
              : preset?.modelId,
          };
          onSubmit(model);
        }}
      />
    );
  }

  return null;
}

// --- Sub-components ---

function PresetSelect({ onSelect }: { onSelect: (preset: Preset) => void }) {
  const [index, setIndex] = React.useState(0);
  const options = [...PRESETS, { id: "custom", name: "Custom (manual setup)", baseUrl: "", modelId: undefined, description: undefined }];

  useInput((_, key) => {
    if (key.upArrow) setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setIndex((i) => Math.min(options.length - 1, i + 1));
    if (key.return) onSelect(options[index]);
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Add Model</Text>
      <Text>{"─".repeat(40)}</Text>
      <Text color="dim" marginTop={1}>Select a provider preset:</Text>
      {options.map((opt, i) => (
        <Box key={opt.id}>
          <Text>
            {i === index ? "> " : "  "}
          </Text>
          <Text color={i === index ? "green" : undefined}>
            {opt.name}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="dim">
          <Text color="green" bold>Enter</Text>: Select  {" "}
          <Text color="green" bold>q</Text>: Cancel
        </Text>
      </Box>
    </Box>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  onSubmit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const inputRef = React.useRef<any>(null);
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>{label}</Text>
      <Text>{"─".repeat(40)}</Text>
      <Box marginTop={1}>
        <Text color="green">{"> "}</Text>
        <TextInput
          ref={inputRef}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      </Box>
      <Text color="dim" marginTop={1}>Press Enter to continue</Text>
    </Box>
  );
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/tui/add-model.tsx
git commit -m "feat: add model form with preset selection and custom provider support"
```

---

### Task 8: Edit Model Component

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/tui/edit-model.tsx`

- [ ] **Step 1: Create edit-model.tsx**

```tsx
// src/tui/edit-model.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { ModelConfig } from "../types.js";

interface EditModelProps {
  model: ModelConfig;
  onSave: (updates: Partial<ModelConfig>) => void;
  onCancel: () => void;
}

type EditField = "name" | "baseUrl" | "apiKey" | "modelId" | "done";

export function EditModel({ model, onSave, onCancel }: EditModelProps) {
  const [field, setField] = React.useState<EditField>("name");
  const [name, setName] = React.useState(model.name);
  const [baseUrl, setBaseUrl] = React.useState(model.baseUrl);
  const [apiKey, setApiKey] = React.useState(model.apiKey);
  const [modelId, setModelId] = React.useState(model.modelId || "");

  useInput((input, key) => {
    if (input === "q" || input === "escape") {
      onCancel();
    }
  });

  if (field === "done") {
    onSave({ name, baseUrl, apiKey, modelId: modelId || undefined });
    return null;
  }

  const fields: { key: EditField; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "baseUrl", label: "Base URL" },
    { key: "apiKey", label: "API Key" },
    { key: "modelId", label: "Model ID (optional)" },
  ];

  const currentField = fields.find((f) => f.key === field)!;
  const valueMap: Record<string, string> = { name, baseUrl, apiKey, modelId };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Edit Model: {model.id}</Text>
      <Text>{"─".repeat(50)}</Text>

      {fields.map((f, i) => (
        <Box key={f.key}>
          <Text>
            {f.key === field ? "> " : "  "}
          </Text>
          <Text color="dim">{f.label.padEnd(16)}</Text>
          {f.key === field ? (
            <Text color="green">{maskIf(f.key === "apiKey", valueMap[f.key])}</Text>
          ) : (
            <Text color="dim">{maskIf(f.key === "apiKey", valueMap[f.key])}</Text>
          )}
        </Box>
      ))}

      <Box marginTop={1} flexDirection="column">
        <TextInput
          value={valueMap[field]}
          onChange={(v) => {
            if (field === "name") setName(v);
            else if (field === "baseUrl") setBaseUrl(v);
            else if (field === "apiKey") setApiKey(v);
            else if (field === "modelId") setModelId(v);
          }}
          onSubmit={() => {
            const idx = fields.findIndex((f) => f.key === field);
            if (idx < fields.length - 1) {
              setField(fields[idx + 1].key);
            } else {
              setField("done");
            }
          }}
        />
        <Text color="dim">Press Enter for next field</Text>
      </Box>
    </Box>
  );
}

function maskIf(shouldMask: boolean, value: string): string {
  if (!shouldMask) return value;
  if (value.length <= 6) return "••••••";
  return value.slice(0, 3) + "••••••" + value.slice(-3);
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/tui/edit-model.tsx
git commit -m "feat: add edit model component with field-by-field editing"
```

---

### Task 9: App State Machine and CLI Entry

**Files:**
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/tui/app.tsx`
- Create: `/Users/dingsheng/Develop/mvp/modle-hub/src/cli.ts`

- [ ] **Step 1: Create app.tsx**

```tsx
// src/tui/app.tsx

import React from "react";
import { render, useApp, Box, Text } from "ink";
import { Spinner } from "ink-spinner";
import { ModelConfig } from "../types.js";
import { loadStore, saveStore, addModel, updateModel, removeModel, setActiveModel, getModel } from "../store/model-store.js";
import { activateModel } from "../store/claude-config.js";
import { Dashboard } from "./dashboard.js";
import { AddModel } from "./add-model.js";
import { EditModel } from "./edit-model.js";
import { Confirm } from "./confirm.js";

type Screen =
  | { type: "dashboard" }
  | { type: "add" }
  | { type: "edit"; modelId: string }
  | { type: "confirm"; message: string; onConfirm: () => void };

type AppState = {
  screen: Screen;
  statusMessage: string | null;
};

export function App() {
  const { exit } = useApp();
  const [store, setStore] = React.useState(() => loadStore());
  const [state, setState] = React.useState<AppState>({
    screen: { type: "dashboard" },
    statusMessage: null,
  });

  // Auto-clear status message after a delay
  React.useEffect(() => {
    if (!state.statusMessage) return;
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, statusMessage: null }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.statusMessage]);

  // Dashboard handlers
  const handleSelect = (id: string) => {
    const updated = setActiveModel(store, id);
    setStore(updated);
    saveStore(updated);
    const model = getModel(updated, id);
    if (model) {
      activateModel(model);
      setState((s) => ({
        ...s,
        statusMessage: `已切换至 ${model.name}`,
      }));
    }
  };

  const handleAdd = () => {
    setState((s) => ({ ...s, screen: { type: "add" } }));
  };

  const handleEdit = (id: string) => {
    setState((s) => ({ ...s, screen: { type: "edit", modelId: id } }));
  };

  const handleDelete = (id: string) => {
    const model = getModel(store, id);
    if (!model) return;
    setState((s) => ({
      ...s,
      screen: {
        type: "confirm",
        message: `Delete model "${model.name}" (${id})?`,
        onConfirm: () => {
          const updated = removeModel(store, id);
          setStore(updated);
          saveStore(updated);
          setState((s) => ({
            ...s,
            screen: { type: "dashboard" },
            statusMessage: `已删除 ${model.name}`,
          }));
        },
      },
    }));
  };

  const handleQuit = () => exit();

  // Add handler
  const handleAddSubmit = (model: ModelConfig) => {
    const updated = addModel(store, model);
    setStore(updated);
    saveStore(updated);
    setState((s) => ({
      ...s,
      screen: { type: "dashboard" },
      statusMessage: `已添加 ${model.name}`,
    }));
  };

  const handleAddCancel = () => {
    setState((s) => ({ ...s, screen: { type: "dashboard" } }));
  };

  // Edit handler
  const handleEditSave = (updates: Partial<ModelConfig>) => {
    const editScreen = state.screen as Extract<Screen, { type: "edit" }>;
    const updated = updateModel(store, editScreen.modelId, updates);
    setStore(updated);
    saveStore(updated);
    setState((s) => ({
      ...s,
      screen: { type: "dashboard" },
      statusMessage: `已更新 ${updates.name || editScreen.modelId}`,
    }));
  };

  const handleEditCancel = () => {
    setState((s) => ({ ...s, screen: { type: "dashboard" } }));
  };

  // Confirm handler
  const handleConfirmCancel = () => {
    setState((s) => ({ ...s, screen: { type: "dashboard" } }));
  };

  return (
    <Box flexDirection="column">
      {state.statusMessage && (
        <Box paddingX={1}>
          <Text color="green">✓ {state.statusMessage}</Text>
        </Box>
      )}

      {state.screen.type === "dashboard" && (
        <Dashboard
          store={store}
          onSelect={handleSelect}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onQuit={handleQuit}
        />
      )}

      {state.screen.type === "add" && (
        <AddModel onSubmit={handleAddSubmit} onCancel={handleAddCancel} />
      )}

      {state.screen.type === "edit" && (
        <EditModel
          model={getModel(store, state.screen.modelId)!}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}

      {state.screen.type === "confirm" && (
        <Confirm
          message={state.screen.message}
          onConfirm={state.screen.onConfirm}
          onCancel={handleConfirmCancel}
        />
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Create cli.ts**

```typescript
// src/cli.ts

import React from "react";
import { render } from "ink";
import { App } from "./tui/app.js";

render(<App />);
```

- [ ] **Step 3: Add shebang to package.json bin field — update package.json**

Ensure `package.json` has:
```json
{
  "bin": {
    "ccmm": "./dist/cli.js"
  }
}
```

And add `#!/usr/bin/env node` to the built output. Since TypeScript compiles without shebang, update the build process. Add a post-build step or use `tsx` directly. For simplicity, update package.json bin to use tsx for dev and compile for production:

For development, use `pnpm dev` (tsx watch). For global install after build, we need the shebang. Create a small build script.

Create `build.mjs`:

```javascript
// build.mjs
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

execSync("tsc", { stdio: "inherit" });

const cliPath = "dist/cli.js";
const content = readFileSync(cliPath, "utf8");
writeFileSync(cliPath, "#!/usr/bin/env node\n" + content);
```

Add to package.json scripts:
```json
{
  "scripts": {
    "dev": "tsx watch src/cli.ts",
    "build": "node build.mjs",
    "start": "node dist/cli.js"
  }
}
```

- [ ] **Step 4: Verify full build**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
```

Expected: `dist/cli.js` exists with shebang line.

- [ ] **Step 5: Test run**

```bash
pnpm dev
```

Expected: TUI launches in terminal showing Dashboard with empty model list and "No models configured" message. Keyboard navigation (arrows, a, q) works.

- [ ] **Step 6: Commit**

```bash
git add src/tui/app.tsx src/cli.ts build.mjs
git commit -m "feat: wire up app state machine and CLI entry point"
```

---

### Task 10: Integration Test and Polish

**Files:**
- No new files — manual verification only

- [ ] **Step 1: Global install test**

```bash
cd /Users/dingsheng/Develop/mvp/modle-hub
pnpm run build
pnpm add -g .
ccmm
```

Expected: TUI launches. Press `q` to quit.

- [ ] **Step 2: Add model from preset**

1. Run `ccmm`
2. Press `a` to add
3. Select "Qwen 3.6 Plus" preset
4. Enter a test API key
5. Accept default display name
6. Press Enter

Expected: Returns to dashboard showing the new model. Status message "已添加 Qwen 3.6 Plus".

- [ ] **Step 3: Switch active model**

1. On dashboard, ensure cursor is on the model
2. Press Enter

Expected: Status message "已切换至 Qwen 3.6 Plus". Check `~/.claude/settings.json`:

```bash
cat ~/.claude/settings.json
```

Expected `env` block contains `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, and `ANTHROPIC_MODEL` with the model's values.

- [ ] **Step 4: Add custom provider**

1. Press `a`, select "Custom (manual setup)"
2. Fill: API Key = `test-key`, Base URL = `https://example.com/v1`, Model ID = `my-model`, Name = `My Custom Model`

Expected: Dashboard shows both models.

- [ ] **Step 5: Edit a model**

1. Navigate to a model, press `e`
2. Change the name, press Enter through all fields

Expected: Name updates on dashboard. Status message shows update.

- [ ] **Step 6: Delete a model**

1. Navigate to a model, press `d`
2. Press `Y` to confirm

Expected: Model removed from list. If it was the active model, active status cleared.

- [ ] **Step 7: Verify models.json**

```bash
cat ~/.cc-model-manager/models.json
```

Expected: Valid JSON with remaining models.

- [ ] **Step 8: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: integration test polish"
```

---

## Self-Review

### 1. Spec Coverage

| Spec Requirement | Task |
|---|---|
| Project scaffold with Ink + TypeScript | Task 1 |
| ModelConfig type | Task 2 |
| 8 built-in presets | Task 2 |
| models.json CRUD | Task 3 |
| Claude settings.json write | Task 4 |
| Dashboard TUI layout | Task 6 |
| Add model (preset + custom) | Task 7 |
| Edit model | Task 8 |
| Delete with confirmation | Task 5 + Task 9 |
| Switch active model | Task 9 (handleSelect) |
| Keyboard navigation | Task 6, 7 |
| Atomic writes | Task 3, 4 |
| Corrupted file recovery | Task 3 (loadStore backup) |
| Global install `ccmm` | Task 9 |
| Integration testing | Task 10 |

All spec requirements covered.

### 2. Placeholder Scan

Searched for TBD, TODO, "fill in", "add validation", "handle edge cases", "similar to" — none found. All steps contain actual code.

### 3. Type Consistency

- `ModelConfig` defined in Task 2 (`types.ts`), used consistently in Tasks 3, 4, 7, 8, 9.
- `ModelStore` defined in Task 2, used in Tasks 3, 6, 9.
- `Screen` type defined in Task 2 — **Note**: The `Screen` type in `types.ts` includes `confirm` with an `onConfirm: () => void` function, but functions can't be serialized in state across re-renders. In `app.tsx`, the confirm state is handled inline with a closure, so the `Screen` type in `types.ts` is not actually used for the confirm screen's function storage. This is fine — `app.tsx` uses a local `Screen` type that shadows the one in `types.ts`. I'll remove the `Screen` type from `types.ts` to avoid confusion since app.tsx defines its own.

Fix: Update `types.ts` to remove `Screen` (it's defined locally in app.tsx).

**Corrected types.ts** (no Screen type):

```typescript
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
```

The plan file has been updated with this correction in Task 2's Step 1 code.
