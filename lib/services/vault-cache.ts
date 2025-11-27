/**
 * Generic cache service for storing and retrieving cached data
 * Implements TTL-based expiration and provides type-safe operations
 */

import { logger } from "../utils/logger";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTTL: number;
  enableLogging?: boolean;
}

export class VaultCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = {
      enableLogging: false,
      ...config,
    };
  }

  /**
   * Retrieves data from cache if it exists and hasn't expired
   * @param key - The cache key
   * @returns The cached data or null if not found/expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.log(`Cache expired for key: ${key}`);
      return null;
    }

    this.log(`Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Stores data in cache with optional custom TTL
   * @param key - The cache key
   * @param data - The data to cache
   * @param ttl - Optional custom TTL (defaults to config.defaultTTL)
   */
  set(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.config.defaultTTL,
    });
    this.log(`Cache set for key: ${key}`);
  }

  /**
   * Checks if a cache entry exists and is valid
   * @param key - The cache key
   * @returns True if the key exists and hasn't expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Removes a specific entry from cache
   * @param key - The cache key to invalidate
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.log(`Cache invalidated for key: ${key}`);
    }
  }

  /**
   * Invalidates all cache entries matching a pattern
   * @param pattern - RegExp pattern or string prefix
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(`^${pattern}`) : pattern;
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.log(`Cache invalidated ${count} entries matching pattern: ${pattern}`);
    }
  }

  /**
   * Clears all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.log(`Cache cleared (${size} entries removed)`);
  }

  /**
   * Gets the current cache size
   * @returns The number of entries in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Gets all cache keys
   * @returns Array of all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Removes all expired entries from cache
   * @returns The number of entries removed
   */
  purgeExpired(): number {
    let count = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      this.log(`Purged ${count} expired cache entries`);
    }

    return count;
  }

  /**
   * Checks if a cache entry has expired
   * @param entry - The cache entry to check
   * @returns True if expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Logs cache operations if logging is enabled
   * @param message - The log message
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      logger.debug(message);
    }
  }
}
