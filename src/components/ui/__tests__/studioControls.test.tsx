import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React from "react";
import { setupDomEnvironment, renderIntoDom } from "@test-utils/domTestUtils";
import { FileUploadButton, SegmentedControl, ColorPickerInput } from "../index";

describe("Studio UI Controls (Design System)", () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(() => {
    if (document.body) {
      document.body.innerHTML = "";
    }
  });

  describe("FileUploadButton", () => {
    it("renders label and hidden file input with accepted types", async () => {
      const { container, unmount } = await renderIntoDom(
        <FileUploadButton
          label="Upload Texture"
          accept="image/png,image/jpeg"
        />
      );

      const button = container.querySelector("button");
      expect(button).not.toBeNull();
      expect(button?.textContent).toContain("Upload Texture");

      const fileInput = container.querySelector<HTMLInputElement>("input[type='file']");
      expect(fileInput).not.toBeNull();
      expect(fileInput?.accept).toBe("image/png,image/jpeg");
      expect(fileInput?.className).toContain("hidden");

      await unmount();
    });

    it("triggers input click when button is clicked", async () => {
      const { container, unmount } = await renderIntoDom(
        <FileUploadButton label="Upload JSON" />
      );

      const fileInput = container.querySelector<HTMLInputElement>("input[type='file']");
      expect(fileInput).not.toBeNull();

      let clickTriggered = false;
      if (fileInput) {
        fileInput.click = () => {
          clickTriggered = true;
        };
      }

      const button = container.querySelector("button");
      button?.click();

      expect(clickTriggered).toBe(true);

      await unmount();
    });

    it("calls onFileSelect and onChange when a file is selected", async () => {
      const onFileSelect = mock((_file: File) => {});
      const onChange = mock((_e: React.ChangeEvent<HTMLInputElement>) => {});

      const { container, unmount } = await renderIntoDom(
        <FileUploadButton
          label="Select File"
          onFileSelect={onFileSelect}
          onChange={onChange}
        />
      );

      const fileInput = container.querySelector<HTMLInputElement>("input[type='file']");
      expect(fileInput).not.toBeNull();

      if (fileInput) {
        const dummyFile = new File(["test data"], "atlas.png", { type: "image/png" });
        Object.defineProperty(fileInput, "files", {
          value: [dummyFile],
          writable: true,
        });

        const changeEvent = new Event("change", { bubbles: true });
        fileInput.dispatchEvent(changeEvent);

        expect(onChange).toHaveBeenCalled();
        expect(onFileSelect).toHaveBeenCalled();
        expect(onFileSelect.mock.calls[0]?.[0]?.name).toBe("atlas.png");
      }

      await unmount();
    });

    it("does not trigger click or input when disabled", async () => {
      const { container, unmount } = await renderIntoDom(
        <FileUploadButton label="Disabled Upload" disabled />
      );

      const button = container.querySelector("button");
      expect(button?.hasAttribute("disabled")).toBe(true);

      const fileInput = container.querySelector<HTMLInputElement>("input[type='file']");
      expect(fileInput?.hasAttribute("disabled")).toBe(true);

      let clickTriggered = false;
      if (fileInput) {
        fileInput.click = () => {
          clickTriggered = true;
        };
      }

      button?.click();
      expect(clickTriggered).toBe(false);

      await unmount();
    });
  });

  describe("SegmentedControl", () => {
    const options = [
      { value: "by_count", label: "By Count" },
      { value: "by_cell_size", label: "By Cell Size" },
      { value: "auto_islands", label: "Auto Islands" },
    ];

    it("renders options with ARIA radiogroup semantics and highlights selected option", async () => {
      const onChange = mock((_val: string) => {});

      const { container, unmount } = await renderIntoDom(
        <SegmentedControl
          options={options}
          value="by_count"
          onChange={onChange}
        />
      );

      const radiogroup = container.querySelector("[role='radiogroup']");
      expect(radiogroup).not.toBeNull();

      const radios = container.querySelectorAll<HTMLButtonElement>("[role='radio']");
      expect(radios.length).toBe(3);

      expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
      expect(radios[1]?.getAttribute("aria-checked")).toBe("false");
      expect(radios[2]?.getAttribute("aria-checked")).toBe("false");

      await unmount();
    });

    it("calls onChange when an unselected option is clicked", async () => {
      const onChange = mock((_val: string) => {});

      const { container, unmount } = await renderIntoDom(
        <SegmentedControl
          options={options}
          value="by_count"
          onChange={onChange}
        />
      );

      const radios = container.querySelectorAll<HTMLButtonElement>("[role='radio']");
      radios[1]?.click();

      expect(onChange).toHaveBeenCalledWith("by_cell_size");

      await unmount();
    });

    it("supports numeric values", async () => {
      const numOptions = [
        { value: 1, label: "1x" },
        { value: 2, label: "2x" },
        { value: 4, label: "4x" },
      ];
      const onChange = mock((_val: number) => {});

      const { container, unmount } = await renderIntoDom(
        <SegmentedControl<number>
          options={numOptions}
          value={2}
          onChange={onChange}
        />
      );

      const radios = container.querySelectorAll<HTMLButtonElement>("[role='radio']");
      expect(radios[1]?.getAttribute("aria-checked")).toBe("true");

      radios[2]?.click();
      expect(onChange).toHaveBeenCalledWith(4);

      await unmount();
    });

    it("supports gridCols responsive layout", async () => {
      const { container, unmount } = await renderIntoDom(
        <SegmentedControl
          options={options}
          value="by_count"
          onChange={() => {}}
          gridCols={3}
          fullWidth
        />
      );

      const radiogroup = container.querySelector("[role='radiogroup']");
      expect(radiogroup?.className).toContain("grid grid-cols-3");

      await unmount();
    });

    it("does not fire onChange for disabled options or control", async () => {
      const onChange = mock((_val: string) => {});
      const optionsWithDisabled = [
        { value: "a", label: "A" },
        { value: "b", label: "B", disabled: true },
      ];

      const { container, unmount } = await renderIntoDom(
        <SegmentedControl
          options={optionsWithDisabled}
          value="a"
          onChange={onChange}
        />
      );

      const radios = container.querySelectorAll<HTMLButtonElement>("[role='radio']");
      radios[1]?.click();

      expect(onChange).not.toHaveBeenCalled();

      await unmount();
    });
  });

  describe("ColorPickerInput", () => {
    it("renders visual swatch, text input and native color input", async () => {
      const { container, unmount } = await renderIntoDom(
        <ColorPickerInput
          value="#ff00aa"
          onChange={() => {}}
        />
      );

      const swatch = container.querySelector("div[style*='background-color']");
      expect(swatch).not.toBeNull();

      const textInput = container.querySelector<HTMLInputElement>("input[type='text']");
      expect(textInput).not.toBeNull();
      expect(textInput?.value).toBe("#ff00aa");

      const colorInput = container.querySelector<HTMLInputElement>("input[type='color']");
      expect(colorInput).not.toBeNull();
      expect(colorInput?.value).toBe("#ff00aa");

      await unmount();
    });

    it("auto-prepends # when typing hex code without hash", async () => {
      const onChange = mock((_hex: string) => {});

      const { container, changeInput, unmount } = await renderIntoDom(
        <ColorPickerInput
          value="#000000"
          onChange={onChange}
        />
      );

      const textInput = container.querySelector<HTMLInputElement>("input[type='text']");
      if (textInput) {
        await changeInput(textInput, "00ff88");
        expect(onChange).toHaveBeenCalledWith("#00ff88");
      }

      await unmount();
    });

    it("calls onChange when native color input changes", async () => {
      const onChange = mock((_hex: string) => {});

      const { container, changeInput, unmount } = await renderIntoDom(
        <ColorPickerInput
          value="#000000"
          onChange={onChange}
        />
      );

      const colorInput = container.querySelector<HTMLInputElement>("input[type='color']");
      if (colorInput) {
        await changeInput(colorInput, "#ffffff");
        expect(onChange).toHaveBeenCalledWith("#ffffff");
      }

      await unmount();
    });

    it("disables all inputs when disabled is true", async () => {
      const { container, unmount } = await renderIntoDom(
        <ColorPickerInput
          value="#123456"
          onChange={() => {}}
          disabled
        />
      );

      const textInput = container.querySelector<HTMLInputElement>("input[type='text']");
      const colorInput = container.querySelector<HTMLInputElement>("input[type='color']");

      expect(textInput?.disabled).toBe(true);
      expect(colorInput?.disabled).toBe(true);

      await unmount();
    });
  });
});
