/**
 * Application-wide constants and configuration
 * Centralized constants following DRY principle to avoid magic strings/numbers
 */

/**
 * Vault-specific configuration constants
 */
export const VAULT_CONFIG = {
  /** Prefix used by Vault tokens (e.g., "hvs.XXXXXX") */
  TOKEN_PREFIX: "hvs.",
  /** Cache time-to-live values in milliseconds */
  CACHE_TTL: {
    /** How long to cache list results (5 minutes) */
    LIST: 5 * 60 * 1000,
    /** How long to cache secret data (2 minutes) */
    SECRET: 2 * 60 * 1000,
  },
  /** Default KV mount point name */
  DEFAULT_MOUNT: "secret",
  /** Base path for Next.js API proxy */
  API_BASE_PATH: "/api/vault",
} as const;

/**
 * Token detection feature configuration
 */
export const TOKEN_DETECTION = {
  /** How often to check URL for tokens in milliseconds (1 second) */
  CHECK_INTERVAL: 1000,
  /** Whether token detection is enabled by default */
  ENABLED_BY_DEFAULT: true,
} as const;

/**
 * LocalStorage key names for persisting data
 */
export const STORAGE_KEYS = {
  /** Key for storing all Vault configurations */
  CONFIGS: "vault-configs",
  /** Key for storing the currently active configuration ID */
  ACTIVE_CONFIG: "active-vault-config",
} as const;

/**
 * UI timing and interaction constants
 */
export const UI_CONFIG = {
  /** How long to show "copied" feedback in milliseconds (2 seconds) */
  COPY_FEEDBACK_DURATION: 2000,
  /** Delay before auto-closing dialogs/dropdowns (500ms) */
  AUTO_CLOSE_DELAY: 500,
  /** Debounce delay for search inputs (300ms) */
  DEBOUNCE_DELAY: 300,
} as const;

/**
 * Standard HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

/**
 * HTTP method names
 */
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  /** Vault-specific LIST method for listing secrets */
  LIST: "LIST",
  OPTIONS: "OPTIONS",
} as const;
