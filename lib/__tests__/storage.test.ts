import { describe, test, expect, beforeEach, vi } from "vitest";
import { storage } from "../storage";
import { SavedConfig } from "../types";

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
          name: "Test Vault",
          url: "https://vault.example.com",
          token: "hvs.test123",
        },
      ];
      localStorage.setItem("vault-configs", JSON.stringify(mockConfigs));

      const configs = storage.getConfigs();
      expect(configs).toEqual(mockConfigs);
    });

    test("migrates legacy configs with namespaces array", () => {
      const legacyConfigs = [
        {
          id: "1",
          name: "Legacy Vault",
          url: "https://vault.example.com",
          token: "hvs.legacy",
          namespaces: ["ns1", "ns2"],
        },
      ];
      localStorage.setItem("vault-configs", JSON.stringify(legacyConfigs));

      const configs = storage.getConfigs();
      expect(configs).toEqual([
        {
          id: "1",
          name: "Legacy Vault",
          url: "https://vault.example.com",
          token: "hvs.legacy",
          namespace: "ns1",
        },
      ]);

      // Verify it saved the migrated config back
      const saved = JSON.parse(localStorage.getItem("vault-configs")!);
      expect(saved[0].namespace).toBe("ns1");
      expect(saved[0].namespaces).toBeUndefined();
    });

    test("handles migration with empty namespaces array", () => {
      const legacyConfigs = [
        {
          id: "1",
          name: "Legacy Vault",
          url: "https://vault.example.com",
          token: "hvs.legacy",
          namespaces: [],
        },
      ];
      localStorage.setItem("vault-configs", JSON.stringify(legacyConfigs));

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
          token: "hvs.1",
          namespaces: ["ns1"],
        },
        {
          id: "2",
          name: "Modern",
          url: "https://vault2.com",
          token: "hvs.2",
          namespace: "ns2",
        },
      ];
      localStorage.setItem("vault-configs", JSON.stringify(mixedConfigs));

      const configs = storage.getConfigs();
      expect(configs).toHaveLength(2);
      expect(configs[0].namespace).toBe("ns1");
      expect(configs[1].namespace).toBe("ns2");
    });
  });

  describe("saveConfig", () => {
    test("saves new config", () => {
      const newConfig: SavedConfig = {
        id: "1",
        name: "New Vault",
        url: "https://vault.example.com",
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
        token: "hvs.1",
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Second",
        url: "https://vault2.com",
        token: "hvs.2",
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
        name: "Config 1",
        url: "https://vault1.com",
        token: "hvs.1",
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Config 2",
        url: "https://vault2.com",
        token: "hvs.2",
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
        name: "Config 1",
        url: "https://vault1.com",
        token: "hvs.1",
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Config 2",
        url: "https://vault2.com",
        token: "hvs.2",
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
        name: "Config 1",
        url: "https://vault.com",
        token: "hvs.1",
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
      localStorage.setItem("active-vault-config", "config-123");
      expect(storage.getActiveConfigId()).toBe("config-123");
    });
  });

  describe("setActiveConfig", () => {
    test("sets active config id", () => {
      storage.setActiveConfig("config-456");
      expect(storage.getActiveConfigId()).toBe("config-456");
    });

    test("clears active config when id is null", () => {
      storage.setActiveConfig("config-123");
      storage.setActiveConfig(null);
      expect(storage.getActiveConfigId()).toBeNull();
    });

    test("handles localStorage errors gracefully", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      // Should not throw
      expect(() => storage.setActiveConfig("config-123")).not.toThrow();
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
        name: "Config 1",
        url: "https://vault1.com",
        token: "hvs.1",
      };
      const config2: SavedConfig = {
        id: "2",
        name: "Config 2",
        url: "https://vault2.com",
        token: "hvs.2",
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
        name: "Config 1",
        url: "https://vault.com",
        token: "hvs.1",
      };
      storage.saveConfig(config);
      storage.setActiveConfig("1");
      storage.deleteConfig("1");

      expect(storage.getActiveConfig()).toBeNull();
    });
  });
});
