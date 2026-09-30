import React from "react";

export type HelpTab = "all" | "shortcuts" | "controls" | "mechanics";

export interface ShortcutEntry {
  id: string;
  icon?: React.ReactNode;
  label: string;
  keys: string[];
  separator?: string;
  badge?: string;
  badgeVariant?: "stone" | "amber" | "cyan" | "purple" | "red";
  keyVariant?: "amber" | "cyan" | "purple" | "stone";
}

export interface PlayerControlItem {
  actionLabel: string;
  keys: string[];
  variant?: "stone" | "amber" | "cyan" | "purple";
}
 
export { formatKeyLabel } from "@components/controls/formatKeyLabel";
