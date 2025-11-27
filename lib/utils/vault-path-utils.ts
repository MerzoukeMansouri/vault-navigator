/**
 * Utility functions for Vault path manipulation
 * Centralizes path handling logic to avoid duplication
 */

import { VAULT_CONFIG } from "../constants";

export class VaultPathUtils {
  /**
   * Removes the "secret/" prefix from a path if present
   * @param path - The path to clean
   * @returns The path without the "secret/" prefix
   */
  static cleanSecretPath(path: string): string {
    return path.startsWith(`${VAULT_CONFIG.DEFAULT_MOUNT}/`)
      ? path.substring(VAULT_CONFIG.DEFAULT_MOUNT.length + 1)
      : path;
  }

  /**
   * Builds a Vault API URL for secret operations
   * @param path - The secret path
   * @param segment - The API segment (data or metadata)
   * @returns The complete API URL
   */
  static buildSecretUrl(path: string, segment: "data" | "metadata"): string {
    const cleanPath = this.cleanSecretPath(path);
    return `/v1/${VAULT_CONFIG.DEFAULT_MOUNT}/${segment}/${cleanPath}`;
  }

  /**
   * Builds a Vault API URL for listing secrets
   * @param path - The path to list
   * @returns The complete API URL for listing
   */
  static buildListUrl(path: string): string {
    if (!path || path === VAULT_CONFIG.DEFAULT_MOUNT) {
      return `/v1/${VAULT_CONFIG.DEFAULT_MOUNT}/metadata`;
    }

    if (path.startsWith(`${VAULT_CONFIG.DEFAULT_MOUNT}/`)) {
      const secretPath = path.substring(VAULT_CONFIG.DEFAULT_MOUNT.length + 1);
      return `/v1/${VAULT_CONFIG.DEFAULT_MOUNT}/metadata/${secretPath}`;
    }

    return `/v1/${VAULT_CONFIG.DEFAULT_MOUNT}/metadata/${path}`;
  }

  /**
   * Generates a cache key for storing cached data
   * @param prefix - The cache key prefix
   * @param path - The path
   * @param namespace - Optional namespace
   * @returns A unique cache key
   */
  static buildCacheKey(prefix: string, path: string, namespace?: string): string {
    return `${prefix}:${path}:${namespace || "root"}`;
  }

  /**
   * Extracts the parent path from a given path
   * @param path - The full path
   * @returns The parent path
   */
  static extractParentPath(path: string): string {
    const parts = path.split("/");
    return parts.slice(0, -1).join("/");
  }

  /**
   * Normalizes a path by removing double slashes and trailing slashes
   * @param path - The path to normalize
   * @returns The normalized path
   */
  static normalizePath(path: string): string {
    return path.replace(/\/+/g, "/").replace(/\/$/, "");
  }

  /**
   * Combines path segments into a full path
   * @param segments - Path segments to combine
   * @returns The combined path
   */
  static joinPaths(...segments: string[]): string {
    return this.normalizePath(segments.filter(Boolean).join("/"));
  }
}
