import React from "react";
import { Button, type ButtonProps } from "../core/button";
import { KbdKey, type KbdKeyVariant } from "../rpg/kbd";
import { cn } from "@lib/utils";

export interface KeyboundButtonProps extends Omit<ButtonProps, "rightIcon"> {
  /** Keyboard shortcut key displayed in KbdKey */
  readonly kbdKey: string;
  /** Color theme for KbdKey */
  readonly kbdVariant?: KbdKeyVariant;
  /** Primary label text or element */
  readonly label?: React.ReactNode;
  /** Whether the text label is hidden on extra-small mobile viewports (hidden sm:inline) */
  readonly responsiveLabel?: boolean;
}

/**
 * Accessible button atom pre-configured with a trailing keyboard shortcut key indicator (<kbd>).
 * Common in HUD toolbars, action belts, and modal header navigation.
 */
export const KeyboundButton = React.memo(
  React.forwardRef<HTMLButtonElement, KeyboundButtonProps>(function KeyboundButton(
    {
      children,
      label,
      kbdKey,
      kbdVariant = "stone",
      responsiveLabel = false,
      className,
      ...buttonProps
    },
    ref
  ) {
    const content = label ?? children;

    return (
      <Button
        ref={ref}
        rightIcon={<KbdKey variant={kbdVariant}>{kbdKey}</KbdKey>}
        className={cn("gap-1.5", className)}
        {...buttonProps}
      >
        {responsiveLabel && content ? (
          <span className="hidden sm:inline">{content}</span>
        ) : (
          content
        )}
      </Button>
    );
  })
);

KeyboundButton.displayName = "KeyboundButton";

export default KeyboundButton;
