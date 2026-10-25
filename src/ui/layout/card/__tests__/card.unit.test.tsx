import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Card } from "../card";

describe("Card Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render card root with default data-slot when mounted", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Card>
        <Card.Header>
          <Card.Title>Armor Plate</Card.Title>
          <Card.Description>Heavy defensive gear</Card.Description>
        </Card.Header>
        <Card.Content>Item Stats</Card.Content>
        <Card.Footer>Equipped</Card.Footer>
      </Card>,
      { mode: "none" }
    );
    const card = container.querySelector("[data-slot='card']");
    const header = container.querySelector("[data-slot='card-header']");
    const title = container.querySelector("[data-slot='card-title']");
    const description = container.querySelector("[data-slot='card-description']");
    const content = container.querySelector("[data-slot='card-content']");
    const footer = container.querySelector("[data-slot='card-footer']");

    // Assert
    expect(card).not.toBeNull();
    expect(header).not.toBeNull();
    expect(title?.textContent).toBe("Armor Plate");
    expect(description?.textContent).toBe("Heavy defensive gear");
    expect(content?.textContent).toBe("Item Stats");
    expect(footer?.textContent).toBe("Equipped");
  });

  it("should apply interactive hover classes when interactive prop is true", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Card interactive variant="highlight">
        <span>Clickable Card</span>
      </Card>,
      { mode: "none" }
    );
    const card = container.querySelector("[data-slot='card']");

    // Assert
    expect(card?.className).toContain("cursor-pointer");
    expect(card?.className).toContain("hover:border-border-accent");
  });
});
