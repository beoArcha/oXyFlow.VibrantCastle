import React from "react";
import { Switch } from "./Switch";
import { cn } from "@lib/utils";

export interface SettingToggleRowProps {
  readonly id?: string;
  readonly icon?: React.ReactNode;
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

/**
 * Standardized setting row component with an icon, title, description, and toggle Switch.
 * Unifies interactive toggle rows across settings and modal panels.
 */
export const SettingToggleRow: React.FC<SettingToggleRowProps> = React.memo(({
  id,
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-3 rounded-xl bg-[#140602] border border-[#4a200e] flex items-center justify-between gap-3 transition-colors",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0 pr-2">
        {icon && <div className="text-amber-400 shrink-0 mt-0.5">{icon}</div>}
        <div className="flex flex-col">
          <label
            htmlFor={id}
            className={cn(
              "text-xs font-bold text-amber-200 cursor-pointer select-none",
              disabled && "cursor-not-allowed"
            )}
            onClick={() => {
              if (!disabled) onCheckedChange(!checked);
            }}
          >
            {title}
          </label>
          {description && (
            <p className="text-[11px] text-stone-400 leading-relaxed mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        size="sm"
      />
    </div>
  );
});

SettingToggleRow.displayName = "SettingToggleRow";
