// src/tui/scenario-config.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import { ConfigStore, ScenarioModels } from "../types.js";
import { getAllModels } from "../store/config-store.js";
import { Table } from "../components/ui/table.js";
import { StatusBar } from "../components/ui/status-bar.js";

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
    if (key.escape) {
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
      const currentIdx = allModels.findIndex((m) => m === values[field]);
      const dir = key.leftArrow ? -1 : 1;
      const nextIdx = (currentIdx + dir + allModels.length + 1) % (allModels.length + 1);
      const nextValue = nextIdx === allModels.length ? undefined : allModels[nextIdx];
      setValues((v) => ({ ...v, [field]: nextValue }));
      return;
    }
    if (key.return) {
      onSave(values);
      return;
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Title */}
      <Text bold>Scenario Mappings</Text>

      {/* Subtitle */}
      <Box marginTop={1}>
        <Text color="dim">
          Map Claude Code's sonnet/opus/haiku/subagent aliases to your models.
        </Text>
      </Box>

      {/* Scenario table */}
      <Box flexDirection="column" marginTop={1}>
        <Table
          columns={[
            { header: "Role", minWidth: 10 },
            { header: "Model", minWidth: 24 },
            { header: "Env Var", minWidth: 20 },
          ]}
          rows={FIELDS.map((f, i) => [
            {
              text: f.label,
              color: i === index ? "green" : undefined,
              bold: i === index,
            },
            {
              text: values[f.key] || "(none)",
              color: i === index ? "green" : "dim",
              bold: i === index,
            },
            {
              text: f.envVar,
              color: "dim",
            },
          ])}
        />
      </Box>

      {/* Status Bar */}
      <Box marginTop={1}>
        <StatusBar
          items={[
            { key: "Enter", label: "Save" },
            { key: "↑↓", label: "Switch role" },
            { key: "←→", label: "Switch model" },
            { key: "Esc", label: "Cancel" },
          ]}
        />
      </Box>
    </Box>
  );
}
