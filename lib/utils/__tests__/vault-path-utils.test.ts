import { describe, test, expect } from "vitest";
import { VaultPathUtils } from "../vault-path-utils";

const SECRET_MYAPP_DB = "secret/myapp/db";
const MYAPP_DB = "myapp/db";
const SECRET_MYAPP = "secret/myapp";
const SECRET = "secret";

describe("VaultPathUtils", () => {
  describe("cleanSecretPath", () => {
    test("removes secret/ prefix", () => {
      expect(VaultPathUtils.cleanSecretPath(SECRET_MYAPP_DB))
        .toBe(MYAPP_DB);
    });

    test("handles path without prefix", () => {
      expect(VaultPathUtils.cleanSecretPath(MYAPP_DB))
        .toBe(MYAPP_DB);
    });

    test("handles empty path", () => {
      expect(VaultPathUtils.cleanSecretPath(""))
        .toBe("");
    });

    test("handles just 'secret'", () => {
      expect(VaultPathUtils.cleanSecretPath(SECRET))
        .toBe(SECRET);
    });

    test("handles path starting with secret but not secret/", () => {
      expect(VaultPathUtils.cleanSecretPath("secretapp/db"))
        .toBe("secretapp/db");
    });
  });

  describe("buildSecretUrl", () => {
    test("builds data URL", () => {
      const url = VaultPathUtils.buildSecretUrl(SECRET_MYAPP_DB, "data");
      expect(url).toBe("/v1/secret/data/myapp/db");
    });

    test("builds metadata URL", () => {
      const url = VaultPathUtils.buildSecretUrl(SECRET_MYAPP_DB, "metadata");
      expect(url).toBe("/v1/secret/metadata/myapp/db");
    });

    test("cleans path before building URL", () => {
      const url = VaultPathUtils.buildSecretUrl("secret/myapp/api", "data");
      expect(url).toBe("/v1/secret/data/myapp/api");
    });

    test("handles path without secret/ prefix", () => {
      const url = VaultPathUtils.buildSecretUrl(MYAPP_DB, "data");
      expect(url).toBe("/v1/secret/data/myapp/db");
    });
  });

  describe("buildListUrl", () => {
    test("builds URL for root", () => {
      const url = VaultPathUtils.buildListUrl("");
      expect(url).toBe("/v1/secret/metadata");
    });

    test("builds URL for 'secret' mount", () => {
      const url = VaultPathUtils.buildListUrl(SECRET);
      expect(url).toBe("/v1/secret/metadata");
    });

    test("builds URL for path with secret/ prefix", () => {
      const url = VaultPathUtils.buildListUrl(SECRET_MYAPP);
      expect(url).toBe("/v1/secret/metadata/myapp");
    });

    test("builds URL for path without secret/ prefix", () => {
      const url = VaultPathUtils.buildListUrl("myapp/config");
      expect(url).toBe("/v1/secret/metadata/myapp/config");
    });
  });

  describe("buildCacheKey", () => {
    test("includes all components", () => {
      const key = VaultPathUtils.buildCacheKey("list", SECRET_MYAPP, "dev");
      expect(key).toBe("list:secret/myapp:dev");
    });

    test("uses 'root' for missing namespace", () => {
      const key = VaultPathUtils.buildCacheKey("secret", SECRET_MYAPP);
      expect(key).toBe("secret:secret/myapp:root");
    });

    test("handles undefined namespace", () => {
      const key = VaultPathUtils.buildCacheKey("list", SECRET_MYAPP, undefined);
      expect(key).toBe("list:secret/myapp:root");
    });

    test("handles empty string namespace", () => {
      const key = VaultPathUtils.buildCacheKey("list", SECRET_MYAPP, "");
      expect(key).toBe("list:secret/myapp:root");
    });
  });

  describe("extractParentPath", () => {
    test("extracts parent from nested path", () => {
      const parent = VaultPathUtils.extractParentPath("secret/myapp/db/config");
      expect(parent).toBe(SECRET_MYAPP_DB);
    });

    test("extracts parent from single-level path", () => {
      const parent = VaultPathUtils.extractParentPath(SECRET_MYAPP);
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
        .toBe(SECRET_MYAPP_DB);
    });

    test("removes trailing slash", () => {
      expect(VaultPathUtils.normalizePath("secret/myapp/db/"))
        .toBe(SECRET_MYAPP_DB);
    });

    test("handles multiple consecutive slashes", () => {
      expect(VaultPathUtils.normalizePath("secret///myapp/db"))
        .toBe(SECRET_MYAPP_DB);
    });

    test("handles already normalized path", () => {
      expect(VaultPathUtils.normalizePath(SECRET_MYAPP_DB))
        .toBe(SECRET_MYAPP_DB);
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
      expect(path).toBe(SECRET_MYAPP_DB);
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
      expect(path).toBe(SECRET_MYAPP_DB);
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
