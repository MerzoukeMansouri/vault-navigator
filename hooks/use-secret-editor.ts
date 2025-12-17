/**
 * Custom hook for managing secret editor state and operations
 * Extracted from SecretEditor to follow SRP
 */

import { useState, useEffect, useCallback } from "react";
import { Secret } from "@/lib/types";
import { useVault } from "@/contexts/vault-context";
import { logger } from "@/lib/utils/logger";
import { UI_CONFIG } from "@/lib/constants";

export type EditMode = "form" | "json";

export interface VersionInfo {
  version: number;
  created_time: string;
}

export function useSecretEditor(path: string, onSaved?: () => void) {
  const { client } = useVault();
  const [secret, setSecret] = useState<Secret | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>("form");
  const [jsonValue, setJsonValue] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const loadSecret = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setIsEditing(false);
    try {
      const data = await client.readSecret(path);
      setSecret(data);
      const formDataObj = Object.entries(data.data).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: typeof value === "string" ? value : JSON.stringify(value),
        }),
        {}
      );
      setFormData(formDataObj);
      setJsonValue(JSON.stringify(data.data, null, 2));
      logger.debug("Secret loaded", path);
      logger.debug("Secret loaded with version", data.metadata?.version);
    } catch (error: unknown) {
      logger.error("Error loading secret", error);
    } finally {
      setLoading(false);
    }
  }, [client, path]);

  const loadVersionHistory = useCallback(async () => {
    if (!client) return;

    setLoadingVersions(true);
    try {
      const versionHistory = await client.getVersionHistory(path);
      setVersions(versionHistory);
      logger.debug("Version history loaded", { path, count: versionHistory.length });
    } catch (error: unknown) {
      logger.error("Error loading version history", error);
      // Don't throw - versioning might not be supported
    } finally {
      setLoadingVersions(false);
    }
  }, [client, path]);

  const readSecretVersion = useCallback(
    async (version: number): Promise<Secret | null> => {
      if (!client) return null;

      try {
        const data = await client.readSecretVersion(path, version);
        logger.debug("Secret version read", { path, version });
        return data;
      } catch (error: unknown) {
        logger.error("Error reading secret version", error);
        throw error;
      }
    },
    [client, path]
  );

  useEffect(() => {
    loadSecret();
    loadVersionHistory();
  }, [loadSecret, loadVersionHistory]);

  const handleSave = async () => {
    if (!client) return;

    setSaving(true);
    try {
      let dataToSave: Record<string, unknown>;

      if (editMode === "json") {
        try {
          dataToSave = JSON.parse(jsonValue);
          setJsonError("");
        } catch {
          setJsonError("Invalid JSON");
          setSaving(false);
          return;
        }
      } else {
        dataToSave = formData;
      }

      // Verify we have data to save
      if (!dataToSave || Object.keys(dataToSave).length === 0) {
        setSaving(false);
        throw new Error("No data to save. Please add at least one field.");
      }

      logger.debug("Saving secret data", { path, dataKeys: Object.keys(dataToSave) });

      await client.writeSecret(path, dataToSave);

      logger.info("Secret saved successfully", path);

      // Wait a bit for Vault to persist, then reload
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadSecret();
      await new Promise(resolve => setTimeout(resolve, 300)); // Wait for state updates

      setIsEditing(false);
      onSaved?.();
    } catch (error: unknown) {
      logger.error("Error saving secret", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error saving secret: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = (key: string) => {
    if (key && !formData[key]) {
      setFormData({ ...formData, [key]: "" });
    }
  };

  const handleRemoveField = (key: string) => {
    const newData = { ...formData };
    delete newData[key];
    setFormData(newData);
  };

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), UI_CONFIG.COPY_FEEDBACK_DURATION);
    logger.debug("Copied to clipboard", key);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    loadSecret();
  };

  return {
    // State
    secret,
    loading,
    saving,
    isEditing,
    editMode,
    jsonValue,
    jsonError,
    copiedKey,
    formData,
    versions,
    loadingVersions,

    // Actions
    setEditMode,
    setJsonValue,
    setFormData,
    startEditing,
    cancelEditing,
    handleSave,
    handleAddField,
    handleRemoveField,
    handleCopy,
    loadSecret,
    readSecretVersion,
  };
}
