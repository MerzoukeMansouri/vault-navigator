/**
 * Application-wide constants and configuration
 */

export const VAULT_CONFIG = {
  TOKEN_PREFIX: "hvs.",
  CACHE_TTL: {
    LIST: 5 * 60 * 1000,    // 5 minutes
    SECRET: 2 * 60 * 1000,   // 2 minutes
  },
  DEFAULT_MOUNT: "secret",
  API_BASE_PATH: "/api/vault",
} as const;

export const TOKEN_DETECTION = {
  CHECK_INTERVAL: 1000,    // 1 second
  ENABLED_BY_DEFAULT: true,
} as const;

export const STORAGE_KEYS = {
  CONFIGS: "vault-configs",
  ACTIVE_CONFIG: "active-vault-config",
} as const;

export const UI_CONFIG = {
  COPY_FEEDBACK_DURATION: 2000,  // 2 seconds
  AUTO_CLOSE_DELAY: 500,         // 500ms
  DEBOUNCE_DELAY: 300,           // 300ms
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  LIST: "LIST",
  OPTIONS: "OPTIONS",
} as const;
