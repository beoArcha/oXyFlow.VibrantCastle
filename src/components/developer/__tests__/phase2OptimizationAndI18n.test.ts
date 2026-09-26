import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { LoggerManager, LogLevel } from "../../../lib/logger";
import { settingsTranslations } from "../../../game/i18n/modules/settings";
import { useThrottledLogs, useThrottledLogCount } from "../../../hooks/useThrottledLogs";

describe("Developer Suite Phase 2: RingBuffer Optimization & i18n Verification", () => {
  beforeEach(() => {
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
  });

  afterEach(() => {
    LoggerManager.resetInstance();
  });

  it("verifies hook definitions and function exports for useThrottledLogs and useThrottledLogCount", () => {
    expect(typeof useThrottledLogs).toBe("function");
    expect(typeof useThrottledLogCount).toBe("function");
  });

  it("verifies all Phase 2 debug i18n translation keys are defined in both Polish and English", () => {
    const requiredKeys = [
      "debugEventLogSubtitle",
      "debugAutoScrollToggle",
      "debugAutoScrollLabel",
      "debugCopyVisibleLogs",
      "debugCopyBtn",
      "debugDownloadLogsJson",
      "debugClearBtn",
      "debugFilterPlaceholder",
      "debugAllCategories",
      "debugGlobalLogLevelLabel",
      "debugNoFilterResults",
      "debugCollapseDetails",
      "debugExpandDetails",
      "debugCopyStackTrace",
      "debugPlayerAttack",
      "debugPlayerDash",
      "debugPlayerFacingLeft",
      "debugPlayerFacingRight",
    ] as const;

    for (const key of requiredKeys) {
      expect(settingsTranslations.pl[key]).toBeDefined();
      expect(typeof settingsTranslations.pl[key]).toBe("string");
      expect(settingsTranslations.pl[key].length).toBeGreaterThan(0);

      expect(settingsTranslations.en[key]).toBeDefined();
      expect(typeof settingsTranslations.en[key]).toBe("string");
      expect(settingsTranslations.en[key].length).toBeGreaterThan(0);
    }
  });

  it("verifies RingBuffer integrates with category filtering and logging correctly", () => {
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

  it("verifies RingBuffer clear cleans up all entries and resets size", () => {
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
