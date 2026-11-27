import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { renderIntoDom, cleanupDom, IntegrationTestProviders } from "@test-utils";
import { InventoryModalView } from "@game-menu/modal/views/InventoryModalView";
import { MENU_CONTEXT_ACTION_EVENT } from "@game-menu/controls/useMenuGamepad";
import { ITEM_REGISTRY, syncPlayerMaxStats } from "@game/logic/inventory";
import gameEngine from "@game/loop/engine";

describe("Given the Inventory tab (Ekwipunek)", () => {
  beforeEach(async () => {
    await cleanupDom();
    gameEngine.resetLevel("courtyard", undefined, false);
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("When rendered with default player gear", () => {
    it("Then it should show the paperdoll around portrait, quick belt 1-3, backpack grid, and empty dashed slots", async () => {
      // Given & When
      const { container, unmount } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <InventoryModalView />
        </IntegrationTestProviders>
      );

      // Then
      expect(container.querySelectorAll('[data-inv-slot^="equipment:"]')).toHaveLength(6);
      expect(container.querySelectorAll('[data-inv-slot^="potion:"]')).toHaveLength(3);
      expect(container.querySelectorAll('[data-inv-slot^="backpack:"]')).toHaveLength(16);
      const emptyRing = container.querySelector('[data-inv-slot="equipment:ring"]');
      expect(emptyRing?.className).toContain("border-dashed");
      expect(emptyRing?.textContent).toContain("Pierścień");
      expect(container.querySelector("img")).not.toBeNull();

      await unmount();
    });
  });

  describe("When selecting a backpack item to inspect", () => {
    it("Then it should display colored stat comparison deltas against the currently equipped slot item", async () => {
      // Given
      const { container, click, unmount } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <InventoryModalView />
        </IntegrationTestProviders>
      );

      // When: backpack[0] is Frost Rapier (+22 ATK, +20 MP) vs equipped Solar Rapier (+15 ATK, +10 STA)
      const firstBackpackSlot = container.querySelector('[data-inv-slot="backpack:0"]') as HTMLElement;
      await click(firstBackpackSlot);

      // Then
      const comparison = container.querySelector('[data-testid="inventory-stat-comparison"]');
      expect(comparison).not.toBeNull();
      const atkDelta = comparison?.querySelector('[data-stat-delta="attack"]');
      const manaDelta = comparison?.querySelector('[data-stat-delta="mana"]');
      const staminaDelta = comparison?.querySelector('[data-stat-delta="stamina"]');
      expect(atkDelta?.textContent).toContain("+7");
      expect(atkDelta?.className).toContain("text-emerald-400");
      expect(manaDelta?.textContent).toContain("+20");
      expect(manaDelta?.className).toContain("text-emerald-400");
      expect(staminaDelta?.textContent).toContain("-10");
      expect(staminaDelta?.className).toContain("text-rose-400");

      await unmount();
    });
  });

  describe("When navigating with arrow keys, Enter, X, and Y", () => {
    it("Then arrows move selection in grid order, Y toggles details, X/context-event requires confirm, and Enter equips and clamps stats", async () => {
      // Given
      const player = gameEngine.players[0]!;
      player.inventory.backpack[2] = { ...ITEM_REGISTRY.scholar_robe! };
      syncPlayerMaxStats(player);
      player.health = player.maxHealth;

      const { container, unmount } = await renderIntoDom(
        <IntegrationTestProviders defaultLanguage="pl">
          <InventoryModalView />
        </IntegrationTestProviders>
      );

      const press = async (target: Element, key: string) => {
        await act(async () => {
          target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
        });
      };

      // When: ArrowRight from amulet -> helmet
      const amuletSlot = container.querySelector('[data-inv-slot="equipment:amulet"]') as HTMLElement;
      await act(async () => {
        amuletSlot.focus();
      });
      await press(amuletSlot, "ArrowRight");
      expect(document.activeElement?.getAttribute("data-inv-slot")).toBe("equipment:helmet");

      // Jump down: helmet -> armor -> potion:1 -> backpack:1
      await press(document.activeElement!, "ArrowDown");
      expect(document.activeElement?.getAttribute("data-inv-slot")).toBe("equipment:armor");
      await press(document.activeElement!, "ArrowDown");
      expect(document.activeElement?.getAttribute("data-inv-slot")).toBe("potion:1");
      await press(document.activeElement!, "ArrowDown");
      expect(document.activeElement?.getAttribute("data-inv-slot")).toBe("backpack:1");

      // Move right to backpack:2 (Scholar Robe: +50 MP, 0 HP vs Crimson Coat +30 HP)
      await press(document.activeElement!, "ArrowRight");
      expect(document.activeElement?.getAttribute("data-inv-slot")).toBe("backpack:2");

      // Y toggles inspector details off then back on
      expect(container.querySelector('[data-testid="inventory-inspector-details"]')).not.toBeNull();
      await press(document.activeElement!, "y");
      expect(container.querySelector('[data-testid="inventory-inspector-details"]')).toBeNull();
      await press(document.activeElement!, "y");
      expect(container.querySelector('[data-testid="inventory-inspector-details"]')).not.toBeNull();

      // X via gamepad custom event opens discard ConfirmDialog with Anuluj focused and does not discard yet
      await act(async () => {
        document.activeElement!.dispatchEvent(
          new CustomEvent(MENU_CONTEXT_ACTION_EVENT, { bubbles: true, cancelable: true })
        );
      });
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
      expect(document.activeElement?.textContent?.trim()).toBe("Anuluj");
      expect(player.inventory.backpack[2]?.id).toBe("scholar_robe");

      // Cancel discard via Esc
      await press(document.activeElement!, "Escape");
      expect(document.body.querySelector('[role="dialog"]')).toBeNull();
      expect(player.inventory.backpack[2]?.id).toBe("scholar_robe");

      // Enter equips Scholar Robe, dropping maxHealth by 30 and clamping current health to new maxHealth
      const maxHpBefore = player.maxHealth;
      const robeSlot = container.querySelector('[data-inv-slot="backpack:2"]') as HTMLElement;
      await act(async () => {
        robeSlot.focus();
      });
      await press(robeSlot, "Enter");

      // Then
      expect(player.inventory.equipment.armor?.id).toBe("scholar_robe");
      expect(player.maxHealth).toBe(maxHpBefore - 30);
      expect(player.health).toBe(player.maxHealth);

      await unmount();
    });
  });
});
