import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { LocaleProvider, useLocale, useI18n } from "../LocaleContext";
import gameEngine from "@game/loop/engine";
import { MissingContextProviderError } from "@lib/errors";
import { renderToString } from "react-dom/server";

const LANG_KEY = "vibrant_castle_language";

describe("LocaleContext, useLocale Hook, and useI18n alias", () => {
  beforeEach(async () => {
    await cleanupDom();
    window.localStorage.clear();
  });

  afterEach(async () => {
    gameEngine.setLanguage("pl");
    window.localStorage.clear();
    await cleanupDom();
  });

  const wrapperFor = (defaultLanguage: "en" | "pl"): React.FC<{ children: React.ReactNode }> =>
    ({ children }) => <LocaleProvider defaultLanguage={defaultLanguage}>{children}</LocaleProvider>;

  it("throws MissingContextProviderError when useLocale is used outside LocaleProvider", () => {
    const Component: React.FC = () => {
      useLocale();
      return null;
    };

    expect(() => renderToString(React.createElement(Component))).toThrow(
      MissingContextProviderError
    );
  });

  it("provides the active language, translator and supported languages", async () => {
    const { result, unmount } = await renderCustomHook(() => useLocale(), {
      wrapper: wrapperFor("en"),
    });

    expect(result.current.language).toBe("en");
    expect(typeof result.current.t).toBe("function");
    expect(result.current.supportedLanguages).toContain("en");
    expect(result.current.supportedLanguages).toContain("pl");

    await unmount();
  });

  it("switches language, updates the translator and mirrors it to the game engine", async () => {
    const { result, unmount } = await renderCustomHook(() => useLocale(), {
      wrapper: wrapperFor("en"),
    });

    const englishSpace = result.current.t("spaceKey");

    await act(async () => {
      result.current.setLanguage("pl");
    });

    expect(result.current.language).toBe("pl");
    expect(result.current.t("spaceKey")).not.toBe(englishSpace);
    expect(gameEngine.settings.language).toBe("pl");
    expect(window.localStorage.getItem(LANG_KEY)).toBe("pl");

    await unmount();
  });

  it("ignores unsupported language codes", async () => {
    const { result, unmount } = await renderCustomHook(() => useLocale(), {
      wrapper: wrapperFor("en"),
    });

    await act(async () => {
      result.current.setLanguage("de" as "pl");
    });

    expect(result.current.language).toBe("en");

    await unmount();
  });

  it("exposes identical context values through the useI18n alias", async () => {
    const { result, unmount } = await renderCustomHook(() => useI18n(), {
      wrapper: wrapperFor("pl"),
    });

    expect(result.current.language).toBe("pl");
    expect(result.current.dict).toBeDefined();

    await unmount();
  });
});
