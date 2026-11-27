import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom, IntegrationTestProviders } from "@test-utils";
import { GameConfigBarSection } from "../gameplay/GameConfigBarSection";
import { GameSaveSection } from "../gameplay/GameSaveSection";
import { GameplayTab } from "../GameplayTab";
import { StatsMenuTab } from "../../../modal/views/StatsMenuTab";
import { InventoryModalView } from "../../../modal/views/InventoryModalView";
import gameEngine from "@game/loop/engine";

const findButton = (label: string): HTMLButtonElement | undefined =>
  Array.from(document.querySelectorAll("button")).find(
    (btn) => btn.textContent?.trim() === label
  ) as HTMLButtonElement | undefined;

const getDialog = (): Element | null => document.querySelector('[role="dialog"]');

const pressEscape = async (target: Element): Promise<void> => {
  const { act } = await import("react");
  await act(async () => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe("Destructive actions require confirmation (PR-4)", () => {
  afterEach(async () => {
    await cleanupDom();
  });

  describe("GameConfigBarSection (settings reset, import, restart)", () => {
    const makeProps = () => ({
      onExportSettings: mock(() => {}),
      onImportSettings: mock(() => Promise.resolve(true)),
      onResetDefaults: mock(() => {}),
      onRestartLocation: mock(() => {}),
    });

    it("opens a reset confirm without resetting, focuses Anuluj, and resets only on confirm", async () => {
      const props = makeProps();
      const { unmount, click } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <GameConfigBarSection {...props} />
        </IntegrationTestProviders>
      );

      await click(findButton("Domyślne")!);

      expect(getDialog()).not.toBeNull();
      expect(document.body.textContent).toContain("Przywrócić ustawienia domyślne?");
      expect(props.onResetDefaults).not.toHaveBeenCalled();
      expect(document.activeElement?.textContent?.trim()).toBe("Anuluj");

      await click(findButton("Zresetuj")!);
      expect(props.onResetDefaults).toHaveBeenCalledTimes(1);
      expect(getDialog()).toBeNull();

      await unmount();
    });

    it("Esc cancels the reset confirm without resetting", async () => {
      const props = makeProps();
      const { unmount, click } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <GameConfigBarSection {...props} />
        </IntegrationTestProviders>
      );

      await click(findButton("Domyślne")!);
      await pressEscape(document.activeElement ?? document.body);

      expect(getDialog()).toBeNull();
      expect(props.onResetDefaults).not.toHaveBeenCalled();

      await unmount();
    });

    it("file import asks for confirmation and imports only after confirm", async () => {
      const props = makeProps();
      const { container, unmount, click } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <GameConfigBarSection {...props} />
        </IntegrationTestProviders>
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["{}"], "settings.json", { type: "application/json" });
      Object.defineProperty(input, "files", { value: [file], configurable: true });
      await click(input);
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(getDialog()).not.toBeNull();
      expect(document.body.textContent).toContain("Zaimportować ustawienia?");
      expect(props.onImportSettings).not.toHaveBeenCalled();

      await click(findButton("Importuj")!);
      expect(props.onImportSettings).toHaveBeenCalledTimes(1);

      await unmount();
    });

    it("restart asks for confirmation and does not restart on Esc", async () => {
      const props = makeProps();
      const { unmount, click } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <GameConfigBarSection {...props} />
        </IntegrationTestProviders>
      );

      await click(document.querySelector("#restart-level-btn") as Element);
      expect(document.body.textContent).toContain("Zrestartować lokację?");
      expect(props.onRestartLocation).not.toHaveBeenCalled();

      await pressEscape(document.activeElement ?? document.body);
      expect(getDialog()).toBeNull();
      expect(props.onRestartLocation).not.toHaveBeenCalled();

      await unmount();
    });
  });

  describe("GameSaveSection (load save)", () => {
    it("quick load asks for confirmation before loading", async () => {
      const onLoadFromLocalStorage = mock(() => {});
      const { unmount, click } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <GameSaveSection
            onSaveToLocalStorage={() => {}}
            onLoadFromLocalStorage={onLoadFromLocalStorage}
            onSaveGame={() => {}}
            onLoadGame={() => {}}
          />
        </IntegrationTestProviders>
      );

      await click(document.querySelector("#load-local-btn") as Element);
      expect(document.body.textContent).toContain("Wczytać zapis?");
      expect(onLoadFromLocalStorage).not.toHaveBeenCalled();
      expect(document.activeElement?.textContent?.trim()).toBe("Anuluj");

      await click(findButton("Wczytaj")!);
      expect(onLoadFromLocalStorage).toHaveBeenCalledTimes(1);

      await unmount();
    });

    it("file load keeps the picked file and loads it only on confirm", async () => {
      const onLoadGame = mock((_file: File) => {});
      const { container, unmount, click } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <GameSaveSection
            onSaveToLocalStorage={() => {}}
            onLoadFromLocalStorage={() => {}}
            onSaveGame={() => {}}
            onLoadGame={onLoadGame}
          />
        </IntegrationTestProviders>
      );

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(["{}"], "save.json", { type: "application/json" });
      Object.defineProperty(input, "files", { value: [file], configurable: true });
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(document.body.textContent).toContain("Wczytać zapis?");
      expect(onLoadGame).not.toHaveBeenCalled();

      await click(findButton("Wczytaj")!);
      expect(onLoadGame).toHaveBeenCalledTimes(1);
      expect(onLoadGame.mock.calls[0]?.[0]).toBe(file);

      await unmount();
    });
  });

  describe("GameplayTab (restart location)", () => {
    it("restart opens a confirm and does not restart the engine until confirmed", async () => {
      const restartSpy = mock(() => {});
      const original = gameEngine.resetLevel;
      (gameEngine as { resetLevel: unknown }).resetLevel = restartSpy;

      try {
        const { unmount, click } = await renderIntoDom(
          <IntegrationTestProviders defaultLanguage="pl">
            <GameplayTab />
          </IntegrationTestProviders>
        );

        await click(document.querySelector("#restart-level-btn") as Element);
        expect(document.body.textContent).toContain("Zrestartować lokację?");
        expect(restartSpy).not.toHaveBeenCalled();

        await click(findButton("Zrestartuj")!);
        expect(restartSpy).toHaveBeenCalledTimes(1);

        await unmount();
      } finally {
        (gameEngine as { resetLevel: unknown }).resetLevel = original;
      }
    });
  });

  describe("StatsMenuTab (reset statistics)", () => {
    it("opens a confirm and keeps stats unchanged until confirmed", async () => {
      const { unmount, click } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <StatsMenuTab />
        </IntegrationTestProviders>
      );

      await click(findButton("Zresetuj Statystyki")!);
      expect(document.body.textContent).toContain("Zresetować statystyki?");
      expect(document.activeElement?.textContent?.trim()).toBe("Anuluj");

      await pressEscape(document.activeElement ?? document.body);
      expect(getDialog()).toBeNull();

      await unmount();
    });
  });

  describe("Empty states (PR-4)", () => {
    let savedBackpack: unknown[] = [];
    let savedMainHand: unknown;

    beforeEach(() => {
      const player = gameEngine.players[0];
      if (!player) return;
      savedBackpack = [...player.inventory.backpack];
      savedMainHand = player.inventory.equipment.mainHand;
      player.inventory.backpack.fill(null);
      player.inventory.equipment.mainHand = null;
    });

    afterEach(() => {
      const player = gameEngine.players[0];
      if (!player) return;
      player.inventory.backpack.splice(0, player.inventory.backpack.length, ...(savedBackpack as typeof player.inventory.backpack));
      player.inventory.equipment.mainHand = savedMainHand as typeof player.inventory.equipment.mainHand;
    });

    it("shows one sentence for an empty backpack instead of a grid of placeholders", async () => {
      const { unmount } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <InventoryModalView />
        </IntegrationTestProviders>
      );

      expect(document.body.textContent).toContain("Plecak jest pusty. Przedmioty znajdziesz w świecie gry.");
      expect(document.querySelector('button[aria-label="Wyrzuć Przedmiot"]')).toBeNull();

      await unmount();
    });

    it("renders an empty equipment slot as a muted name in a dashed border", async () => {
      const { container, unmount } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <InventoryModalView />
        </IntegrationTestProviders>
      );

      const label = Array.from(container.querySelectorAll("*")).find(
        (el) => el.children.length === 0 && el.textContent?.trim() === "Prawa Ręka (Broń)"
      );
      const row = label?.parentElement;

      expect(row).toBeDefined();
      expect(row?.className).toContain("border-dashed");
      expect(container.textContent).not.toContain("Pusty Slot");

      await unmount();
    });
  });

  describe("InventoryModalView (discard item)", () => {
    let previousSlot: unknown;

    beforeEach(() => {
      const player = gameEngine.players[0];
      previousSlot = player?.inventory.backpack[0];
      if (player) {
        player.inventory.backpack[0] = {
          id: "test_discard_item",
          nameKey: "item.test_discard_item",
          type: "potion",
          rarity: "common",
        } as unknown as NonNullable<typeof player.inventory.backpack[number]>;
      }
    });

    afterEach(() => {
      const player = gameEngine.players[0];
      if (player) player.inventory.backpack[0] = previousSlot as typeof player.inventory.backpack[number];
    });

    it("discard opens a confirm and removes the item only on confirm", async () => {
      const discardSpy = mock((_playerIndex: number, _backpackIndex: number) => true);
      const original = gameEngine.discardPlayerItem;
      (gameEngine as { discardPlayerItem: unknown }).discardPlayerItem = discardSpy;

      try {
        const { unmount, click } = await renderIntoDom(
          <IntegrationTestProviders defaultLanguage="pl">
            <InventoryModalView />
          </IntegrationTestProviders>
        );

        await click(document.querySelector('button[aria-label="Wyrzuć Przedmiot"]') as Element);
        expect(document.body.textContent).toContain("Wyrzucić przedmiot?");
        expect(discardSpy).not.toHaveBeenCalled();
        expect(document.activeElement?.textContent?.trim()).toBe("Anuluj");

        await click(findButton("Wyrzuć")!);
        expect(discardSpy).toHaveBeenCalledTimes(1);
        expect(discardSpy.mock.calls[0]?.[1]).toBe(0);

        await unmount();
      } finally {
        (gameEngine as { discardPlayerItem: unknown }).discardPlayerItem = original;
      }
    });

    it("Esc cancels the discard without calling the engine", async () => {
      const discardSpy = mock((_playerIndex: number, _backpackIndex: number) => true);
      const original = gameEngine.discardPlayerItem;
      (gameEngine as { discardPlayerItem: unknown }).discardPlayerItem = discardSpy;

      try {
        const { unmount, click } = await renderIntoDom(
          <IntegrationTestProviders defaultLanguage="pl">
            <InventoryModalView />
          </IntegrationTestProviders>
        );

        await click(document.querySelector('button[aria-label="Wyrzuć Przedmiot"]') as Element);
        await pressEscape(document.activeElement ?? document.body);

        expect(getDialog()).toBeNull();
        expect(discardSpy).not.toHaveBeenCalled();

        await unmount();
      } finally {
        (gameEngine as { discardPlayerItem: unknown }).discardPlayerItem = original;
      }
    });
  });
});
