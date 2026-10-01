import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { useAtlasTexture } from "../hooks/useAtlasTexture";
import {
  renderCustomHook,
  cleanupDom,
  setupDomEnvironment,
} from "@test-utils";
import { LoggerManager, LogLevel } from "@lib/logger";

describe("useAtlasTexture Hook & Single-Source Decodes", () => {
  beforeEach(() => {
    setupDomEnvironment();
    LoggerManager.resetInstance({
      mode: "development",
      defaultLevel: LogLevel.DEBUG,
    });
    LoggerManager.getInstance().ringBuffer.clear();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("handles empty imageSrc gracefully without throwing", async () => {
    const { result } = await renderCustomHook(() => useAtlasTexture(""));

    expect(result.current.image).toBeNull();
    expect(result.current.pixelBuffer).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("loads a valid 1x1 data URL image and provides image element", async () => {
    const dataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const { result } = await renderCustomHook(() => useAtlasTexture(dataUri));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.image).not.toBeNull();
  });
});
