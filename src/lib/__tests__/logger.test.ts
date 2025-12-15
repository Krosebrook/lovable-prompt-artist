import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "../logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    logger.clearLogs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logging methods", () => {
    it("logs debug messages", () => {
      logger.debug("Debug message");
      expect(console.debug).toHaveBeenCalled();
    });

    it("logs info messages", () => {
      logger.info("Info message");
      expect(console.info).toHaveBeenCalled();
    });

    it("logs warning messages", () => {
      logger.warn("Warning message");
      expect(console.warn).toHaveBeenCalled();
    });

    it("logs error messages", () => {
      logger.error("Error message");
      expect(console.error).toHaveBeenCalled();
    });

    it("logs error messages with Error object", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", error);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("log storage", () => {
    it("stores logs in memory", () => {
      logger.info("Test message");
      const logs = logger.getRecentLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].message).toBe("Test message");
    });

    it("limits stored logs", () => {
      // Log more than max
      for (let i = 0; i < 150; i++) {
        logger.info(`Message ${i}`);
      }
      const logs = logger.getRecentLogs(200);
      expect(logs.length).toBeLessThanOrEqual(100);
    });

    it("clears logs", () => {
      logger.info("Test message");
      logger.clearLogs();
      const logs = logger.getRecentLogs();
      expect(logs.length).toBe(0);
    });

    it("gets recent logs with count", () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }
      const logs = logger.getRecentLogs(5);
      expect(logs.length).toBe(5);
    });
  });

  describe("context", () => {
    it("includes context in logs", () => {
      logger.info("Test message", { userId: "123", action: "test" });
      const logs = logger.getRecentLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.context).toEqual({ userId: "123", action: "test" });
    });
  });

  describe("child logger", () => {
    it("creates child logger with default context", () => {
      const childLogger = logger.child({ component: "TestComponent" });
      childLogger.info("Child message");

      const logs = logger.getRecentLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.context?.component).toBe("TestComponent");
    });

    it("merges child context with additional context", () => {
      const childLogger = logger.child({ component: "TestComponent" });
      childLogger.info("Child message", { action: "test" });

      const logs = logger.getRecentLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.context).toEqual({
        component: "TestComponent",
        action: "test",
      });
    });
  });

  describe("log entry format", () => {
    it("includes timestamp in log entries", () => {
      logger.info("Test message");
      const logs = logger.getRecentLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.timestamp).toBeDefined();
      expect(new Date(lastLog.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("includes level in log entries", () => {
      logger.warn("Test warning");
      const logs = logger.getRecentLogs();
      const lastLog = logs[logs.length - 1];
      expect(lastLog.level).toBe("warn");
    });
  });
});
