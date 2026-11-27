import { describe, it, expect, afterEach } from "bun:test";
import { renderIntoDom, type RenderIntoDomResult } from "@test-utils/dom/renderComponent";
import { DataStudioSubtab } from "@developer/subtabs/datastudio/DataStudioSubtab";
import { LevelsSubtab } from "@developer/subtabs/levels/LevelsSubtab";
import React from "react";
import { IntegrationTestProviders } from "@test-utils/testProviders";

const EnglishIntegrationProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <IntegrationTestProviders defaultLanguage="en">{children}</IntegrationTestProviders>
);

const UNFILLED_PLACEHOLDER = /<[a-ząćęłńóśźż]+>/;

let handle: RenderIntoDomResult | null = null;

afterEach(async () => {
  if (handle) {
    await handle.unmount();
    handle = null;
  }
});

function findButtonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (el) => el.textContent?.trim() === text
  );
  if (!button) {
    throw new Error(`Button not found: ${text}`);
  }
  return button as HTMLButtonElement;
}

describe("DataStudio hero labels (VC-072)", () => {
  it("shows hero display names instead of raw ids in the VN portraits section", async () => {
    handle = await renderIntoDom(<DataStudioSubtab />, { wrapper: EnglishIntegrationProviders });
    await handle.click(findButtonByText(handle.container, "Dialogi VN & Portrety"));

    const text = handle.container.textContent ?? "";
    expect(text).toContain("Valen");
    expect(text).toContain("Aurelia");
    expect(findButtonByText(handle.container, "Valen")).toBeDefined();
    expect(findButtonByText(handle.container, "Aurelia")).toBeDefined();
    expect(Array.from(handle.container.querySelectorAll("button")).some((b) => b.textContent === "valen")).toBe(false);
    expect(text).not.toMatch(UNFILLED_PLACEHOLDER);
  });

  it("shows hero display names in the DAG section", async () => {
    handle = await renderIntoDom(<DataStudioSubtab />, { wrapper: EnglishIntegrationProviders });
    await handle.click(findButtonByText(handle.container, "Drzewko DAG"));

    const text = handle.container.textContent ?? "";
    expect(text).toContain("Valen");
    expect(text).toContain("Aurelia");
    expect(text).not.toMatch(UNFILLED_PLACEHOLDER);
  });
});

describe("Levels layer library labels (VC-072)", () => {
  it("renders the layer library filters without unfilled template placeholders", async () => {
    handle = await renderIntoDom(<LevelsSubtab />, { wrapper: EnglishIntegrationProviders });
    await handle.click(findButtonByText(handle.container, "Hybrid Parallax Library"));

    const text = handle.container.textContent ?? "";
    expect(text).toContain("Worlds (8)");
    expect(text).toContain("Shared (23)");
    expect(text).toContain("Bosses (2)");
    expect(text).not.toMatch(UNFILLED_PLACEHOLDER);
  });

  it("renders the teleport button with the resolved world code", async () => {
    handle = await renderIntoDom(<LevelsSubtab />, { wrapper: EnglishIntegrationProviders });

    const text = handle.container.textContent ?? "";
    expect(text).toMatch(/Teleport Player: W\d+/);
    expect(text).not.toMatch(UNFILLED_PLACEHOLDER);
  });
});
