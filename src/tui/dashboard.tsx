// src/tui/dashboard.tsx

import { Box, Text } from "ink";
import { ConfigStore } from "../types.js";
import { Table } from "../components/ui/table.js";
import { StatusBar } from "../components/ui/status-bar.js";

interface DashboardProps {
  store: ConfigStore;
  selectedIndex: number;
  onSelect: (modelId: string) => void;
  onDelete: (providerId: string, modelId: string) => void;
  onScenario: () => void;
}

type TableRow = {
  providerName: string;
  modelId: string;
  active: boolean;
  isSelected: boolean;
};

export function Dashboard({ store, selectedIndex }: DashboardProps) {
  const rows: TableRow[] = [];
  for (const p of store.providers) {
    for (const m of p.models) {
      rows.push({
        providerName: p.name,
        modelId: m,
        active: m === store.activeModelId,
        isSelected: rows.length === selectedIndex,
      });
    }
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Title */}
      <Text bold>CC Model Hub</Text>

      {/* Subtitle */}
      <Box marginTop={1}>
        <Text color="dim">
          Select a model to switch your active Claude Code configuration.
        </Text>
      </Box>

      {/* Model table */}
      <Box flexDirection="column" marginTop={1}>
        {rows.length === 0 ? (
          <Box flexDirection="column" marginTop={1}>
            <Text color="dim">No providers configured.</Text>
            <Text color="dim">
              Edit <Text color="cyan">~/.cc-model-hub/config.json</Text> to add
              providers, then restart.
            </Text>
          </Box>
        ) : (
          <Table
            columns={[
              { header: "Provider", minWidth: 10 },
              { header: "Model", minWidth: 24 },
              { header: "Active", width: 8 },
            ]}
            rows={rows.map((row) => [
              {
                text: row.providerName,
                color: row.isSelected ? "green" : undefined,
                bold: row.isSelected,
              },
              {
                text: row.modelId,
                color: row.isSelected ? "green" : undefined,
                bold: row.isSelected,
              },
              {
                text: row.active ? "●" : "",
                color: row.active ? "green" : undefined,
                bold: row.active,
              },
            ])}
          />
        )}
      </Box>

      {/* Status Bar */}
      <Box marginTop={1}>
        <StatusBar
          items={[
            { key: "Enter", label: "Switch" },
            { key: "↑↓", label: "Navigate" },
            { key: "d", label: "Delete" },
            { key: "s", label: "Scenarios" },
            { key: "q", label: "Quit" },
          ]}
        />
      </Box>
    </Box>
  );
}
