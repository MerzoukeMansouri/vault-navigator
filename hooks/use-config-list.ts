/**
 * Custom hook for managing the list of saved configurations
 * Handles CRUD operations for configs
 */

import { useState, useEffect, useCallback } from "react";
import { SavedConfig } from "@/lib/types";
import { storage } from "@/lib/storage";
import { useVault } from "@/contexts/vault-context";
import { logger } from "@/lib/utils/logger";

export function useConfigList() {
  const [configs, setConfigs] = useState<SavedConfig[]>([]);
  const { login, activeConfig, refreshConfig } = useVault();

  const loadConfigs = useCallback(() => {
    const loadedConfigs = storage.getConfigs();
    setConfigs(loadedConfigs);
    logger.debug("Loaded configs", { count: loadedConfigs.length });
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const saveConfig = useCallback((config: SavedConfig) => {
    try {
      storage.saveConfig(config);
      loadConfigs();
      refreshConfig();
      logger.info("Config saved", config.id);
    } catch (error) {
      logger.error("Failed to save config", error);
      throw error;
    }
  }, [loadConfigs, refreshConfig]);

  const deleteConfig = useCallback((id: string) => {
    try {
      storage.deleteConfig(id);
      loadConfigs();
      logger.info("Config deleted", id);
    } catch (error) {
      logger.error("Failed to delete config", error);
      throw error;
    }
  }, [loadConfigs]);

  const selectConfig = useCallback((config: SavedConfig) => {
    login(config);
    logger.info("Config selected", config.id);
  }, [login]);

  const isActiveConfig = useCallback((configId: string): boolean => {
    return activeConfig?.id === configId;
  }, [activeConfig]);

  return {
    configs,
    activeConfig,
    loadConfigs,
    saveConfig,
    deleteConfig,
    selectConfig,
    isActiveConfig,
  };
}
