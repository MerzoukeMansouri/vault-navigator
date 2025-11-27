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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
  onSave: (e: React.FormEvent) => void;
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
  isEditing,
}: ConfigFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Configuration" : "Add New Configuration"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Configuration Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                onFormDataChange({ ...formData, name: e.target.value })
              }
              placeholder="Production Vault"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Vault URL</Label>
            <Input
              id="url"
              value={formData.url}
              onChange={(e) =>
                onFormDataChange({ ...formData, url: e.target.value })
              }
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
              onChange={(e) =>
                onFormDataChange({ ...formData, token: e.target.value })
              }
              placeholder="hvs.XXXXXXXXXXXXXX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="namespace">Namespace</Label>
            <Input
              id="namespace"
              value={formData.namespace}
              onChange={(e) =>
                onFormDataChange({ ...formData, namespace: e.target.value })
              }
              placeholder="my-namespace"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for root namespace
            </p>
          </div>

          {connectionStatus && (
            <div
              className={`rounded-md border p-3 flex items-start gap-2 ${
                connectionStatus.success
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {connectionStatus.success ? (
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm">{connectionStatus.message}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onTestConnection}
              disabled={testingConnection}
              className="gap-2"
            >
              {testingConnection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Test Connection
            </Button>
            <Button type="submit" className="gap-2">
              <Check className="h-4 w-4" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
