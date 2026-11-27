import { describe, it, expect } from "bun:test";
import { developerTranslations } from "@i18n/modules/developer";
import { hudTranslations } from "@i18n/modules/hud";
import { t } from "@/i18n";

describe("Atlas Studio Layout & Domain Translations (i18n)", () => {
  it("should provide modal maximize and restore labels in both languages", () => {
    // Arrange
    const translations = hudTranslations;

    // Act
    const { pl, en } = translations;

    // Assert
    expect(pl.modalMaximize).toBe("Powiększ okno");
    expect(pl.modalRestore).toBe("Przywróć standardowy rozmiar");
    expect(en.modalMaximize).toBe("Maximize window");
    expect(en.modalRestore).toBe("Restore window size");
  });

  it("should provide inspector toggle labels in both languages", () => {
    // Arrange
    const translations = developerTranslations;

    // Act
    const { pl, en } = translations;

    // Assert
    expect(pl.atlasStudioToggleInspector).toBe("Przełącz panel boczny");
    expect(pl.atlasStudioCollapseInspector).toBe("Zwiń panel boczny");
    expect(pl.atlasStudioExpandInspector).toBe("Rozwiń panel boczny");
    expect(en.atlasStudioToggleInspector).toBe("Toggle side panel");
    expect(en.atlasStudioCollapseInspector).toBe("Collapse side panel");
    expect(en.atlasStudioExpandInspector).toBe("Expand side panel");
  });

  it("should provide atlas studio tab labels in both languages", () => {
    // Arrange
    const translations = developerTranslations;

    // Act
    const { pl, en } = translations;

    // Assert
    expect(pl.atlasStudioTabLivePreview).toContain("Podgląd");
    expect(pl.atlasStudioTabSlicing).toBeDefined();
    expect(pl.atlasStudioTabBackground).toBeDefined();
    expect(pl.atlasStudioTabExport).toBeDefined();
    expect(en.atlasStudioTabLivePreview).toContain("Preview");
    expect(en.atlasStudioTabSlicing).toBeDefined();
    expect(en.atlasStudioTabBackground).toBeDefined();
    expect(en.atlasStudioTabExport).toBeDefined();
  });

  it("should translate atlas status and log labels in both languages", () => {
    // Arrange
    const translations = developerTranslations;

    // Act
    const { pl, en } = translations;

    // Assert
    expect(pl.atlasStudioStatusReady).toBe("Gotowy");
    expect(pl.atlasStudioStatusError).toBe("Błąd");
    expect(pl.atlasStudioDismissError).toBe("Zamknij błąd");
    expect(pl.atlasStudioToggleLogs).toBe("Dziennik zdarzeń slicera");
    expect(pl.atlasStudioLogs).toBe("Dziennik");
    expect(pl.atlasStudioRecentLogs).toBe("Ostatnie zdarzenia slicera");
    expect(pl.atlasStudioOpenLogsTab).toBe("Pełny podgląd (Logs)");
    expect(pl.atlasStudioNoLogsYet).toBe("Brak zarejestrowanych zdarzeń slicera.");
    expect(en.atlasStudioStatusReady).toBe("Ready");
    expect(en.atlasStudioStatusError).toBe("Error");
    expect(en.atlasStudioDismissError).toBe("Dismiss error");
    expect(en.atlasStudioToggleLogs).toBe("Slicer event log");
    expect(en.atlasStudioLogs).toBe("Logs");
    expect(en.atlasStudioRecentLogs).toBe("Recent slicer events");
    expect(en.atlasStudioOpenLogsTab).toBe("Full view (Logs)");
    expect(en.atlasStudioNoLogsYet).toBe("No slicer events recorded yet.");
  });

  it("should resolve atlas toolbar labels without exposing raw keys in either language", () => {
    // Arrange
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

    // Act
    const translations = keysToCheck.map((key) => ({
      key,
      pl: t("pl", key),
      en: t("en", key),
    }));

    // Assert
    for (const { key, pl, en } of translations) {
      // Neither Polish nor English should return the raw key
      expect(pl).not.toBe(key);
      expect(en).not.toBe(key);
      expect(pl.length).toBeGreaterThan(0);
      expect(en.length).toBeGreaterThan(0);
    }
  });
});
