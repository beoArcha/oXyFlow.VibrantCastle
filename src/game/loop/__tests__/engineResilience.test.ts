import { describe, it, expect, beforeEach } from "bun:test";
import { LoopCircuitBreaker } from "../loopCircuitBreaker";
import { GameEngine } from "../engine";
import { LoggerManager, LogLevel, ILogTransport, LogRecord } from "../../../lib/logger";
import { gameSave } from "../../logic/save";
import { statsManager } from "../../logic/stats";

describe("GameEngine Error Resilience & Logging", () => {
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
      transports: [testTransport],
    });
  });

  describe("LoopCircuitBreaker", () => {
    it("successfully runs normal operations and resets error count on recovery", () => {
      const logger = manager.getLogger("test:circuit");
      const breaker = new LoopCircuitBreaker({ logger, maxConsecutiveErrors: 3 });

      let count = 0;
      const success = breaker.execute("testOp", () => {
        count++;
      });

      expect(success).toBe(true);
      expect(count).toBe(1);
      expect(breaker.tripped).toBe(false);
      expect(records.length).toBe(0);
    });

    it("catches errors, records error log, and throttles rapid repeated errors", () => {
      const logger = manager.getLogger("test:circuit");
      const breaker = new LoopCircuitBreaker({
        logger,
        maxConsecutiveErrors: 10,
        throttleIntervalMs: 500,
      });

      // 5 immediate errors within the 500ms throttle window
      for (let i = 0; i < 5; i++) {
        breaker.execute("failingOp", () => {
          throw new Error(`Simulation crash #${i}`);
        });
      }

      // Should only log the first error due to throttling (preventing 60fps flood)
      expect(records.length).toBe(1);
      expect(records[0].level).toBe(LogLevel.ERROR);
      expect(records[0].message).toContain("Unhandled error in game loop (failingOp)");
    });

    it("trips when consecutive errors exceed maximum threshold and triggers onTrip callback", () => {
      const logger = manager.getLogger("test:circuit");
      let trippedTriggered = false;

      const breaker = new LoopCircuitBreaker({
        logger,
        maxConsecutiveErrors: 3,
        throttleIntervalMs: 0, // No throttle for this test
        onTrip: () => {
          trippedTriggered = true;
        },
      });

      breaker.execute("crash1", () => { throw new Error("1"); });
      breaker.execute("crash2", () => { throw new Error("2"); });
      expect(breaker.tripped).toBe(false);

      breaker.execute("crash3", () => { throw new Error("3"); });
      expect(breaker.tripped).toBe(true);
      expect(trippedTriggered).toBe(true);

      const fatalLog = records.find((r) => r.level === LogLevel.FATAL);
      expect(fatalLog).toBeDefined();
      expect(fatalLog?.message).toContain("Circuit breaker tripped!");

      // Subsequent executions should be rejected
      let executed = false;
      const result = breaker.execute("afterTrip", () => { executed = true; });
      expect(result).toBe(false);
      expect(executed).toBe(false);
    });
  });

  describe("GameEngine DIP & Loop Error Trapping", () => {
    it("injects custom logger and loopCircuitBreaker via IGameDependencies (DIP)", () => {
      const customLogger = manager.getLogger("game:engine:custom");
      let onTripCalled = false;
      const customBreaker = new LoopCircuitBreaker({
        logger: customLogger,
        maxConsecutiveErrors: 2,
        onTrip: () => {
          onTripCalled = true;
        },
      });

      const engine = new GameEngine({
        logger: customLogger,
        circuitBreaker: customBreaker,
      });

      expect(engine.engineLogger).toBe(customLogger);
      expect(engine.loopCircuitBreaker).toBe(customBreaker);
    });

    it("pauses engine safely when circuit breaker trips during simulation errors", () => {
      let reactNotified = false;
      const customLogger = manager.getLogger("game:engine");
      const customBreaker = new LoopCircuitBreaker({
        logger: customLogger,
        maxConsecutiveErrors: 2,
        onTrip: () => {
          engine.isPaused = true;
          engine.notifyReact();
        },
      });

      const engine = new GameEngine({
        logger: customLogger,
        circuitBreaker: customBreaker,
      });

      engine.registerStateListener(() => {
        reactNotified = true;
      });

      expect(engine.isPaused).toBe(false);

      // Simulate 2 consecutive crashes in engine loop
      customBreaker.execute("fixedUpdate", () => { throw new Error("Crash 1"); });
      customBreaker.execute("fixedUpdate", () => { throw new Error("Crash 2"); });

      expect(customBreaker.tripped).toBe(true);
      expect(engine.isPaused).toBe(true);
      expect(reactNotified).toBe(true);
    });

    it("logs location transitions with context", () => {
      const engine = new GameEngine({
        logger: manager.getLogger("game:engine"),
      });

      engine.loadLocation("courtyard", { x: 100, y: 200 }, true);

      const log = records.find((r) => r.message.includes("Loading location: courtyard"));
      expect(log).toBeDefined();
      expect(log?.level).toBe(LogLevel.INFO);
      expect(log?.context).toEqual({
        locationId: "courtyard",
        targetSpawnPoint: { x: 100, y: 200 },
        preservePlayerStats: true,
      });
    });
  });

  describe("Game Logic Subsystems Logging", () => {
    it("logs error when save state parsing fails in save.ts", () => {
      const origWindow = (globalThis as any).window;
      const origStorage = (globalThis as any).localStorage;
      const mockStorage = {
        getItem: () => "invalid-non-json{{{",
        setItem: () => {},
        removeItem: () => {},
      };
      (globalThis as any).window = { localStorage: mockStorage };
      (globalThis as any).localStorage = mockStorage;

      try {
        const result = gameSave.loadFromLocalStorage();
        expect(result).toBeNull();

        const errLog = records.find((r) => r.category === "game:save" && r.level === LogLevel.ERROR);
        expect(errLog).toBeDefined();
        expect(errLog?.message).toContain("Failed to parse LocalStorage save");
      } finally {
        (globalThis as any).window = origWindow;
        (globalThis as any).localStorage = origStorage;
      }
    });

    it("logs warning when stats parsing fails in stats.ts", () => {
      const origWindow = (globalThis as any).window;
      const origStorage = (globalThis as any).localStorage;
      const mockStorage = {
        getItem: () => "corrupt-json",
        setItem: () => {},
        removeItem: () => {},
      };
      (globalThis as any).window = { localStorage: mockStorage };
      (globalThis as any).localStorage = mockStorage;

      try {
        const result = statsManager.loadFromLocalStorage();
        expect(result).toBe(false);

        const warnLog = records.find((r) => r.category === "game:stats" && r.level === LogLevel.WARN);
        expect(warnLog).toBeDefined();
        expect(warnLog?.message).toContain("Failed to load game statistics from localStorage");
      } finally {
        (globalThis as any).window = origWindow;
        (globalThis as any).localStorage = origStorage;
      }
    });
  });
});
