// src/tui/dashboard.tsx

import { Box, Text } from "ink";
import { ConfigStore } from "../types.js";
import { Table } from "../components/ui/table.js";
import { StatusBar } from "../components/ui/status-bar.js";
import { TabBar } from "../components/ui/tab-bar.js";
import { getSettingsPath, getActiveProviderAndModel } from "../store/claude-config.js";
import { homedir } from "os";

interface DashboardProps {
  store: ConfigStore;
  selectedIndex: number;
  scope: "global" | "local";
  onSelect: (providerId: string, modelId: string) => void;
  onDelete: (providerId: string, modelId: string) => void;
  onScenario: () => void;
}

type TableRow = {
  providerName: string;
  modelId: string;
  active: boolean;
  isSelected: boolean;
};

export function Dashboard({ store, selectedIndex, scope }: DashboardProps) {
  // Derive active provider/model from Claude settings.json
  const { provider: activeProvider, modelId: activeModelId } =
    getActiveProviderAndModel(store, scope);
  const activeProviderId = activeProvider?.id ?? null;

  const rawPath = getSettingsPath(scope);
  const displayPath = rawPath.replace(homedir(), "~");
  const rows: TableRow[] = [];
  for (const p of store.providers) {
    for (const m of p.models) {
      rows.push({
        providerName: p.name,
        modelId: m,
        active: m === activeModelId && p.id === activeProviderId,
        isSelected: rows.length === selectedIndex,
      });
    }
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Title */}
      <Text color="cyan">
        {`                   __          __  `}
      </Text>
      <Text color="cyan">
        {`  __________      / /_  __  __/ /_ `}
      </Text>
      <Text color="cyan">
        {` / ___/ ___/_____/ __ \\/ / / / __ \\`}
      </Text>
      <Text color="cyan">
        {`/ /__/ /__/_____/ / / / /_/ / /_/ /`}
      </Text>
      <Text color="cyan">
        {`\\___/\\___/     /_/ /_/\\__,_/_.__/ `}
      </Text>

      {/* Subtitle */}
      <Box marginTop={1}>
        <Text color="dim">
          Edit <Text color="cyan">~/.cc-hub/config.json</Text> to add providers.
        </Text>
      </Box>

      {/* Scope TabBar */}
      <Box marginTop={1}>
        <TabBar
          label="Scope"
          options={["Global", "Local"]}
          selectedIndex={scope === "global" ? 0 : 1}
          focused={true}
          activeColor="cyan"
        />
      </Box>
      <Box>
        <Text color="dim">
          Writing to: <Text color="cyan">{displayPath}</Text>
        </Text>
      </Box>

      {/* Model table */}
      <Box flexDirection="column" marginTop={1}>
        {rows.length === 0 ? (
          <Box flexDirection="column" marginTop={1}>
            <Text color="dim">No providers configured.</Text>
            <Text color="dim">
              Edit <Text color="cyan">~/.cc-hub/config.json</Text> to add
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
            { key: "Tab", label: "Scope" },
            { key: "d", label: "Delete" },
            { key: "s", label: "Scenarios" },
            { key: "q", label: "Quit" },
          ]}
        />
      </Box>
    </Box>
  );
}
