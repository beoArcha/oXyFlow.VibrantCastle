import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { List, ListItem, MetaItem, OptionItem } from "../typography";

describe("Structural Typography Primitives (@ui)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  describe("<List /> and <ListItem />", () => {
    it("renders semantic ul tag with diamond gothic markers", async () => {
      const { unmount } = await renderIntoDom(
        <List variant="diamond">
          <ListItem>First tactic</ListItem>
          <ListItem>Second tactic</ListItem>
        </List>
      );

      const list = document.querySelector("ul[data-slot='list']");
      expect(list).not.toBeNull();
      expect(list?.getAttribute("data-variant")).toBe("diamond");

      const items = document.querySelectorAll("li[data-slot='list-item']");
      expect(items.length).toBe(2);

      const markers = document.querySelectorAll("[data-slot='list-item-marker']");
      expect(markers.length).toBe(2);
      expect(markers[0].textContent).toBe("◆");

      await unmount();
    });

    it("renders semantic ol tag when variant is decimal", async () => {
      const { unmount } = await renderIntoDom(
        <List variant="decimal">
          <ListItem>Step 1</ListItem>
          <ListItem>Step 2</ListItem>
        </List>
      );

      const list = document.querySelector("ol[data-slot='list']");
      expect(list).not.toBeNull();
      expect(list?.tagName.toLowerCase()).toBe("ol");

      await unmount();
    });

    it("supports custom leading icons in ListItem", async () => {
      const { unmount } = await renderIntoDom(
        <List>
          <ListItem icon={<span data-testid="custom-icon">⚔️</span>}>
            Attack bonus
          </ListItem>
        </List>
      );

      const icon = document.querySelector("[data-slot='list-item-icon']");
      expect(icon).not.toBeNull();
      expect(icon?.textContent).toBe("⚔️");

      await unmount();
    });

    it("supports multi-column grid layout (columns=2)", async () => {
      const { unmount } = await renderIntoDom(
        <List columns={2}>
          <ListItem>Col 1</ListItem>
          <ListItem>Col 2</ListItem>
        </List>
      );

      const list = document.querySelector("ul[data-slot='list']");
      expect(list?.className).toContain("grid");
      expect(list?.className).toContain("grid-cols-1");
      expect(list?.className).toContain("sm:grid-cols-2");

      await unmount();
    });
  });

  describe("<MetaItem />", () => {
    it("renders stacked key-value metadata with mono value", async () => {
      const { unmount } = await renderIntoDom(
        <MetaItem
          label="Drop Rate"
          value="15%"
          mono
          layout="stacked"
        />
      );

      const root = document.querySelector("[data-slot='meta-item']");
      expect(root?.getAttribute("data-layout")).toBe("stacked");
      expect(root?.className).toContain("flex-col");

      const label = document.querySelector("[data-slot='meta-item-label']");
      expect(label?.textContent).toBe("Drop Rate");

      const value = document.querySelector("[data-slot='meta-item-value']");
      expect(value?.textContent).toBe("15%");
      expect(value?.className).toContain("font-mono");

      await unmount();
    });

    it("renders inline layout with colon delimiter", async () => {
      const { unmount } = await renderIntoDom(
        <MetaItem
          label="Skill ID"
          value="slash_combo_01"
          layout="inline"
        />
      );

      const root = document.querySelector("[data-slot='meta-item']");
      expect(root?.getAttribute("data-layout")).toBe("inline");
      expect(root?.className).toContain("inline-flex");

      const label = document.querySelector("[data-slot='meta-item-label']");
      expect(label?.textContent).toBe("Skill ID:");

      await unmount();
    });

    it("renders optional leading icon alongside label", async () => {
      const { unmount } = await renderIntoDom(
        <MetaItem
          icon={<span data-testid="meta-icon">🪙</span>}
          label="Bounty"
          value="500g"
        />
      );

      const icon = document.querySelector("[data-slot='meta-item-icon']");
      expect(icon?.textContent).toBe("🪙");

      await unmount();
    });
  });

  describe("<OptionItem />", () => {
    it("renders option with label, description, and selected checkmark", async () => {
      const { unmount } = await renderIntoDom(
        <OptionItem
          label="High Quality"
          description="Enables bloom, 60fps fixed update, full lighting"
          selected
          accelerator="Alt+H"
        />
      );

      const option = document.querySelector("[data-slot='option-item']");
      expect(option?.getAttribute("role")).toBe("option");
      expect(option?.getAttribute("aria-selected")).toBe("true");

      const check = document.querySelector("[data-slot='option-item-check']");
      expect(check).not.toBeNull();

      const accelerator = document.querySelector("[data-slot='option-item-accelerator']");
      expect(accelerator?.textContent).toBe("Alt+H");

      await unmount();
    });

    it("renders disabled state with aria-disabled and muted pointer events", async () => {
      const { unmount } = await renderIntoDom(
        <OptionItem
          label="Locked Skill"
          disabled
        />
      );

      const option = document.querySelector("[data-slot='option-item']");
      expect(option?.getAttribute("aria-disabled")).toBe("true");
      expect(option?.className).toContain("pointer-events-none");

      await unmount();
    });
  });
});
