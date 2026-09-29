import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { GameSessionProvider, useGameSession } from "../GameSessionContext";
import { I18nProvider } from "../I18nContext";
import gameEngine from "@game/loop/engine";

describe("GameSessionContext & useGameSession Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
    gameEngine.setPaused(false);
  });

  afterEach(async () => {
    gameEngine.setPaused(false);
    await cleanupDom();
  });

  const createWrapper = (onNotification?: (msg: string) => void) => {
    return function TestGameSessionWrapper({ children }: { children: React.ReactNode }) {
      return (
        <I18nProvider>
          <GameSessionProvider onNotification={onNotification}>{children}</GameSessionProvider>
        </I18nProvider>
      );
    };
  };

  it("exposes engine session properties and p1 player", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameSession(), {
      wrapper: createWrapper(),
    });

    expect(result.current.p1).toBeDefined();
    expect(result.current.p1?.id).toBe("player1");
    expect(result.current.isVictory).toBe(false);
    expect(result.current.isDefeat).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.currentLocationId).toBeDefined();
    expect(result.current.currentLocation).toBeDefined();

    await unmount();
  });

  it("handles pause state toggling via setPaused and togglePause", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameSession(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPaused).toBe(false);

    await act(async () => {
      result.current.setPaused(true);
    });
    expect(result.current.isPaused).toBe(true);
    expect(gameEngine.isPaused).toBe(true);

    await act(async () => {
      const state = result.current.togglePause();
      expect(state).toBe(false);
    });
    expect(result.current.isPaused).toBe(false);
    expect(gameEngine.isPaused).toBe(false);

    await unmount();
  });

  it("dispatches level commands: loadLocation and restart", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameSession(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.loadLocation("grand_bastion");
    });
    expect(result.current.currentLocationId).toBe("grand_bastion");

    await act(async () => {
      result.current.restart();
    });
    expect(result.current.isDefeat).toBe(false);

    await unmount();
  });

  it("initializes audio and sends notification callback", async () => {
    let receivedNotification = "";
    const { result, unmount } = await renderCustomHook(() => useGameSession(), {
      wrapper: createWrapper((msg) => {
        receivedNotification = msg;
      }),
    });

    expect(result.current.isAudioInitialized).toBe(false);

    await act(async () => {
      result.current.initializeAudio();
    });

    expect(result.current.isAudioInitialized).toBe(true);
    expect(receivedNotification.length).toBeGreaterThan(0);

    await unmount();
  });

  it("triggers notifyEngineUpdate and responds to engine state listeners", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameSession(), {
      wrapper: createWrapper(),
    });

    // notifyEngineUpdate is a stable callback
    expect(typeof result.current.notifyEngineUpdate).toBe("function");

    await act(async () => {
      result.current.setPaused(true);
    });

    expect(result.current.isPaused).toBe(true);

    await unmount();
  });
});
