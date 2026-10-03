import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { GameModalHost } from "../GameModalHost";

describe("GameModalHost Component", () => {
  let unmount: (() => Promise<void>) | null = null;

  beforeEach(() => {
    unmount = null;
  });

  afterEach(async () => {
    if (unmount) {
      await unmount();
      unmount = null;
    }
    cleanupDom();
  });

  const baseModalManager = {
    isHelpOpen: false,
    isMenuOpen: false,
    isInventoryOpen: false,
    isSkillTreeOpen: false,
    isCreationOpen: false,
  };


  it("renders null when no modal is active", async () => {
    const rendered = await renderIntoDom(
      <GameModalHost
        modalManager={baseModalManager}
        onClose={mock()}
        onNavigateModal={mock()}
        onResume={mock()}
      />
    );
    unmount = rendered.unmount;

    expect(rendered.container.childNodes.length).toBe(0);
    expect(document.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders HelpModal when isHelpOpen is true and passes callbacks", async () => {
    const handleClose = mock();
    const handleNavigate = mock();
    const handleResume = mock();

    const rendered = await renderIntoDom(
      <GameModalHost
        modalManager={{ ...baseModalManager, isHelpOpen: true }}
        onClose={handleClose}
        onNavigateModal={handleNavigate}
        onResume={handleResume}
      />
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
    // Modal header close button with X icon should be present
    const closeBtn = document.querySelector(".lucide-x")?.closest("button");
    expect(closeBtn).not.toBeNull();
    await rendered.click(closeBtn!);
    expect(handleClose).toHaveBeenCalled();
  });

  it("renders MenuModal when isMenuOpen is true", async () => {
    const handleRebind = mock();
    const rendered = await renderIntoDom(
      <GameModalHost
        modalManager={{ ...baseModalManager, isMenuOpen: true }}
        onClose={mock()}
        onNavigateModal={mock()}
        onResume={mock()}
        onStartRebind={handleRebind}
      />
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
  });

  it("renders InventoryPanel when isInventoryOpen is true", async () => {
    const rendered = await renderIntoDom(
      <GameModalHost
        modalManager={{ ...baseModalManager, isInventoryOpen: true }}
        onClose={mock()}
        onNavigateModal={mock()}
        onResume={mock()}
      />
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
  });

  it("renders SkillTreePanel when isSkillTreeOpen is true", async () => {
    const rendered = await renderIntoDom(
      <GameModalHost
        modalManager={{ ...baseModalManager, isSkillTreeOpen: true }}
        onClose={mock()}
        onNavigateModal={mock()}
        onResume={mock()}
      />
    );
    unmount = rendered.unmount;

    // SkillTreePanel will render either dialog or null depending on activePlayer
    // In TestProviders activePlayer exists so dialog is rendered
    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
  });

  it("renders DeveloperModal when isCreationOpen is true", async () => {
    const rendered = await renderIntoDom(
      <GameModalHost
        modalManager={{ ...baseModalManager, isCreationOpen: true }}
        onClose={mock()}
        onNavigateModal={mock()}
        onResume={mock()}
      />
    );
    unmount = rendered.unmount;

    const dialog = document.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
  });
});
