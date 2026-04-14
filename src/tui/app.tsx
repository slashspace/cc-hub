// src/tui/app.tsx

import React from "react";
import { useApp, useInput, Box, Text } from "ink";
import { Scope } from "../types.js";
import {
  loadConfig,
  saveConfig,
  findModel,
  removeModelFromProvider,
  getConfigError,
  clearConfigError,
} from "../store/config-store.js";
import {
  activateModel,
  detectScope,
  saveScenarioModels,
} from "../store/claude-config.js";
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
  const [scope, setScope] = React.useState<Scope>(() => detectScope());

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
      p.models.map((m) => ({ providerId: p.id, modelId: m })),
    );
  }

  React.useEffect(() => {
    const n = getModelRows().length;
    if (n === 0) return;
    setSelectedIndex((prev) => Math.max(0, Math.min(prev, n - 1)));
  }, [store.providers.length]);

  // --- Action handlers ---

  const handleSelect = React.useCallback(
    (providerId: string, modelId: string) => {
      const provider = store.providers.find((p) => p.id === providerId);
      if (provider) {
        activateModel(provider, modelId, { scope });
        setStatusMessage(`Switched to ${modelId}`);
      }
    },
    [store, scope],
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
    (scenarioModels: { opusModelId?: string; sonnetModelId?: string; haikuModelId?: string; subagentModelId?: string }) => {
      saveScenarioModels(scenarioModels, scope);
      setStatusMessage("Scenario mappings saved");
    },
    [scope],
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
        if (key.tab) {
          const nextScope: Scope = scope === "global" ? "local" : "global";
          setScope(nextScope);
          return;
        }
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
          if (row) handleSelect(row.providerId, row.modelId);
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
        <Box minHeight={20}>
          <Dashboard
            store={store}
            selectedIndex={selectedIndex}
            scope={scope}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onScenario={() => setScreen({ type: "scenario" })}
          />
        </Box>
      )}

      {screen.type === "scenario" && (
        <Box minHeight={20}>
          <ScenarioConfig
            store={store}
            scope={scope}
            onSave={handleScenarioSave}
            onCancel={handleScenarioCancel}
          />
        </Box>
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
                <Text inverse bold>
                  {" "}
                  Y{" "}
                </Text>
                <Text dimColor> Yes</Text>
              </Text>
              <Text>
                <Text inverse bold>
                  {" "}
                  N{" "}
                </Text>
                <Text dimColor> No</Text>
              </Text>
              <Text>
                <Text inverse bold>
                  {" "}
                  Esc{" "}
                </Text>
                <Text dimColor> Cancel</Text>
              </Text>
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
}
