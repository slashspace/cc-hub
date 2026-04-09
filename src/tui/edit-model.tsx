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

  // Handle escape BEFORE TextInput's useInput can process it
  useInput((_, key) => {
    if (key.escape) {
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

  const valueMap: Record<string, string> = { name, baseUrl, apiKey, modelId };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Edit Model: {model.id}</Text>
      <Text>{"─".repeat(50)}</Text>

      {fields.map((f) => (
        <Box key={f.key}>
          <Text>{f.key === field ? "> " : "  "}</Text>
          <Text color="dim">{f.label.padEnd(16)}</Text>
          {f.key === field ? (
            <Text color="green">
              {maskIf(f.key === "apiKey", valueMap[f.key])}
            </Text>
          ) : (
            <Text color="dim">
              {maskIf(f.key === "apiKey", valueMap[f.key])}
            </Text>
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
          focus={false}
        />
        <Text color="dim">Press Enter for next field, Esc to cancel</Text>
      </Box>
    </Box>
  );
}

function maskIf(shouldMask: boolean, value: string): string {
  if (!shouldMask) return value;
  if (value.length <= 6) return "••••••";
  return value.slice(0, 3) + "••••••" + value.slice(-3);
}
