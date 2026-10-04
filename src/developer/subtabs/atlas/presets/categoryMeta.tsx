import React from "react";
import { User, Skull, Building, Sparkles, Layers } from "lucide-react";
import { AtlasCategory } from "@game/engine/meta/registry";

export interface CategoryMeta {
  icon: React.ReactNode;
  variant: "amber" | "red" | "cyan" | "purple" | "stone";
  labelKey: string;
}

export function getCategoryMeta(cat: AtlasCategory): CategoryMeta {
  switch (cat) {
    case "character":
      return {
        icon: <User size={12} className="text-amber-300" />,
        variant: "amber",
        labelKey: "atlasStudioFilterCharacters",
      };
    case "enemy":
      return {
        icon: <Skull size={12} className="text-rose-400" />,
        variant: "red",
        labelKey: "atlasStudioFilterEnemies",
      };
    case "structure":
      return {
        icon: <Building size={12} className="text-cyan-400" />,
        variant: "cyan",
        labelKey: "atlasStudioFilterStructures",
      };
    case "portrait":
      return {
        icon: <Sparkles size={12} className="text-purple-400" />,
        variant: "purple",
        labelKey: "atlasStudioFilterPortraits",
      };
    default:
      return {
        icon: <Layers size={12} className="text-stone-400" />,
        variant: "stone",
        labelKey: "atlasStudioFilterAll",
      };
  }
}
