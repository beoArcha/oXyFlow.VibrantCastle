import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { setupDomEnvironment, cleanupDom, renderCustomHook } from "@test-utils";
import { useTesterActions } from "../subtabs/tester/useTesterActions";
import gameEngine from "@game/loop/engine";
import { debugManager } from "@game/debug/debugManager";
import { PlayerId } from "@game/types";

describe("useTesterActions Facade Hook", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("provides stable references for action dispatches", async () => {
    const { result, rerender } = await renderCustomHook(() => useTesterActions());

    const firstInstance = result.current;
    await rerender();
    const secondInstance = result.current;

    expect(firstInstance.teleportPlayer).toBe(secondInstance.teleportPlayer);
    expect(firstInstance.toggleGodMode).toBe(secondInstance.toggleGodMode);
    expect(firstInstance.giveAllWeapons).toBe(secondInstance.giveAllWeapons);
  });

  it("dispatches teleport action safely with coordinate rounding and default PlayerId", async () => {
    let teleportArgs: { playerId: PlayerId; x: number; y: number } | null = null;
    const originalTeleport = gameEngine.teleportPlayer;
    gameEngine.teleportPlayer = (playerId = PlayerId.Player1, x, y) => {
      teleportArgs = { playerId: playerId ?? PlayerId.Player1, x, y };
    };

    try {
      const { result } = await renderCustomHook(() => useTesterActions());

      // Valid coordinates
      result.current.teleportPlayer(150.8, 250.2);
      expect(teleportArgs).toEqual({ playerId: PlayerId.Player1, x: 151, y: 250 });

      // NaN coordinates should be ignored (fault tolerance)
      teleportArgs = null;
      result.current.teleportPlayer(NaN, 200);
      expect(teleportArgs).toBeNull();
    } finally {
      gameEngine.teleportPlayer = originalTeleport;
    }
  });

  it("dispatches cheat toggles to debugManager and returns boolean results", async () => {
    const { result } = await renderCustomHook(() => useTesterActions());

    const initialGodMode = debugManager.state.godMode;
    const toggled = result.current.toggleGodMode();
    expect(toggled).toBe(!initialGodMode);
    expect(debugManager.state.godMode).toBe(!initialGodMode);

    // Toggle back
    result.current.toggleGodMode();
    expect(debugManager.state.godMode).toBe(initialGodMode);
  });

  it("dispatches health setting with validation", async () => {
    let statArgs: { playerId: number; stat: string; val: number } | null = null;
    const originalSetStat = gameEngine.setPlayerStat;
    gameEngine.setPlayerStat = (playerId, stat, val) => {
      statArgs = { playerId, stat, val };
    };

    try {
      const { result } = await renderCustomHook(() => useTesterActions());

      result.current.setPlayerHp(42);
      expect(statArgs).toEqual({ playerId: 0, stat: "health", val: 42 });

      result.current.setPlayerHp(20, PlayerId.Player2);
      expect(statArgs).toEqual({ playerId: 1, stat: "health", val: 20 });

      // Negative values ignored
      statArgs = null;
      result.current.setPlayerHp(-10);
      expect(statArgs).toBeNull();
    } finally {
      gameEngine.setPlayerStat = originalSetStat;
    }
  });

  it("dispatches gold additions safely", async () => {
    let addedGold = 0;
    const originalAddGold = gameEngine.addGold;
    gameEngine.addGold = (amount) => {
      addedGold += amount;
    };

    try {
      const { result } = await renderCustomHook(() => useTesterActions());

      result.current.addGold(500);
      expect(addedGold).toBe(500);

      // 0 or negative ignored
      result.current.addGold(0);
      result.current.addGold(-50);
      expect(addedGold).toBe(500);
    } finally {
      gameEngine.addGold = originalAddGold;
    }
  });

  it("dispatches music intensity with boundary clamping", async () => {
    let musicIntensity: number | null = null;
    const originalSetMusic = gameEngine.setMusicIntensity;
    gameEngine.setMusicIntensity = (val) => {
      musicIntensity = val;
    };

    try {
      const { result } = await renderCustomHook(() => useTesterActions());

      result.current.setMusicIntensity(0.7);
      expect(musicIntensity).toBe(0.7);

      result.current.setMusicIntensity(1.5);
      expect(musicIntensity).toBe(1.0);

      result.current.setMusicIntensity(-0.3);
      expect(musicIntensity).toBe(0.0);
    } finally {
      gameEngine.setMusicIntensity = originalSetMusic;
    }
  });
});
