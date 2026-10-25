import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { InventoryPlayerTabs } from "../InventoryPlayerTabs";

describe("InventoryPlayerTabs", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders Badge in solo player mode", async () => {
    const onSelectPlayer = mock((_idx: number) => {});
    const { container } = await renderIntoDom(
      <InventoryPlayerTabs
        p1={{ characterId: "valen", characterName: "Valen" }}
        p2={null}
        isTwoPlayer={false}
        activePlayerIndex={0}
        onSelectPlayer={onSelectPlayer}
        p1Name="Valen"
        p2Name="Aurelia"
      />,
      { mode: "ui" }
    );

    expect(container.textContent).toContain("Valen");
    expect(container.querySelectorAll("[role='tab']").length).toBe(0);
    const badge = container.querySelector("span");
    expect(badge).not.toBeNull();
    expect(badge?.className).toContain("border-amber-600/50");
  });

  it("renders Tabs with P1 and P2 triggers in two-player mode", async () => {
    const onSelectPlayer = mock((_idx: number) => {});
    const { container } = await renderIntoDom(
      <InventoryPlayerTabs
        p1={{ characterId: "valen", characterName: "Valen" }}
        p2={{ characterId: "aurelia", characterName: "Aurelia" }}
        isTwoPlayer={true}
        activePlayerIndex={0}
        onSelectPlayer={onSelectPlayer}
        p1Name="Valen"
        p2Name="Aurelia"
      />,
      { mode: "ui" }
    );

    const tabs = container.querySelectorAll("[role='tab']");
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs[1].getAttribute("aria-selected")).toBe("false");
    expect(container.textContent).toContain("Valen");
    expect(container.textContent).toContain("P1");
    expect(container.textContent).toContain("Aurelia");
    expect(container.textContent).toContain("P2");
  });

  it("calls onSelectPlayer when player 2 tab is clicked", async () => {
    const onSelectPlayer = mock((_idx: number) => {});
    const { container, click } = await renderIntoDom(
      <InventoryPlayerTabs
        p1={{ characterId: "valen", characterName: "Valen" }}
        p2={{ characterId: "aurelia", characterName: "Aurelia" }}
        isTwoPlayer={true}
        activePlayerIndex={0}
        onSelectPlayer={onSelectPlayer}
        p1Name="Valen"
        p2Name="Aurelia"
      />,
      { mode: "ui" }
    );

    const tabs = container.querySelectorAll<HTMLButtonElement>("[role='tab']");
    await act(async () => {
      await click(tabs[1]);
    });

    expect(onSelectPlayer).toHaveBeenCalledTimes(1);
    expect(onSelectPlayer).toHaveBeenCalledWith(1);
  });
});
