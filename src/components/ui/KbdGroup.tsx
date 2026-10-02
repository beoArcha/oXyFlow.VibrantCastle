import React from "react";
import { KbdKey, KbdKeyVariant } from "./KbdKey";
import { cn } from "@lib/utils";

export interface KbdGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of raw key strings or display labels */
  readonly keys: readonly string[];
  /** Visual color theme variant matching KbdKey */
  readonly variant?: KbdKeyVariant;
  /** Optional separator element rendered between keys (e.g. "+", "/", "or") */
  readonly separator?: React.ReactNode;
  /** Optional label formatter function (e.g. formatKeyLabel) */
  readonly formatLabel?: (key: string) => React.ReactNode;
  /** Optional maximum number of keys to display */
  readonly maxKeys?: number;
}

/**
 * Generic design system primitive rendering a sequence or combination of keyboard keys.
 * Composes KbdKey with optional formatting, key limit, and inter-key separators.
 *
 * @example
 * ```tsx
 * <KbdGroup keys={["KeyW", "ArrowUp"]} separator="/" variant="amber" />
 * ```
 */
export const KbdGroup: React.FC<KbdGroupProps> = React.memo(
  function KbdGroup({
    keys,
    variant = "stone",
    separator,
    formatLabel,
    maxKeys,
    className,
    ...props
  }) {
    if (!keys || keys.length === 0) {
      return null;
    }

    const displayKeys = typeof maxKeys === "number" ? keys.slice(0, maxKeys) : keys;

    return (
      <div
        className={cn("flex flex-wrap items-center gap-1.5", className)}
        {...props}
      >
        {displayKeys.map((key, index) => {
          const label = formatLabel ? formatLabel(key) : key;
          return (
            <React.Fragment key={`${key}-${index}`}>
              <KbdKey variant={variant}>{label}</KbdKey>
              {separator && index < displayKeys.length - 1 && (
                <span className="text-[10px] text-stone-500 font-mono select-none">
                  {separator}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
);

KbdGroup.displayName = "KbdGroup";

export default KbdGroup;
