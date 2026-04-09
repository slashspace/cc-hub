// src/tui/scenario-config.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import { ConfigStore } from "../types.js";
import { getAllModels } from "../store/config-store.js";

interface ScenarioConfigProps {
  store: ConfigStore;
  onSave: (updates: {
    opusModelId?: string;
    sonnetModelId?: string;
    haikuModelId?: string;
    subagentModelId?: string;
  }) => void;
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
  const [values, setValues] = React.useState({
    opusModelId: store.scenarioModels.opusModelId || "",
    sonnetModelId: store.scenarioModels.sonnetModelId || "",
    haikuModelId: store.scenarioModels.haikuModelId || "",
    subagentModelId: store.scenarioModels.subagentModelId || "",
  });

  const saveIndex = FIELDS.length; // Last row is "Save"

  useInput((input, key) => {
    if (key.escape || input === "q") {
      onCancel();
      return;
    }
    if (key.upArrow) setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setIndex((i) => Math.min(saveIndex, i + 1));
    if (key.return) {
      if (index === saveIndex) {
        // Save row
        onSave({
          opusModelId: values.opusModelId || undefined,
          sonnetModelId: values.sonnetModelId || undefined,
          haikuModelId: values.haikuModelId || undefined,
          subagentModelId: values.subagentModelId || undefined,
        });
        return;
      }
      // Cycle through available models for this field
      const field = FIELDS[index].key;
      const currentIdx = allModels.findIndex((m) => m.id === values[field]);
      const nextIdx = (currentIdx + 1) % (allModels.length + 1);
      const nextValue = nextIdx === allModels.length ? "" : allModels[nextIdx].id;
      setValues((v) => ({ ...v, [field]: nextValue }));
      return;
    }
    // Cycle with left/right arrows
    if ((input === "h" || input === "l") && index < saveIndex) {
      const field = FIELDS[index].key;
      const currentIdx = allModels.findIndex((m) => m.id === values[field]);
      const dir = input === "h" ? -1 : 1;
      const nextIdx = (currentIdx + dir + allModels.length + 1) % (allModels.length + 1);
      const nextValue = nextIdx === allModels.length ? "" : allModels[nextIdx].id;
      setValues((v) => ({ ...v, [field]: nextValue }));
      return;
    }
  });

  function resolveModelName(modelId: string): string {
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
        <Box marginTop={1}>
          <Text>{index === saveIndex ? "> " : "  "}</Text>
          <Text color={index === saveIndex ? "green" : "dim"} bold>
            [Save & Return]
          </Text>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text color="dim">
          <Text color="green" bold>Enter</Text>: Cycle model / Save{" "}
          <Text color="green" bold>h/l</Text>: Prev/Next model{" "}
          <Text color="green" bold>Esc</Text>: Cancel
        </Text>
      </Box>
    </Box>
  );
}
