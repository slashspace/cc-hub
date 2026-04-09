// src/tui/dashboard.tsx

import React from "react";
import { Box, Text } from "ink";
import { ConfigStore, Provider } from "../types.js";

interface DashboardProps {
  store: ConfigStore;
  selectedIndex: number;
  onSelect: (modelId: string) => void;
  onDelete: (providerId: string, modelId: string) => void;
  onScenario: () => void;
  onNavigate: (direction: "up" | "down") => void;
}

type Row =
  | { type: "header"; provider: Provider }
  | { type: "model"; provider: Provider; modelId: string };

function flattenStore(store: ConfigStore): Row[] {
  const items: Row[] = [];
  for (const p of store.providers) {
    items.push({ type: "header", provider: p });
    for (const m of p.models) {
      items.push({ type: "model", provider: p, modelId: m });
    }
  }
  return items;
}

export function Dashboard({
  store,
  selectedIndex,
  onSelect,
  onDelete,
  onScenario,
  onNavigate,
}: DashboardProps) {
  const items = flattenStore(store);

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Text bold>CC Model Hub</Text>
      <Text>{"─".repeat(50)}</Text>

      {/* Active model info */}
      <Box flexDirection="column" marginTop={1}>
        {store.activeModelId ? (
          <Text color="dim">
            Active: <Text color="green" bold>{store.activeModelId}</Text>
          </Text>
        ) : (
          <Text color="yellow">No active model selected</Text>
        )}
      </Box>

      {/* Model list grouped by provider */}
      <Box flexDirection="column" marginTop={1}>
        <Text bold>MODELS</Text>
        <Text>{"─".repeat(50)}</Text>

        {items.length === 0 ? (
          <Box flexDirection="column" marginTop={1}>
            <Text color="dim">No providers configured.</Text>
            <Text color="dim">
              Edit{" "}
              <Text color="cyan">~/.cc-model-hub/config.json</Text>{" "}
              to add providers, then restart.
            </Text>
          </Box>
        ) : (
          items.map((item, index) => {
            if (item.type === "header") {
              return (
                <Box
                  key={`h-${item.provider.id}`}
                  marginTop={index > 0 ? 1 : 0}
                >
                  <Text color="cyan" bold>
                    ── {item.provider.name} ──
                  </Text>
                </Box>
              );
            }
            const isActive = item.modelId === store.activeModelId;
            const isSelected = index === selectedIndex;
            return (
              <Box key={item.modelId}>
                <Text>{isSelected ? "> " : "  "}</Text>
                <Text color={isActive ? "green" : "dim"}>
                  {isActive ? "●" : "○"}
                </Text>
                <Text> {item.modelId}</Text>
                {isSelected && <Text color="yellow"> ←</Text>}
              </Box>
            );
          })
        )}
      </Box>

      {/* Help bar */}
      <Box marginTop={1}>
        <Text color="dim">
          <Text color="green" bold>
            Enter
          </Text>
          : Switch{" "}
          <Text color="green" bold>
            ↑↓
          </Text>
          : Navigate{" "}
          <Text color="green" bold>
            d
          </Text>
          : Delete{" "}
          <Text color="green" bold>
            s
          </Text>
          : Scenarios{" "}
          <Text color="green" bold>
            q
          </Text>
          : Quit
        </Text>
      </Box>
    </Box>
  );
}
