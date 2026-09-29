import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { I18nProvider, useI18n } from "../I18nContext";
import gameEngine from "@game/loop/engine";

describe("I18nContext & useI18n Hook", () => {
  const initialLang = gameEngine.settings.language;

  beforeEach(async () => {
    await cleanupDom();
    gameEngine.settings.language = "pl";
  });

  afterEach(async () => {
    gameEngine.settings.language = initialLang;
    await cleanupDom();
  });

  it("initializes with Polish language by default", async () => {
    const { result, unmount } = await renderCustomHook(() => useI18n(), {
      wrapper: I18nProvider,
    });

    expect(result.current.language).toBe("pl");
    expect(result.current.isPl).toBe(true);
    expect(result.current.isEn).toBe(false);
    expect(result.current.dictionary).toBeDefined();
    expect(result.current.domains).toBeDefined();

    await unmount();
  });

  it("translates existing keys using t() function", async () => {
    const { result, unmount } = await renderCustomHook(() => useI18n(), {
      wrapper: I18nProvider,
    });

    const translated = result.current.t("title");
    expect(translated).toBe("Słoneczny Bastion Zamku");

    const health = result.current.t("health");
    expect(health).toBe("Zdrowie");

    await unmount();
  });

  it("handles string parameter interpolation in t()", async () => {
    const { result, unmount } = await renderCustomHook(() => useI18n(), {
      wrapper: I18nProvider,
    });

    // Test a key or fallback with interpolation
    const interpolated = result.current.t("unknown_key_with_{foo}", { foo: "Bar" });
    expect(interpolated).toContain("Bar");

    await unmount();
  });

  it("switches language and synchronizes with gameEngine on setLanguage", async () => {
    const { result, unmount } = await renderCustomHook(() => useI18n(), {
      wrapper: I18nProvider,
    });

    expect(result.current.language).toBe("pl");

    await act(async () => {
      result.current.setLanguage("en");
    });

    expect(result.current.language).toBe("en");
    expect(result.current.isPl).toBe(false);
    expect(result.current.isEn).toBe(true);
    expect(result.current.t("health")).toBe("Health");
    expect(gameEngine.settings.language).toBe("en");

    await unmount();
  });

  it("reacts to language changes initiated in the engine", async () => {
    const { result, unmount } = await renderCustomHook(() => useI18n(), {
      wrapper: I18nProvider,
    });

    expect(result.current.language).toBe("pl");

    await act(async () => {
      gameEngine.setLanguage("en");
    });

    expect(result.current.language).toBe("en");
    expect(result.current.isEn).toBe(true);

    await unmount();
  });
});
