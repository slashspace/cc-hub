// src/tui/app.tsx

import React from "react";
import { useApp, useInput, Box, Text } from "ink";
import { ModelConfig } from "../types.js";
import {
  loadStore,
  saveStore,
  addModel,
  updateModel,
  removeModel,
  setActiveModel,
  getModel,
} from "../store/model-store.js";
import { activateModel } from "../store/claude-config.js";
import { Dashboard } from "./dashboard.js";
import { AddModel } from "./add-model.js";
import { EditModel } from "./edit-model.js";
import { Confirm } from "./confirm.js";

type Screen =
  | { type: "dashboard" }
  | { type: "add" }
  | { type: "edit"; modelId: string }
  | { type: "confirm"; message: string; onConfirm: () => void };

export function App() {
  const { exit } = useApp();
  const [store, setStore] = React.useState(() => loadStore());
  const [screen, setScreen] = React.useState<Screen>({ type: "dashboard" });
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Auto-clear status message
  React.useEffect(() => {
    if (!statusMessage) return;
    const timer = setTimeout(() => setStatusMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [statusMessage]);

  // Reset selection when models change
  React.useEffect(() => {
    if (selectedIndex >= store.models.length && store.models.length > 0) {
      setSelectedIndex(store.models.length - 1);
    }
  }, [store.models.length, selectedIndex]);

  // --- Action handlers (stable refs) ---

  const handleSelect = React.useCallback(
    (id: string) => {
      const updated = setActiveModel(store, id);
      setStore(updated);
      saveStore(updated);
      const model = getModel(updated, id);
      if (model) {
        activateModel(model);
        setStatusMessage(`已切换至 ${model.name}`);
      }
    },
    [store],
  );

  const handleEdit = React.useCallback(
    (id: string) => setScreen({ type: "edit", modelId: id }),
    [],
  );

  const handleAddSubmit = React.useCallback(
    (model: ModelConfig) => {
      const updated = addModel(store, model);
      setStore(updated);
      saveStore(updated);
      setScreen({ type: "dashboard" });
      setStatusMessage(`已添加 ${model.name}`);
    },
    [store],
  );

  const handleAddCancel = React.useCallback(
    () => setScreen({ type: "dashboard" }),
    [],
  );

  const handleEditSave = React.useCallback(
    (updates: Partial<ModelConfig>) => {
      const editScreen = screen as Extract<Screen, { type: "edit" }>;
      const updated = updateModel(store, editScreen.modelId, updates);
      setStore(updated);
      saveStore(updated);
      setScreen({ type: "dashboard" });
      setStatusMessage(`已更新 ${updates.name || editScreen.modelId}`);
    },
    [store, screen],
  );

  const handleEditCancel = React.useCallback(
    () => setScreen({ type: "dashboard" }),
    [],
  );

  const handleDelete = React.useCallback(
    (id: string) => {
      const model = getModel(store, id);
      if (!model) return;
      setScreen({
        type: "confirm",
        message: `Delete model "${model.name}" (${id})?`,
        onConfirm: () => {
          const updated = removeModel(store, id);
          setStore(updated);
          saveStore(updated);
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

  // --- Centralized keyboard handling ---

  useInput((input, key) => {
    // Global: quit from any screen
    if (input === "q") {
      exit();
      return;
    }

    switch (screen.type) {
      case "dashboard": {
        if (input === "a") {
          setScreen({ type: "add" });
          return;
        }
        if (key.escape) {
          exit();
          return;
        }
        if (key.upArrow) {
          setSelectedIndex((i) => Math.max(0, i - 1));
          return;
        }
        if (key.downArrow) {
          setSelectedIndex((i) =>
            Math.max(0, Math.min(store.models.length - 1, i + 1)),
          );
          return;
        }
        if (key.return && store.models.length > 0) {
          handleSelect(store.models[selectedIndex].id);
          return;
        }
        if (input === "e" && store.models.length > 0) {
          handleEdit(store.models[selectedIndex].id);
          return;
        }
        if (input === "d" && store.models.length > 0) {
          handleDelete(store.models[selectedIndex].id);
          return;
        }
        return;
      }

      case "add": {
        if (input === "escape") {
          setScreen({ type: "dashboard" });
          return;
        }
        return;
      }

      case "edit": {
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
          onAdd={() => setScreen({ type: "add" })}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNavigate={(dir) =>
            setSelectedIndex((i) =>
              dir === "up"
                ? Math.max(0, i - 1)
                : Math.max(0, Math.min(store.models.length - 1, i + 1)),
            )
          }
        />
      )}

      {screen.type === "add" && (
        <AddModel onSubmit={handleAddSubmit} onCancel={handleAddCancel} />
      )}

      {screen.type === "edit" && (
        <EditModel
          model={getModel(store, screen.modelId)!}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
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
