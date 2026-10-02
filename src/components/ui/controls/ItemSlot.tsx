import React from "react";
import { cn } from "@lib/utils";
import { ItemIcon } from "../primitives/ItemIcon";

export type ItemSlotRarityVariant = "stone" | "green" | "cyan" | "amber";

export interface ItemSlotData {
  readonly id?: string | null;
  readonly icon?: string | null;
  readonly iconName?: string | null;
  readonly rarity?: string | null;
  readonly rarityVariant?: ItemSlotRarityVariant;
  readonly count?: number;
  readonly nameKey?: string | null;
  readonly label?: string | null;
  readonly isEmpty?: boolean;
  readonly placeholderIconName?: string;
}

export interface ItemSlotProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick" | "slot"> {
  readonly slot?: ItemSlotData | null;
  readonly item?: ItemSlotData | null;
  readonly label?: string;
  readonly accessibleLabel?: string;
  readonly iconPlaceholder?: React.ReactNode;
  readonly isSelected?: boolean;
  readonly count?: number;
  readonly size?: "sm" | "md" | "lg";
  readonly rarity?: ItemSlotRarityVariant | "common" | "uncommon" | "rare" | "legendary";
  readonly onClick?: () => void;
  readonly className?: string;
}

const rarityBorders: Record<ItemSlotRarityVariant, string> = {
  stone: "border-stone-700",
  green: "border-emerald-600/80 shadow-emerald-950/40",
  cyan: "border-cyan-500/80 shadow-cyan-950/40",
  amber: "border-amber-400 shadow-amber-950/60 ring-1 ring-amber-400/40",
};

const legacyRarityMap: Record<string, ItemSlotRarityVariant> = {
  common: "stone",
  uncommon: "green",
  rare: "cyan",
  legendary: "amber",
  stone: "stone",
  green: "green",
  cyan: "cyan",
  amber: "amber",
};

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "w-10 h-10 text-base",
  md: "w-12 h-12 text-xl",
  lg: "w-14 h-14 text-2xl",
};

const iconSizes: Record<"sm" | "md" | "lg", number> = {
  sm: 14,
  md: 18,
  lg: 22,
};

/**
 * Gothic Inventory Item Slot representing equipped items or backpack cells.
 * Supports WAI-ARIA role="button" semantics, keyboard activation (Enter/Space),
 * stack counter badges, and selection highlight rings.
 */
export const ItemSlot = React.memo(
  React.forwardRef<HTMLDivElement, ItemSlotProps>(function ItemSlot(
    {
      slot,
      item,
      label,
      accessibleLabel,
      iconPlaceholder,
      isSelected = false,
      count,
      onClick,
      onKeyDown,
      size = "md",
      rarity,
      className,
      ...props
    },
    ref
  ) {
    const target = slot ?? item ?? null;
    const hasItem = Boolean(
      target &&
        (target.isEmpty !== undefined ? !target.isEmpty : Boolean(target.id || target.icon || target.iconName))
    );

    const iconName = target?.iconName ?? target?.icon ?? null;
    const resolvedRarityVariant: ItemSlotRarityVariant = rarity
      ? legacyRarityMap[rarity] || "stone"
      : target?.rarityVariant ?? (target?.rarity ? legacyRarityMap[target.rarity] || "stone" : "stone");

    const borderClass = hasItem ? rarityBorders[resolvedRarityVariant] : "border-stone-800/80";
    const effectiveCount = count ?? target?.count;
    const effectiveLabel = label ?? target?.label;

    const computedAriaLabel =
      accessibleLabel ??
      effectiveLabel ??
      (hasItem ? target?.nameKey || "Item" : "Empty slot");

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick?.();
      }
    };

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={computedAriaLabel}
        aria-pressed={isSelected}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all cursor-pointer select-none relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
          isSelected
            ? "border-amber-400 bg-amber-950/50 ring-2 ring-amber-400/60 scale-[1.02]"
            : hasItem
            ? cn(borderClass, "bg-stone-900/90 hover:border-amber-400 hover:bg-stone-800/80 shadow-md")
            : "border-stone-800/60 bg-stone-950/40 hover:border-stone-600 hover:bg-stone-900/40",
          className
        )}
        {...props}
      >
        {effectiveLabel && (
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            {iconPlaceholder}
            {effectiveLabel}
          </span>
        )}
        <div
          className={cn(
            sizeClasses[size],
            "rounded-lg border border-stone-800 bg-stone-950 flex items-center justify-center relative overflow-hidden"
          )}
        >
          {hasItem && iconName ? (
            <>
              <ItemIcon
                name={iconName}
                size={iconSizes[size]}
                className="text-amber-200 drop-shadow-sm transition-transform hover:scale-110"
              />
              {effectiveCount !== undefined && effectiveCount > 1 && (
                <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono font-bold bg-amber-950/90 text-amber-200 px-1 rounded border border-amber-600/60 leading-none">
                  x{effectiveCount}
                </span>
              )}
            </>
          ) : (
            <span className="text-stone-700 text-xs italic font-mono">-</span>
          )}
        </div>
      </div>
    );
  })
);

ItemSlot.displayName = "ItemSlot";

export default ItemSlot;
