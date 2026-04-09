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
import { Modal } from "../components/ui/modal.js";

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

  // Model-only rows for navigation (no headers)
  function getModelRows() {
    return store.providers.flatMap((p) =>
      p.models.map((m) => ({ providerId: p.id, modelId: m }))
    );
  }

  React.useEffect(() => {
    const n = getModelRows().length;
    if (n === 0) return;
    setSelectedIndex((prev) => Math.max(0, Math.min(prev, n - 1)));
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
        setStatusMessage(`Switched to ${resolved.modelId}`);
      }
    },
    [store],
  );

  const handleDelete = React.useCallback(
    (providerId: string, modelId: string) => {
      const provider = store.providers.find((p) => p.id === providerId);
      if (!provider || !provider.models.includes(modelId)) return;
      setScreen({
        type: "confirm",
        message: `Delete model "${modelId}"?`,
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
          setStatusMessage(`Deleted ${modelId}`);
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
        if (key.upArrow || key.downArrow) {
          const models = getModelRows();
          if (models.length === 0) return;
          const nextPos = key.upArrow
            ? (selectedIndex - 1 + models.length) % models.length
            : (selectedIndex + 1) % models.length;
          setSelectedIndex(nextPos);
          return;
        }
        if (key.return) {
          const models = getModelRows();
          const row = models[selectedIndex];
          if (row) handleSelect(row.modelId);
          return;
        }
        if (input === "d") {
          const models = getModelRows();
          const row = models[selectedIndex];
          if (row) {
            handleDelete(row.providerId, row.modelId);
          }
          return;
        }
        return;
      }

      case "scenario": {
        // ScenarioConfig handles its own keyboard input (↑↓←→Enter Esc)
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
        <Modal
          title="Confirm"
          borderColor="yellow"
          borderStyle="round"
          onClose={() => setScreen({ type: "dashboard" })}
        >
          <Box paddingX={2} paddingY={1} flexDirection="column">
            <Text>{screen.message}</Text>
            <Box marginTop={1} gap={2}>
              <Text>
                <Text inverse bold> Y </Text>
                <Text dimColor> Yes</Text>
              </Text>
              <Text>
                <Text inverse bold> N </Text>
                <Text dimColor> No</Text>
              </Text>
              <Text>
                <Text inverse bold> Esc </Text>
                <Text dimColor> Cancel</Text>
              </Text>
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
