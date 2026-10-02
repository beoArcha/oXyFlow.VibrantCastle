import React from "react";
import { cn } from "@lib/utils";

export type ActionBarVariant = "default" | "subtle" | "banner" | "plain";

export interface ActionBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional contextual text or label displayed on the left side */
  description?: React.ReactNode;
  /** Primary and secondary action buttons displayed on the right side */
  actions?: React.ReactNode;
  /** Whether to show a top separator border. Defaults to true for default/subtle variants. */
  bordered?: boolean;
  /** Visual presentation variant */
  variant?: ActionBarVariant;
}

const variantStyles: Record<ActionBarVariant, string> = {
  default: "pt-2 border-stone-800/80",
  subtle: "pt-1.5 border-stone-800/50",
  banner: "p-2.5 bg-amber-950/30 rounded-xl border border-amber-600/40",
  plain: "",
};

/**
 * Standard Castle action bar container for contextual actions, status descriptions, and buttons.
 * Supports forwardRef, semantic variants, and both declarative props (description, actions) or custom children.
 */
export const ActionBar = React.memo(
  React.forwardRef<HTMLDivElement, ActionBarProps>(function ActionBar(
    {
      description,
      actions,
      bordered = true,
      variant = "default",
      children,
      className,
      ...props
    },
    ref
  ) {
    const hasBorder = bordered && (variant === "default" || variant === "subtle");

    return (
      <div
        ref={ref}
        role="toolbar"
        className={cn(
          "flex items-center justify-between gap-2 flex-wrap text-xs",
          variantStyles[variant],
          hasBorder && "border-t",
          className
        )}
        {...props}
      >
        {description && (
          <div className="text-[11px] text-stone-400 flex items-center gap-1.5 min-w-0">
            {typeof description === "string" ? <span>{description}</span> : description}
          </div>
        )}

        {children}

        {actions && (
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            {actions}
          </div>
        )}
      </div>
    );
  })
);

ActionBar.displayName = "ActionBar";

export default ActionBar;
