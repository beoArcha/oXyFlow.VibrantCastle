import { beforeEach, describe, expect, it } from "bun:test";
import { readInitialLanguage } from "../LocaleContext";
import { SettingsStorage } from "../settings/settingsStorage";

const LANG_KEY = "vibrant_castle_language";
const SETTINGS_KEY = SettingsStorage.SETTINGS_STORAGE_KEY;

describe("readInitialLanguage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("uses the language from the full settings blob when it is the only saved value", () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: "en" }));
    expect(readInitialLanguage()).toBe("en");
  });

  it("prefers the standalone language key over the full settings blob", () => {
    window.localStorage.setItem(LANG_KEY, "pl");
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: "en" }));
    expect(readInitialLanguage()).toBe("pl");
  });

  it("falls back to the default when the settings blob is corrupt JSON", () => {
    window.localStorage.setItem(SETTINGS_KEY, "{not valid json");
    expect(readInitialLanguage()).toBe("pl");
  });

  it("returns an explicit defaultLanguage over any saved value", () => {
    window.localStorage.setItem(LANG_KEY, "pl");
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ language: "pl" }));
    expect(readInitialLanguage("en")).toBe("en");
  });
});
