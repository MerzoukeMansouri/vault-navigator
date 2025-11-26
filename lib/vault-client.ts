import axios, { AxiosInstance, AxiosError } from "axios";
import { VaultConfig, Secret, SecretListItem, VaultError } from "./types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class VaultClient {
  private client: AxiosInstance;
  private config: VaultConfig;
  private listCache: Map<string, CacheEntry<SecretListItem[]>>;
  private secretCache: Map<string, CacheEntry<Secret>>;
  private readonly LIST_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SECRET_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
  private debugMode: boolean = false;

  constructor(config: VaultConfig, debugMode: boolean = false) {
    this.config = config;
    this.debugMode = debugMode;
    this.listCache = new Map();
    this.secretCache = new Map();

    // Use Next.js API proxy to avoid CORS issues
    this.client = axios.create({
      baseURL: "/api/vault",
    });

    // Set default headers for all requests
    this.client.defaults.headers.common["x-vault-url"] = config.url;
    this.client.defaults.headers.common["x-vault-token"] = config.token;
    if (config.namespace) {
      this.client.defaults.headers.common["x-vault-namespace"] = config.namespace;
    }

    if (this.debugMode) {
      console.log("VaultClient created with:", {
        url: config.url,
        hasToken: !!config.token,
        namespace: config.namespace,
      });

      // Add request interceptor for debugging
      this.client.interceptors.request.use(
        (config) => {
          console.log("Axios request:", {
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

  private getCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }

    if (this.debugMode) {
      console.log(`Cache hit for: ${key}`);
    }
    return entry.data;
  }

  private setCachedData<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T, ttl: number) {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
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
    const cacheKey = `list:${path}:${this.config.namespace || 'root'}`;
    const cached = this.getCachedData(this.listCache, cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // If no path or just "secret", list from root of secret mount
      let url: string;

      if (!path || path === "secret") {
        url = `/v1/secret/metadata`;
      } else if (path.startsWith("secret/")) {
        // Path includes mount, use it directly
        const secretPath = path.substring(7); // Remove "secret/" prefix
        url = `/v1/secret/metadata/${secretPath}`;
      } else {
        // Assume it's a path within secret mount
        url = `/v1/secret/metadata/${path}`;
      }

      if (this.debugMode) {
        console.log("Listing secrets from:", url);
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
      const basePath = path && path !== "secret" ? path : "";

      const results = keys.map((key: string) => ({
        name: key.replace(/\/$/, ""),
        path: basePath ? `${basePath}/${key}`.replace(/^\//, "") : key,
        isFolder: key.endsWith("/"),
      }));

      // Cache the results
      this.setCachedData(this.listCache, cacheKey, results, this.LIST_CACHE_TTL);

      return results;
    } catch (error) {
      const vaultError = this.handleError(error);
      if (this.debugMode) {
        console.error("Error listing secrets:", vaultError);
      }
      if (vaultError.message.includes("404")) {
        return [];
      }
      throw vaultError;
    }
  }

  async readSecret(path: string): Promise<Secret> {
    // Check cache first
    const cacheKey = `secret:${path}:${this.config.namespace || 'root'}`;
    const cached = this.getCachedData(this.secretCache, cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Remove "secret/" prefix if present for the API call
      const cleanPath = path.startsWith("secret/")
        ? path.substring(7)
        : path;

      const url = `/v1/secret/data/${cleanPath}`;
      if (this.debugMode) {
        console.log("Reading secret from:", url);
      }

      const response = await this.client.get(url);

      const result = {
        path,
        data: response.data?.data?.data || {},
        metadata: response.data?.data?.metadata,
      };

      // Cache the result
      this.setCachedData(this.secretCache, cacheKey, result, this.SECRET_CACHE_TTL);

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
      // Remove "secret/" prefix if present
      const cleanPath = path.startsWith("secret/")
        ? path.substring(7)
        : path;

      const url = `/v1/secret/data/${cleanPath}`;
      if (this.debugMode) {
        console.log("Writing secret to:", url);
      }

      await this.client.post(url, { data });

      // Invalidate cache for this secret
      const cacheKey = `secret:${path}:${this.config.namespace || 'root'}`;
      this.secretCache.delete(cacheKey);

      // Invalidate parent folder list cache
      const parentPath = path.split('/').slice(0, -1).join('/');
      const listCacheKey = `list:${parentPath}:${this.config.namespace || 'root'}`;
      this.listCache.delete(listCacheKey);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteSecret(path: string): Promise<void> {
    try {
      // Remove "secret/" prefix if present
      const cleanPath = path.startsWith("secret/")
        ? path.substring(7)
        : path;

      const url = `/v1/secret/metadata/${cleanPath}`;
      if (this.debugMode) {
        console.log("Deleting secret from:", url);
      }

      await this.client.delete(url);

      // Invalidate cache for this secret
      const cacheKey = `secret:${path}:${this.config.namespace || 'root'}`;
      this.secretCache.delete(cacheKey);

      // Invalidate parent folder list cache
      const parentPath = path.split('/').slice(0, -1).join('/');
      const listCacheKey = `list:${parentPath}:${this.config.namespace || 'root'}`;
      this.listCache.delete(listCacheKey);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchSecrets(
    query: string,
    basePath: string = "secret",
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
                console.error(`Error reading secret ${fullPath}:`, error);
              }
            }
          }
        });

        // Wait for all parallel operations
        await Promise.all(promises);
      } catch (error) {
        if (this.debugMode) {
          console.error(`Error searching path ${currentPath}:`, error);
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
        .filter((mount) => mount.includes("secret") || mount.includes("kv"))
        .map((mount) => mount.replace(/\/$/, ""));
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private extractMountPath(path: string): string {
    const parts = path.split("/");
    return parts[0] || "secret";
  }

  private extractSecretPath(path: string): string {
    const parts = path.split("/");
    return parts.slice(1).join("/");
  }
}
