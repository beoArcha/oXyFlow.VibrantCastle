import React, { createRef, act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  ItemSlot,
  ItemIcon,
  registerItemIcon,
  getItemIcon,
  itemIconRegistry,
  KeyedTabs,
  ModalNavigationTabs,
  ModalType,
} from "@ui";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { Item, ItemRarity, ItemType } from "@game/types";

describe("Domain UI Components (ItemIcon, ItemSlot, KeyedTabs, ModalNavigationTabs)", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("ItemIcon Component", () => {
    it("renders a standard known icon (e.g. Sword)", async () => {
      const { container } = await renderIntoDom(<ItemIcon name="Sword" size={24} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("width")).toBe("24");
      expect(svg?.getAttribute("height")).toBe("24");
    });

    it("falls back to Package icon when icon name is unknown", async () => {
      const { container } = await renderIntoDom(<ItemIcon name="UnknownMysteryItem" />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      // getItemIcon directly returns Package component
      const fallbackComponent = getItemIcon("UnknownMysteryItem");
      const packageComponent = getItemIcon("Package");
      expect(fallbackComponent).toBe(packageComponent);
    });

    it("allows runtime icon registration conforming to OCP", async () => {
      const CustomIcon = ({ size }: { size?: number }) => (
        <svg data-testid="custom-gem-icon" width={size} height={size} />
      );

      registerItemIcon("CustomRubyGem", CustomIcon);
      expect(getItemIcon("CustomRubyGem")).toBe(CustomIcon);

      const { container } = await renderIntoDom(<ItemIcon name="CustomRubyGem" size={32} />);
      expect(container.querySelector("[data-testid='custom-gem-icon']")).not.toBeNull();

      // Cleanup registry
      itemIconRegistry.delete("CustomRubyGem");
    });

    it("forwards ref to the outer span wrapper", async () => {
      const iconRef = createRef<HTMLSpanElement>();
      await renderIntoDom(<ItemIcon ref={iconRef} name="Shield" />);
      expect(iconRef.current).not.toBeNull();
      expect(iconRef.current?.tagName).toBe("SPAN");
    });
  });

  describe("ItemSlot Component", () => {
    const createMockItem = (overrides: Partial<Item> = {}): Item => ({
      id: "iron_sword",
      nameKey: "ironSword",
      descriptionKey: "ironSwordDesc",
      type: ItemType.Weapon,
      rarity: "common",
      icon: "Sword",
      count: 1,
      attackBonus: 10,
      ...overrides,
    });

    it("renders an empty slot with dash placeholder and empty slot label", async () => {
      const { container } = await renderIntoDom(<ItemSlot item={null} />);
      const slot = container.querySelector("[role='button']");
      expect(slot).not.toBeNull();
      expect(slot?.getAttribute("aria-label")).toBe("Empty slot");
      expect(container.textContent).toContain("-");
    });

    it("renders empty slot with custom label and icon placeholder", async () => {
      const { container } = await renderIntoDom(
        <ItemSlot
          item={null}
          label="Weapon Slot"
          iconPlaceholder={<span data-testid="ph-icon">⚔️</span>}
        />
      );
      expect(container.textContent).toContain("Weapon Slot");
      expect(container.querySelector("[data-testid='ph-icon']")).not.toBeNull();
      expect(container.querySelector("[role='button']")?.getAttribute("aria-label")).toBe(
        "Weapon Slot"
      );
    });

    it("renders item with appropriate rarity border styling", async () => {
      const rarities: ItemRarity[] = ["common", "uncommon", "rare", "legendary"];
      const expectedBorderSubstrings: Record<ItemRarity, string> = {
        common: "border-stone-700",
        uncommon: "border-emerald-600",
        rare: "border-cyan-500",
        legendary: "border-amber-400",
      };

      for (const rarity of rarities) {
        await cleanupDom();
        const item = createMockItem({ rarity, nameKey: `item_${rarity}` });
        const { container } = await renderIntoDom(<ItemSlot item={item} />);
        const slot = container.querySelector("[role='button']") as HTMLElement;
        expect(slot.className).toContain(expectedBorderSubstrings[rarity]);
        expect(slot.getAttribute("aria-label")).toBe(`item_${rarity}`);
      }
    });

    it("does not render stack badge when count is 1 or undefined", async () => {
      const item = createMockItem({ count: 1 });
      const { container } = await renderIntoDom(<ItemSlot item={item} />);
      expect(container.textContent).not.toContain("x1");
    });

    it("renders stack count badge when item.count > 1 or count prop > 1", async () => {
      const item = createMockItem({ count: 5 });
      const { container } = await renderIntoDom(<ItemSlot item={item} />);
      expect(container.textContent).toContain("x5");

      // Count prop takes precedence
      await cleanupDom();
      const { container: containerOverride } = await renderIntoDom(
        <ItemSlot item={item} count={12} />
      );
      expect(containerOverride.textContent).toContain("x12");
    });

    it("renders selected state with aria-pressed and highlight styling", async () => {
      const item = createMockItem();
      const { container } = await renderIntoDom(<ItemSlot item={item} isSelected={true} />);
      const slot = container.querySelector("[role='button']") as HTMLElement;
      expect(slot.getAttribute("aria-pressed")).toBe("true");
      expect(slot.className).toContain("ring-2");
      expect(slot.className).toContain("ring-amber-400/60");
    });

    it("handles mouse click and keyboard activation (Enter / Space)", async () => {
      const handleClick = mock(() => {});
      const item = createMockItem();
      const { container, click } = await renderIntoDom(
        <ItemSlot item={item} onClick={handleClick} />
      );
      const slot = container.querySelector("[role='button']") as HTMLElement;

      // Click
      await click(slot);
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Enter key
      await act(async () => {
        slot.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      });
      expect(handleClick).toHaveBeenCalledTimes(2);

      // Space key
      await act(async () => {
        slot.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
      });
      expect(handleClick).toHaveBeenCalledTimes(3);

      // Irrelevant key (e.g. Tab or Escape) does not trigger onClick
      await act(async () => {
        slot.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      });
      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("forwards ref to the slot element", async () => {
      const slotRef = createRef<HTMLDivElement>();
      await renderIntoDom(<ItemSlot ref={slotRef} item={null} />);
      expect(slotRef.current).not.toBeNull();
      expect(slotRef.current?.getAttribute("role")).toBe("button");
    });
  });

  describe("KeyedTabs Component", () => {
    const items = [
      { id: "tab1", label: "First Tab", keyLabel: "1" },
      { id: "tab2", label: "Second Tab", keyLabel: "2" },
      { id: "tab3", label: "Disabled Tab", keyLabel: "3", disabled: true },
    ];

    it("renders tabs with labels and shortcut key badges", async () => {
      const handleChange = mock((_id: string) => {});
      const { container } = await renderIntoDom(
        <KeyedTabs items={items} activeId="tab1" onChange={handleChange} />
      );

      expect(container.textContent).toContain("First Tab");
      expect(container.textContent).toContain("[1]");
      expect(container.textContent).toContain("Second Tab");
      expect(container.textContent).toContain("[2]");

      const tablist = container.querySelector("[role='tablist']");
      expect(tablist).not.toBeNull();

      const tabs = container.querySelectorAll("[role='tab']");
      expect(tabs.length).toBe(3);
      expect(tabs[0].getAttribute("aria-selected")).toBe("true");
      expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    });

    it("calls onChange when an enabled tab is clicked", async () => {
      const handleChange = mock((_id: string) => {});
      const { container, click } = await renderIntoDom(
        <KeyedTabs items={items} activeId="tab1" onChange={handleChange} />
      );

      const tab2 = container.querySelectorAll("[role='tab']")[1];
      await click(tab2);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith("tab2");
    });

    it("does not trigger onChange when a disabled tab is clicked", async () => {
      const handleChange = mock((_id: string) => {});
      const { container, click } = await renderIntoDom(
        <KeyedTabs items={items} activeId="tab1" onChange={handleChange} />
      );

      const disabledTab = container.querySelectorAll<HTMLButtonElement>("[role='tab']")[2];
      expect(disabledTab.disabled).toBe(true);

      await click(disabledTab);
      expect(handleChange).toHaveBeenCalledTimes(0);
    });

    it("renders trailing action if provided", async () => {
      const { container } = await renderIntoDom(
        <KeyedTabs
          items={items}
          activeId="tab1"
          onChange={() => {}}
          trailingAction={<button data-testid="trailing-btn">Exit</button>}
        />
      );

      expect(container.querySelector("[data-testid='trailing-btn']")).not.toBeNull();
    });

    it("forwards ref to the tablist container", async () => {
      const listRef = createRef<HTMLDivElement>();
      await renderIntoDom(
        <KeyedTabs ref={listRef} items={items} activeId="tab1" onChange={() => {}} />
      );
      expect(listRef.current).not.toBeNull();
      expect(listRef.current?.getAttribute("role")).toBe("tablist");
    });
  });

  describe("ModalNavigationTabs Component", () => {
    it("renders standard modal navigation tabs and handles navigation", async () => {
      const handleNavigate = mock((_m: ModalType) => {});
      const handleResume = mock(() => {});

      const { container, click } = await renderIntoDom(
        <ModalNavigationTabs
          currentModal="menu"
          onNavigate={handleNavigate}
          onResume={handleResume}
          showCreation={true}
        />
      );

      // Verify tabs exist
      const tabs = container.querySelectorAll("[role='tab']");
      expect(tabs.length).toBe(5); // menu, help, inventory, skillTree, creation

      expect(container.textContent).toContain("[M]");
      expect(container.textContent).toContain("[H]");
      expect(container.textContent).toContain("[I]");
      expect(container.textContent).toContain("[K]");
      expect(container.textContent).toContain("[C]");

      // Click inventory tab
      const inventoryTab = tabs[2];
      await click(inventoryTab);
      expect(handleNavigate).toHaveBeenCalledWith("inventory");

      // Click resume button
      const resumeBtn = container.querySelector("button[title*='[P]']") as HTMLButtonElement;
      expect(resumeBtn).not.toBeNull();
      await click(resumeBtn);
      expect(handleResume).toHaveBeenCalledTimes(1);
    });

    it("hides creation tab when showCreation is false", async () => {
      const { container } = await renderIntoDom(
        <ModalNavigationTabs
          currentModal="inventory"
          onNavigate={() => {}}
          onResume={() => {}}
          showCreation={false}
        />
      );

      const tabs = container.querySelectorAll("[role='tab']");
      expect(tabs.length).toBe(4); // menu, help, inventory, skillTree
      expect(container.textContent).not.toContain("[C]");
    });
  });
});
