import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import {
  LocaleProvider,
  useLocale,
  useI18n,
} from "../LocaleContext";
import { MissingContextProviderError } from "@lib/errors";

describe("LocaleContext, useLocale Hook, and useI18n compatibility", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should throw MissingContextProviderError when useLocale is used outside LocaleProvider", () => {
    // Arrange & Act & Assert
    expect(() => {
      const Component: React.FC = () => {
        useLocale();
        return null;
      };
      const { renderToString } = require("react-dom/server");
      renderToString(React.createElement(Component));
    }).toThrow(MissingContextProviderError);
  });

  it("should provide active language, translations, and language switching via useLocale", async () => {
    // Arrange
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <LocaleProvider defaultLanguage="en">{children}</LocaleProvider>
    );

    const { result, unmount } = await renderCustomHook(() => useLocale(), {
      wrapper,
    });

    // Act & Assert
    expect(result.current.language).toBe("en");
    expect(result.current.isLanguage("en")).toBe(true);
    expect(result.current.isEn).toBe(true);
    expect(typeof result.current.t).toBe("function");

    await act(async () => {
      result.current.setLanguage("pl");
    });

    expect(result.current.language).toBe("pl");
    expect(result.current.isLanguage("pl")).toBe(true);
    expect(result.current.isPl).toBe(true);

    await unmount();
  });

  it("should provide identical context values via legacy useI18n hook", async () => {
    // Arrange
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <LocaleProvider defaultLanguage="pl">{children}</LocaleProvider>
    );

    const { result, unmount } = await renderCustomHook(() => useI18n(), {
      wrapper,
    });

    // Act & Assert
    expect(result.current.language).toBe("pl");
    expect(result.current.isPl).toBe(true);

    await unmount();
  });
});
