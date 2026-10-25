import React, { createRef } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { Select, SelectOption } from "@ui";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";

describe("Select Component", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  const testOptions: SelectOption[] = [
    { value: "goblin", label: "Goblin Archer" },
    { value: "gargoyle", label: "Gargoyle Sentinel" },
    { value: "boss", label: "Ancient Dragon", disabled: true },
  ];

  it("renders options from options prop and selects current value", async () => {
    const { container } = await renderIntoDom(
      <Select
        data-testid="test-select"
        value="gargoyle"
        onChange={() => {}}
        options={testOptions}
      />
    );

    const select = container.querySelector("[data-testid='test-select']") as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe("gargoyle");

    const options = select.querySelectorAll("option");
    expect(options.length).toBe(3);
    expect(options[0].value).toBe("goblin");
    expect(options[0].textContent).toBe("Goblin Archer");
    expect(options[1].value).toBe("gargoyle");
    expect(options[1].textContent).toBe("Gargoyle Sentinel");
    expect(options[2].value).toBe("boss");
    expect(options[2].disabled).toBe(true);
  });

  it("renders placeholder when specified", async () => {
    const { container } = await renderIntoDom(
      <Select
        placeholder="Choose a monster..."
        value=""
        onChange={() => {}}
        options={testOptions}
      />
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select).not.toBeNull();
    const firstOption = select.querySelector("option");
    expect(firstOption?.value).toBe("");
    expect(firstOption?.disabled).toBe(true);
    expect(firstOption?.textContent).toBe("Choose a monster...");
  });

  it("renders children when options prop is omitted", async () => {
    const { container } = await renderIntoDom(
      <Select value="fire" onChange={() => {}}>
        <option value="fire">Fire Elemental</option>
        <option value="ice">Ice Golem</option>
      </Select>
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.querySelectorAll("option").length).toBe(2);
    expect(select.value).toBe("fire");
  });

  it("triggers onChange handler when value changes", async () => {
    const handleChange = mock((_e: React.ChangeEvent<HTMLSelectElement>) => {});
    const { container, changeSelect } = await renderIntoDom(
      <Select
        value="goblin"
        onChange={handleChange}
        options={testOptions}
      />
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    await changeSelect(select, "gargoyle");

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("handles disabled state properly", async () => {
    const { container } = await renderIntoDom(
      <Select
        disabled
        value="goblin"
        onChange={() => {}}
        options={testOptions}
      />
    );

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(select.className).toContain("opacity-50");
    expect(select.className).toContain("pointer-events-none");
  });

  it("renders label and associates it with the select", async () => {
    const { container } = await renderIntoDom(
      <Select
        id="enemy-select"
        label="Enemy Target"
        value="goblin"
        onChange={() => {}}
        options={testOptions}
      />
    );

    const label = container.querySelector("label");
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe("Enemy Target");
    expect(label?.getAttribute("for")).toBe("enemy-select");

    const select = container.querySelector("select");
    expect(select?.id).toBe("enemy-select");
  });

  it("renders error state with role='alert' and aria-invalid", async () => {
    const { container } = await renderIntoDom(
      <Select
        id="validated-select"
        label="Target"
        error="Selection is required"
        value=""
        onChange={() => {}}
        options={testOptions}
      />
    );

    const select = container.querySelector("select");
    expect(select?.getAttribute("aria-invalid")).toBe("true");

    const alert = container.querySelector("[role='alert']");
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toBe("Selection is required");
    expect(select?.getAttribute("aria-describedby")).toBe("validated-select-error");
  });

  it("renders helperText when error is not present", async () => {
    const { container } = await renderIntoDom(
      <Select
        id="helper-select"
        label="Target"
        helperText="Select the enemy to spawn near player"
        value="goblin"
        onChange={() => {}}
        options={testOptions}
      />
    );

    expect(container.textContent).toContain("Select the enemy to spawn near player");
    const select = container.querySelector("select");
    expect(select?.getAttribute("aria-describedby")).toBe("helper-select-helper");
  });

  it("renders leftIcon adornment", async () => {
    const { container } = await renderIntoDom(
      <Select
        leftIcon={<span data-testid="custom-icon">⚔️</span>}
        value="goblin"
        onChange={() => {}}
        options={testOptions}
      />
    );

    expect(container.querySelector("[data-testid='custom-icon']")).not.toBeNull();
  });

  it("supports size and variant styling presets", async () => {
    const { container: smCastle } = await renderIntoDom(
      <Select
        size="sm"
        variant="castle"
        value="goblin"
        onChange={() => {}}
        options={testOptions}
      />
    );

    const smSelect = smCastle.querySelector("select");
    expect(smSelect?.className).toContain("text-xs");
    expect(smSelect?.className).toContain("bg-surface-darker");

    const { container: lgDefault } = await renderIntoDom(
      <Select
        size="lg"
        variant="default"
        value="goblin"
        onChange={() => {}}
        options={testOptions}
      />
    );

    const lgSelect = lgDefault.querySelector("select");
    expect(lgSelect?.className).toContain("text-base");
    expect(lgSelect?.className).toContain("bg-surface-darkest/90");
  });

  it("forwards ref to the underlying HTMLSelectElement", async () => {
    const selectRef = createRef<HTMLSelectElement>();
    await renderIntoDom(
      <Select
        ref={selectRef}
        value="goblin"
        onChange={() => {}}
        options={testOptions}
      />
    );

    expect(selectRef.current).not.toBeNull();
    expect(selectRef.current?.tagName.toLowerCase()).toBe("select");
    expect(selectRef.current?.value).toBe("goblin");
  });
});
