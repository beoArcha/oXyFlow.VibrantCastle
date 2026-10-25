import React from "react";
import { Slider as BaseSlider } from "@base-ui/react/slider";
import { cn } from "@lib/utils";
import {
  sliderTrackVariants,
  sliderLabelVariants,
  sliderValueVariants,
} from "./slider-variants";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "min" | "max" | "step" | "onChange"> {
  /** Input ID for label pairing and accessibility */
  id?: string;
  /** Visible label describing the slider */
  label: string;
  /** Current numeric value */
  value: number;
  /** Change callback with parsed numeric value */
  onChange: (value: number) => void;
  /** Minimum slider value (default: 0) */
  min?: number;
  /** Maximum slider value (default: 100) */
  max?: number;
  /** Step increment (default: 1) */
  step?: number;
  /** Optional icon rendered next to label */
  icon?: React.ReactNode;
  /** Unit suffix for value display (default: "%") */
  unit?: string;
  /** Whether to show the current value display badge (default: true) */
  showValue?: boolean;
  /** Custom formatter function for the value display */
  formatValue?: (val: number) => string;
}

/**
 * Gothic Range Slider input primitive with accessible range track,
 * numeric value readout, icon support, and forwardRef to input element.
 */
const SliderBase = React.memo(
  React.forwardRef<HTMLInputElement, SliderProps>(function Slider(
    {
      id,
      label,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      icon,
      unit = "%",
      showValue = true,
      formatValue,
      disabled = false,
      className,
      ...props
    },
    ref
  ) {
    const formattedValue = formatValue ? formatValue(value) : `${value}${unit}`;

    return (
      <div
        className={cn(
          "flex flex-col gap-1.5",
          disabled && "opacity-50 pointer-events-none cursor-not-allowed",
          className
        )}
      >
        <div className="flex justify-between items-center text-xs select-none">
          <label htmlFor={id} className={sliderLabelVariants()}>
            {icon && <span className="text-primary-500 shrink-0">{icon}</span>}
            {label}
          </label>
          {showValue && (
            <span className={sliderValueVariants()}>
              {formattedValue}
            </span>
          )}
        </div>
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formattedValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className={sliderTrackVariants()}
          {...props}
        />
      </div>
    );
  })
);

SliderBase.displayName = "Slider";

export const Slider = Object.assign(SliderBase, {
  Root: BaseSlider.Root,
  Control: BaseSlider.Control,
  Track: BaseSlider.Track,
  Indicator: BaseSlider.Indicator,
  Thumb: BaseSlider.Thumb,
  Value: BaseSlider.Value,
  Label: BaseSlider.Label,
});

export default Slider;
