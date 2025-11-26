import { SavedConfig } from "./types";

const STORAGE_KEY = "vault-configs";
const ACTIVE_CONFIG_KEY = "active-vault-config";

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
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const rawConfigs: LegacyConfig[] = JSON.parse(data);
      const migratedConfigs = rawConfigs.map(migrateConfig);

      // Save migrated configs back to storage if migration occurred
      const needsMigration = rawConfigs.some(c => c.namespaces && Array.isArray(c.namespaces));
      if (needsMigration) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedConfigs));
      }

      return migratedConfigs;
    } catch {
      return [];
    }
  },

  saveConfig(config: SavedConfig): void {
    const configs = this.getConfigs();
    const existingIndex = configs.findIndex((c) => c.id === config.id);

    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
  },

  deleteConfig(id: string): void {
    const configs = this.getConfigs().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));

    if (this.getActiveConfigId() === id) {
      this.setActiveConfig(null);
    }
  },

  getActiveConfigId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_CONFIG_KEY);
  },

  setActiveConfig(id: string | null): void {
    if (id) {
      localStorage.setItem(ACTIVE_CONFIG_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CONFIG_KEY);
    }
  },

  getActiveConfig(): SavedConfig | null {
    const id = this.getActiveConfigId();
    if (!id) return null;
    return this.getConfigs().find((c) => c.id === id) || null;
  },
};
