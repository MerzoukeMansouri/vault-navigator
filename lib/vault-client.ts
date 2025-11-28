import axios, { AxiosInstance, AxiosError } from "axios";
import { VaultConfig, Secret, SecretListItem, VaultError } from "./types";
import { VaultCache } from "./services/vault-cache";
import { VaultPathUtils } from "./utils/vault-path-utils";
import { logger } from "./utils/logger";
import { VAULT_CONFIG } from "./constants";

/**
 * Client for interacting with HashiCorp Vault KV v2 secrets engine
 *
 * Features:
 * - Automatic caching with TTL for lists and secrets
 * - Namespace support for Vault Enterprise
 * - CORS-free operation using Next.js API proxy
 * - Comprehensive error handling with typed errors
 *
 * @example
 * ```typescript
 * const client = new VaultClient({
 *   url: 'https://vault.example.com',
 *   token: 'hvs.xxxxx',
 *   namespace: 'my-namespace' // Optional
 * });
 *
 * // List secrets
 * const secrets = await client.listSecrets('secret/myapp');
 *
 * // Read a secret
 * const secret = await client.readSecret('secret/myapp/database');
 *
 * // Write a secret
 * await client.writeSecret('secret/myapp/api', {
 *   key: 'value',
 *   password: 'secret123'
 * });
 * ```
 */
export class VaultClient {
  private client: AxiosInstance;
  private config: VaultConfig;
  private listCache: VaultCache<SecretListItem[]>;
  private secretCache: VaultCache<Secret>;
  private debugMode: boolean = false;

  /**
   * Create a new VaultClient instance
   *
   * @param config - Vault connection configuration
   * @param debugMode - Enable debug logging (default: false)
   */
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

  /**
   * Update the Vault namespace and clear cache
   *
   * @param namespace - New namespace to use (undefined to remove namespace)
   */
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

  /**
   * Clear all cached data (lists and secrets)
   */
  clearCache() {
    this.listCache.clear();
    this.secretCache.clear();
  }

  /**
   * Convert various error types to VaultError format
   * @private
   */
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

  /**
   * Test connection to Vault server
   *
   * @returns Object with success status and optional error message
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.get("/v1/sys/health");
      return { success: true };
    } catch (error) {
      const vaultError = this.handleError(error);
      return { success: false, error: vaultError.message };
    }
  }

  /**
   * List secrets and folders at a given path
   * Results are cached with TTL from VAULT_CONFIG.CACHE_TTL.LIST
   *
   * @param path - Path to list (defaults to root of secret mount)
   * @returns Array of secrets and folders with metadata
   * @throws {VaultError} If the request fails
   *
   * @example
   * ```typescript
   * const items = await client.listSecrets('secret/myapp');
   * items.forEach(item => {
   *   console.log(item.isFolder ? '📁' : '🔑', item.name);
   * });
   * ```
   */
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

  /**
   * Read a secret's data and metadata
   * Results are cached with TTL from VAULT_CONFIG.CACHE_TTL.SECRET
   *
   * @param path - Full path to the secret
   * @returns Secret object with data and metadata
   * @throws {VaultError} If the secret doesn't exist or request fails
   *
   * @example
   * ```typescript
   * const secret = await client.readSecret('secret/myapp/database');
   * console.log(secret.data.username);
   * console.log(secret.metadata.version);
   * ```
   */
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

  /**
   * Write (create or update) a secret
   * Automatically invalidates cache for the secret and parent folder list
   *
   * @param path - Full path where the secret should be written
   * @param data - Secret data as key-value pairs
   * @throws {VaultError} If the write operation fails
   *
   * @example
   * ```typescript
   * await client.writeSecret('secret/myapp/api', {
   *   api_key: 'sk-xxxxx',
   *   endpoint: 'https://api.example.com'
   * });
   * ```
   */
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

  /**
   * Delete a secret and all its versions
   * Automatically invalidates cache for the secret and parent folder list
   *
   * @param path - Full path to the secret to delete
   * @throws {VaultError} If the delete operation fails
   *
   * @example
   * ```typescript
   * await client.deleteSecret('secret/myapp/old-api-key');
   * ```
   */
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

  /**
   * Recursively search for secrets by name or content
   * Searches both secret names and their data content
   *
   * @param query - Search query (case-insensitive)
   * @param basePath - Starting path for search (default: 'secret')
   * @param signal - AbortSignal for cancelling search
   * @param maxResults - Maximum number of results to return (default: 100)
   * @param maxDepth - Maximum folder depth to search (default: 10)
   * @returns Array of matching secrets
   *
   * @example
   * ```typescript
   * const abortController = new AbortController();
   * const results = await client.searchSecrets(
   *   'database',
   *   'secret/myapp',
   *   abortController.signal,
   *   50
   * );
   * ```
   */
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

  /**
   * List all KV secret mounts available on the Vault server
   *
   * @returns Array of mount point names
   * @throws {VaultError} If the request fails
   */
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
