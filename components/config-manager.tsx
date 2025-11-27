"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { ConfigForm } from "./config/config-form";
import { ConfigCard } from "./config/config-card";
import { useConfigForm } from "@/hooks/use-config-form";
import { useConfigList } from "@/hooks/use-config-list";
import { useConfirm } from "@/hooks/use-confirm";

interface ConfigManagerProps {
  prefilledToken?: string;
}

export function ConfigManager({ prefilledToken }: ConfigManagerProps) {
  // Custom hooks for state management
  const {
    formData,
    isEditing,
    testingConnection,
    connectionStatus,
    setFormData,
    startEditing,
    cancelEditing,
    testConnection,
    handleSave,
  } = useConfigForm({
    prefilledToken,
  });

  const {
    configs,
    saveConfig,
    deleteConfig,
    selectConfig,
    isActiveConfig,
  } = useConfigList();

  const { confirm, confirmState, handleClose } = useConfirm();

  // Handlers
  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const config = handleSave();
    saveConfig(config);
  };

  const onEdit = (config: Parameters<typeof startEditing>[0]) => {
    startEditing(config);
  };

  const onDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Configuration",
      description: "Are you sure you want to delete this configuration? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (confirmed) {
      deleteConfig(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Vault Configurations</h2>
        {!isEditing && (
          <Button onClick={() => startEditing()} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Configuration
          </Button>
        )}
      </div>

      {isEditing && (
        <ConfigForm
          formData={formData}
          onFormDataChange={setFormData}
          onSave={onSave}
          onCancel={cancelEditing}
          onTestConnection={testConnection}
          testingConnection={testingConnection}
          connectionStatus={connectionStatus}
          isEditing={!!formData.name}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configs.map((config) => (
          <ConfigCard
            key={config.id}
            config={config}
            isActive={isActiveConfig(config.id)}
            onSelect={selectConfig}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {configs.length === 0 && !isEditing && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No configurations yet. Add one to get started!
            </p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmState.open}
        onClose={handleClose}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        variant={confirmState.variant}
      />
    </div>
  );
}
