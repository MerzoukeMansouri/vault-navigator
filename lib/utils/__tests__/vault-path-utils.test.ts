import { describe, test, expect } from "vitest";
import { VaultPathUtils } from "../vault-path-utils";

describe("VaultPathUtils", () => {
  describe("cleanSecretPath", () => {
    test("removes secret/ prefix", () => {
      expect(VaultPathUtils.cleanSecretPath("secret/myapp/db"))
        .toBe("myapp/db");
    });

    test("handles path without prefix", () => {
      expect(VaultPathUtils.cleanSecretPath("myapp/db"))
        .toBe("myapp/db");
    });

    test("handles empty path", () => {
      expect(VaultPathUtils.cleanSecretPath(""))
        .toBe("");
    });

    test("handles just 'secret'", () => {
      expect(VaultPathUtils.cleanSecretPath("secret"))
        .toBe("secret");
    });

    test("handles path starting with secret but not secret/", () => {
      expect(VaultPathUtils.cleanSecretPath("secretapp/db"))
        .toBe("secretapp/db");
    });
  });

  describe("buildSecretUrl", () => {
    test("builds data URL", () => {
      const url = VaultPathUtils.buildSecretUrl("secret/myapp/db", "data");
      expect(url).toBe("/v1/secret/data/myapp/db");
    });

    test("builds metadata URL", () => {
      const url = VaultPathUtils.buildSecretUrl("secret/myapp/db", "metadata");
      expect(url).toBe("/v1/secret/metadata/myapp/db");
    });

    test("cleans path before building URL", () => {
      const url = VaultPathUtils.buildSecretUrl("secret/myapp/api", "data");
      expect(url).toBe("/v1/secret/data/myapp/api");
    });

    test("handles path without secret/ prefix", () => {
      const url = VaultPathUtils.buildSecretUrl("myapp/db", "data");
      expect(url).toBe("/v1/secret/data/myapp/db");
    });
  });

  describe("buildListUrl", () => {
    test("builds URL for root", () => {
      const url = VaultPathUtils.buildListUrl("");
      expect(url).toBe("/v1/secret/metadata");
    });

    test("builds URL for 'secret' mount", () => {
      const url = VaultPathUtils.buildListUrl("secret");
      expect(url).toBe("/v1/secret/metadata");
    });

    test("builds URL for path with secret/ prefix", () => {
      const url = VaultPathUtils.buildListUrl("secret/myapp");
      expect(url).toBe("/v1/secret/metadata/myapp");
    });

    test("builds URL for path without secret/ prefix", () => {
      const url = VaultPathUtils.buildListUrl("myapp/config");
      expect(url).toBe("/v1/secret/metadata/myapp/config");
    });
  });

  describe("buildCacheKey", () => {
    test("includes all components", () => {
      const key = VaultPathUtils.buildCacheKey("list", "secret/myapp", "dev");
      expect(key).toBe("list:secret/myapp:dev");
    });

    test("uses 'root' for missing namespace", () => {
      const key = VaultPathUtils.buildCacheKey("secret", "secret/myapp");
      expect(key).toBe("secret:secret/myapp:root");
    });

    test("handles undefined namespace", () => {
      const key = VaultPathUtils.buildCacheKey("list", "secret/myapp", undefined);
      expect(key).toBe("list:secret/myapp:root");
    });

    test("handles empty string namespace", () => {
      const key = VaultPathUtils.buildCacheKey("list", "secret/myapp", "");
      expect(key).toBe("list:secret/myapp:root");
    });
  });

  describe("extractParentPath", () => {
    test("extracts parent from nested path", () => {
      const parent = VaultPathUtils.extractParentPath("secret/myapp/db/config");
      expect(parent).toBe("secret/myapp/db");
    });

    test("extracts parent from single-level path", () => {
      const parent = VaultPathUtils.extractParentPath("secret/myapp");
      expect(parent).toBe("secret");
    });

    test("handles root path", () => {
      const parent = VaultPathUtils.extractParentPath("secret");
      expect(parent).toBe("");
    });

    test("handles empty path", () => {
      const parent = VaultPathUtils.extractParentPath("");
      expect(parent).toBe("");
    });
  });

  describe("normalizePath", () => {
    test("removes double slashes", () => {
      expect(VaultPathUtils.normalizePath("secret//myapp//db"))
        .toBe("secret/myapp/db");
    });

    test("removes trailing slash", () => {
      expect(VaultPathUtils.normalizePath("secret/myapp/db/"))
        .toBe("secret/myapp/db");
    });

    test("handles multiple consecutive slashes", () => {
      expect(VaultPathUtils.normalizePath("secret///myapp/db"))
        .toBe("secret/myapp/db");
    });

    test("handles already normalized path", () => {
      expect(VaultPathUtils.normalizePath("secret/myapp/db"))
        .toBe("secret/myapp/db");
    });

    test("handles single slash", () => {
      expect(VaultPathUtils.normalizePath("/"))
        .toBe("");
    });

    test("handles empty path", () => {
      expect(VaultPathUtils.normalizePath(""))
        .toBe("");
    });
  });

  describe("joinPaths", () => {
    test("joins multiple segments", () => {
      const path = VaultPathUtils.joinPaths("secret", "myapp", "db");
      expect(path).toBe("secret/myapp/db");
    });

    test("handles empty segments", () => {
      const path = VaultPathUtils.joinPaths("secret", "", "db");
      expect(path).toBe("secret/db");
    });

    test("handles single segment", () => {
      const path = VaultPathUtils.joinPaths("secret");
      expect(path).toBe("secret");
    });

    test("normalizes result", () => {
      const path = VaultPathUtils.joinPaths("secret//", "myapp", "/db/");
      expect(path).toBe("secret/myapp/db");
    });

    test("filters falsy values", () => {
      const path = VaultPathUtils.joinPaths("secret", null as unknown as string, "db");
      expect(path).toBe("secret/db");
    });

    test("handles no arguments", () => {
      const path = VaultPathUtils.joinPaths();
      expect(path).toBe("");
    });

    test("handles all empty segments", () => {
      const path = VaultPathUtils.joinPaths("", "", "");
      expect(path).toBe("");
    });
  });
});
