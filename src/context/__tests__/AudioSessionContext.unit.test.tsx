import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { AudioSessionProvider, useAudioSession } from "../AudioSessionContext";
import { I18nProvider } from "../I18nContext";
import { gameAudio } from "@game/engine/audioEngine";
import { SoundType } from "@game/types";
import { MissingContextProviderError } from "@lib/errors";
import { renderToString } from "react-dom/server";

describe("AudioSessionContext & useAudioSession Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const createWrapper = (onNotification?: (msg: string) => void) => {
    return function TestWrapper({ children }: { children: React.ReactNode }) {
      return (
        <I18nProvider>
          <AudioSessionProvider onNotification={onNotification}>{children}</AudioSessionProvider>
        </I18nProvider>
      );
    };
  };

  it("throws MissingContextProviderError when useAudioSession is used outside AudioSessionProvider", () => {
    const Component: React.FC = () => {
      useAudioSession();
      return null;
    };

    expect(() => renderToString(React.createElement(Component))).toThrow(
      MissingContextProviderError
    );
  });

  it("initializes audio once and notifies only on the first initialization", async () => {
    const messages: string[] = [];
    const initSpy = spyOn(gameAudio, "init").mockImplementation(() => {});
    const wrapper = createWrapper((msg) => {
      messages.push(msg);
    });

    const { result, unmount } = await renderCustomHook(() => useAudioSession(), {
      wrapper,
    });

    expect(result.current.isAudioInitialized).toBe(false);

    await act(async () => {
      result.current.initializeAudio();
    });

    expect(result.current.isAudioInitialized).toBe(true);
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(messages.length).toBe(1);

    await act(async () => {
      result.current.initializeAudio();
    });

    expect(messages.length).toBe(1);

    initSpy.mockRestore();
    await unmount();
  });

  it("plays preview SFX for slash and magic and marks audio as initialized", async () => {
    const playSpy = spyOn(gameAudio, "playSFX").mockImplementation(() => {});
    const initSpy = spyOn(gameAudio, "init").mockImplementation(() => {});
    const { result, unmount } = await renderCustomHook(() => useAudioSession(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.playPreviewSFX("slash");
    });
    await act(async () => {
      result.current.playPreviewSFX("magic");
    });

    expect(playSpy).toHaveBeenCalledWith(SoundType.SFX_SLASH);
    expect(playSpy).toHaveBeenCalledWith(SoundType.SFX_MAGIC_BOLT);
    expect(result.current.isAudioInitialized).toBe(true);

    playSpy.mockRestore();
    initSpy.mockRestore();
    await unmount();
  });
});
