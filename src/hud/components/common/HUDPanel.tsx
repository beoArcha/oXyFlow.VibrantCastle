import React from "react";
import { cn } from "@lib/utils";

export interface HUDPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual frame density/opacity variant */
  readonly variant?: "default" | "subtle" | "active";
  /** Custom dynamic border color token (e.g. from player theme or active state) */
  readonly borderColor?: string;
  /** Internal padding presets */
  readonly padding?: "none" | "sm" | "md" | "lg";
  /** Optional accessible role */
  readonly role?: string;
}

const PADDING_STYLES = {
  none: "p-0",
  sm: "p-1.5 md:p-2",
  md: "p-2.5 md:p-3",
  lg: "p-3.5 md:p-4",
} as const;

const VARIANT_STYLES = {
  default: "bg-stone-950/85 backdrop-blur-md border shadow-2xl",
  subtle: "bg-stone-950/70 backdrop-blur-md border border-stone-900/60 shadow-xl",
  active: "bg-stone-950/90 backdrop-blur-md border shadow-2xl ring-1 ring-amber-500/30",
} as const;

/**
 * Foundational glassmorphism container for HUD cards, quick belts, and floating control bars.
 * Standardizes the 85% translucent gothic background, 2xl radius, and backdrop blur.
 */
export const HUDPanel = React.memo(
  React.forwardRef<HTMLDivElement, HUDPanelProps>(function HUDPanel(
    {
      children,
      variant = "default",
      borderColor = "border-stone-800/80",
      padding = "md",
      className,
      ...divProps
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        data-slot="hud-panel"
        className={cn(
          "rounded-2xl transition-all",
          VARIANT_STYLES[variant],
          borderColor,
          PADDING_STYLES[padding],
          className
        )}
        {...divProps}
      >
        {children}
      </div>
    );
  })
);

HUDPanel.displayName = "HUDPanel";

export default HUDPanel;
