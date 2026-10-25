import React from "react";
import { PlayerId } from "@game/types";
import { ModalType } from "@game-menu/modal";
import type { PlayerTheme } from "@styles/theme";

export type HelpTab = "all" | "shortcuts" | "controls" | "mechanics";

export interface ShortcutEntry {
  readonly id: string;
  readonly icon?: React.ReactNode;
  readonly label: string;
  readonly keys: readonly string[];
  readonly separator?: string;
  readonly badge?: string;
  readonly badgeVariant?: "stone" | "amber" | "cyan" | "purple" | "red";
  readonly keyVariant?: "amber" | "cyan" | "purple" | "stone";
}

export interface PlayerControlItem {
  readonly actionLabel: string;
  readonly keys: readonly string[];
  readonly variant?: "stone" | "amber" | "cyan" | "purple";
}

export interface HelpBannerProps {
  readonly className?: string;
}

export interface HelpNavigationProps {
  readonly activeTab: HelpTab;
  readonly onSelectTab: (tab: HelpTab) => void;
  readonly className?: string;
}

export interface HelpControlsCardProps {
  readonly playerId: PlayerId;
  readonly title: string;
  readonly icon: React.ReactNode;
  readonly flankBadge: string;
  readonly theme: PlayerTheme;
  readonly className?: string;
}

export interface HelpShortcutsGridProps {
  readonly className?: string;
}

export interface HelpMechanicsTipsProps {
  readonly className?: string;
}

export interface HelpModalProps {
  readonly onClose: () => void;
  readonly defaultTab?: HelpTab;
  readonly onNavigateModal?: (modal: ModalType) => void;
  readonly onResume?: () => void;
}
