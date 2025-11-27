/**
 * Logger utility for consistent logging across the application
 * Only logs debug messages in development mode
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === "development",
      level: "debug",
    };
  }

  debug(message: string, data?: unknown): void {
    if (this.config.enabled) {
      console.log(`[DEBUG] ${message}`, data !== undefined ? data : "");
    }
  }

  info(message: string, data?: unknown): void {
    console.info(`[INFO] ${message}`, data !== undefined ? data : "");
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data !== undefined ? data : "");
  }

  error(message: string, error?: unknown): void {
    console.error(`[ERROR] ${message}`, error !== undefined ? error : "");
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const logger = new Logger();
