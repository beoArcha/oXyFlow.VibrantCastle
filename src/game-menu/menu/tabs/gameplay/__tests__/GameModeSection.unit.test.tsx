import React, { act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { GameModeSection } from "../GameModeSection";

describe("GameModeSection", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders 1P and 2P options with default Valen character selected", async () => {
    const onSelectMode = mock((_mode: boolean) => {});
    const onSelectCharacter = mock((_char: "valen" | "aurelia") => {});

    const { container } = await renderIntoDom(
      <GameModeSection
        isTwoPlayer={false}
        onSelectMode={onSelectMode}
        primaryCharacter="valen"
        onSelectCharacter={onSelectCharacter}
      />,
      { mode: "ui" }
    );

    const valenCard = container.querySelector("#character-select-valen");
    const aureliaCard = container.querySelector("#character-select-aurelia");

    expect(valenCard).not.toBeNull();
    expect(aureliaCard).not.toBeNull();
    expect(valenCard?.getAttribute("aria-pressed")).toBe("true");
    expect(aureliaCard?.getAttribute("aria-pressed")).toBe("false");
  });

  it("calls onSelectCharacter when Aurelia card is clicked", async () => {
    const onSelectMode = mock((_mode: boolean) => {});
    const onSelectCharacter = mock((_char: "valen" | "aurelia") => {});

    const { container, click } = await renderIntoDom(
      <GameModeSection
        isTwoPlayer={false}
        onSelectMode={onSelectMode}
        primaryCharacter="valen"
        onSelectCharacter={onSelectCharacter}
      />,
      { mode: "ui" }
    );

    const aureliaCard = container.querySelector("#character-select-aurelia") as HTMLElement;
    expect(aureliaCard).not.toBeNull();

    await act(async () => {
      await click(aureliaCard);
    });

    expect(onSelectCharacter).toHaveBeenCalledTimes(1);
    expect(onSelectCharacter).toHaveBeenCalledWith("aurelia");
  });

  it("calls onSelectCharacter when Valen card is clicked while Aurelia is active", async () => {
    const onSelectMode = mock((_mode: boolean) => {});
    const onSelectCharacter = mock((_char: "valen" | "aurelia") => {});

    const { container, click } = await renderIntoDom(
      <GameModeSection
        isTwoPlayer={true}
        onSelectMode={onSelectMode}
        primaryCharacter="aurelia"
        onSelectCharacter={onSelectCharacter}
      />,
      { mode: "ui" }
    );

    const valenCard = container.querySelector("#character-select-valen") as HTMLElement;
    const aureliaCard = container.querySelector("#character-select-aurelia");

    expect(valenCard?.getAttribute("aria-pressed")).toBe("false");
    expect(aureliaCard?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => {
      await click(valenCard);
    });

    expect(onSelectCharacter).toHaveBeenCalledTimes(1);
    expect(onSelectCharacter).toHaveBeenCalledWith("valen");
  });

  it("calls onSelectMode when mode card is clicked", async () => {
    const onSelectMode = mock((_mode: boolean) => {});
    const onSelectCharacter = mock((_char: "valen" | "aurelia") => {});

    const { container, click } = await renderIntoDom(
      <GameModeSection
        isTwoPlayer={false}
        onSelectMode={onSelectMode}
        primaryCharacter="valen"
        onSelectCharacter={onSelectCharacter}
      />,
      { mode: "ui" }
    );

    const p2ModeCard = container.querySelector("#gamemode-select-2p") as HTMLElement;
    expect(p2ModeCard).not.toBeNull();

    await act(async () => {
      await click(p2ModeCard);
    });

    expect(onSelectMode).toHaveBeenCalledTimes(1);
    expect(onSelectMode).toHaveBeenCalledWith(true);
  });
});
