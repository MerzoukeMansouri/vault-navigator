"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { SavedConfig } from "@/lib/types";
import { storage } from "@/lib/storage";
import { useVault } from "@/contexts/vault-context";
import { VaultClient } from "@/lib/vault-client";

export function ConfigManager() {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { login, activeConfig, refreshConfig } = useVault();

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    token: "",
    namespace: "",
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = () => {
    setConfigs(storage.getConfigs());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: SavedConfig = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      url: formData.url,
      token: formData.token,
      namespace: formData.namespace.trim() || undefined,
    };

    storage.saveConfig(config);
    loadConfigs();
    refreshConfig();
    resetForm();
  };

  const handleEdit = (config: SavedConfig) => {
    setFormData({
      name: config.name,
      url: config.url,
      token: config.token,
      namespace: config.namespace || "",
    });
    setEditingId(config.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this configuration?")) {
      storage.deleteConfig(id);
      loadConfigs();
    }
  };

  const handleSelect = (config: SavedConfig) => {
    login(config);
  };

  const resetForm = () => {
    setFormData({ name: "", url: "", token: "", namespace: "" });
    setIsAdding(false);
    setEditingId(null);
    setConnectionStatus(null);
  };

  const handleTestConnection = async () => {
    if (!formData.url || !formData.token) {
      setConnectionStatus({
        success: false,
        message: "Please enter both URL and token",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      const testClient = new VaultClient({
        url: formData.url,
        token: formData.token,
      });

      const result = await testClient.testConnection();

      if (result.success) {
        setConnectionStatus({
          success: true,
          message: "Connection successful!",
        });
      } else {
        setConnectionStatus({
          success: false,
          message: result.error || "Connection failed",
        });
      }
    } catch (error: unknown) {
      setConnectionStatus({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Vault Configurations</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Configuration
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit Configuration" : "Add New Configuration"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Configuration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                    setFormData({ ...formData, url: e.target.value })
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
                    setFormData({ ...formData, token: e.target.value })
                  }
                  placeholder="hvs.XXXXXXXXXXXXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="namespace">
                  Namespace
                </Label>
                <Input
                  id="namespace"
                  value={formData.namespace}
                  onChange={(e) =>
                    setFormData({ ...formData, namespace: e.target.value })
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
                  onClick={handleTestConnection}
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
                  onClick={resetForm}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {configs.map((config) => (
          <Card
            key={config.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              activeConfig?.id === config.id
                ? "ring-2 ring-primary"
                : ""
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{config.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(config);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(config.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent onClick={() => handleSelect(config)}>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">URL:</span>{" "}
                  <span className="text-muted-foreground truncate block">
                    {config.url}
                  </span>
                </div>
                <div>
                  <span className="font-semibold">Namespace:</span>{" "}
                  <span className="text-muted-foreground">
                    {config.namespace || "Root"}
                  </span>
                </div>
              </div>
              {activeConfig?.id === config.id && (
                <div className="mt-3 text-xs font-semibold text-primary">
                  Active
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {configs.length === 0 && !isAdding && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No configurations yet. Add one to get started!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
