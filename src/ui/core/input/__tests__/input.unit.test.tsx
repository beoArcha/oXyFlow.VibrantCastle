import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, cleanupDom, renderIntoDom } from "@test-utils";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { SearchInput } from "../search-input";

describe("Input, Textarea & SearchInput Unit Tests (AAA)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  it("should render input with label and helper text", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Input
        id="hero-name"
        label="Hero Name"
        helperText="Enter your duelist name"
        defaultValue="Valen"
      />,
      { mode: "none" }
    );
    const label = container.querySelector("label");
    const input = container.querySelector("input");
    const helper = container.querySelector("#hero-name-helper");

    // Assert
    expect(label?.textContent).toBe("Hero Name");
    expect(input?.value).toBe("Valen");
    expect(helper?.textContent).toBe("Enter your duelist name");
  });

  it("should render error state with role='alert' and aria-invalid='true'", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Input
        id="bad-input"
        label="Password"
        error="Field cannot be blank"
      />,
      { mode: "none" }
    );
    const input = container.querySelector("input");
    const alert = container.querySelector("[role='alert']");

    // Assert
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(alert?.textContent).toBe("Field cannot be blank");
  });

  it("should render textarea with specified rows and handle disabled state", async () => {
    // Arrange & Act
    const { container } = await renderIntoDom(
      <Textarea
        id="lore-entry"
        label="Lore Notes"
        rows={6}
        disabled={true}
        defaultValue="Ancient gothic tapestry..."
      />,
      { mode: "none" }
    );
    const textarea = container.querySelector("textarea");

    // Assert
    expect(Number(textarea?.rows)).toBe(6);
    expect(textarea?.disabled).toBe(true);
    expect(textarea?.value).toBe("Ancient gothic tapestry...");
  });

  it("should render SearchInput and trigger onClear when clicking clear button", async () => {
    // Arrange
    const handleChange = mock((val: string) => {});
    const handleClear = mock(() => {});

    // Act
    const { container } = await renderIntoDom(
      <SearchInput
        value="gargoyle"
        onChange={handleChange}
        onClear={handleClear}
      />,
      { mode: "none" }
    );
    const clearBtn = container.querySelector("button[aria-label='Clear search']") as HTMLButtonElement;

    // Assert & Action
    expect(clearBtn).not.toBeNull();
    clearBtn.click();
    expect(handleChange).toHaveBeenCalledWith("");
    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});
