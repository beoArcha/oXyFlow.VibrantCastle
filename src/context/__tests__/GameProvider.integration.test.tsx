import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { GameProvider } from "../GameContext";
import { I18nProvider, useI18n } from "../I18nContext";
import { useSettings } from "../SettingsContext";
import { useSaveGame } from "../SaveGameContext";
import { useGameSession } from "../GameSessionContext";
import { useInventory } from "../InventoryContext";
import { useSkills } from "../SkillsContext";
import gameEngine from "@game/loop/engine";

describe("GameProvider Architectural Composition & Integration", () => {
  beforeEach(async () => {
    await cleanupDom();
    gameEngine.resetPlayerInventoryToDefaults();
    gameEngine.resetPlayerSkillsToDefaults();
  });

  afterEach(async () => {
    gameEngine.resetPlayerInventoryToDefaults();
    gameEngine.resetPlayerSkillsToDefaults();
    await cleanupDom();
  });

  const RootAppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <I18nProvider>
      <GameProvider>{children}</GameProvider>
    </I18nProvider>
  );

  function useAllGameContexts() {
    const i18n = useI18n();
    const settings = useSettings();
    const saveGame = useSaveGame();
    const session = useGameSession();
    const inventory = useInventory();
    const skills = useSkills();
    return { i18n, settings, saveGame, session, inventory, skills };
  }

  it("successfully composes all modular domain contexts and exposes valid state", async () => {
    const { result, unmount } = await renderCustomHook(() => useAllGameContexts(), {
      wrapper: RootAppWrapper,
    });

    // Verify all domain hooks resolved their respective providers
    expect(result.current.i18n.language).toBeDefined();
    expect(result.current.settings.settings).toBeDefined();
    expect(result.current.saveGame.isLoaded).toBe(true);
    expect(result.current.session.currentLocationId).toBeDefined();
    expect(result.current.inventory.activePlayerIndex).toBe(0);
    expect(result.current.skills.activePlayerIndex).toBe(0);

    await unmount();
  });

  it("coordinates language switching between Settings and I18n without polluting game session or inventory", async () => {
    const { result, unmount } = await renderCustomHook(() => useAllGameContexts(), {
      wrapper: RootAppWrapper,
    });

    const initialInventoryBackpackCount = result.current.inventory.activeInventory?.backpack.length;

    // Switch language via i18n
    await act(async () => {
      result.current.i18n.setLanguage("en");
    });

    expect(result.current.i18n.language).toBe("en");
    expect(result.current.i18n.isEn).toBe(true);

    // Verify inventory state and skill points remained consistent
    expect(result.current.inventory.activeInventory?.backpack.length).toBe(initialInventoryBackpackCount);
    expect(result.current.skills.activeCharacter).toBe("valen");

    await unmount();
  });

  it("preserves settings domain state when session or level restarts occur", async () => {
    const { result, unmount } = await renderCustomHook(() => useAllGameContexts(), {
      wrapper: RootAppWrapper,
    });

    // Mutate settings
    await act(async () => {
      result.current.settings.setVolumeMusic(0.85);
    });
    expect(result.current.settings.volumeMusic).toBe(0.85);

    // Restart location in session
    await act(async () => {
      result.current.session.restart();
    });

    // Settings must remain unchanged despite session restart
    expect(result.current.settings.volumeMusic).toBe(0.85);

    await unmount();
  });
});
