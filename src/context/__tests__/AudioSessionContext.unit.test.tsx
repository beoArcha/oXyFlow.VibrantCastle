import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import {
  AudioSessionProvider,
  useAudioSession,
} from "../AudioSessionContext";
import { I18nProvider } from "../I18nContext";
import { gameAudio } from "@game/engine/audioEngine";
import { SoundType } from "@game/types";
import { MissingContextProviderError } from "@lib/errors";

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
          <AudioSessionProvider onNotification={onNotification}>
            {children}
          </AudioSessionProvider>
        </I18nProvider>
      );
    };
  };

  it("should throw MissingContextProviderError when useAudioSession is used outside AudioSessionProvider", () => {
    // Arrange & Act & Assert
    expect(() => {
      const Component: React.FC = () => {
        useAudioSession();
        return null;
      };
      const { renderToString } = require("react-dom/server");
      renderToString(React.createElement(Component));
    }).toThrow(MissingContextProviderError);
  });

  it("should initialize audio and notify callback when initializeAudio is called", async () => {
    // Arrange
    let receivedMessage = "";
    const initSpy = spyOn(gameAudio, "init").mockImplementation(() => {});
    const wrapper = createWrapper((msg) => {
      receivedMessage = msg;
    });

    const { result, unmount } = await renderCustomHook(() => useAudioSession(), {
      wrapper,
    });

    // Act
    expect(result.current.isAudioInitialized).toBe(false);
    await act(async () => {
      result.current.initializeAudio();
    });

    // Assert
    expect(result.current.isAudioInitialized).toBe(true);
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(receivedMessage.length).toBeGreaterThan(0);

    initSpy.mockRestore();
    await unmount();
  });

  it("should dispatch preview sound effects when playPreviewSFX is called", async () => {
    // Arrange
    const playSpy = spyOn(gameAudio, "playSFX").mockImplementation(() => {});
    const { result, unmount } = await renderCustomHook(() => useAudioSession(), {
      wrapper: createWrapper(),
    });

    // Act
    result.current.playPreviewSFX("slash");
    result.current.playPreviewSFX("magic");

    // Assert
    expect(playSpy).toHaveBeenCalledWith(SoundType.SFX_SLASH);
    expect(playSpy).toHaveBeenCalledWith(SoundType.SFX_MAGIC_BOLT);

    playSpy.mockRestore();
    await unmount();
  });
});
