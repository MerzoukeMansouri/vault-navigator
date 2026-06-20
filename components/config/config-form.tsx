/**
 * Configuration form component
 * Extracted from ConfigManager for better SRP
 */

"use client";

import React from "react";
import { Check, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";


interface ConfigFormData {
  name: string;
  url: string;
  token: string;
  namespace: string;
}

interface ConnectionStatus {
  success: boolean;
  message: string;
}

interface ConfigFormProps {
  formData: ConfigFormData;
  onFormDataChange: (data: ConfigFormData) => void;
  onSave: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onTestConnection: () => void;
  testingConnection: boolean;
  connectionStatus: ConnectionStatus | null;
  isEditing: boolean;
}

export function ConfigForm({
  formData,
  onFormDataChange,
  onSave,
  onCancel,
  onTestConnection,
  testingConnection,
  connectionStatus,
}: ConfigFormProps) {
  return (
    <form onSubmit={onSave} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Configuration Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
            placeholder="Production Vault"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">Vault URL</Label>
          <Input
            id="url"
            value={formData.url}
            onChange={(e) => onFormDataChange({ ...formData, url: e.target.value })}
            placeholder="https://vault.example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">Vault Token</Label>
          <Input
            id="token"
            type="password"
            value={formData.token}
            onChange={(e) => onFormDataChange({ ...formData, token: e.target.value })}
            placeholder="hvs.XXXXXXXXXXXXXX"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="namespace">Namespace</Label>
          <Input
            id="namespace"
            value={formData.namespace}
            onChange={(e) => onFormDataChange({ ...formData, namespace: e.target.value })}
            placeholder="my-namespace"
          />
          <p className="text-xs text-muted-foreground">Leave empty for root namespace</p>
        </div>

        {connectionStatus && (
          <div className={`rounded-md border p-3 flex items-start gap-2 ${
            connectionStatus.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {connectionStatus.success
              ? <CheckCircle className="size-4 mt-0.5 flex-shrink-0" />
              : <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />}
            <p className="text-sm">{connectionStatus.message}</p>
          </div>
        )}
      </div>

      <div className="border-t px-4 py-4 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onTestConnection}
          disabled={testingConnection}
          className="gap-2"
        >
          {testingConnection ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
          Test
        </Button>
        <Button type="submit" className="gap-2 flex-1">
          <Check className="size-4" />
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="size-4" />
        </Button>
      </div>
    </form>
  );
}
