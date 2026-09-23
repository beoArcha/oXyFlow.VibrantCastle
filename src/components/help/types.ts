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

/**
 * Format raw browser key strings into concise, readable badge labels.
 */
export function formatKeyLabel(key: string, spaceLabel: string = "Space"): string {
  if (key === " " || key === "Space") return spaceLabel;
  if (key === "ArrowUp") return "↑";
  if (key === "ArrowDown") return "↓";
  if (key === "ArrowLeft") return "←";
  if (key === "ArrowRight") return "→";
  if (key.startsWith("Numpad")) return `Num ${key.replace("Numpad", "")}`;
  if (key.startsWith("Key")) return key.replace("Key", "");
  if (key.startsWith("Digit")) return key.replace("Digit", "");
  if (key === "Slash") return "/";
  if (key === "Comma") return ",";
  if (key === "Period") return ".";
  if (key === "BracketLeft") return "[";
  if (key === "BracketRight") return "]";
  return key;
}
