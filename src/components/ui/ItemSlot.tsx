import React from "react";
import { Item } from "@game/types";
import { cn } from "@lib/utils";
import { ItemIcon } from "./ItemIcon";

export interface ItemSlotProps {
  item: Item | null;
  label?: string;
  iconPlaceholder?: React.ReactNode;
  isSelected?: boolean;
  count?: number;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const rarityBorders: Record<string, string> = {
  common: "border-stone-700",
  uncommon: "border-emerald-600/80 shadow-emerald-950/40",
  rare: "border-cyan-500/80 shadow-cyan-950/40",
  legendary: "border-amber-400 shadow-amber-950/60 ring-1 ring-amber-400/40",
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

export const ItemSlot: React.FC<ItemSlotProps> = React.memo(({
  item,
  label,
  iconPlaceholder,
  isSelected = false,
  count,
  onClick,
  size = "md",
  className,
}) => {
  const borderClass = item
    ? rarityBorders[item.rarity] || "border-stone-700"
    : "border-stone-800/80";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-1.5 rounded-xl border-2 transition-all cursor-pointer select-none relative",
        isSelected
          ? "border-amber-400 bg-amber-950/50 ring-2 ring-amber-400/60 scale-[1.02]"
          : item
          ? cn(borderClass, "bg-stone-900/90 hover:border-amber-400 hover:bg-stone-800/80 shadow-md")
          : "border-stone-800/60 bg-stone-950/40 hover:border-stone-600 hover:bg-stone-900/40",
        className
      )}
    >
      {label && (
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          {iconPlaceholder}
          {label}
        </span>
      )}
      <div
        className={cn(
          sizeClasses[size],
          "rounded-lg border border-stone-800 bg-stone-950 flex items-center justify-center relative overflow-hidden"
        )}
      >
        {item ? (
          <>
            <ItemIcon
              name={item.icon}
              size={iconSizes[size]}
              className="text-amber-200 drop-shadow-sm transition-transform hover:scale-110"
            />
            {count !== undefined && count > 1 && (
              <span className="absolute bottom-0.5 right-0.5 text-[9px] font-mono font-bold bg-amber-950/90 text-amber-200 px-1 rounded border border-amber-600/60 leading-none">
                x{count}
              </span>
            )}
          </>
        ) : (
          <span className="text-stone-700 text-xs italic font-mono">-</span>
        )}
      </div>
    </div>
  );
});

export default ItemSlot;
