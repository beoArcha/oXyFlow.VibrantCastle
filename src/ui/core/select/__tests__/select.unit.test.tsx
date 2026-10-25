import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Select } from "../select";

describe("Select Primitive Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const testOptions = [
    { value: "dusk", label: "Dusk Citadel" },
    { value: "dawn", label: "Dawn Spire" },
    { value: "abyss", label: "Abyssal Crypt", disabled: true },
  ];

  it("should render native select with options and select current value", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Select
        id="location-select"
        label="Citadel Location"
        value="dawn"
        onChange={() => {}}
        options={testOptions}
      />,
      { mode: "none" }
    );
    const select = container.querySelector("select") as HTMLSelectElement;

    // Assert
    expect(select).not.toBeNull();
    expect(select.value).toBe("dawn");
    expect(select.options.length).toBe(3);
    expect(select.options[1].textContent).toBe("Dawn Spire");
    expect(select.options[2].disabled).toBe(true);
  });

  it("should render error message with role='alert' when error prop is present", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Select
        id="error-select"
        label="Required Choice"
        error="You must choose a destination"
        value=""
        onChange={() => {}}
        options={testOptions}
      />,
      { mode: "none" }
    );
    const alert = container.querySelector("[role='alert']");

    // Assert
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toBe("You must choose a destination");
  });

  it("should forward ref and handle disabled state", async () => {
    // Arrange
    const selectRef = React.createRef<HTMLSelectElement>();

    // Act
    await renderIntoDom(
      <Select
        ref={selectRef}
        disabled={true}
        value="dusk"
        onChange={() => {}}
        options={testOptions}
      />,
      { mode: "none" }
    );

    // Assert
    expect(selectRef.current).not.toBeNull();
    expect(selectRef.current?.disabled).toBe(true);
  });
});
