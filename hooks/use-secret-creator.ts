/**
 * Custom hook for managing secret creation state and operations
 * Extracted from SecretCreator to follow Single Responsibility Principle
 */

import { useState, useCallback } from "react";
import { useVault } from "@/contexts/vault-context";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { VAULT_CONFIG } from "@/lib/constants";

export type CreatorMode = "form" | "json";

interface UseSecretCreatorOptions {
  onCreated?: (path: string) => void;
}

export function useSecretCreator(options: UseSecretCreatorOptions = {}) {
  const { client } = useVault();
  const { onCreated } = options;

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Mode state
  const [mode, setMode] = useState<CreatorMode>("form");

  // Form data
  const [path, setPath] = useState("");
  const [jsonValue, setJsonValue] = useState("{}");
  const [jsonError, setJsonError] = useState("");
  const [formFields, setFormFields] = useState<Record<string, string>>({});

  /**
   * Add a new field to the form
   */
  const handleAddField = useCallback(() => {
    const key = `field_${Object.keys(formFields).length + 1}`;
    setFormFields({ ...formFields, [key]: "" });
  }, [formFields]);

  /**
   * Remove a field from the form
   */
  const handleRemoveField = useCallback((key: string) => {
    const newFields = { ...formFields };
    delete newFields[key];
    setFormFields(newFields);
  }, [formFields]);

  /**
   * Update a field's key or value
   */
  const handleUpdateField = useCallback((oldKey: string, newKey: string, value: string) => {
    const newFields = { ...formFields };
    delete newFields[oldKey];
    newFields[newKey] = value;
    setFormFields(newFields);
  }, [formFields]);

  /**
   * Switch to JSON mode and sync data
   */
  const switchToJsonMode = useCallback(() => {
    setMode("json");
    setJsonValue(JSON.stringify(formFields, null, 2));
  }, [formFields]);

  /**
   * Create the secret
   */
  const handleCreate = useCallback(async () => {
    if (!client || !path.trim()) return;

    setSaving(true);
    try {
      let dataToSave: Record<string, unknown>;

      // Parse data based on mode
      if (mode === "json") {
        try {
          dataToSave = JSON.parse(jsonValue);
          setJsonError("");
        } catch {
          setJsonError("Invalid JSON");
          setSaving(false);
          return;
        }
      } else {
        dataToSave = formFields;
      }

      // Ensure path starts with the mount point
      const fullPath = path.startsWith(`${VAULT_CONFIG.DEFAULT_MOUNT}/`)
        ? path
        : `${VAULT_CONFIG.DEFAULT_MOUNT}/${path}`;

      await client.writeSecret(fullPath, dataToSave);

      toast.success(`Secret created at ${fullPath}`);
      logger.info("Secret created", fullPath);

      onCreated?.(fullPath);
      handleClose();
    } catch (error: unknown) {
      logger.error("Error creating secret", error);
      toast.error(error instanceof Error ? error.message : "Failed to create secret");
    } finally {
      setSaving(false);
    }
  }, [client, path, mode, jsonValue, formFields, onCreated]);

  /**
   * Open the creator
   */
  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Close and reset the creator
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPath("");
    setFormFields({});
    setJsonValue("{}");
    setJsonError("");
    setMode("form");
  }, []);

  return {
    // State
    isOpen,
    saving,
    mode,
    path,
    jsonValue,
    jsonError,
    formFields,

    // Actions
    setMode,
    setPath,
    setJsonValue,
    setJsonError,
    handleAddField,
    handleRemoveField,
    handleUpdateField,
    switchToJsonMode,
    handleCreate,
    handleOpen,
    handleClose,
  };
}
