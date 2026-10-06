import { describe, it, expect } from "bun:test";
import { translations, t, getDomainI18n } from "../index";

describe("i18n Horizontal Domain Service", () => {
  it("provides populated translation dictionaries for supported languages", () => {
    expect(translations.pl).toBeDefined();
    expect(translations.en).toBeDefined();
    expect(Object.keys(translations.pl).length).toBeGreaterThan(50);
    expect(Object.keys(translations.en).length).toBeGreaterThan(50);
  });

  it("translates known keys correctly across languages", () => {
    const plText = t("pl", "tabGameplay");
    const enText = t("en", "tabGameplay");

    expect(typeof plText).toBe("string");
    expect(typeof enText).toBe("string");
    expect(plText.length).toBeGreaterThan(0);
    expect(enText.length).toBeGreaterThan(0);
    expect(plText).not.toEqual(enText);
  });

  it("interpolates parameters when formatting string template", () => {
    const interpolated = t("en", "keyBoundNotification", { key: "Space", action: "Jump" });
    expect(interpolated).toBe('Successfully bound key "Space" to action "Jump"!');

    const plInterpolated = t("pl", "keyBoundNotification", { key: "Spacja", action: "Skok" });
    expect(plInterpolated).toBe('Pomyślnie przypisano klawisz "Spacja" dla akcji "Skok"!');
  });


  it("falls back to the raw key string when translation key is not found", () => {
    const missingKey = "totally_non_existent_key_12345";
    expect(t("pl", missingKey)).toBe(missingKey);
    expect(t("en", missingKey)).toBe(missingKey);
  });

  it("segments domain dictionaries cleanly via getDomainI18n", () => {
    const plDomains = getDomainI18n("pl");
    const enDomains = getDomainI18n("en");

    const domains = [
      "hud",
      "settings",
      "inventory",
      "skills",
      "items",
      "locations",
      "narrations",
      "dialogues",
      "lore",
    ] as const;

    for (const domain of domains) {
      expect(plDomains[domain]).toBeDefined();
      expect(enDomains[domain]).toBeDefined();
      expect(Object.keys(plDomains[domain]).length).toBeGreaterThan(0);
      expect(Object.keys(enDomains[domain]).length).toBeGreaterThan(0);
    }
  });

  it("ensures key parity between Polish and English for all domains", () => {
    const plDomains = getDomainI18n("pl");
    const enDomains = getDomainI18n("en");

    for (const domain of Object.keys(plDomains) as (keyof typeof plDomains)[]) {
      const plKeys = Object.keys(plDomains[domain]).sort();
      const enKeys = Object.keys(enDomains[domain]).sort();

      expect(plKeys).toEqual(enKeys);
    }
  });
});
