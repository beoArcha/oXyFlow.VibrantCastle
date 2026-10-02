import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { act } from "react";
import { Swords } from "lucide-react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { PlayerId } from "@game/types";
import { gameInputs } from "@game/loop/input";
import { rebindKeyboardAction, resetKeyboardBindings } from "@components/adapters";
import { HelpControlsCard } from "../HelpControlsCard";

describe("HelpControlsCard Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
    resetKeyboardBindings(PlayerId.Player1);
    resetKeyboardBindings(PlayerId.Player2);
  });

  afterEach(async () => {
    await cleanupDom();
    resetKeyboardBindings(PlayerId.Player1);
    resetKeyboardBindings(PlayerId.Player2);
  });

  it("renders title, icon, flankBadge, and control rows for Player 1", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpControlsCard
          playerId={PlayerId.Player1}
          title="Player 1 Controls"
          icon={<Swords className="test-icon" size={14} />}
          flankBadge="Left Flank"
          theme="crimson"
        />
      </TestProviders>
    );

    expect(container.textContent).toContain("Player 1 Controls");
    expect(container.textContent).toContain("Left Flank");
    expect(container.querySelector(".test-icon")).not.toBeNull();

    // Default P1 controls in Polish locale (TestProviders default) include Spacja for jump
    expect(container.textContent).toContain("Spacja");

    await unmount();
  });

  it("applies crimson theme border and text classes when theme is crimson", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpControlsCard
          playerId={PlayerId.Player1}
          title="P1"
          icon={<Swords size={14} />}
          flankBadge="P1"
          theme="crimson"
        />
      </TestProviders>
    );

    const titleSpan = container.querySelector(".text-red-400");
    expect(titleSpan).not.toBeNull();

    await unmount();
  });

  it("applies cyan theme border and text classes when theme is cyan", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpControlsCard
          playerId={PlayerId.Player2}
          title="P2"
          icon={<Swords size={14} />}
          flankBadge="P2"
          theme="cyan"
        />
      </TestProviders>
    );

    const titleSpan = container.querySelector(".text-cyan-400");
    expect(titleSpan).not.toBeNull();

    await unmount();
  });

  it("reactively updates keys display when keyboard bindings are updated", async () => {
    const { container, unmount } = await renderIntoDom(
      <TestProviders>
        <HelpControlsCard
          playerId={PlayerId.Player1}
          title="P1"
          icon={<Swords size={14} />}
          flankBadge="P1"
          theme="crimson"
        />
      </TestProviders>
    );

    // Initial jump key
    expect(container.textContent).toContain("Spacja");

    // Rebind Jump to KeyZ via adapter inside act
    await act(async () => {
      rebindKeyboardAction(PlayerId.Player1, "jump", "KeyZ", "z");
    });

    expect(container.textContent).toContain("Z");

    await unmount();
  });
});
