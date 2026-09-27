import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { LoggerManager, LogLevel } from "../index";

describe("RingBuffer - Category Filtering & Buffer Lifecycle", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(() => {
    LoggerManager.resetInstance();
  });

  it("integrates with category filtering and logging correctly", () => {
    const ringBuffer = LoggerManager.getInstance().ringBuffer;
    const loggerA = LoggerManager.getInstance().getLogger("EngineDomain");
    const loggerB = LoggerManager.getInstance().getLogger("PhysicsDomain");

    loggerA.info("Engine tick message", { tick: 1 });
    loggerB.warn("Physics collision warning", { entityId: "player" });

    const allLogs = ringBuffer.getLogs();
    expect(allLogs.length).toBe(2);

    const filteredEngine = allLogs.filter((l) => l.category === "EngineDomain");
    expect(filteredEngine.length).toBe(1);
    expect(filteredEngine[0].message).toBe("Engine tick message");

    const filteredPhysics = allLogs.filter((l) => l.category === "PhysicsDomain");
    expect(filteredPhysics.length).toBe(1);
    expect(filteredPhysics[0].message).toBe("Physics collision warning");
  });

  it("cleans up all entries and resets size on clear()", () => {
    const ringBuffer = LoggerManager.getInstance().ringBuffer;
    const logger = LoggerManager.getInstance().getLogger("TestLogger");

    for (let i = 0; i < 10; i++) {
      logger.info(`Message ${i}`);
    }
    expect(ringBuffer.size).toBe(10);

    ringBuffer.clear();
    expect(ringBuffer.size).toBe(0);
    expect(ringBuffer.getLogs().length).toBe(0);
  });
});
