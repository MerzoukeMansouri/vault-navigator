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

export function useSecretEditor(path: string, onDeleted?: () => void, onSaved?: () => void) {
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

  const loadSecret = useCallback(async () => {
    if (!client) return;

    setLoading(true);
    setIsEditing(false);
    try {
      const data = await client.readSecret(path);
      setSecret(data);
      setFormData(
        Object.entries(data.data).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: typeof value === "string" ? value : JSON.stringify(value),
          }),
          {}
        )
      );
      setJsonValue(JSON.stringify(data.data, null, 2));
      logger.debug("Secret loaded", path);
    } catch (error: unknown) {
      logger.error("Error loading secret", error);
    } finally {
      setLoading(false);
    }
  }, [client, path]);

  useEffect(() => {
    loadSecret();
  }, [loadSecret]);

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

      await client.writeSecret(path, dataToSave);
      await loadSecret();
      setIsEditing(false);
      onSaved?.();
      logger.info("Secret saved", path);
    } catch (error: unknown) {
      logger.error("Error saving secret", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error saving secret: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;

    try {
      await client.deleteSecret(path);
      onDeleted?.();
      logger.info("Secret deleted", path);
    } catch (error: unknown) {
      logger.error("Error deleting secret", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Error deleting secret: ${message}`);
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

    // Actions
    setEditMode,
    setJsonValue,
    setFormData,
    startEditing,
    cancelEditing,
    handleSave,
    handleDelete,
    handleAddField,
    handleRemoveField,
    handleCopy,
    loadSecret,
  };
}
