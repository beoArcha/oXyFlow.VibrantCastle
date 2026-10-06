import React from "react";
import {
  Sword,
  Zap,
  Wand2 as Wand,
  Shield,
  BookOpen,
  Crown,
  HardHat,
  Shirt,
  Sparkles,
  CircleDot,
  Heart,
  Flame,
  FlaskConical,
  Package,
} from "lucide-react";
import { cn } from "@lib/utils";

export type KnownItemIconName =
  | "Sword"
  | "Zap"
  | "Wand"
  | "Shield"
  | "BookOpen"
  | "Crown"
  | "HardHat"
  | "Shirt"
  | "Sparkles"
  | "CircleDot"
  | "Heart"
  | "Flame"
  | "FlaskConical"
  | "Package";

export type ItemIconName = KnownItemIconName | (string & {});

export interface ItemIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly name: ItemIconName;
  readonly size?: number;
  readonly className?: string;
}

export type IconComponentType = React.ComponentType<{ size?: number; className?: string }>;

const initialIconMap: Record<KnownItemIconName, IconComponentType> = {
  Sword,
  Zap,
  Wand,
  Shield,
  BookOpen,
  Crown,
  HardHat,
  Shirt,
  Sparkles,
  CircleDot,
  Heart,
  Flame,
  FlaskConical,
  Package,
};

/**
 * Registry mapping icon identifier keys to React icon components.
 */
export const itemIconRegistry = new Map<string, IconComponentType>(
  Object.entries(initialIconMap)
);

/**
 * Registers or overrides an icon component in the registry.
 */
export function registerItemIcon(name: string, component: IconComponentType): void {
  itemIconRegistry.set(name, component);
}

/**
 * Retrieves an icon component from registry with Package fallback.
 */
export function getItemIcon(name: string): IconComponentType {
  return itemIconRegistry.get(name) || Package;
}

/**
 * Standard item sprite/icon primitive for game items.
 */
export const ItemIcon = React.memo(
  React.forwardRef<HTMLSpanElement, ItemIconProps>(function ItemIcon(
    { name, className, size = 18, ...props },
    ref
  ) {
    const IconComponent = getItemIcon(name);

    return (
      <span ref={ref} className={cn("inline-flex items-center shrink-0", className)} {...props}>
        <IconComponent size={size} className="shrink-0" />
      </span>
    );
  })
);

ItemIcon.displayName = "ItemIcon";

/**
 * Returns default icon name for a given item type string.
 */
export function getDefaultIconNameForType(type: string | null | undefined): ItemIconName {
  switch (type) {
    case "weapon":
      return "Sword";
    case "shield":
      return "Shield";
    case "helmet":
      return "Crown";
    case "armor":
      return "Shirt";
    case "amulet":
      return "Sparkles";
    case "ring":
      return "CircleDot";
    case "potion":
      return "FlaskConical";
    default:
      return "Package";
  }
}

export default ItemIcon;
