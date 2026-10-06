import { describe, it, expect } from "bun:test";
import { developerTranslations } from "../modules/developer";

describe("Debug Translations (i18n)", () => {
  it("defines all debug translation keys in both Polish and English", () => {
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
      "debugActionTeleportShort",
      "debugActionDamageShort",
      "debugPlayerIdleState",
      "debugUnitFps",
      "debugUnitMs",
      "debugUnitPx",
      "debugToggleSensorsTitle",
      "debugSearchEnemiesPlaceholder",
      "debugVitalsHp",
      "debugVitalsMp",
      "debugVitalsSp",
    ] as const;

    for (const key of requiredKeys) {
      expect(developerTranslations.pl[key]).toBeDefined();
      expect(typeof developerTranslations.pl[key]).toBe("string");
      expect(developerTranslations.pl[key].length).toBeGreaterThan(0);

      expect(developerTranslations.en[key]).toBeDefined();
      expect(typeof developerTranslations.en[key]).toBe("string");
      expect(developerTranslations.en[key].length).toBeGreaterThan(0);
    }
  });
});
