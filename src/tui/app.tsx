// src/tui/app.tsx

import React from "react";
import { useApp, Box, Text } from "ink";
import { ModelConfig } from "../types.js";
import { loadStore, saveStore, addModel, updateModel, removeModel, setActiveModel, getModel } from "../store/model-store.js";
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

type AppState = {
  screen: Screen;
  statusMessage: string | null;
};

export function App() {
  const { exit } = useApp();
  const [store, setStore] = React.useState(() => loadStore());
  const [state, setState] = React.useState<AppState>({
    screen: { type: "dashboard" },
    statusMessage: null,
  });

  // Auto-clear status message after a delay
  React.useEffect(() => {
    if (!state.statusMessage) return;
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, statusMessage: null }));
    }, 2000);
    return () => clearTimeout(timer);
  }, [state.statusMessage]);

  // Dashboard handlers
  const handleSelect = (id: string) => {
    const updated = setActiveModel(store, id);
    setStore(updated);
    saveStore(updated);
    const model = getModel(updated, id);
    if (model) {
      activateModel(model);
      setState((s) => ({
        ...s,
        statusMessage: `已切换至 ${model.name}`,
      }));
    }
  };

  const handleAdd = () => {
    setState((s) => ({ ...s, screen: { type: "add" } }));
  };

  const handleEdit = (id: string) => {
    setState((s) => ({ ...s, screen: { type: "edit", modelId: id } }));
  };

  const handleDelete = (id: string) => {
    const model = getModel(store, id);
    if (!model) return;
    setState((s) => ({
      ...s,
      screen: {
        type: "confirm",
        message: `Delete model "${model.name}" (${id})?`,
        onConfirm: () => {
          const updated = removeModel(store, id);
          setStore(updated);
          saveStore(updated);
          setState((s) => ({
            ...s,
            screen: { type: "dashboard" },
            statusMessage: `已删除 ${model.name}`,
          }));
        },
      },
    }));
  };

  const handleQuit = () => exit();

  // Add handler
  const handleAddSubmit = (model: ModelConfig) => {
    const updated = addModel(store, model);
    setStore(updated);
    saveStore(updated);
    setState((s) => ({
      ...s,
      screen: { type: "dashboard" },
      statusMessage: `已添加 ${model.name}`,
    }));
  };

  const handleAddCancel = () => {
    setState((s) => ({ ...s, screen: { type: "dashboard" } }));
  };

  // Edit handler
  const handleEditSave = (updates: Partial<ModelConfig>) => {
    const editScreen = state.screen as Extract<Screen, { type: "edit" }>;
    const updated = updateModel(store, editScreen.modelId, updates);
    setStore(updated);
    saveStore(updated);
    setState((s) => ({
      ...s,
      screen: { type: "dashboard" },
      statusMessage: `已更新 ${updates.name || editScreen.modelId}`,
    }));
  };

  const handleEditCancel = () => {
    setState((s) => ({ ...s, screen: { type: "dashboard" } }));
  };

  // Confirm handler
  const handleConfirmCancel = () => {
    setState((s) => ({ ...s, screen: { type: "dashboard" } }));
  };

  return (
    <Box flexDirection="column">
      {state.statusMessage && (
        <Box paddingX={1}>
          <Text color="green">✓ {state.statusMessage}</Text>
        </Box>
      )}

      {state.screen.type === "dashboard" && (
        <Dashboard
          store={store}
          onSelect={handleSelect}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onQuit={handleQuit}
        />
      )}

      {state.screen.type === "add" && (
        <AddModel onSubmit={handleAddSubmit} onCancel={handleAddCancel} />
      )}

      {state.screen.type === "edit" && (
        <EditModel
          model={getModel(store, state.screen.modelId)!}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}

      {state.screen.type === "confirm" && (
        <Confirm
          message={state.screen.message}
          onConfirm={state.screen.onConfirm}
          onCancel={handleConfirmCancel}
        />
      )}
    </Box>
  );
}
