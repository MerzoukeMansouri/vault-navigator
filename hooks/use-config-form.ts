/**
 * Custom hook for managing configuration form state and operations
 * Extracted from ConfigManager to follow SRP
 */

import { useState, useEffect } from "react";
import { SavedConfig } from "@/lib/types";
import { VaultClient } from "@/lib/vault-client";
import { logger } from "@/lib/utils/logger";

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

interface UseConfigFormOptions {
  prefilledToken?: string;
  onSaveSuccess?: () => void;
}

export function useConfigForm(options: UseConfigFormOptions = {}) {
  const { prefilledToken, onSaveSuccess } = options;

  const [formData, setFormData] = useState<ConfigFormData>({
    name: "",
    url: "",
    token: "",
    namespace: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  // Handle prefilled token from URL
  useEffect(() => {
    if (prefilledToken) {
      setFormData((prev) => ({ ...prev, token: prefilledToken }));
      setIsEditing(true);
    }
  }, [prefilledToken]);

  const resetForm = () => {
    setFormData({ name: "", url: "", token: "", namespace: "" });
    setIsEditing(false);
    setEditingId(null);
    setConnectionStatus(null);
  };

  const startEditing = (config?: SavedConfig) => {
    if (config) {
      setFormData({
        name: config.name,
        url: config.url,
        token: config.token,
        namespace: config.namespace || "",
      });
      setEditingId(config.id);
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    resetForm();
  };

  const testConnection = async (): Promise<void> => {
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
        logger.info("Vault connection test successful", formData.url);
      } else {
        setConnectionStatus({
          success: false,
          message: result.error || "Connection failed",
        });
        logger.warn("Vault connection test failed", result.error);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection test failed";
      setConnectionStatus({
        success: false,
        message,
      });
      logger.error("Vault connection test error", error);
    } finally {
      setTestingConnection(false);
    }
  };

  const buildConfig = (): SavedConfig => {
    return {
      id: editingId || Date.now().toString(),
      name: formData.name,
      url: formData.url,
      token: formData.token,
      namespace: formData.namespace.trim() || undefined,
    };
  };

  const handleSave = () => {
    const config = buildConfig();
    resetForm();
    onSaveSuccess?.();
    return config;
  };

  return {
    // State
    formData,
    isEditing,
    editingId,
    testingConnection,
    connectionStatus,

    // Actions
    setFormData,
    startEditing,
    cancelEditing,
    testConnection,
    handleSave,
    resetForm,

    // Helpers
    buildConfig,
  };
}
