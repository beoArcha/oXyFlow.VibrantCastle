import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import React, { useState } from "react";
import { CompactNumberStepper } from "../index";
import { renderIntoDom, cleanupDom, setupDomEnvironment } from "@test-utils";

describe("CompactNumberStepper Component", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("increments and decrements by step while clamping to min and max", async () => {
    const TestComponent = () => {
      const [val, setVal] = useState<number>(5);
      return (
        <CompactNumberStepper
          label="Test Stepper"
          value={val}
          onChange={setVal}
          min={0}
          max={10}
          step={2}
          unit="px"
        />
      );
    };

    const { container, click } = await renderIntoDom(<TestComponent />);

    const buttons = container.querySelectorAll("button");
    const decBtn = buttons[0];
    const incBtn = buttons[1];
    const input = container.querySelector("input");

    expect(input?.value).toBe("5");
    expect(container.textContent).toContain("Test Stepper");
    expect(container.textContent).toContain("px");

    // Increment: 5 + 2 = 7
    await click(incBtn);
    expect(input?.value).toBe("7");

    // Increment: 7 + 2 = 9
    await click(incBtn);
    expect(input?.value).toBe("9");

    // Increment: 9 + 2 = 11 -> clamped to max 10
    await click(incBtn);
    expect(input?.value).toBe("10");
    expect(incBtn.hasAttribute("disabled")).toBe(true);

    // Decrement: 10 - 2 = 8
    await click(decBtn);
    expect(input?.value).toBe("8");
  });

  it("disables both controls when disabled prop is set", async () => {
    const { container } = await renderIntoDom(
      <CompactNumberStepper
        value={16}
        onChange={() => {}}
        min={0}
        max={100}
        disabled={true}
      />
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons[0].hasAttribute("disabled")).toBe(true);
    expect(buttons[1].hasAttribute("disabled")).toBe(true);
    const input = container.querySelector("input");
    expect(input?.hasAttribute("disabled")).toBe(true);
  });
});
