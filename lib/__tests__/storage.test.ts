import { describe, test, expect, beforeEach, vi } from "vitest";
import { storage } from "../storage";
import { SavedConfig } from "../types";

const STORAGE_KEY = "vault-configs";
const VAULT_EXAMPLE_URL = "https://vault.example.com";
const TEST_VAULT = "Test Vault";
const CONFIG_1 = "Config 1";
const CONFIG_123 = "config-123";
const NS1 = "ns1";
const HVS_LEGACY = "hvs.legacy";
const HVS_1 = "hvs.1";
const HVS_2 = "hvs.2";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("getConfigs", () => {
    test("returns empty array when no configs exist", () => {
      const configs = storage.getConfigs();
      expect(configs).toEqual([]);
    });

    test("returns saved configs", () => {
      const mockConfigs: SavedConfig[] = [
        {
          id: "1",
          name: TEST_VAULT,
          url: VAULT_EXAMPLE_URL,
          token: "hvs.test123",
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockConfigs));

      const configs = storage.getConfigs();
      expect(configs).toEqual(mockConfigs);
    });

    test("migrates legacy configs with namespaces array", () => {
      const legacyConfigs = [
        {
          id: "1",
          name: "Legacy Vault",
          url: VAULT_EXAMPLE_URL,
          token: HVS_LEGACY,
          namespaces: [NS1, "ns2"],
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyConfigs));

      const configs = storage.getConfigs();
      expect(configs).toEqual([
        {
          id: "1",
          name: "Legacy Vault",
          url: VAULT_EXAMPLE_URL,
          token: HVS_LEGACY,
          namespace: NS1,
        },
      ]);

      // Verify it saved the migrated config back
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(saved[0].namespace).toBe(NS1);
      expect(saved[0].namespaces).toBeUndefined();
    });

    test("handles migration with empty namespaces array", () => {
      const legacyConfigs = [
        {
          id: "1",
          name: "Legacy Vault",
          url: VAULT_EXAMPLE_URL,
          token: HVS_LEGACY,
          namespaces: [],
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyConfigs));

      const configs = storage.getConfigs();
      expect(configs[0].namespace).toBeUndefined();
    });

    test("returns empty array on parse error", () => {
      localStorage.setItem("vault_configs", "invalid json");

      const configs = storage.getConfigs();
      expect(configs).toEqual([]);
    });

    test("handles multiple configs with mixed formats", () => {
      const mixedConfigs = [
        {
          id: "1",
          name: "Legacy",
          url: "https://vault1.com",
          token: HVS_1,
          namespaces: [NS1],
        },
        {
          id: "2",
          name: "Modern",
          url: "https://vault2.com",
          token: HVS_2,
          namespace: "ns2",
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mixedConfigs));

      const configs = storage.getConfigs();
      expect(configs).toHaveLength(2);
      expect(configs[0].namespace).toBe(NS1);
      expect(configs[1].namespace).toBe("ns2");
    });
  });

  describe("saveConfig", () => {
    test("saves new config", () => {
      const newConfig: SavedConfig = {
        id: "1",
        name: "New Vault",
        url: VAULT_EXAMPLE_URL,
        token: "hvs.new",
      };

      storage.saveConfig(newConfig);

      const configs = storage.getConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0]).toEqual(newConfig);
    });

    test("updates existing config", () => {
      const config1: SavedConfig = {
        id: "1",
        name: "Original",
        url: "https://vault1.com",
        token: "hvs.original",
      };
      storage.saveConfig(config1);

      const updatedConfig: SavedConfig = {
        id: "1",
        name: "Updated",
        url: "https://vault2.com",
        token: "hvs.updated",
      };
      storage.saveConfig(updatedConfig);

      const configs = storage.getConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0]).toEqual(updatedConfig);
    });

    test("maintains order when updating config", () => {
      const config1: SavedConfig = {
        id: "1",
        name: "First",
        url: "https://vault1.com",
        token: HVS_1,
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Second",
        url: "https://vault2.com",
        token: HVS_2,
      };
      storage.saveConfig(config1);
      storage.saveConfig(config2);

      const updatedConfig1: SavedConfig = {
        ...config1,
        name: "Updated First",
      };
      storage.saveConfig(updatedConfig1);

      const configs = storage.getConfigs();
      expect(configs[0].id).toBe("1");
      expect(configs[0].name).toBe("Updated First");
      expect(configs[1].id).toBe("2");
    });
  });

  describe("deleteConfig", () => {
    test("deletes config by id", () => {
      const config1: SavedConfig = {
        id: "1",
        name: CONFIG_1,
        url: "https://vault1.com",
        token: HVS_1,
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Config 2",
        url: "https://vault2.com",
        token: HVS_2,
      };
      storage.saveConfig(config1);
      storage.saveConfig(config2);

      storage.deleteConfig("1");

      const configs = storage.getConfigs();
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe("2");
    });

    test("clears active config when deleted", () => {
      const config: SavedConfig = {
        id: "1",
        name: "Active Config",
        url: "https://vault.com",
        token: "hvs.active",
      };
      storage.saveConfig(config);
      storage.setActiveConfig("1");

      storage.deleteConfig("1");

      expect(storage.getActiveConfigId()).toBeNull();
    });

    test("preserves active config when deleting different config", () => {
      const config1: SavedConfig = {
        id: "1",
        name: CONFIG_1,
        url: "https://vault1.com",
        token: HVS_1,
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Config 2",
        url: "https://vault2.com",
        token: HVS_2,
      };
      storage.saveConfig(config1);
      storage.saveConfig(config2);
      storage.setActiveConfig("2");

      storage.deleteConfig("1");

      expect(storage.getActiveConfigId()).toBe("2");
    });

    test("handles deleting non-existent config", () => {
      const config: SavedConfig = {
        id: "1",
        name: CONFIG_1,
        url: "https://vault.com",
        token: HVS_1,
      };
      storage.saveConfig(config);

      storage.deleteConfig("non-existent");

      const configs = storage.getConfigs();
      expect(configs).toHaveLength(1);
    });
  });

  describe("getActiveConfigId", () => {
    test("returns null when no active config", () => {
      expect(storage.getActiveConfigId()).toBeNull();
    });

    test("returns active config id", () => {
      localStorage.setItem("active-vault-config", CONFIG_123);
      expect(storage.getActiveConfigId()).toBe(CONFIG_123);
    });
  });

  describe("setActiveConfig", () => {
    test("sets active config id", () => {
      storage.setActiveConfig("config-456");
      expect(storage.getActiveConfigId()).toBe("config-456");
    });

    test("clears active config when id is null", () => {
      storage.setActiveConfig(CONFIG_123);
      storage.setActiveConfig(null);
      expect(storage.getActiveConfigId()).toBeNull();
    });

    test("handles localStorage errors gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Should not throw
      expect(() => storage.setActiveConfig(CONFIG_123)).not.toThrow();
    });
  });

  describe("getActiveConfig", () => {
    test("returns null when no active config set", () => {
      expect(storage.getActiveConfig()).toBeNull();
    });

    test("returns null when active config id doesn't exist", () => {
      storage.setActiveConfig("non-existent");
      expect(storage.getActiveConfig()).toBeNull();
    });

    test("returns active config", () => {
      const config1: SavedConfig = {
        id: "1",
        name: CONFIG_1,
        url: "https://vault1.com",
        token: HVS_1,
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Config 2",
        url: "https://vault2.com",
        token: HVS_2,
      };
      storage.saveConfig(config1);
      storage.saveConfig(config2);
      storage.setActiveConfig("2");

      const activeConfig = storage.getActiveConfig();
      expect(activeConfig).toEqual(config2);
    });

    test("returns null after active config is deleted", () => {
      const config: SavedConfig = {
        id: "1",
        name: CONFIG_1,
        url: "https://vault.com",
        token: HVS_1,
      };
      storage.saveConfig(config);
      storage.setActiveConfig("1");
      storage.deleteConfig("1");

      expect(storage.getActiveConfig()).toBeNull();
    });
  });
});
