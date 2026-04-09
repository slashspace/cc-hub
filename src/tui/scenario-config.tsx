// src/tui/scenario-config.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import { ConfigStore, ScenarioModels } from "../types.js";
import { getAllModels } from "../store/config-store.js";

interface ScenarioConfigProps {
  store: ConfigStore;
  onSave: (updates: ScenarioModels) => void;
  onCancel: () => void;
}

type ScenarioField = "opusModelId" | "sonnetModelId" | "haikuModelId" | "subagentModelId";

interface ScenarioFieldDef {
  key: ScenarioField;
  label: string;
  envVar: string;
}

const FIELDS: ScenarioFieldDef[] = [
  { key: "opusModelId", label: "Opus", envVar: "ANTHROPIC_DEFAULT_OPUS_MODEL" },
  { key: "sonnetModelId", label: "Sonnet", envVar: "ANTHROPIC_DEFAULT_SONNET_MODEL" },
  { key: "haikuModelId", label: "Haiku", envVar: "ANTHROPIC_DEFAULT_HAIKU_MODEL" },
  { key: "subagentModelId", label: "Subagent", envVar: "CLAUDE_CODE_SUBAGENT_MODEL" },
];

export function ScenarioConfig({ store, onSave, onCancel }: ScenarioConfigProps) {
  const allModels = getAllModels(store);
  const [index, setIndex] = React.useState(0);
  const [values, setValues] = React.useState<ScenarioModels>({
    opusModelId: store.scenarioModels.opusModelId,
    sonnetModelId: store.scenarioModels.sonnetModelId,
    haikuModelId: store.scenarioModels.haikuModelId,
    subagentModelId: store.scenarioModels.subagentModelId,
  });

  useInput((input, key) => {
    if (key.escape || input === "q") {
      onCancel();
      return;
    }
    if (key.upArrow) {
      setIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow) {
      setIndex((i) => Math.min(FIELDS.length - 1, i + 1));
      return;
    }
    if (key.leftArrow || key.rightArrow) {
      const field = FIELDS[index].key;
      const currentIdx = allModels.findIndex((m) => m.id === values[field]);
      const dir = key.leftArrow ? -1 : 1;
      const nextIdx = (currentIdx + dir + allModels.length + 1) % (allModels.length + 1);
      const nextValue = nextIdx === allModels.length ? undefined : allModels[nextIdx].id;
      setValues((v) => ({ ...v, [field]: nextValue }));
      return;
    }
    if (key.return) {
      onSave(values);
      return;
    }
  });

  function resolveModelName(modelId: string | undefined): string {
    if (!modelId) return "(none)";
    const m = allModels.find((mm) => mm.id === modelId);
    return m ? `${m.name} (${m.id})` : modelId;
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold>Scenario Model Mappings</Text>
      <Text>{"─".repeat(50)}</Text>
      <Box marginTop={1}>
        <Text color="dim">
          Map Claude Code aliases to your models.
        </Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        {FIELDS.map((f, i) => (
          <Box key={f.key}>
            <Text>{i === index ? "> " : "  "}</Text>
            <Text color="dim">{f.label.padEnd(10)}</Text>
            <Text color={i === index ? "green" : undefined}>
              {resolveModelName(values[f.key])}
            </Text>
            <Text color="dim">  [{f.envVar}]</Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="dim">
          <Text color="green" bold>Enter</Text>: Save{" "}
          <Text color="green" bold>↑↓</Text>: Switch field{" "}
          <Text color="green" bold>←→</Text>: Switch model{" "}
          <Text color="green" bold>Esc</Text>: Cancel
        </Text>
      </Box>
    </Box>
  );
}
