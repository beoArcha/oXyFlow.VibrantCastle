import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import React, { act } from "react";
import { renderCustomHook, cleanupDom } from "@test-utils/domTestUtils";
import { LocaleProvider, useLocale } from "../LocaleContext";
import { GameProvider } from "../GameContext";
import { useGameEngine } from "../GameEngineContext";
import { useGameSession } from "../GameSessionContext";
import { useViewport } from "../ViewportContext";
import { useInventory } from "../InventoryContext";
import { useSkills } from "../SkillsContext";
import defaultGameEngine, { GameEngine } from "@game/loop/engine";

describe("Custom Engine End-to-End Provider Tree Integration", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should propagate a custom GameEngine instance through LocaleProvider and GameProvider tree without touching the global singleton", async () => {
    // Arrange: Create a dedicated custom GameEngine instance
    const customEngine = new GameEngine();
    customEngine.settings.language = "en";
    customEngine.setPaused(false);

    // Track singleton state to verify isolation
    const initialSingletonLang = defaultGameEngine.settings.language;
    const initialSingletonPaused = defaultGameEngine.isPaused;

    const startSpy = spyOn(customEngine, "start").mockImplementation(() => {});
    const attachSpy = spyOn(customEngine, "attachCanvas").mockImplementation(() => {});
    const singletonStartSpy = spyOn(defaultGameEngine, "start");

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <LocaleProvider engine={customEngine} defaultLanguage="en">
        <GameProvider engine={customEngine}>
          {children}
        </GameProvider>
      </LocaleProvider>
    );

    // Act: Render hooks consuming all composed domains
    const { result, unmount } = await renderCustomHook(
      () => ({
        locale: useLocale(),
        engine: useGameEngine(),
        session: useGameSession(),
        viewport: useViewport(),
        inventory: useInventory(),
        skills: useSkills(),
      }),
      { wrapper }
    );

    // Assert: Initial wiring bound to customEngine
    expect(result.current.locale.language).toBe("en");
    expect(customEngine.settings.language).toBe("en");
    expect(result.current.engine.isPaused).toBe(false);
    expect(result.current.session.isPaused).toBe(false);

    // Act: Switch language in LocaleContext
    await act(async () => {
      result.current.locale.setLanguage("pl");
    });

    // Assert: customEngine language updated, singleton untouched
    expect(customEngine.settings.language).toBe("pl");
    expect(defaultGameEngine.settings.language).toBe(initialSingletonLang);

    // Act: Pause via GameSessionContext
    await act(async () => {
      result.current.session.setPaused(true);
    });

    // Assert: customEngine paused, singleton untouched
    expect(customEngine.isPaused).toBe(true);
    expect(result.current.engine.isPaused).toBe(true);
    expect(result.current.session.isPaused).toBe(true);
    expect(defaultGameEngine.isPaused).toBe(initialSingletonPaused);

    // Act: Attach canvas via ViewportContext
    const mockCanvas = {} as HTMLCanvasElement;
    result.current.viewport.attachCanvas(mockCanvas);

    // Assert: customEngine lifecycle methods invoked, singleton not touched
    expect(attachSpy).toHaveBeenCalledWith(mockCanvas);
    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(singletonStartSpy).not.toHaveBeenCalled();

    // Assert: Inventory and Skills are bound to customEngine player instances
    expect(result.current.inventory.activePlayer?.id).toBe(customEngine.players[0]?.id);
    expect(result.current.skills.activePlayer?.id).toBe(customEngine.players[0]?.id);

    await unmount();
  });
});
