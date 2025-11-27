import axios, { AxiosInstance, AxiosError } from "axios";
import { VaultConfig, Secret, SecretListItem, VaultError } from "./types";
import { VaultCache } from "./services/vault-cache";
import { VaultPathUtils } from "./utils/vault-path-utils";
import { logger } from "./utils/logger";
import { VAULT_CONFIG } from "./constants";

export class VaultClient {
  private client: AxiosInstance;
  private config: VaultConfig;
  private listCache: VaultCache<SecretListItem[]>;
  private secretCache: VaultCache<Secret>;
  private debugMode: boolean = false;

  constructor(config: VaultConfig, debugMode: boolean = false) {
    this.config = config;
    this.debugMode = debugMode;

    // Initialize caches with configured TTLs
    this.listCache = new VaultCache<SecretListItem[]>({
      defaultTTL: VAULT_CONFIG.CACHE_TTL.LIST,
      enableLogging: debugMode,
    });
    this.secretCache = new VaultCache<Secret>({
      defaultTTL: VAULT_CONFIG.CACHE_TTL.SECRET,
      enableLogging: debugMode,
    });

    // Use Next.js API proxy to avoid CORS issues
    this.client = axios.create({
      baseURL: VAULT_CONFIG.API_BASE_PATH,
    });

    // Set default headers for all requests
    this.client.defaults.headers.common["x-vault-url"] = config.url;
    this.client.defaults.headers.common["x-vault-token"] = config.token;
    if (config.namespace) {
      this.client.defaults.headers.common["x-vault-namespace"] = config.namespace;
    }

    if (this.debugMode) {
      logger.debug("VaultClient created", {
        url: config.url,
        hasToken: !!config.token,
        namespace: config.namespace,
      });

      // Add request interceptor for debugging
      this.client.interceptors.request.use(
        (config) => {
          logger.debug("Axios request", {
            url: config.url,
            method: config.method,
            headers: config.headers,
          });
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
    }
  }

  updateNamespace(namespace?: string) {
    this.config.namespace = namespace;
    if (namespace) {
      this.client.defaults.headers.common["x-vault-namespace"] = namespace;
    } else {
      delete this.client.defaults.headers.common["x-vault-namespace"];
    }
    // Clear cache when namespace changes
    this.clearCache();
  }

  clearCache() {
    this.listCache.clear();
    this.secretCache.clear();
  }

  private handleError(error: unknown): VaultError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ errors?: string[] }>;
      return {
        message: axiosError.response?.data?.errors?.[0] || axiosError.message,
        errors: axiosError.response?.data?.errors,
      };
    }
    return { message: error instanceof Error ? error.message : "Unknown error occurred" };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.get("/v1/sys/health");
      return { success: true };
    } catch (error) {
      const vaultError = this.handleError(error);
      return { success: false, error: vaultError.message };
    }
  }

  async listSecrets(path: string = ""): Promise<SecretListItem[]> {
    // Check cache first
    const cacheKey = VaultPathUtils.buildCacheKey("list", path, this.config.namespace);
    const cached = this.listCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = VaultPathUtils.buildListUrl(path);

      if (this.debugMode) {
        logger.debug("Listing secrets from", url);
      }

      // Use POST with X-HTTP-Method-Override since browsers don't support LIST method
      const response = await this.client.request({
        method: "POST",
        url: url,
        headers: {
          "X-HTTP-Method-Override": "LIST",
        },
      });

      const keys = response.data?.data?.keys || [];
      const basePath = path && path !== VAULT_CONFIG.DEFAULT_MOUNT ? path : "";

      const results = keys.map((key: string) => ({
        name: key.replace(/\/$/, ""),
        path: basePath ? VaultPathUtils.joinPaths(basePath, key) : key,
        isFolder: key.endsWith("/"),
      }));

      // Cache the results
      this.listCache.set(cacheKey, results);

      return results;
    } catch (error) {
      const vaultError = this.handleError(error);
      if (this.debugMode) {
        logger.error("Error listing secrets", vaultError);
      }
      if (vaultError.message.includes("404")) {
        return [];
      }
      throw vaultError;
    }
  }

  async readSecret(path: string): Promise<Secret> {
    // Check cache first
    const cacheKey = VaultPathUtils.buildCacheKey("secret", path, this.config.namespace);
    const cached = this.secretCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = VaultPathUtils.buildSecretUrl(path, "data");

      if (this.debugMode) {
        logger.debug("Reading secret from", url);
      }

      const response = await this.client.get(url);

      const result = {
        path,
        data: response.data?.data?.data || {},
        metadata: response.data?.data?.metadata,
      };

      // Cache the result
      this.secretCache.set(cacheKey, result);

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async writeSecret(
    path: string,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      const url = VaultPathUtils.buildSecretUrl(path, "data");

      if (this.debugMode) {
        logger.debug("Writing secret to", url);
      }

      await this.client.post(url, { data });

      // Invalidate cache for this secret
      const cacheKey = VaultPathUtils.buildCacheKey("secret", path, this.config.namespace);
      this.secretCache.invalidate(cacheKey);

      // Invalidate parent folder list cache
      const parentPath = VaultPathUtils.extractParentPath(path);
      const listCacheKey = VaultPathUtils.buildCacheKey("list", parentPath, this.config.namespace);
      this.listCache.invalidate(listCacheKey);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteSecret(path: string): Promise<void> {
    try {
      const url = VaultPathUtils.buildSecretUrl(path, "metadata");

      if (this.debugMode) {
        logger.debug("Deleting secret from", url);
      }

      await this.client.delete(url);

      // Invalidate cache for this secret
      const cacheKey = VaultPathUtils.buildCacheKey("secret", path, this.config.namespace);
      this.secretCache.invalidate(cacheKey);

      // Invalidate parent folder list cache
      const parentPath = VaultPathUtils.extractParentPath(path);
      const listCacheKey = VaultPathUtils.buildCacheKey("list", parentPath, this.config.namespace);
      this.listCache.invalidate(listCacheKey);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchSecrets(
    query: string,
    basePath: string = VAULT_CONFIG.DEFAULT_MOUNT,
    signal?: AbortSignal,
    maxResults: number = 100,
    maxDepth: number = 10
  ): Promise<SecretListItem[]> {
    const results: SecretListItem[] = [];
    const searchLower = query.toLowerCase();
    const processedPaths = new Set<string>();

    const searchRecursive = async (currentPath: string, depth: number = 0): Promise<void> => {
      // Check if aborted
      if (signal?.aborted) {
        return;
      }

      // Check result limit
      if (results.length >= maxResults) {
        return;
      }

      // Check depth limit
      if (depth > maxDepth) {
        return;
      }

      try {
        const items = await this.listSecrets(currentPath);

        // Process items in parallel
        const promises = items.map(async (item) => {
          if (signal?.aborted || results.length >= maxResults) {
            return;
          }

          const fullPath = currentPath
            ? `${currentPath}/${item.name}`
            : item.name;

          // Avoid processing same path twice
          if (processedPaths.has(fullPath)) {
            return;
          }
          processedPaths.add(fullPath);

          // Check if item name matches query
          if (item.name.toLowerCase().includes(searchLower)) {
            if (!results.find((r) => r.path === fullPath)) {
              results.push({
                ...item,
                path: fullPath,
              });
            }
          }

          if (item.isFolder) {
            // Recursively search folders
            await searchRecursive(
              currentPath ? `${currentPath}/${item.name}` : item.name,
              depth + 1
            );
          } else {
            // Search secret content
            try {
              const secret = await this.readSecret(fullPath);
              const secretString = JSON.stringify(secret.data).toLowerCase();
              if (
                secretString.includes(searchLower) &&
                !results.find((r) => r.path === fullPath)
              ) {
                results.push({
                  ...item,
                  path: fullPath,
                });
              }
            } catch (error) {
              if (this.debugMode) {
                logger.error(`Error reading secret ${fullPath}`, error);
              }
            }
          }
        });

        // Wait for all parallel operations
        await Promise.all(promises);
      } catch (error) {
        if (this.debugMode) {
          logger.error(`Error searching path ${currentPath}`, error);
        }
      }
    };

    await searchRecursive(basePath);
    return results.slice(0, maxResults); // Ensure we don't exceed maxResults
  }

  async listMounts(): Promise<string[]> {
    try {
      const response = await this.client.get("/v1/sys/mounts");
      return Object.keys(response.data?.data || response.data || {})
        .filter((mount) => mount.includes(VAULT_CONFIG.DEFAULT_MOUNT) || mount.includes("kv"))
        .map((mount) => mount.replace(/\/$/, ""));
    } catch (error) {
      throw this.handleError(error);
    }
  }
}
