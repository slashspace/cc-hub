// src/tui/app.tsx

import React from "react";
import { useApp, useInput, Box, Text } from "ink";
import { ScenarioModels } from "../types.js";
import {
  loadConfig,
  saveConfig,
  setActiveModel,
  findModel,
  updateScenarioModels,
  removeModelFromProvider,
  getConfigError,
  clearConfigError,
} from "../store/config-store.js";
import { activateModel } from "../store/claude-config.js";
import { Dashboard } from "./dashboard.js";
import { ScenarioConfig } from "./scenario-config.js";
import { Confirm } from "./confirm.js";

type Screen =
  | { type: "dashboard" }
  | { type: "scenario" }
  | { type: "confirm"; message: string; onConfirm: () => void };

export function App() {
  const { exit } = useApp();
  const [store, setStore] = React.useState(() => loadConfig());
  const [screen, setScreen] = React.useState<Screen>({ type: "dashboard" });
  const [statusMessage, setStatusMessage] = React.useState<string | null>(() =>
    getConfigError(),
  );
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Auto-clear status message
  React.useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  React.useEffect(() => {
    clearConfigError();
  }, []);

  // Flatten rows for navigation
  function getFlatRows() {
    return store.providers.flatMap((p) => [
      { type: "header" as const, providerId: p.id },
      ...p.models.map((m) => ({ type: "model" as const, modelId: m.id })),
    ]);
  }

  // Clamp selection to a valid model row
  function clampToModel(idx: number): number {
    const rows = getFlatRows();
    if (rows.length === 0) return 0;
    let i = Math.max(0, Math.min(idx, rows.length - 1));
    while (i < rows.length && rows[i].type === "header") i++;
    if (i >= rows.length) {
      i = rows.length - 1;
      while (i >= 0 && rows[i].type === "header") i--;
    }
    return Math.max(0, i);
  }

  React.useEffect(() => {
    setSelectedIndex((prev) => clampToModel(prev));
  }, [store.providers.length]);

  // --- Action handlers ---

  const handleSelect = React.useCallback(
    (modelId: string) => {
      const updated = setActiveModel(store, modelId);
      // Always sync scenarioModels to the selected model
      const withScenarios = updateScenarioModels(updated, {
        opusModelId: modelId,
        sonnetModelId: modelId,
        haikuModelId: modelId,
        subagentModelId: modelId,
      });
      setStore(withScenarios);
      saveConfig(withScenarios);
      const resolved = findModel(withScenarios, modelId);
      if (resolved) {
        activateModel(withScenarios, modelId, withScenarios.scenarioModels);
        setStatusMessage(`已切换至 ${resolved.model.name}`);
      }
    },
    [store],
  );

  const handleDelete = React.useCallback(
    (providerId: string, modelId: string) => {
      const provider = store.providers.find((p) => p.id === providerId);
      const model = provider?.models.find((m) => m.id === modelId);
      if (!provider || !model) return;
      setScreen({
        type: "confirm",
        message: `Delete model "${model.name}" (${model.id})?`,
        onConfirm: () => {
          const updated = removeModelFromProvider(store, providerId, modelId);
          // Remove provider if empty
          const target = updated.providers.find((p) => p.id === providerId);
          if (target && target.models.length === 0) {
            updated.providers = updated.providers.filter(
              (p) => p.id !== providerId,
            );
            if (updated.activeProviderId === providerId)
              updated.activeProviderId = null;
          }
          setStore(updated);
          saveConfig(updated);
          setScreen({ type: "dashboard" });
          setStatusMessage(`已删除 ${model.name}`);
        },
      });
    },
    [store],
  );

  const handleConfirmCancel = React.useCallback(
    () => setScreen({ type: "dashboard" }),
    [],
  );

  const handleScenarioSave = React.useCallback(
    (updates: ScenarioModels) => {
      const updated = {
        ...store,
        scenarioModels: updates,
      };
      setStore(updated);
      saveConfig(updated);
      setScreen({ type: "dashboard" });
      if (updated.activeModelId) {
        activateModel(updated, updated.activeModelId, updated.scenarioModels);
      }
      setStatusMessage("Scenario models updated");
    },
    [store],
  );

  const handleScenarioCancel = React.useCallback(
    () => setScreen({ type: "dashboard" }),
    [],
  );

  // --- Centralized keyboard handling ---

  useInput((input, key) => {
    if (input === "q") {
      exit();
      return;
    }

    switch (screen.type) {
      case "dashboard": {
        if (input === "s") {
          setScreen({ type: "scenario" });
          return;
        }
        if (key.escape) {
          exit();
          return;
        }
        if (key.upArrow) {
          const rows = getFlatRows();
          let next = selectedIndex - 1;
          while (next >= 0 && rows[next]?.type === "header") next--;
          setSelectedIndex(Math.max(0, next));
          return;
        }
        if (key.downArrow) {
          const rows = getFlatRows();
          let next = selectedIndex + 1;
          while (next < rows.length && rows[next]?.type === "header") next++;
          setSelectedIndex(Math.min(rows.length - 1, next));
          return;
        }
        if (key.return) {
          const rows = getFlatRows();
          const row = rows[selectedIndex];
          if (row?.type === "model") handleSelect(row.modelId);
          return;
        }
        if (input === "d") {
          const rows = getFlatRows();
          const row = rows[selectedIndex];
          if (row?.type === "model") {
            const provider = store.providers.find((p) =>
              p.models.some((m) => m.id === row.modelId),
            );
            if (provider) handleDelete(provider.id, row.modelId);
          }
          return;
        }
        return;
      }

      case "scenario": {
        if (input === "escape") {
          setScreen({ type: "dashboard" });
          return;
        }
        return;
      }

      case "confirm": {
        if (input === "y" || input === "Y") {
          screen.onConfirm();
          return;
        }
        if (input === "n" || input === "N" || input === "escape") {
          setScreen({ type: "dashboard" });
          return;
        }
        return;
      }
    }
  });

  // --- Render ---

  return (
    <Box flexDirection="column">
      {statusMessage && (
        <Box paddingX={1}>
          <Text color="green">✓ {statusMessage}</Text>
        </Box>
      )}

      {screen.type === "dashboard" && (
        <Dashboard
          store={store}
          selectedIndex={selectedIndex}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onScenario={() => setScreen({ type: "scenario" })}
          onNavigate={(dir) => {
            const rows = getFlatRows();
            if (dir === "up") {
              let next = selectedIndex - 1;
              while (next >= 0 && rows[next]?.type === "header") next--;
              setSelectedIndex(Math.max(0, next));
            } else {
              let next = selectedIndex + 1;
              while (next < rows.length && rows[next]?.type === "header")
                next++;
              setSelectedIndex(Math.min(rows.length - 1, next));
            }
          }}
        />
      )}

      {screen.type === "scenario" && (
        <ScenarioConfig
          store={store}
          onSave={handleScenarioSave}
          onCancel={handleScenarioCancel}
        />
      )}

      {screen.type === "confirm" && (
        <Confirm
          message={screen.message}
          onConfirm={screen.onConfirm}
          onCancel={handleConfirmCancel}
        />
      )}
    </Box>
  );
}
