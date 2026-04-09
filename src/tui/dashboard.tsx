// src/tui/dashboard.tsx

import React from "react";
import { Box, Text } from "ink";
import { ConfigStore, Provider, Model } from "../types.js";

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
  | { type: "model"; provider: Provider; model: Model };

function flattenStore(store: ConfigStore): Row[] {
  const items: Row[] = [];
  for (const p of store.providers) {
    items.push({ type: "header", provider: p });
    for (const m of p.models) {
      items.push({ type: "model", provider: p, model: m });
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

  const activeProvider = store.activeProviderId
    ? store.providers.find((p) => p.id === store.activeProviderId)
    : null;
  const activeModel =
    activeProvider && store.activeModelId
      ? activeProvider.models.find((m) => m.id === store.activeModelId)
      : null;

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* Header */}
      <Text bold>CC Model Hub</Text>
      <Text>{"─".repeat(50)}</Text>

      {/* Active model info */}
      <Box flexDirection="column" marginTop={1}>
        {activeModel && activeProvider ? (
          <>
            <Text>
              Active:{" "}
              <Text color="green" bold>
                {activeModel.name}
              </Text>{" "}
              ({activeModel.id})
            </Text>
            <Text color="dim">
              Provider: {activeProvider.name} · Endpoint:{" "}
              {truncateUrl(activeProvider.baseUrl)}
            </Text>
          </>
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
            const isActive = item.model.id === store.activeModelId;
            const isSelected = index === selectedIndex;
            return (
              <Box key={item.model.id}>
                <Text>{isSelected ? "> " : "  "}</Text>
                <Text color={isActive ? "green" : "dim"}>
                  {isActive ? "●" : "○"}
                </Text>
                <Text> {item.model.id.padEnd(20)}</Text>
                <Text color="dim">{item.model.name}</Text>
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

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname + u.pathname;
  } catch {
    return url.length > 40 ? url.slice(0, 37) + "..." : url;
  }
}
