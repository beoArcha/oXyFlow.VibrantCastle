import React, { useCallback } from "react";
import { cn } from "@lib/utils";

export interface ColorPickerInputProps {
  /** Hex color value e.g. "#ff00ff" */
  readonly value: string;
  /** Change callback with validated hex color */
  readonly onChange: (hex: string) => void;
  /** Disables color picker controls */
  readonly disabled?: boolean;
  /** Placeholder text */
  readonly placeholder?: string;
  /** Custom container class */
  readonly className?: string;
  /** Tooltip for the color picker button */
  readonly colorPickerTitle?: string;
  /** Tooltip for the color swatch */
  readonly sampleTitle?: string;
}

/**
 * ColorPickerInput
 *
 * Connected color picker control:
 * - Color swatch thumbnail.
 * - Monospaced HEX input with format cleanup.
 * - Integrated native system color picker.
 */
export const ColorPickerInput: React.FC<ColorPickerInputProps> = React.memo(({
  value,
  onChange,
  disabled = false,
  placeholder = "#000000",
  className,
  colorPickerTitle = "Open color picker",
  sampleTitle,
}) => {
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let text = e.target.value.trim();
      if (text && !text.startsWith("#")) {
        text = `#${text}`;
      }
      onChange(text);
    },
    [onChange]
  );

  const nativeColorValue =
    value.startsWith("#") && (value.length === 7 || value.length === 4)
      ? value
      : "#000000";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className="w-8 h-8 rounded-lg border-2 border-stone-700 shadow-inner shrink-0 transition-colors"
        style={{ backgroundColor: value || "#000000" }}
        title={sampleTitle || `Color: ${value}`}
      />

      <div className="flex-1 flex items-center gap-1.5">
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="w-full bg-black/70 border border-stone-800 rounded px-2.5 py-1 text-xs text-amber-200 font-mono font-bold outline-none focus:border-amber-500 disabled:opacity-50"
        />

        <input
          type="color"
          value={nativeColorValue}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-7 bg-transparent border-0 cursor-pointer rounded p-0 disabled:opacity-50"
          title={colorPickerTitle}
        />
      </div>
    </div>
  );
});

ColorPickerInput.displayName = "ColorPickerInput";

export default ColorPickerInput;
