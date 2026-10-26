import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDSpellSlot } from "../components/belt/HUDSpellSlot";
import type { SpellItemVM } from "../types";

describe("<HUDSpellSlot />", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const dummySpell: SpellItemVM = {
    id: "fireball",
    nameKey: "skillFireball",
    manaCost: 15,
    keyLabel: "U",
    variant: "cyan",
  };

  it("renders spell badge with name, mana cost, and shortcut key for cyan variant", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDSpellSlot
          spell={dummySpell}
          spellName="Kula Ognia"
          keyLabel="U"
          variant="cyan"
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Kula Ognia");
    expect(container.textContent).toContain("15");
    expect(container.textContent).toContain("U");
    const kbd = container.querySelector("kbd");
    expect(kbd).not.toBeNull();
    expect(kbd?.textContent).toBe("U");

    await unmount();
  });

  it("renders purple variant styling for secondary spells", async () => {
    const aegisSpell: SpellItemVM = {
      id: "aegis",
      nameKey: "skillAegis",
      manaCost: 25,
      keyLabel: "O",
      variant: "purple",
    };

    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDSpellSlot
          spell={aegisSpell}
          spellName="Egida Cieni"
          keyLabel="O"
          variant="purple"
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Egida Cieni");
    expect(container.textContent).toContain("25");
    expect(container.textContent).toContain("O");

    await unmount();
  });
});
