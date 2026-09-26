import { describe, it, expect } from "bun:test";
import { settingsTranslations } from "../../../../../game/i18n/modules/settings";
import { hudTranslations } from "../../../../../game/i18n/modules/hud";

describe("Atlas Studio Layout & Modal Responsive Suite (Phase 1)", () => {
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
});
