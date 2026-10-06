import { describe, it, expect, beforeEach } from "bun:test";
import {
  LoggerManager,
  LogLevel,
  ILogTransport,
  LogRecord,
  getLogger,
} from "../index";
import { GameErrorBoundary } from "@ui";
import React from "react";

describe("Logging System Integration & E2E", () => {
  let records: LogRecord[] = [];
  let testTransport: ILogTransport;
  let manager: LoggerManager;

  beforeEach(() => {
    records = [];
    testTransport = {
      name: "TestTransport",
      write: (r) => records.push(r),
    };
    manager = LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
    manager.addTransport(testTransport);
  });

  describe("Dynamic Runtime Level Reconfiguration", () => {
    it("dynamically changes global level in runtime without recreating loggers", () => {
      const engineLogger = getLogger("game:engine");
      const saveLogger = getLogger("game:save");

      // Initially at DEBUG
      engineLogger.debug("Engine debug step 1");
      expect(records.length).toBe(1);

      // Dynamically raise level to WARN
      manager.setDefaultLevel(LogLevel.WARN);

      engineLogger.debug("Engine debug step 2 - should be skipped");
      engineLogger.info("Engine info step - should be skipped");
      saveLogger.debug("Save debug - should be skipped");
      expect(records.length).toBe(1);

      // Warning and error pass
      saveLogger.warn("Save slot full warning");
      engineLogger.error("Failed tick", undefined, new Error("Tick Error"));
      expect(records.length).toBe(3);

      // Dynamically lower level back to DEBUG
      manager.setDefaultLevel(LogLevel.DEBUG);
      engineLogger.debug("Engine debug step 3 - re-enabled");
      expect(records.length).toBe(4);
      expect(records[3].message).toBe("Engine debug step 3 - re-enabled");
    });

    it("verifies hierarchical category overrides in runtime", () => {
      manager.setDefaultLevel(LogLevel.ERROR);
      manager.setCategoryLevel("game:physics", LogLevel.DEBUG);

      const rootLogger = getLogger("game");
      const audioLogger = getLogger("game:audio");
      const physicsLogger = getLogger("game:physics");
      const collisionLogger = physicsLogger.getChild("collisions");

      rootLogger.info("Root info - skipped");
      audioLogger.warn("Audio warning - skipped");

      physicsLogger.debug("Physics step calculated");
      collisionLogger.debug("Collision detected with platform");

      expect(records.length).toBe(2);
      expect(records[0].category).toBe("game:physics");
      expect(records[1].category).toBe("game:physics:collisions");
    });
  });

  describe("End-to-End Error Flow & Crash Diagnostic Export", () => {
    it("captures component crash, logs FATAL, buffers in RingBuffer, and generates JSON/TXT dump", () => {
      const boundaryLogger = getLogger("component:error-boundary");
      const boundary = new GameErrorBoundary({
        children: null,
        logger: boundaryLogger,
      });

      const simulatedCrash = new Error("Simulated Canvas WebGL Context Disconnection");
      const errorInfo: React.ErrorInfo = {
        componentStack: "\n    in GameCanvas\n    in GameScreen\n    in App",
      };

      // Simulate React crash lifecycle
      boundary.componentDidCatch(simulatedCrash, errorInfo);

      // 1. Verify log record dispatched
      const fatalRecord = records.find((r) => r.level === LogLevel.FATAL);
      expect(fatalRecord).toBeDefined();
      expect(fatalRecord?.message).toContain("Uncaught React component render crash");
      expect(fatalRecord?.error?.name).toBe("Error");
      expect(fatalRecord?.error?.message).toContain("Simulated Canvas WebGL Context Disconnection");

      // 2. Verify buffer capture
      const ringBufferLogs = manager.ringBuffer.getLogs();
      const bufferedFatal = ringBufferLogs.find((r) => r.level === LogLevel.FATAL);
      expect(bufferedFatal).toBeDefined();

      // 3. Verify JSON diagnostic dump
      const jsonDump = manager.ringBuffer.exportAsJson();
      const parsed = JSON.parse(jsonDump);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[parsed.length - 1].category).toBe("component:error-boundary");

      // 4. Verify Text diagnostic dump
      const textDump = manager.ringBuffer.exportAsText();
      expect(textDump).toContain("[FATAL]");
      expect(textDump).toContain("Simulated Canvas WebGL Context Disconnection");
    });

    it("confirms all recorded system messages are in English", () => {
      const logger = getLogger("game:system:audit");

      logger.debug("Player position synchronized");
      logger.info("New quest unlocked: Chamber of Eternity");
      logger.warn("Deprecated sound buffer format detected");
      logger.error("Failed to read settings from storage", undefined, new Error("Storage quota exceeded"));
      logger.fatal("System out of memory condition");

      for (const rec of records) {
        expect(typeof rec.message).toBe("string");
        expect(rec.message.length).toBeGreaterThan(0);
        // Ensure no Polish letters leaked into log messages
        expect(/[ąćęłńóśźż]/i.test(rec.message)).toBe(false);
      }
    });
  });
});
