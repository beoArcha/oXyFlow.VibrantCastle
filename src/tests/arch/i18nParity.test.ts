import { describe, it, expect } from "bun:test";
import { translations, GameTranslationDictionary } from "@i18n";

describe("i18n Architecture & Translation Parity", () => {
  const plDict = translations.pl;
  const enDict = translations.en;

  it("enforces 100% key parity between English (canonical) and Polish translations", () => {
    const plKeys = Object.keys(plDict).sort();
    const enKeys = Object.keys(enDict).sort();

    const missingInPl = enKeys.filter((key) => !(key in plDict));
    const missingInEn = plKeys.filter((key) => !(key in enDict));

    expect(missingInPl).toEqual([]);
    expect(missingInEn).toEqual([]);
    expect(plKeys.length).toBe(enKeys.length);
    expect(plKeys.length).toBeGreaterThan(0);
  });

  it("ensures zero empty string values exist in translation dictionaries", () => {
    const emptyPlKeys: string[] = [];
    const emptyEnKeys: string[] = [];

    for (const [key, value] of Object.entries(plDict)) {
      if (typeof value !== "string" || value.trim().length === 0) {
        emptyPlKeys.push(key);
      }
    }

    for (const [key, value] of Object.entries(enDict)) {
      if (typeof value !== "string" || value.trim().length === 0) {
        emptyEnKeys.push(key);
      }
    }

    expect(emptyPlKeys).toEqual([]);
    expect(emptyEnKeys).toEqual([]);
  });

  it("verifies template placeholder parameter consistency between languages", () => {
    const placeholderRegex = /\{([a-zA-Z0-9_]+)\}/g;
    const mismatchedKeys: Array<{ key: string; enParams: string[]; plParams: string[] }> = [];

    for (const key of Object.keys(enDict) as Array<keyof GameTranslationDictionary>) {
      const enVal = enDict[key];
      const plVal = plDict[key];

      if (typeof enVal === "string" && typeof plVal === "string") {
        const enMatches = Array.from(enVal.matchAll(placeholderRegex), (m) => m[1]).sort();
        const plMatches = Array.from(plVal.matchAll(placeholderRegex), (m) => m[1]).sort();

        const areEqual =
          enMatches.length === plMatches.length &&
          enMatches.every((val, index) => val === plMatches[index]);

        if (!areEqual) {
          mismatchedKeys.push({ key, enParams: enMatches, plParams: plMatches });
        }
      }
    }

    expect(mismatchedKeys).toEqual([]);
  });
});
