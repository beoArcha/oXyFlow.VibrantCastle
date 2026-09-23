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
import { ItemType } from "../../game/types";
import { cn } from "../../lib/utils";

export interface ItemIconProps {
  name: string;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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

export const ItemIcon: React.FC<ItemIconProps> = React.memo(({ name, className, size = 18 }) => {
  const IconComponent = ICON_MAP[name] || Package;
  return <IconComponent size={size} className={cn("shrink-0", className)} />;
});

/**
 * Returns default icon name for a given item type.
 */
export function getDefaultIconNameForType(type: ItemType): string {
  switch (type) {
    case ItemType.Weapon:
      return "Sword";
    case ItemType.Shield:
      return "Shield";
    case ItemType.Helmet:
      return "Crown";
    case ItemType.Armor:
      return "Shirt";
    case ItemType.Amulet:
      return "Sparkles";
    case ItemType.Ring:
      return "CircleDot";
    case ItemType.Potion:
      return "FlaskConical";
    default:
      return "Package";
  }
}

export default ItemIcon;
