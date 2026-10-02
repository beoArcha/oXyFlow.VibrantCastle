import { describe, it, expect } from "bun:test";
import { settingsTranslations } from "@i18n/modules/settings";
import { hudTranslations } from "@i18n/modules/hud";
import { t } from "@/i18n";

describe("Atlas Studio Layout & Domain Translations (i18n)", () => {
  it("verifies modal maximize and restore translations in both languages", () => {
    expect(hudTranslations.pl.modalMaximize).toBe("Powiększ okno");
    expect(hudTranslations.pl.modalRestore).toBe("Przywróć standardowy rozmiar");
    expect(hudTranslations.en.modalMaximize).toBe("Maximize window");
    expect(hudTranslations.en.modalRestore).toBe("Restore window size");
  });

  it("verifies inspector toggle translations in both languages", () => {
    expect(settingsTranslations.pl.atlasStudioToggleInspector).toBe("Przełącz panel boczny");
    expect(settingsTranslations.pl.atlasStudioCollapseInspector).toBe("Zwiń panel boczny");
    expect(settingsTranslations.pl.atlasStudioExpandInspector).toBe("Rozwiń panel boczny");

    expect(settingsTranslations.en.atlasStudioToggleInspector).toBe("Toggle side panel");
    expect(settingsTranslations.en.atlasStudioCollapseInspector).toBe("Collapse side panel");
    expect(settingsTranslations.en.atlasStudioExpandInspector).toBe("Expand side panel");
  });

  it("verifies atlas studio tab names exist and are concise to avoid UI truncation", () => {
    expect(settingsTranslations.pl.atlasStudioTabLivePreview).toContain("Podgląd");
    expect(settingsTranslations.pl.atlasStudioTabSlicing).toBeDefined();
    expect(settingsTranslations.pl.atlasStudioTabBackground).toBeDefined();
    expect(settingsTranslations.pl.atlasStudioTabExport).toBeDefined();

    expect(settingsTranslations.en.atlasStudioTabLivePreview).toContain("Preview");
    expect(settingsTranslations.en.atlasStudioTabSlicing).toBeDefined();
    expect(settingsTranslations.en.atlasStudioTabBackground).toBeDefined();
    expect(settingsTranslations.en.atlasStudioTabExport).toBeDefined();
  });

  it("verifies status bar i18n keys are translated in PL and EN", () => {
    expect(settingsTranslations.pl.atlasStudioStatusReady).toBe("Gotowy");
    expect(settingsTranslations.pl.atlasStudioStatusError).toBe("Błąd");
    expect(settingsTranslations.pl.atlasStudioDismissError).toBe("Zamknij błąd");
    expect(settingsTranslations.pl.atlasStudioToggleLogs).toBe("Dziennik zdarzeń slicera");
    expect(settingsTranslations.pl.atlasStudioLogs).toBe("Dziennik");
    expect(settingsTranslations.pl.atlasStudioRecentLogs).toBe("Ostatnie zdarzenia slicera");
    expect(settingsTranslations.pl.atlasStudioOpenLogsTab).toBe("Pełny podgląd (Logs)");
    expect(settingsTranslations.pl.atlasStudioNoLogsYet).toBe("Brak zarejestrowanych zdarzeń slicera.");

    expect(settingsTranslations.en.atlasStudioStatusReady).toBe("Ready");
    expect(settingsTranslations.en.atlasStudioStatusError).toBe("Error");
    expect(settingsTranslations.en.atlasStudioDismissError).toBe("Dismiss error");
    expect(settingsTranslations.en.atlasStudioToggleLogs).toBe("Slicer event log");
    expect(settingsTranslations.en.atlasStudioLogs).toBe("Logs");
    expect(settingsTranslations.en.atlasStudioRecentLogs).toBe("Recent slicer events");
    expect(settingsTranslations.en.atlasStudioOpenLogsTab).toBe("Full view (Logs)");
    expect(settingsTranslations.en.atlasStudioNoLogsYet).toBe("No slicer events recorded yet.");
  });

  it("verifies all atlas toolbar and studio keys are properly translated without exposing raw keys", () => {
    const keysToCheck = [
      "atlasStudioGridShort",
      "atlasStudioTracksShort",
      "atlasStudioFramesShort",
      "atlasStudioToggleChroma",
      "atlasStudioChromaShort",
      "atlasStudioAutoIslandsTitle",
      "atlasStudioBakeIslandsDesc",
      "atlasStudioBakeSuccess",
      "atlasStudioBakeIslandsBtn",
      "atlasStudioFreeformFramesTitle",
      "atlasStudioAddFrameBtn",
      "atlasStudioFrameColId",
      "atlasStudioFrameColTrack",
      "atlasStudioGridConfigTitle",
      "atlasStudioGridCellWidth",
      "atlasStudioGridCellHeight",
      "atlasStudioGridSpacing",
      "atlasStudioGridSafeMargin",
      "atlasStudioSlicingStrategyLabel",
      "atlasStudioFramesSelected",
      "atlasStudioSelectTrackPlaceholder",
      "atlasStudioNewTrackNamePlaceholder",
      "atlasStudioCreateTrackBtn",
    ];

    for (const key of keysToCheck) {
      const plTranslation = t("pl", key);
      const enTranslation = t("en", key);

      // Neither Polish nor English should return the raw key
      expect(plTranslation).not.toBe(key);
      expect(enTranslation).not.toBe(key);
      expect(plTranslation.length).toBeGreaterThan(0);
      expect(enTranslation.length).toBeGreaterThan(0);
    }
  });
});
