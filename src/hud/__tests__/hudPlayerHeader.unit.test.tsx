import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { HUDPlayerHeader } from "../components/player/HUDPlayerHeader";
import { getPlayerThemeTokens } from "@styles/theme";

describe("<HUDPlayerHeader />", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const crimsonTheme = getPlayerThemeTokens("crimson");
  const cyanTheme = getPlayerThemeTokens("cyan");

  it("renders player name, lore title, rounded attack power, passive name, and P1 tag", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerHeader
          characterId="valen"
          characterName="Valen"
          playerNumber={1}
          attackPower={24.7}
          defensePower={7}
          loreTitleKey="valenLoreTitle"
          passiveNameKey="valenPassiveName"
          passiveDescKey="valenPassiveDesc"
          emblem="sun"
          themeTokens={crimsonTheme}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Valen");
    expect(container.textContent).toContain("Słoneczny Rycerz");
    expect(container.textContent).toContain("Solarny Hart");
    expect(container.textContent).toContain("25");
    expect(container.textContent).toContain("P1");

    await unmount();
  });

  it("renders skill points level up button when points > 0 and calls onOpenSkillTree", async () => {
    const onOpenSkillTree = mock(() => {});

    const { container, click, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerHeader
          characterId="valen"
          characterName="Valen"
          playerNumber={1}
          attackPower={20}
          skillPoints={3}
          themeTokens={crimsonTheme}
          onOpenSkillTree={onOpenSkillTree}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("+3");
    const btn = container.querySelector("button");
    expect(btn).not.toBeNull();
    await click(btn!);

    expect(onOpenSkillTree).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("renders Aurelia lore identity and spell power bonus for Player 2 without redundant Co-op badge", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerHeader
          characterId="aurelia"
          characterName="Aurelia"
          playerNumber={2}
          attackPower={18}
          spellPowerMultiplier={1.15}
          loreTitleKey="aureliaLoreTitle"
          passiveNameKey="aureliaPassiveName"
          emblem="astrolabe"
          skillPoints={0}
          themeTokens={cyanTheme}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Uczona Arkanów");
    expect(container.textContent).toContain("Astralny Przepływ");
    expect(container.textContent).toContain("+15%");
    expect(container.textContent).toContain("P2");
    expect(container.textContent).not.toContain("Co-op");

    await unmount();
  });
});
