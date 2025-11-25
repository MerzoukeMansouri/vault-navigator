import axios, { AxiosInstance, AxiosError } from "axios";
import { VaultConfig, Secret, SecretListItem, VaultError } from "./types";

export class VaultClient {
  private client: AxiosInstance;
  private config: VaultConfig;

  constructor(config: VaultConfig) {
    this.config = config;

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

  updateNamespace(namespace?: string) {
    this.config.namespace = namespace;
    if (namespace) {
      this.client.defaults.headers.common["x-vault-namespace"] = namespace;
    } else {
      delete this.client.defaults.headers.common["x-vault-namespace"];
    }
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

      console.log("Listing secrets from:", url);

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

      return keys.map((key: string) => ({
        name: key.replace(/\/$/, ""),
        path: basePath ? `${basePath}/${key}`.replace(/^\//, "") : key,
        isFolder: key.endsWith("/"),
      }));
    } catch (error) {
      const vaultError = this.handleError(error);
      console.error("Error listing secrets:", vaultError);
      if (vaultError.message.includes("404")) {
        return [];
      }
      throw vaultError;
    }
  }

  async readSecret(path: string): Promise<Secret> {
    try {
      // Remove "secret/" prefix if present for the API call
      const cleanPath = path.startsWith("secret/")
        ? path.substring(7)
        : path;

      const url = `/v1/secret/data/${cleanPath}`;
      console.log("Reading secret from:", url);

      const response = await this.client.get(url);

      return {
        path,
        data: response.data?.data?.data || {},
        metadata: response.data?.data?.metadata,
      };
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
      console.log("Writing secret to:", url);

      await this.client.post(url, { data });
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
      console.log("Deleting secret from:", url);

      await this.client.delete(url);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchSecrets(
    query: string,
    basePath: string = "secret"
  ): Promise<SecretListItem[]> {
    const results: SecretListItem[] = [];
    const searchLower = query.toLowerCase();

    const searchRecursive = async (currentPath: string) => {
      try {
        const items = await this.listSecrets(currentPath);

        for (const item of items) {
          const fullPath = currentPath
            ? `${currentPath}/${item.name}`
            : item.name;

          if (item.name.toLowerCase().includes(searchLower)) {
            results.push({
              ...item,
              path: fullPath,
            });
          }

          if (item.isFolder) {
            await searchRecursive(
              currentPath ? `${currentPath}/${item.name}` : item.name
            );
          } else {
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
              console.error(`Error reading secret ${fullPath}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error searching path ${currentPath}:`, error);
      }
    };

    await searchRecursive(basePath);
    return results;
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
