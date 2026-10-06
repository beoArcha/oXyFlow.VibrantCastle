import { describe, it, expect } from "bun:test";
import { translations, GameTranslationDictionary, LanguageCode } from "@i18n";

describe("i18n Architecture & Translation Parity", () => {
  const canonicalLang: LanguageCode = "en";
  const enDict = translations[canonicalLang];
  const allLanguages = Object.keys(translations) as LanguageCode[];
  const nonCanonicalLanguages = allLanguages.filter((l) => l !== canonicalLang);

  it("enforces 100% key parity between English (canonical) and all supported translations", () => {
    const enKeys = Object.keys(enDict).sort();
    expect(enKeys.length).toBeGreaterThan(0);

    for (const lang of nonCanonicalLanguages) {
      const targetDict = translations[lang];
      const targetKeys = Object.keys(targetDict).sort();

      const missingInTarget = enKeys.filter((key) => !(key in targetDict));
      const missingInEn = targetKeys.filter((key) => !(key in enDict));

      expect(missingInTarget).toEqual([]);
      expect(missingInEn).toEqual([]);
      expect(targetKeys.length).toBe(enKeys.length);
    }
  });

  it("ensures zero empty string values exist in translation dictionaries", () => {
    for (const lang of allLanguages) {
      const dict = translations[lang];
      const emptyKeys: string[] = [];

      for (const [key, value] of Object.entries(dict)) {
        if (typeof value !== "string" || value.trim().length === 0) {
          emptyKeys.push(`${lang}:${key}`);
        }
      }

      expect(emptyKeys).toEqual([]);
    }
  });

  it("verifies template placeholder parameter consistency between languages", () => {
    const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;

    for (const lang of nonCanonicalLanguages) {
      const targetDict = translations[lang];
      const mismatchedKeys: Array<{ key: string; enParams: string[]; targetParams: string[] }> = [];

      for (const key of Object.keys(enDict) as Array<keyof GameTranslationDictionary>) {
        const enVal = enDict[key];
        const targetVal = targetDict[key];

        if (typeof enVal === "string" && typeof targetVal === "string") {
          const enMatches = Array.from(enVal.matchAll(placeholderRegex), (m) => m[1]).sort();
          const targetMatches = Array.from(targetVal.matchAll(placeholderRegex), (m) => m[1]).sort();

          const areEqual =
            enMatches.length === targetMatches.length &&
            enMatches.every((val, index) => val === targetMatches[index]);

          if (!areEqual) {
            mismatchedKeys.push({ key, enParams: enMatches, targetParams: targetMatches });
          }
        }
      }

      expect(mismatchedKeys).toEqual([]);
    }
  });
});
