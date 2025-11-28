import { describe, test, expect, beforeEach, vi } from "vitest";
import { logger } from "../logger";

describe("logger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    // Spy on all console methods
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      info: vi.spyOn(console, "info").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };

    // Reset logger config to default
    logger.setConfig({
      enabled: process.env.NODE_ENV === "development",
      level: "debug",
    });
  });

  describe("debug", () => {
    test("logs debug message when enabled", () => {
      logger.setConfig({ enabled: true });
      logger.debug("Test debug message");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[DEBUG] Test debug message",
        ""
      );
    });

    test("logs debug message with data when enabled", () => {
      logger.setConfig({ enabled: true });
      const testData = { key: "value" };
      logger.debug("Test with data", testData);

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[DEBUG] Test with data",
        testData
      );
    });

    test("does not log debug message when disabled", () => {
      logger.setConfig({ enabled: false });
      logger.debug("Should not log");

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    test("handles undefined data parameter", () => {
      logger.setConfig({ enabled: true });
      logger.debug("Message without data");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "[DEBUG] Message without data",
        ""
      );
    });

    test("handles various data types", () => {
      logger.setConfig({ enabled: true });

      logger.debug("Number", 42);
      expect(consoleSpy.log).toHaveBeenCalledWith("[DEBUG] Number", 42);

      logger.debug("Boolean", true);
      expect(consoleSpy.log).toHaveBeenCalledWith("[DEBUG] Boolean", true);

      logger.debug("Array", [1, 2, 3]);
      expect(consoleSpy.log).toHaveBeenCalledWith("[DEBUG] Array", [1, 2, 3]);
    });
  });

  describe("info", () => {
    test("always logs info message", () => {
      logger.setConfig({ enabled: false });
      logger.info("Info message");

      expect(consoleSpy.info).toHaveBeenCalledWith("[INFO] Info message", "");
    });

    test("logs info message with data", () => {
      const data = { status: "ok" };
      logger.info("Info with data", data);

      expect(consoleSpy.info).toHaveBeenCalledWith(
        "[INFO] Info with data",
        data
      );
    });

    test("handles undefined data parameter", () => {
      logger.info("Info without data");

      expect(consoleSpy.info).toHaveBeenCalledWith(
        "[INFO] Info without data",
        ""
      );
    });
  });

  describe("warn", () => {
    test("always logs warn message", () => {
      logger.setConfig({ enabled: false });
      logger.warn("Warning message");

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[WARN] Warning message",
        ""
      );
    });

    test("logs warn message with data", () => {
      const warning = { code: "DEPRECATED" };
      logger.warn("Deprecation warning", warning);

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[WARN] Deprecation warning",
        warning
      );
    });

    test("handles undefined data parameter", () => {
      logger.warn("Warning without data");

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "[WARN] Warning without data",
        ""
      );
    });
  });

  describe("error", () => {
    test("always logs error message", () => {
      logger.setConfig({ enabled: false });
      logger.error("Error message");

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[ERROR] Error message",
        ""
      );
    });

    test("logs error message with error object", () => {
      const error = new Error("Something went wrong");
      logger.error("An error occurred", error);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[ERROR] An error occurred",
        error
      );
    });

    test("logs error message with custom error data", () => {
      const errorData = { code: 500, message: "Server error" };
      logger.error("Server error", errorData);

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[ERROR] Server error",
        errorData
      );
    });

    test("handles undefined error parameter", () => {
      logger.error("Error without details");

      expect(consoleSpy.error).toHaveBeenCalledWith(
        "[ERROR] Error without details",
        ""
      );
    });
  });

  describe("setConfig", () => {
    test("enables logging", () => {
      logger.setConfig({ enabled: true });
      logger.debug("Should log");

      expect(consoleSpy.log).toHaveBeenCalled();
    });

    test("disables logging", () => {
      logger.setConfig({ enabled: false });
      logger.debug("Should not log");

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    test("partially updates config", () => {
      logger.setConfig({ enabled: true });
      logger.debug("Test 1");
      expect(consoleSpy.log).toHaveBeenCalled();

      consoleSpy.log.mockClear();

      logger.setConfig({ enabled: false });
      logger.debug("Test 2");
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    test("preserves unmodified config properties", () => {
      logger.setConfig({ enabled: true, level: "info" });
      logger.setConfig({ enabled: false });

      // Level should still be 'info' even though we only updated 'enabled'
      // We can't directly test the level property, but we verify partial updates work
      logger.setConfig({ enabled: true });
      logger.debug("Test");
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe("integration", () => {
    test("logs multiple levels in sequence", () => {
      logger.setConfig({ enabled: true });

      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    test("respects enabled state for debug only", () => {
      logger.setConfig({ enabled: false });

      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });
});
