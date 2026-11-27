import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { GameEngineProvider, useGameEngine } from "../GameEngineContext";
import gameEngine from "@game/loop/engine";
import { Item, ItemType } from "@game/types";
import { MissingContextProviderError } from "@lib/errors";
import { renderToString } from "react-dom/server";

describe("GameEngineContext & useGameEngine Hook", () => {
  beforeEach(async () => {
    await cleanupDom();
    gameEngine.setPaused(false);
    gameEngine.setPlayerCharacter(0, "valen");
  });

  afterEach(async () => {
    gameEngine.setPaused(false);
    gameEngine.setPlayerCharacter(0, "valen");
    await cleanupDom();
  });

  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <GameEngineProvider>{children}</GameEngineProvider>
  );

  it("throws MissingContextProviderError when useGameEngine is used outside GameEngineProvider", () => {
    const Component: React.FC = () => {
      useGameEngine();
      return null;
    };

    expect(() => renderToString(React.createElement(Component))).toThrow(
      MissingContextProviderError
    );
  });

  it("exposes engine state, player 1 and the location catalogue", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), { wrapper });

    expect(result.current.engine).toBe(gameEngine);
    expect(result.current.p1?.id).toBe("player1");
    expect(result.current.isVictory).toBe(false);
    expect(result.current.isDefeat).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.currentLocationId).toBeDefined();
    expect(result.current.availableLocations.length).toBeGreaterThan(0);

    await unmount();
  });

  it("handles pause commands via setPaused and togglePause", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), { wrapper });

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

  it("reactively reflects engine changes after notifyReact while paused", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), { wrapper });

    await act(async () => {
      result.current.setPaused(true);
    });

    const p1 = gameEngine.players.find((p) => p.id === "player1");
    const initialMana = p1?.mana ?? 100;

    await act(async () => {
      if (p1) {
        p1.mana = initialMana - 15;
      }
      gameEngine.notifyReact();
    });

    expect(result.current.p1?.mana).toBe(initialMana - 15);

    if (p1) {
      p1.mana = initialMana;
    }

    await unmount();
  });

  it("updates player snapshots through an ordinary engine action such as a quick potion", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), { wrapper });

    const p1 = gameEngine.players.find((p) => p.id === "player1");
    const testPotion: Item = {
      id: "health_potion",
      nameKey: "healthPotionName",
      descriptionKey: "healthPotionDesc",
      type: ItemType.Potion,
      icon: "potion_red",
      rarity: "common",
      healHp: 30,
      count: 2,
    };
    if (p1) {
      p1.health = 40;
      p1.maxHealth = 100;
      p1.inventory.quickPotions[0] = testPotion;
    }

    await act(async () => {
      const consumed = result.current.useQuickPotion(0, 0);
      expect(consumed).toBe(true);
    });

    expect(result.current.p1?.health).toBe(70);

    if (p1) {
      p1.health = 100;
    }

    await unmount();
  });

  it("dispatches level navigation commands through loadLocation and restart", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), { wrapper });

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

  it("swaps the player character reactively via swapCharacters", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), { wrapper });

    expect(result.current.p1?.characterId).toBe("valen");

    await act(async () => {
      const success = result.current.swapCharacters();
      expect(success).toBe(true);
    });

    expect(result.current.p1?.characterId).toBe("aurelia");
    expect(result.current.p1?.characterName).toBe("Aurelia");

    await unmount();
  });

  it("sets the player character directly via setPlayerCharacter", async () => {
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), { wrapper });

    await act(async () => {
      const success = result.current.setPlayerCharacter(0, "aurelia");
      expect(success).toBe(true);
    });

    expect(result.current.p1?.characterId).toBe("aurelia");

    await unmount();
  });
});
