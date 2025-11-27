import { SavedConfig } from "./types";
import { STORAGE_KEYS } from "./constants";
import { logger } from "./utils/logger";

// Migration helper for old config format
interface LegacyConfig {
  id: string;
  name: string;
  url: string;
  token: string;
  namespaces?: string[];
  namespace?: string;
}

function migrateConfig(config: LegacyConfig): SavedConfig {
  // If config has old namespaces array format, convert to new single namespace format
  if (config.namespaces && Array.isArray(config.namespaces)) {
    return {
      id: config.id,
      name: config.name,
      url: config.url,
      token: config.token,
      namespace: config.namespaces[0] || undefined,
    };
  }
  // Already in new format
  return config as SavedConfig;
}

export const storage = {
  getConfigs(): SavedConfig[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIGS);
      if (!data) return [];

      const rawConfigs: LegacyConfig[] = JSON.parse(data);
      const migratedConfigs = rawConfigs.map(migrateConfig);

      // Save migrated configs back to storage if migration occurred
      const needsMigration = rawConfigs.some(c => c.namespaces && Array.isArray(c.namespaces));
      if (needsMigration) {
        logger.info("Migrating configs from legacy format");
        localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(migratedConfigs));
      }

      return migratedConfigs;
    } catch (error) {
      logger.error("Failed to load configs from localStorage", error);
      return [];
    }
  },

  saveConfig(config: SavedConfig): void {
    try {
      const configs = this.getConfigs();
      const existingIndex = configs.findIndex((c) => c.id === config.id);

      if (existingIndex >= 0) {
        configs[existingIndex] = config;
        logger.debug("Updated existing config", config.id);
      } else {
        configs.push(config);
        logger.debug("Added new config", config.id);
      }

      localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs));
    } catch (error) {
      logger.error("Failed to save config", error);
      throw new Error("Failed to save configuration");
    }
  },

  deleteConfig(id: string): void {
    try {
      const configs = this.getConfigs().filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(configs));

      if (this.getActiveConfigId() === id) {
        this.setActiveConfig(null);
      }

      logger.debug("Deleted config", id);
    } catch (error) {
      logger.error("Failed to delete config", error);
      throw new Error("Failed to delete configuration");
    }
  },

  getActiveConfigId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONFIG);
  },

  setActiveConfig(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CONFIG, id);
        logger.debug("Set active config", id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONFIG);
        logger.debug("Cleared active config");
      }
    } catch (error) {
      logger.error("Failed to set active config", error);
    }
  },

  getActiveConfig(): SavedConfig | null {
    const id = this.getActiveConfigId();
    if (!id) return null;
    return this.getConfigs().find((c) => c.id === id) || null;
  },
};
