import React from "react";
import { Check } from "lucide-react";
import { cn } from "@lib/utils";

export interface SettingOptionCardProps {
  readonly id?: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly icon?: React.ReactNode;
  readonly badge?: React.ReactNode;
  readonly variant?: "amber" | "cyan";
  readonly disabled?: boolean;
  readonly className?: string;
  readonly children?: React.ReactNode;
}

/**
 * Standardized selectable option tile/card (radio-card pattern).
 * Unifies interactive selection tiles with focus rings, active badges, and theme tokens.
 */
export const SettingOptionCard: React.FC<SettingOptionCardProps> = React.memo(({
  id,
  selected,
  onSelect,
  title,
  description,
  icon,
  badge,
  variant = "amber",
  disabled = false,
  className,
  children,
}) => {
  const isAmber = variant === "amber";

  return (
    <div
      id={id}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 select-none relative focus-visible:outline-none focus-visible:ring-2",
        selected
          ? isAmber
            ? "bg-surface-card border-amber-primary shadow-md shadow-amber-950/60 ring-1 ring-amber-light/40 focus-visible:ring-amber-light"
            : "bg-surface-darker border-cyan-500 shadow-md shadow-cyan-950/60 ring-1 ring-cyan-400/40 focus-visible:ring-cyan-400"
          : "bg-surface-darkest border-border-subtle hover:border-amber-dark/60 hover:bg-surface-card focus-visible:ring-amber-primary/50",
        disabled && "opacity-50 cursor-not-allowed hover:bg-surface-darkest hover:border-border-subtle",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && (
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                selected
                  ? isAmber
                    ? "bg-amber-600/30 border-amber-400 text-amber-300"
                    : "bg-cyan-600/30 border-cyan-400 text-cyan-300"
                  : "bg-surface-darkest/40 border-stone-800 text-stone-500"
              )}
            >
              {icon}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span
              className={cn(
                "text-xs font-bold truncate",
                selected
                  ? isAmber
                    ? "text-amber-200"
                    : "text-cyan-200"
                  : "text-stone-300"
              )}
            >
              {title}
            </span>
            {badge && <div className="mt-0.5">{badge}</div>}
          </div>
        </div>
        {selected && (
          <Check
            size={16}
            className={cn("shrink-0", isAmber ? "text-amber-400" : "text-cyan-400")}
          />
        )}
      </div>

      {description && (
        <p className="text-[11px] text-stone-400 leading-relaxed">
          {description}
        </p>
      )}

      {children}
    </div>
  );
});

SettingOptionCard.displayName = "SettingOptionCard";
export default SettingOptionCard;
