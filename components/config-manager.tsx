"use client";

import React, { useState, useEffect } from "react";
import { Plus, Copy, Check, Terminal } from "lucide-react";
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
  prefilledUrl?: string;
  prefilledNamespace?: string;
}

function buildAlias(ns: string, addr: string, origin: string) {
  return `vault-me() {
  local ns="\${1:-${ns}}"
  local addr="${addr}"
  vault login -method=oidc -namespace="$ns" -address="$addr" && \\
  [[ -f ~/.vault-token ]] && pbcopy < ~/.vault-token && \\
  echo "VAULT_TOKEN=$(<~/.vault-token)" > ~/.env-spring && \\
  open "${origin}/config?token=$(cat ~/.vault-token)&url=$addr&namespace=$ns"
}`;
}

function AliasInfo() {
  const [copied, setCopied] = useState(false);
  const [ns, setNs] = useState("");
  const [addr, setAddr] = useState("");
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const alias = buildAlias(ns, addr, origin);

  const handleCopy = () => {
    navigator.clipboard.writeText(alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Terminal className="size-4" />
            Add to <code className="bg-muted px-1 py-0.5 rounded text-xs">~/.zshrc</code> for one-command login
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 h-7 text-xs">
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="flex gap-2">
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="Vault address"
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-xs font-mono"
          />
          <input
            value={ns}
            onChange={(e) => setNs(e.target.value)}
            placeholder="Namespace"
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-xs font-mono"
          />
        </div>
        <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto leading-relaxed">{alias}</pre>
      </CardContent>
    </Card>
  );
}

export function ConfigManager({ prefilledToken, prefilledUrl, prefilledNamespace }: ConfigManagerProps) {
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
    prefilledUrl,
    prefilledNamespace,
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
      <AliasInfo />
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Vault Configurations</h2>
        {!isEditing && (
          <Button onClick={() => startEditing()} className="gap-2">
            <Plus className="size-4" />
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
