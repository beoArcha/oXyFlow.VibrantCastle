import { describe, it, expect } from "bun:test";
import { developerTranslations } from "@i18n/modules/developer";
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
    expect(developerTranslations.pl.atlasStudioToggleInspector).toBe("Przełącz panel boczny");
    expect(developerTranslations.pl.atlasStudioCollapseInspector).toBe("Zwiń panel boczny");
    expect(developerTranslations.pl.atlasStudioExpandInspector).toBe("Rozwiń panel boczny");

    expect(developerTranslations.en.atlasStudioToggleInspector).toBe("Toggle side panel");
    expect(developerTranslations.en.atlasStudioCollapseInspector).toBe("Collapse side panel");
    expect(developerTranslations.en.atlasStudioExpandInspector).toBe("Expand side panel");
  });

  it("verifies atlas studio tab names exist and are concise to avoid UI truncation", () => {
    expect(developerTranslations.pl.atlasStudioTabLivePreview).toContain("Podgląd");
    expect(developerTranslations.pl.atlasStudioTabSlicing).toBeDefined();
    expect(developerTranslations.pl.atlasStudioTabBackground).toBeDefined();
    expect(developerTranslations.pl.atlasStudioTabExport).toBeDefined();

    expect(developerTranslations.en.atlasStudioTabLivePreview).toContain("Preview");
    expect(developerTranslations.en.atlasStudioTabSlicing).toBeDefined();
    expect(developerTranslations.en.atlasStudioTabBackground).toBeDefined();
    expect(developerTranslations.en.atlasStudioTabExport).toBeDefined();
  });

  it("verifies status bar i18n keys are translated in PL and EN", () => {
    expect(developerTranslations.pl.atlasStudioStatusReady).toBe("Gotowy");
    expect(developerTranslations.pl.atlasStudioStatusError).toBe("Błąd");
    expect(developerTranslations.pl.atlasStudioDismissError).toBe("Zamknij błąd");
    expect(developerTranslations.pl.atlasStudioToggleLogs).toBe("Dziennik zdarzeń slicera");
    expect(developerTranslations.pl.atlasStudioLogs).toBe("Dziennik");
    expect(developerTranslations.pl.atlasStudioRecentLogs).toBe("Ostatnie zdarzenia slicera");
    expect(developerTranslations.pl.atlasStudioOpenLogsTab).toBe("Pełny podgląd (Logs)");
    expect(developerTranslations.pl.atlasStudioNoLogsYet).toBe("Brak zarejestrowanych zdarzeń slicera.");

    expect(developerTranslations.en.atlasStudioStatusReady).toBe("Ready");
    expect(developerTranslations.en.atlasStudioStatusError).toBe("Error");
    expect(developerTranslations.en.atlasStudioDismissError).toBe("Dismiss error");
    expect(developerTranslations.en.atlasStudioToggleLogs).toBe("Slicer event log");
    expect(developerTranslations.en.atlasStudioLogs).toBe("Logs");
    expect(developerTranslations.en.atlasStudioRecentLogs).toBe("Recent slicer events");
    expect(developerTranslations.en.atlasStudioOpenLogsTab).toBe("Full view (Logs)");
    expect(developerTranslations.en.atlasStudioNoLogsYet).toBe("No slicer events recorded yet.");
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
