import { describe, it, expect } from "bun:test";
import { settingsTranslations } from "../modules/settings";

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
});
