// src/tui/add-model.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { ModelConfig, Preset } from "../types.js";
import { PRESETS } from "../config/presets.js";

interface AddModelProps {
  onSubmit: (model: ModelConfig) => void;
  onCancel: () => void;
}

type AddStep =
  | "select-preset"
  | "enter-key"
  | "enter-baseurl"
  | "enter-modelid"
  | "enter-name";

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

  // Preset selection
  if (state.step === "select-preset") {
    return (
      <PresetSelect
        onSelect={(preset) =>
          setState((s) => ({ ...s, preset, step: "enter-key" }))
        }
        onCancel={onCancel}
      />
    );
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
        onCancel={onCancel}
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
        onCancel={onCancel}
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
        onCancel={onCancel}
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
            id: isCustom ? toKebabCase(state.customName) : preset!.id,
            name:
              state.customName.trim() ||
              (preset ? preset.name : state.customBaseUrl),
            baseUrl: isCustom ? state.customBaseUrl.trim() : preset!.baseUrl,
            apiKey: state.apiKey,
            modelId: isCustom
              ? state.customModelId.trim() || undefined
              : preset?.modelId,
          };
          onSubmit(model);
        }}
        onCancel={onCancel}
      />
    );
  }

  return null;
}

// --- Sub-components ---

function PresetSelect({
  onSelect,
  onCancel,
}: {
  onSelect: (preset: Preset) => void;
  onCancel: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const options = [
    ...PRESETS,
    {
      id: "custom" as const,
      name: "Custom (manual setup)",
      baseUrl: "",
      modelId: undefined,
      description: undefined,
    },
  ];

  useInput((input, key) => {
    if (key.escape || input === "q") {
      onCancel();
      return;
    }
    if (key.upArrow) setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setIndex((i) => Math.min(options.length - 1, i + 1));
    if (key.return) onSelect(options[index]);
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Add Model</Text>
      <Text>{"─".repeat(40)}</Text>
      <Box marginTop={1}>
        <Text color="dim">Select a provider preset:</Text>
      </Box>
      {options.map((opt, i) => (
        <Box key={opt.id}>
          <Text>{i === index ? "> " : "  "}</Text>
          <Text color={i === index ? "green" : undefined}>{opt.name}</Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="dim">
          <Text color="green" bold>
            Enter
          </Text>
          : Select{" "}
          <Text color="green" bold>
            q
          </Text>
          : Cancel
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
  onCancel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  // Handle escape BEFORE TextInput's useInput can process it
  useInput((_, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>{label}</Text>
      <Text>{"─".repeat(40)}</Text>
      <Box marginTop={1}>
        <Text color="green">{"> "}</Text>
        <TextInput value={value} onChange={onChange} onSubmit={onSubmit} focus={false} />
      </Box>
      <Box marginTop={1}>
        <Text color="dim">Press Enter to continue, Esc to cancel</Text>
      </Box>
    </Box>
  );
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
