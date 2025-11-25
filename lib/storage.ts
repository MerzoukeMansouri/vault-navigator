import { SavedConfig } from "./types";

const STORAGE_KEY = "vault-configs";
const ACTIVE_CONFIG_KEY = "active-vault-config";

export const storage = {
  getConfigs(): SavedConfig[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
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
