import { describe, it, expect, mock } from "bun:test";
import React from "react";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";
import { UiTestProviders, IntegrationTestProviders } from "@test-utils/testProviders";
import { LocationsTab, type LocationItemVM } from "../LocationsTab";

describe("LocationsTab", () => {
  const mockLocations: readonly LocationItemVM[] = [
    {
      id: "catacombs",
      nameKey: "locCatacombsName",
      descriptionKey: "locCatacombsDesc",
      width: 4800,
      height: 1200,
    },
    {
      id: "courtyard",
      nameKey: "locCourtyardName",
      descriptionKey: "locCourtyardDesc",
      width: 6400,
      height: 1400,
    },
  ];

  it("renders location items and identifies the active location", async () => {
    await cleanupDom();
    const onLoadLocation = mock();

    const { container, unmount } = await renderIntoDom(
      <UiTestProviders defaultLanguage="en">
        <LocationsTab
          locations={mockLocations}
          currentLocationId="catacombs"
          onLoadLocation={onLoadLocation}
        />
      </UiTestProviders>
    );

    expect(container.querySelector("#tab-content-locations")).not.toBeNull();

    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.length).toBe(2);

    // Active location button should be disabled
    expect(buttons[0].hasAttribute("disabled")).toBe(true);

    // Inactive location button should be enabled
    expect(buttons[1].hasAttribute("disabled")).toBe(false);

    await unmount();
  });

  it("calls onLoadLocation when clicking an inactive location", async () => {
    await cleanupDom();
    let loadedId: string | null = null;

    const { container, unmount } = await renderIntoDom(
      <UiTestProviders defaultLanguage="en">
        <LocationsTab
          locations={mockLocations}
          currentLocationId="catacombs"
          onLoadLocation={(id) => {
            loadedId = id;
          }}
        />
      </UiTestProviders>
    );

    const buttons = Array.from(container.querySelectorAll("button"));
    buttons[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(loadedId).toBe("courtyard");

    await unmount();
  });

  it("mounts with session defaults inside IntegrationTestProviders", async () => {
    await cleanupDom();

    const { container, unmount } = await renderIntoDom(
      <IntegrationTestProviders defaultLanguage="en">
        <LocationsTab />
      </IntegrationTestProviders>
    );

    expect(container.querySelector("#tab-content-locations")).not.toBeNull();
    await unmount();
  });
});
