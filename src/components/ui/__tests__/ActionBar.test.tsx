import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { ActionBar } from "../ActionBar";
import { Button } from "../Button";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils";

describe("ActionBar Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("renders description and actions cleanly", async () => {
    const { container } = await renderIntoDom(
      <ActionBar
        description="Select items to proceed"
        actions={<Button size="sm">Proceed</Button>}
      />
    );

    expect(container.textContent).toContain("Select items to proceed");
    expect(container.textContent).toContain("Proceed");
    expect(container.querySelector("[role='toolbar']")).not.toBeNull();
  });

  it("supports custom children composition", async () => {
    const { container } = await renderIntoDom(
      <ActionBar variant="banner">
        <span>Custom Bar Content</span>
      </ActionBar>
    );

    expect(container.textContent).toContain("Custom Bar Content");
    expect(container.querySelector(".bg-amber-950\\/30")).not.toBeNull();
  });
});
