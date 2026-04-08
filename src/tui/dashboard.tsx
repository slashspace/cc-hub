// src/tui/dashboard.tsx

import React from "react";
import { Box, Text, useInput } from "ink";
import { ModelStore } from "../types.js";
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
          <Box marginTop={1}>
            <Text color="dim">
              No models configured. Press <Text color="green" bold>[a]</Text> to add one.
            </Text>
          </Box>
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
