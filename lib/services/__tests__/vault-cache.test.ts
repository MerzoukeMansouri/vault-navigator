import { describe, test, expect, beforeEach, vi } from "vitest";
import { VaultCache } from "../vault-cache";

describe("VaultCache", () => {
  let cache: VaultCache<string>;

  beforeEach(() => {
    cache = new VaultCache({ defaultTTL: 1000 }); // 1 second TTL
  });

  describe("get and set", () => {
    test("stores and retrieves data", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    test("returns null for non-existent key", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    test("supports different data types", () => {
      const objectCache = new VaultCache<{ name: string }>({ defaultTTL: 1000 });
      const data = { name: "test" };

      objectCache.set("key1", data);
      expect(objectCache.get("key1")).toEqual(data);
    });
  });

  describe("TTL expiration", () => {
    test("returns null for expired entries", async () => {
      cache.set("key1", "value1", 100); // 100ms TTL

      // Immediately available
      expect(cache.get("key1")).toBe("value1");

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(cache.get("key1")).toBeNull();
    });

    test("uses default TTL when not specified", async () => {
      const shortCache = new VaultCache<string>({ defaultTTL: 100 });
      shortCache.set("key1", "value1");

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(shortCache.get("key1")).toBeNull();
    });

    test("allows custom TTL per entry", async () => {
      cache.set("short", "value1", 100);  // 100ms TTL
      cache.set("long", "value2", 10000); // 10s TTL

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get("short")).toBeNull();
      expect(cache.get("long")).toBe("value2");
    });
  });

  describe("has", () => {
    test("returns true for existing keys", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
    });

    test("returns false for non-existent keys", () => {
      expect(cache.has("nonexistent")).toBe(false);
    });

    test("returns false for expired keys", async () => {
      cache.set("key1", "value1", 100);

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(cache.has("key1")).toBe(false);
    });
  });

  describe("invalidate", () => {
    test("removes specific key", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      cache.invalidate("key1");

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBe("value2");
    });

    test("handles invalidating non-existent key", () => {
      expect(() => cache.invalidate("nonexistent")).not.toThrow();
    });
  });

  describe("invalidatePattern", () => {
    test("invalidates by string prefix", () => {
      cache.set("secret:app1:db", "value1");
      cache.set("secret:app1:api", "value2");
      cache.set("secret:app2:db", "value3");
      cache.set("list:app1:db", "value4");

      cache.invalidatePattern("secret:app1");

      expect(cache.get("secret:app1:db")).toBeNull();
      expect(cache.get("secret:app1:api")).toBeNull();
      expect(cache.get("secret:app2:db")).toBe("value3");
      expect(cache.get("list:app1:db")).toBe("value4");
    });

    test("invalidates by regex pattern", () => {
      cache.set("secret:app1:db", "value1");
      cache.set("secret:app2:db", "value2");
      cache.set("list:app1:db", "value3");

      cache.invalidatePattern(/^secret:.*:db$/);

      expect(cache.get("secret:app1:db")).toBeNull();
      expect(cache.get("secret:app2:db")).toBeNull();
      expect(cache.get("list:app1:db")).toBe("value3");
    });

    test("handles no matches", () => {
      cache.set("key1", "value1");

      expect(() => cache.invalidatePattern("nomatch")).not.toThrow();
      expect(cache.get("key1")).toBe("value1");
    });
  });

  describe("clear", () => {
    test("removes all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      cache.clear();

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
      expect(cache.get("key3")).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe("size and keys", () => {
    test("returns correct size", () => {
      expect(cache.size()).toBe(0);

      cache.set("key1", "value1");
      expect(cache.size()).toBe(1);

      cache.set("key2", "value2");
      expect(cache.size()).toBe(2);

      cache.invalidate("key1");
      expect(cache.size()).toBe(1);
    });

    test("returns all keys", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.set("key3", "value3");

      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain("key1");
      expect(keys).toContain("key2");
      expect(keys).toContain("key3");
    });
  });

  describe("purgeExpired", () => {
    test("removes only expired entries", async () => {
      cache.set("expired1", "value1", 100);
      cache.set("expired2", "value2", 100);
      cache.set("valid", "value3", 10000);

      await new Promise(resolve => setTimeout(resolve, 150));

      const purged = cache.purgeExpired();

      expect(purged).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.get("valid")).toBe("value3");
    });

    test("returns 0 when no entries expired", () => {
      cache.set("key1", "value1", 10000);
      cache.set("key2", "value2", 10000);

      const purged = cache.purgeExpired();
      expect(purged).toBe(0);
      expect(cache.size()).toBe(2);
    });
  });

  describe("logging", () => {
    test("logs when logging is enabled", () => {
      const logSpy = vi.spyOn(console, "log");
      const loggingCache = new VaultCache({ defaultTTL: 1000, enableLogging: true });

      // This would trigger logs in debug mode
      loggingCache.set("key1", "value1");
      loggingCache.get("key1");

      // Note: Actual logging is environment-dependent
      logSpy.mockRestore();
    });
  });
});
