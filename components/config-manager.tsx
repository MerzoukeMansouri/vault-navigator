"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { ConfigForm } from "./config/config-form";
import { ConfigCard } from "./config/config-card";
import { useConfigForm } from "@/hooks/use-config-form";
import { useConfigList } from "@/hooks/use-config-list";
import { useConfirm } from "@/hooks/use-confirm";
import { SavedConfig } from "@/lib/types";
import confetti from "canvas-confetti";
import { MatrixRain } from "./matrix-rain";

interface ConfigManagerProps {
  prefilledToken?: string;
  prefilledUrl?: string;
  prefilledNamespace?: string;
}


export function ConfigManager({ prefilledToken, prefilledUrl, prefilledNamespace }: ConfigManagerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    configs,
    loaded,
    saveConfig,
    deleteConfig,
    selectConfig,
    isActiveConfig,
  } = useConfigList();

  const {
    formData,
    testingConnection,
    connectionStatus,
    setFormData,
    startEditing,
    cancelEditing,
    testConnection,
    handleSave,
  } = useConfigForm({
    prefilledToken,
    prefilledUrl,
    prefilledNamespace,
  });

  useEffect(() => {
    if (!loaded || !prefilledToken || !prefilledUrl) return;

    const host = (u: string) => { try { return new URL(u).hostname; } catch { return u; } };
    const match = configs.find(
      (c) =>
        host(c.url) === host(prefilledUrl) &&
        (c.namespace ?? "") === (prefilledNamespace ?? "")
    );

    if (match) {
      const updated = { ...match, token: prefilledToken };
      saveConfig(updated);
      toast.custom(() => (
        <div className="relative overflow-hidden rounded-md border border-emerald-500/30 shadow-lg shadow-emerald-900/20 w-[360px]">
          <MatrixRain className="absolute inset-0 w-full h-full opacity-30" />
          <div className="relative z-10 flex items-start gap-3 bg-black/75 px-4 py-3 font-mono text-sm">
            <span className="mt-px text-emerald-400 select-none">▶</span>
            <div className="space-y-0.5">
              <p className="text-emerald-300 font-semibold tracking-wide">TOKEN ROTATED</p>
              <p className="text-emerald-600 text-xs">{match.name} — credentials synchronized</p>
            </div>
          </div>
        </div>
      ), { duration: 4000 });
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSheetOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, prefilledToken, prefilledUrl, prefilledNamespace]);

  const { confirm, confirmState, handleClose } = useConfirm();

  const openSheet = (config?: SavedConfig) => {
    startEditing(config);
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    cancelEditing();
  };

  const onSave = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const config = handleSave();
    saveConfig(config);
    setSheetOpen(false);
  };

  const onDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete Configuration",
      description: "Are you sure you want to delete this configuration? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    if (confirmed) deleteConfig(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-heading">Vault Configurations</h2>
        <Button onClick={() => openSheet()} className="gap-2">
          <Plus className="size-4" />
          Add Configuration
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) closeSheet(); }}>
        <SheetContent side="right" showCloseButton={false}>
          <SheetHeader className="border-b pb-4">
            <SheetTitle>{formData.name ? "Edit Configuration" : "Add Configuration"}</SheetTitle>
          </SheetHeader>
          <ConfigForm
            formData={formData}
            onFormDataChange={setFormData}
            onSave={onSave}
            onCancel={closeSheet}
            onTestConnection={testConnection}
            testingConnection={testingConnection}
            connectionStatus={connectionStatus}
            isEditing={!!formData.name}
          />
        </SheetContent>
      </Sheet>

      {configs.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="py-2.5 px-4 w-8"></th>
                <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Name</th>
                <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground">URL</th>
                <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground">Namespace</th>
                <th className="py-2.5 px-4 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <ConfigCard
                  key={config.id}
                  config={config}
                  isActive={isActiveConfig(config.id)}
                  onSelect={selectConfig}
                  onEdit={openSheet}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {configs.length === 0 && (
        <div className="border rounded-lg py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No configurations yet. Add one to get started.
          </p>
        </div>
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
