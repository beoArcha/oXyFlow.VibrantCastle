import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import {
  LogLevel,
  LoggerManager,
  DefaultFormatter,
  RingBufferTransport,
  ConsoleTransport,
  ILogTransport,
  LogRecord,
  initGlobalErrorHandlers,
  cleanupGlobalErrorHandlers,
} from "../index";

describe("Logger System", () => {
  let manager: LoggerManager;

  beforeEach(() => {
    cleanupGlobalErrorHandlers();
    // Isolated instance for testing
    manager = LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(() => {
    cleanupGlobalErrorHandlers();
  });

  describe("Log Level Hierarchy & Filtering", () => {
    it("filters records below the minimum configured level", () => {
      const records: LogRecord[] = [];
      const testTransport: ILogTransport = {
        name: "TestTransport",
        write: (r) => records.push(r),
      };

      manager.clearTransports();
      manager.addTransport(testTransport);
      manager.setDefaultLevel(LogLevel.WARN);

      const logger = manager.getLogger("test:filter");

      logger.debug("Debug msg should be skipped");
      logger.info("Info msg should be skipped");
      logger.warn("Warn msg should be logged");
      logger.error("Error msg should be logged");
      logger.fatal("Fatal msg should be logged");

      expect(records.length).toBe(3);
      expect(records[0].level).toBe(LogLevel.WARN);
      expect(records[0].message).toBe("Warn msg should be logged");
      expect(records[1].level).toBe(LogLevel.ERROR);
      expect(records[2].level).toBe(LogLevel.FATAL);
    });

    it("verifies isLevelEnabled() for zero-overhead hot loops", () => {
      manager.setDefaultLevel(LogLevel.INFO);
      const logger = manager.getLogger("test:performance");

      expect(logger.isLevelEnabled(LogLevel.DEBUG)).toBe(false);
      expect(logger.isLevelEnabled(LogLevel.INFO)).toBe(true);
      expect(logger.isLevelEnabled(LogLevel.WARN)).toBe(true);
      expect(logger.isLevelEnabled(LogLevel.ERROR)).toBe(true);
      expect(logger.isLevelEnabled(LogLevel.FATAL)).toBe(true);
    });

    it("supports category-specific overrides (Hierarchical Sub-Loggers)", () => {
      const records: LogRecord[] = [];
      const testTransport: ILogTransport = {
        name: "TestTransport",
        write: (r) => records.push(r),
      };

      manager.clearTransports();
      manager.addTransport(testTransport);
      manager.setDefaultLevel(LogLevel.ERROR);
      manager.setCategoryLevel("game:physics", LogLevel.DEBUG);

      const engineLogger = manager.getLogger("game:engine");
      const physicsLogger = manager.getLogger("game:physics");
      const collisionLogger = physicsLogger.getChild("collisions");

      engineLogger.debug("Skipped engine debug");
      engineLogger.info("Skipped engine info");

      physicsLogger.debug("Captured physics debug");
      collisionLogger.debug("Captured nested collision debug");

      expect(records.length).toBe(2);
      expect(records[0].category).toBe("game:physics");
      expect(records[1].category).toBe("game:physics:collisions");
    });
  });

  describe("Modes and Environments", () => {
    it("configures appropriate default levels per environment mode", () => {
      manager.setMode("production");
      expect(manager.defaultLevel).toBe(LogLevel.WARN);

      manager.setMode("test");
      expect(manager.defaultLevel).toBe(LogLevel.ERROR);

      manager.setMode("development");
      expect(manager.defaultLevel).toBe(LogLevel.DEBUG);
    });
  });

  describe("Circular RingBufferTransport & Subscribers", () => {
    it("maintains a maximum capacity and drops oldest logs in FIFO order", () => {
      const ringBuffer = new RingBufferTransport({ capacity: 5 });

      for (let i = 1; i <= 8; i++) {
        ringBuffer.write({
          id: `id_${i}`,
          timestamp: Date.now(),
          timeFormatted: "12:00:00.000",
          level: LogLevel.INFO,
          levelName: "INFO",
          category: "test",
          message: `Message ${i}`,
        });
      }

      const logs = ringBuffer.getLogs();
      expect(logs.length).toBe(5);
      expect(logs[0].message).toBe("Message 4");
      expect(logs[4].message).toBe("Message 8");
    });

    it("notifies active subscribers when a new record is recorded", () => {
      const ringBuffer = new RingBufferTransport({ capacity: 10 });
      const received: string[] = [];

      const unsubscribe = ringBuffer.subscribe((record) => {
        received.push(record.message);
      });

      ringBuffer.write({
        id: "sub_1",
        timestamp: Date.now(),
        timeFormatted: "12:00:00.000",
        level: LogLevel.INFO,
        levelName: "INFO",
        category: "test",
        message: "Subscriber event 1",
      });

      ringBuffer.write({
        id: "sub_2",
        timestamp: Date.now(),
        timeFormatted: "12:00:00.001",
        level: LogLevel.INFO,
        levelName: "INFO",
        category: "test",
        message: "Subscriber event 2",
      });

      unsubscribe();

      ringBuffer.write({
        id: "sub_3",
        timestamp: Date.now(),
        timeFormatted: "12:00:00.002",
        level: LogLevel.INFO,
        levelName: "INFO",
        category: "test",
        message: "Ignored event 3",
      });

      expect(received).toEqual(["Subscriber event 1", "Subscriber event 2"]);
    });

    it("exports logs to JSON and formatted text strings", () => {
      const ringBuffer = new RingBufferTransport({ capacity: 10 });
      ringBuffer.write({
        id: "exp_1",
        timestamp: 1700000000000,
        timeFormatted: "12:34:56.789",
        level: LogLevel.WARN,
        levelName: "WARN",
        category: "game:audio",
        message: "AudioContext suspended",
      });

      const jsonStr = ringBuffer.exportAsJson();
      const textStr = ringBuffer.exportAsText();

      expect(jsonStr).toContain("AudioContext suspended");
      expect(textStr).toContain("[12:34:56.789] [WARN] [game:audio] AudioContext suspended");
    });
  });

  describe("Error Serialization & Formatting", () => {
    it("safely serializes Native Errors with stack trace and context", () => {
      const formatter = new DefaultFormatter();
      const records: LogRecord[] = [];
      const testTransport: ILogTransport = {
        name: "Test",
        write: (r) => records.push(r),
      };

      manager.clearTransports();
      manager.addTransport(testTransport);
      const logger = manager.getLogger("game:save");

      const testError = new TypeError("Invalid save JSON payload");
      logger.error("Failed to read save slot", { slot: 1 }, testError);

      expect(records.length).toBe(1);
      const record = records[0];
      expect(record.error?.name).toBe("TypeError");
      expect(record.error?.message).toBe("Invalid save JSON payload");
      expect(record.error?.stack).toBeDefined();
      expect(record.context).toEqual({ slot: 1 });

      const formatted = formatter.format(record);
      expect(formatted).toContain("TypeError: Invalid save JSON payload");
      expect(formatted).toContain('{"slot":1}');
    });

    it("safely formats string and object errors without crashing", () => {
      const records: LogRecord[] = [];
      const testTransport: ILogTransport = {
        name: "Test",
        write: (r) => records.push(r),
      };

      manager.clearTransports();
      manager.addTransport(testTransport);
      const logger = manager.getLogger("game:network");

      logger.error("Network timeout", undefined, "Socket closed abruptly");
      expect(records[0].error?.message).toBe("Socket closed abruptly");

      logger.error("Database failure", undefined, { code: 500, detail: "Disk full" });
      expect(records[1].error?.name).toBe("Error");
      expect(records[1].error?.message).toContain("Disk full");
    });
  });

  describe("Global Error Handling Interception", () => {
    it("attaches cleanly and catches simulated window error events", () => {
      const records: LogRecord[] = [];
      const testTransport: ILogTransport = {
        name: "TestTransport",
        write: (r) => records.push(r),
      };

      manager.clearTransports();
      manager.addTransport(testTransport);

      const cleanup = initGlobalErrorHandlers(manager.getLogger("system"));

      if (typeof window !== "undefined") {
        const errorEvent = new ErrorEvent("error", {
          message: "Uncaught simulated crash",
          filename: "test.js",
          lineno: 42,
          colno: 10,
          error: new Error("Simulated crash error"),
        });

        window.dispatchEvent(errorEvent);

        const fatalRecord = records.find((r) => r.level === LogLevel.FATAL);
        expect(fatalRecord).toBeDefined();
        expect(fatalRecord?.message).toContain("Uncaught simulated crash");
      }

      cleanup();
    });
  });
});
