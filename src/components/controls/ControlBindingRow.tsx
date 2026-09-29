import React from "react";
import { Button, ButtonVariant } from "@components/ui";
import { cn } from "@lib/utils";

export interface ControlBindingRowProps {
  /** Label describing the action (e.g. "Jump", "Attack") */
  label: string;
  /** Controls representation (rendered badges, KbdKeys, etc.) */
  children: React.ReactNode;
  /** Callback fired when the rebind button is clicked */
  onRebind: () => void;
  /** Text displayed inside the rebind button */
  rebindLabel: string;
  /** Visual variant of the rebind button */
  rebindVariant?: ButtonVariant;
  /** Whether rebinding is disabled */
  disabled?: boolean;
  /** Whether this row is currently listening for input capture */
  isListening?: boolean;
  /** Optional identifier for testing and accessibility */
  id?: string;
  /** Additional class names for the outer wrapper */
  className?: string;
}

/**
 * Reusable presentation row for action-to-input mappings (keyboard keys or gamepad buttons).
 * Supports active listening states, keyboard accessibility, and consistent gothic styling.
 *
 * @example
 * ```tsx
 * <ControlBindingRow
 *   label="Jump"
 *   rebindLabel="Remap"
 *   onRebind={() => handleRebind("jump")}
 * >
 *   <KbdKey>Space</KbdKey>
 * </ControlBindingRow>
 * ```
 */
export const ControlBindingRow: React.FC<ControlBindingRowProps> = React.memo(
  function ControlBindingRow({
    label,
    children,
    onRebind,
    rebindLabel,
    rebindVariant = "secondary",
    disabled = false,
    isListening = false,
    id,
    className,
  }) {
    return (
      <div
        id={id}
        data-testid={id ?? `control-binding-row-${label.toLowerCase().replace(/\s+/g, "-")}`}
        className={cn(
          "p-2.5 rounded-lg bg-[#1c0c07] border transition-all duration-150 flex items-center justify-between gap-3",
          isListening
            ? "border-amber-500 bg-amber-950/30 shadow-sm shadow-amber-950/40"
            : "border-[#4a200e] hover:border-[#8d4325]",
          className
        )}
      >
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-[#fed7aa] truncate">{label}</span>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">{children}</div>
        </div>

        <Button
          type="button"
          size="sm"
          variant={isListening ? "primary" : rebindVariant}
          disabled={disabled}
          onClick={onRebind}
          className="shrink-0"
        >
          {rebindLabel}
        </Button>
      </div>
    );
  }
);

ControlBindingRow.displayName = "ControlBindingRow";

export default ControlBindingRow;
