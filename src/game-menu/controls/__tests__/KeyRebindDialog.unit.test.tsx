import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom, TestProviders } from "@test-utils";
import { PlayerId } from "@game/types";
import { KeyRebindDialog } from "../KeyRebindDialog";

describe("KeyRebindDialog i18n", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders the Polish rebind title and prompt from i18n", async () => {
    const { unmount } = await renderIntoDom(
      <TestProviders>
        <KeyRebindDialog
          target={{ action: "jump", player: PlayerId.Player1, label: "Skok" }}
          onCancel={() => {}}
        />
      </TestProviders>
    );

    const text = document.body.textContent ?? "";
    expect(text).toContain("USTAWIANIE KLAWISZA");
    expect(text).toContain("Naciśnij dowolny klawisz na klawiaturze, aby go przypisać...");
    expect(text).toContain("Anuluj");
    expect(text).not.toContain("Press any key");

    await unmount();
  });
});
