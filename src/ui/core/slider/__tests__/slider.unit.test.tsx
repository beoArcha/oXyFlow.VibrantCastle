import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Slider } from "../slider";

describe("Slider Primitive Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render slider input with label, formatted value, and range attributes", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Slider
        id="bgm-volume"
        label="Citadel Ambience"
        value={75}
        onChange={() => {}}
        unit="%"
      />,
      { mode: "none" }
    );
    const input = container.querySelector("input[type='range']") as HTMLInputElement;
    const label = container.querySelector("label");
    const readout = container.querySelector("span.font-mono");

    // Assert
    expect(input).not.toBeNull();
    expect(input.value).toBe("75");
    expect(label?.textContent).toBe("Citadel Ambience");
    expect(readout?.textContent).toBe("75%");
  });

  it("should trigger onChange when value is adjusted", async () => {
    // Arrange
    const handleChange = mock((val: number) => {});
    const { container, changeInput } = await renderIntoDom(
      <Slider label="Master Volume" value={50} onChange={handleChange} />,
      { mode: "none" }
    );
    const input = container.querySelector("input[type='range']") as HTMLInputElement;

    // Act
    await changeInput(input, "80");

    // Assert
    expect(handleChange).toHaveBeenCalledWith(80);
  });

  it("should forward ref and handle disabled state", async () => {
    // Arrange
    const inputRef = React.createRef<HTMLInputElement>();

    // Act
    await renderIntoDom(
      <Slider ref={inputRef} label="Muted Channel" value={0} disabled={true} onChange={() => {}} />,
      { mode: "none" }
    );

    // Assert
    expect(inputRef.current).not.toBeNull();
    expect(inputRef.current?.disabled).toBe(true);
  });
});
