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

  it("renders player name, rounded attack power, and P1 tag", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerHeader
          characterId="valen"
          characterName="Valen Shadowblade"
          playerNumber={1}
          attackPower={24.7}
          themeTokens={crimsonTheme}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Valen Shadowblade");
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

  it("renders Co-op badge for Player 2 when skill points are 0", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HUDPlayerHeader
          characterId="aurelia"
          characterName="Aurelia Sunfire"
          playerNumber={2}
          attackPower={18}
          skillPoints={0}
          themeTokens={cyanTheme}
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Co-op");
    expect(container.textContent).toContain("P2");

    await unmount();
  });
});
