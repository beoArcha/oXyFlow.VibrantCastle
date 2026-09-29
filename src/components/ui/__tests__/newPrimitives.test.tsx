import React, { createRef, act } from "react";
import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import {
  Input,
  Switch,
  Tooltip,
  ConfirmDialog,
} from "@ui";
import { renderIntoDom, cleanupDom } from "@test-utils/domTestUtils";

describe("New UI Primitives (Input, Switch, Tooltip, ConfirmDialog)", () => {
  beforeEach(async () => {
    await cleanupDom();
  });

  afterEach(async () => {
    await cleanupDom();
  });

  // ==========================================
  // Input
  // ==========================================
  describe("Input Component", () => {
    it("renders text input and handles value changes", async () => {
      const handleChange = mock((_e: React.ChangeEvent<HTMLInputElement>) => {});
      const { container, changeInput } = await renderIntoDom(
        <Input placeholder="Enter hero name..." onChange={handleChange} defaultValue="Valen" />
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.placeholder).toBe("Enter hero name...");
      expect(input.value).toBe("Valen");

      await changeInput(input, "Aurelia");

      expect(handleChange).toHaveBeenCalled();
    });

    it("renders label linked via htmlFor to input id", async () => {
      const { container } = await renderIntoDom(
        <Input label="Hero Name" id="hero-name-input" />
      );

      const label = container.querySelector("label");
      const input = container.querySelector("input");
      expect(label).not.toBeNull();
      expect(label?.textContent).toBe("Hero Name");
      expect(label?.getAttribute("for")).toBe("hero-name-input");
      expect(input?.id).toBe("hero-name-input");
    });

    it("renders error message with role='alert' and sets aria-invalid", async () => {
      const { container } = await renderIntoDom(
        <Input id="error-input" error="Name is required" helperText="Will be hidden by error" />
      );

      const input = container.querySelector("input");
      expect(input?.getAttribute("aria-invalid")).toBe("true");

      const errorText = container.querySelector("[role='alert']");
      expect(errorText).not.toBeNull();
      expect(errorText?.textContent).toBe("Name is required");
      expect(input?.getAttribute("aria-describedby")).toBe("error-input-error");
      expect(container.textContent).not.toContain("Will be hidden by error");
    });

    it("renders helperText when no error is present", async () => {
      const { container } = await renderIntoDom(
        <Input id="helper-input" helperText="Max 24 characters" />
      );

      const input = container.querySelector("input");
      expect(input?.getAttribute("aria-invalid")).toBe("false");
      expect(container.textContent).toContain("Max 24 characters");
      expect(input?.getAttribute("aria-describedby")).toBe("helper-input-helper");
    });

    it("renders leftIcon and rightIcon slots", async () => {
      const { container } = await renderIntoDom(
        <Input
          leftIcon={<span data-testid="left-search">🔍</span>}
          rightIcon={<span data-testid="right-clear">✖</span>}
        />
      );

      expect(container.querySelector("[data-testid='left-search']")).not.toBeNull();
      expect(container.querySelector("[data-testid='right-clear']")).not.toBeNull();
    });

    it("disables input and applies disabled styling", async () => {
      const { container } = await renderIntoDom(<Input disabled value="Locked" />);
      const input = container.querySelector("input");
      expect(input?.disabled).toBe(true);
      expect(input?.className).toContain("cursor-not-allowed");
      expect(input?.className).toContain("opacity-50");
    });

    it("forwards ref to the underlying HTMLInputElement", async () => {
      const inputRef = createRef<HTMLInputElement>();
      await renderIntoDom(<Input ref={inputRef} />);
      expect(inputRef.current).not.toBeNull();
      expect(inputRef.current?.tagName).toBe("INPUT");
    });
  });

  // ==========================================
  // Switch
  // ==========================================
  describe("Switch Component", () => {
    it("renders switch button with WAI-ARIA role and aria-checked attribute", async () => {
      const { container } = await renderIntoDom(<Switch checked={true} />);
      const switchBtn = container.querySelector("[role='switch']");
      expect(switchBtn).not.toBeNull();
      expect(switchBtn?.getAttribute("aria-checked")).toBe("true");

      await cleanupDom();
      const { container: offContainer } = await renderIntoDom(<Switch checked={false} />);
      const offSwitch = offContainer.querySelector("[role='switch']");
      expect(offSwitch?.getAttribute("aria-checked")).toBe("false");
    });

    it("invokes onCheckedChange when clicked", async () => {
      const handleChange = mock((_checked: boolean) => {});
      const { container, click } = await renderIntoDom(
        <Switch checked={false} onCheckedChange={handleChange} />
      );

      const switchBtn = container.querySelector("[role='switch']") as HTMLElement;
      await click(switchBtn);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("supports clicking on associated label to toggle switch", async () => {
      const handleChange = mock((_checked: boolean) => {});
      const { container, click } = await renderIntoDom(
        <Switch
          id="sound-toggle"
          checked={true}
          onCheckedChange={handleChange}
          label="Sound Effects"
          description="Enable environmental audio"
        />
      );

      expect(container.textContent).toContain("Sound Effects");
      expect(container.textContent).toContain("Enable environmental audio");

      const label = container.querySelector("label") as HTMLElement;
      await click(label);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it("prevents interactions when disabled", async () => {
      const handleChange = mock((_checked: boolean) => {});
      const { container, click } = await renderIntoDom(
        <Switch checked={false} onCheckedChange={handleChange} disabled={true} />
      );

      const switchBtn = container.querySelector("[role='switch']") as HTMLButtonElement;
      expect(switchBtn.disabled).toBe(true);

      await click(switchBtn);
      expect(handleChange).toHaveBeenCalledTimes(0);
    });

    it("supports different sizes (sm, md, lg)", async () => {
      for (const size of ["sm", "md", "lg"] as const) {
        await cleanupDom();
        const { container } = await renderIntoDom(<Switch checked={true} size={size} />);
        const switchBtn = container.querySelector("[role='switch']");
        expect(switchBtn).not.toBeNull();
      }
    });

    it("forwards ref to the button element", async () => {
      const switchRef = createRef<HTMLButtonElement>();
      await renderIntoDom(<Switch ref={switchRef} checked={false} />);
      expect(switchRef.current).not.toBeNull();
      expect(switchRef.current?.getAttribute("role")).toBe("switch");
    });
  });

  // ==========================================
  // Tooltip
  // ==========================================
  describe("Tooltip Component", () => {
    it("does not render tooltip content initially", async () => {
      const { container } = await renderIntoDom(
        <Tooltip content="Attack power: +15">
          <button>Hover me</button>
        </Tooltip>
      );

      expect(container.querySelector("[role='tooltip']")).toBeNull();
    });

    it("shows tooltip on mouse enter and hides on mouse leave with delayDuration=0", async () => {
      const { container } = await renderIntoDom(
        <Tooltip content="Attack power: +15" delayDuration={0}>
          <button id="trigger-btn">Hover me</button>
        </Tooltip>
      );

      const button = container.querySelector("#trigger-btn") as HTMLElement;

      // Mouse enter via mouseover (React event delegation)
      await act(async () => {
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      });

      const tooltip = container.querySelector("[role='tooltip']");
      expect(tooltip).not.toBeNull();
      expect(tooltip?.textContent).toBe("Attack power: +15");

      // Mouse leave via mouseout
      await act(async () => {
        button.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
      });

      expect(container.querySelector("[role='tooltip']")).toBeNull();
    });

    it("shows tooltip on keyboard focus and hides on blur with delayDuration=0", async () => {
      const { container } = await renderIntoDom(
        <Tooltip content="Press [E] to interact" delayDuration={0}>
          <button id="focus-btn">Focus me</button>
        </Tooltip>
      );

      const button = container.querySelector("#focus-btn") as HTMLButtonElement;

      // Focus
      await act(async () => {
        button.focus();
        button.dispatchEvent(new Event("focus", { bubbles: true }));
      });

      const tooltip = container.querySelector("[role='tooltip']");
      expect(tooltip).not.toBeNull();
      expect(tooltip?.textContent).toBe("Press [E] to interact");
      expect(button.getAttribute("aria-describedby")).toBe(tooltip?.id);

      // Blur
      await act(async () => {
        button.blur();
        button.dispatchEvent(new Event("blur", { bubbles: true }));
      });

      expect(container.querySelector("[role='tooltip']")).toBeNull();
    });

    it("respects disabled prop and does not show tooltip", async () => {
      const { container } = await renderIntoDom(
        <Tooltip content="Hidden tip" disabled={true} delayDuration={0}>
          <button id="disabled-btn">Disabled</button>
        </Tooltip>
      );

      const button = container.querySelector("#disabled-btn") as HTMLElement;
      await act(async () => {
        button.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      });

      expect(container.querySelector("[role='tooltip']")).toBeNull();
    });
  });

  // ==========================================
  // ConfirmDialog
  // ==========================================
  describe("ConfirmDialog Component", () => {
    it("renders nothing when isOpen is false", async () => {
      const { container } = await renderIntoDom(
        <ConfirmDialog
          isOpen={false}
          title="Reset Character?"
          message="Are you sure you want to reset?"
          onConfirm={() => {}}
          onClose={() => {}}
          usePortal={false}
        />
      );

      expect(container.textContent).toBe("");
    });

    it("renders title, message, and action buttons when isOpen is true", async () => {
      const handleClose = mock(() => {});
      const handleConfirm = mock(() => {});

      const { container, click } = await renderIntoDom(
        <ConfirmDialog
          isOpen={true}
          title="Delete Save Slot"
          message="This action is irreversible and will delete your save."
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep"
          confirmVariant="danger"
          onClose={handleClose}
          onConfirm={handleConfirm}
          usePortal={false}
        />
      );

      expect(container.textContent).toContain("Delete Save Slot");
      expect(container.textContent).toContain("This action is irreversible and will delete your save.");
      expect(container.textContent).toContain("Yes, Delete");
      expect(container.textContent).toContain("No, Keep");

      // Click cancel
      const cancelBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("No, Keep")
      );
      expect(cancelBtn).toBeDefined();
      await click(cancelBtn!);
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Click confirm
      const confirmBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Yes, Delete")
      );
      expect(confirmBtn).toBeDefined();
      await click(confirmBtn!);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it("disables cancel button and sets loading state on confirm button during isLoading", async () => {
      const { container } = await renderIntoDom(
        <ConfirmDialog
          isOpen={true}
          title="Processing Action"
          message="Please wait while saving..."
          isLoading={true}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onClose={() => {}}
          onConfirm={() => {}}
          usePortal={false}
        />
      );

      const cancelBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Cancel")
      ) as HTMLButtonElement;
      expect(cancelBtn.disabled).toBe(true);

      const confirmBtn = Array.from(container.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Confirm")
      ) as HTMLButtonElement;
      expect(confirmBtn.disabled).toBe(true); // Button.tsx disables when isLoading
    });
  });
});
