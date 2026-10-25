import React from "react";
import { cn } from "@lib/utils";
import { ItemIcon } from "../item-icon/index";
import {
  itemSlotVariants,
  itemSlotInnerSize,
  itemSlotIconSize,
  type ItemSlotRarityVariant,
} from "./item-slot-variants";

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
          itemSlotVariants({
            rarity: hasItem ? resolvedRarityVariant : "stone",
            selected: isSelected,
            empty: !hasItem && !isSelected,
          }),
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
            itemSlotInnerSize[size],
            "rounded-lg border border-stone-800 bg-surface-darkest flex items-center justify-center relative overflow-hidden"
          )}
        >
          {hasItem && iconName ? (
            <>
              <ItemIcon
                name={iconName}
                size={itemSlotIconSize[size]}
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
