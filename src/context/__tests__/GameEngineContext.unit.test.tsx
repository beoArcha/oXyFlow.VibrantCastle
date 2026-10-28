import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import {
  GameEngineProvider,
  useGameEngine,
} from "../GameEngineContext";
import gameEngine from "@game/loop/engine";
import { Item, ItemType } from "@game/types";
import { MissingContextProviderError } from "@lib/errors";

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

  it("should throw MissingContextProviderError when useGameEngine is used outside GameEngineProvider", () => {
    // Arrange & Act & Assert
    expect(() => {
      const Component: React.FC = () => {
        useGameEngine();
        return null;
      };
      const { renderToString } = require("react-dom/server");
      renderToString(React.createElement(Component));
    }).toThrow(MissingContextProviderError);
  });

  it("should expose engine state, player 1, and locations", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

    // Act & Assert
    expect(result.current.p1).toBeDefined();
    expect(result.current.p1?.id).toBe("player1");
    expect(result.current.isVictory).toBe(false);
    expect(result.current.isDefeat).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.currentLocationId).toBeDefined();
    expect(result.current.availableLocations.length).toBeGreaterThan(0);

    await unmount();
  });

  it("should handle pause commands via setPaused and togglePause", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

    // Act
    await act(async () => {
      result.current.setPaused(true);
    });

    // Assert
    expect(result.current.isPaused).toBe(true);
    expect(gameEngine.isPaused).toBe(true);

    // Act
    await act(async () => {
      const state = result.current.togglePause();
      expect(state).toBe(false);
    });

    // Assert
    expect(result.current.isPaused).toBe(false);
    expect(gameEngine.isPaused).toBe(false);

    await unmount();
  });

  it("should reactively update player snapshot when vitals or spells change even while paused", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

    await act(async () => {
      result.current.setPaused(true);
    });

    const initialHealth = result.current.p1?.health ?? 100;

    // Act: mutate player health directly on engine while paused and trigger notification
    await act(async () => {
      const p1 = gameEngine.players.find((p) => p.id === "player1");
      if (p1) {
        p1.health = initialHealth - 25;
      }
      result.current.notifyEngineUpdate();
    });

    // Assert
    expect(result.current.p1?.health).toBe(initialHealth - 25);

    // Cleanup
    const p1 = gameEngine.players.find((p) => p.id === "player1");
    if (p1) {
      p1.health = initialHealth;
    }

    await unmount();
  });

  it("should update player snapshots through ordinary engine operations without manual notifyEngineUpdate", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

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

    // Act: use quick potion via standard engine action which updates health and triggers state notification
    await act(async () => {
      const consumed = result.current.useQuickPotion(0, 0);
      expect(consumed).toBe(true);
    });

    // Assert: health was restored and snapshot updated reactively without manual notifyEngineUpdate
    expect(result.current.p1?.health).toBe(70);

    // Cleanup
    if (p1) {
      p1.health = 100;
    }

    await unmount();
  });

  it("should update player snapshots reactively when engine notifies state listeners via notifyReact", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

    const p1 = gameEngine.players.find((p) => p.id === "player1");
    const initialMana = p1?.mana ?? 100;

    // Act: engine updates player mana and calls notifyReact()
    await act(async () => {
      if (p1) {
        p1.mana = initialMana - 15;
      }
      gameEngine.notifyReact();
    });

    // Assert: mana snapshot updated reactively
    expect(result.current.p1?.mana).toBe(initialMana - 15);

    // Cleanup
    if (p1) {
      p1.mana = initialMana;
    }

    await unmount();
  });

  it("should dispatch level navigation commands", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

    // Act
    await act(async () => {
      result.current.loadLocation("grand_bastion");
    });

    // Assert
    expect(result.current.currentLocationId).toBe("grand_bastion");

    // Act
    await act(async () => {
      result.current.restart();
    });

    // Assert
    expect(result.current.isDefeat).toBe(false);

    await unmount();
  });

  it("should swap player character reactively via swapCharacters", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

    expect(result.current.p1?.characterId).toBe("valen");

    // Act
    await act(async () => {
      const success = result.current.swapCharacters();
      expect(success).toBe(true);
    });

    // Assert
    expect(result.current.p1?.characterId).toBe("aurelia");
    expect(result.current.p1?.characterName).toBe("Aurelia");

    await unmount();
  });

  it("should set player character directly via setPlayerCharacter", async () => {
    // Arrange
    const { result, unmount } = await renderCustomHook(() => useGameEngine(), {
      wrapper,
    });

    // Act
    await act(async () => {
      const success = result.current.setPlayerCharacter(0, "aurelia");
      expect(success).toBe(true);
    });

    // Assert
    expect(result.current.p1?.characterId).toBe("aurelia");

    await unmount();
  });
});
